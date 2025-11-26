import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity, ScrollView, Dimensions, Vibration, RefreshControl } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Svg, { Defs, LinearGradient as SvgLinearGradient, Stop, Rect } from 'react-native-svg';
import { COLORS, SPACING, FONTS } from '../constants';
import { SkeletonScreen } from '../components/SkeletonScreen';
import { UserAvatar } from '../components/UserAvatar';
import { ProfileSheet } from '../components/ProfileSheet';
import { ColorPickerCircles } from '../components/ColorPickerCircles';
import { BalanceCard } from '../components/BalanceCard';
import { TransferScreen } from './TransferScreen';
import { User, Balance, Currency } from '../models';
import { UserContact } from '../models/contacts';
import { db } from '../data/database';
import { useBackgroundColor } from '../contexts/BackgroundColorContext';
import { useLogs } from '../contexts/LogContext';
import { balanceService } from '../services/api/balanceService';
import { userService } from '../services/api/userService';
import { cognitoService } from '../services/auth/cognitoService';
import { movementsService } from '../services/api/movementsService';
import { MovementCard } from '../components/MovementCard';
import { Movement } from '../models';
import { AllMovementsScreen } from './AllMovementsScreen';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface HomeScreenProps {
  onLogout?: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ onLogout }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isProfileVisible, setIsProfileVisible] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [balances, setBalances] = useState<Balance[]>([]);
  const [isBalanceExpanded, setIsBalanceExpanded] = useState(false);
  const [selectedContact, setSelectedContact] = useState<UserContact | null>(null);
  const [showTransferScreen, setShowTransferScreen] = useState(false);
  const [transferDestinationCurrency, setTransferDestinationCurrency] = useState<Currency>('USDc');
  const [refreshing, setRefreshing] = useState(false);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [showAllMovements, setShowAllMovements] = useState(false);
  
  // Control de llamadas en progreso para evitar duplicados
  const loadingRef = useRef({
    userData: false,
    balances: false,
    movements: false,
  });
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const avatarRef = useRef<View | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const contentScrollViewRef = useRef<ScrollView>(null);
  const balanceCardRef = useRef<View | null>(null);
  const [balanceCardHeight, setBalanceCardHeight] = useState(0);
  const { setShowColorPicker, setAvatarPosition } = useBackgroundColor();
  const { addLog } = useLogs();

  // Mock balances - TODO: Reemplazar con llamada al backend
  // Orden: 1. UYU (Pesos), 2. USD, 3. USDc
  const getMockBalances = (): Balance[] => [
    { 
      currency: 'UYU', 
      amount: 45000.00, 
      availableActions: ['agregar', 'pagar', 'exchange'] 
    },
    { 
      currency: 'USD', 
      amount: 1250.36, 
      availableActions: ['agregar', 'enviar', 'exchange'] 
    },
    { 
      currency: 'USDc', 
      amount: 125000.50, 
      availableActions: ['agregar', 'enviar', 'exchange', 'pagar'] 
    },
  ];

  const handleAvatarLongPress = () => {
    // Vibración mínima al activar el selector de colores
    Vibration.vibrate(50);
    
    if (avatarRef.current) {
      avatarRef.current.measure((x, y, width, height, pageX, pageY) => {
        // Calcular posición del centro del avatar
        const avatarCenterX = pageX + width / 2;
        const avatarCenterY = pageY + height / 2;
        setAvatarPosition({ x: avatarCenterX, y: avatarCenterY });
        setShowColorPicker(true);
      });
    }
  };

  const handleAvatarLayout = () => {
    if (avatarRef.current) {
      avatarRef.current.measure((x, y, width, height, pageX, pageY) => {
        // Calcular posición del centro del avatar
        const avatarCenterX = pageX + width / 2;
        const avatarCenterY = pageY + height / 2;
        setAvatarPosition({ x: avatarCenterX, y: avatarCenterY });
      });
    }
  };

  useEffect(() => {
    // Crear AbortController para cancelar operaciones cuando el componente se desmonte
    const abortController = new AbortController();
    const signal = abortController.signal;
    
    // Cargar datos iniciales de forma secuencial para evitar llamadas duplicadas
    const loadInitialData = async () => {
      try {
        // Primero cargar datos del usuario (necesario para obtener el KSUID)
        // Si retorna true, significa que se creó un usuario nuevo y AsyncStorage ya tiene el KSUID
        const userCreated = await loadUserData(signal);
        
        // Luego cargar balances y movimientos en paralelo (ya tenemos el KSUID)
        // Solo cargar si no se creó un usuario nuevo (porque loadUserData ya actualizó AsyncStorage)
        // o si se creó uno nuevo, esperar un momento para asegurar que AsyncStorage se actualizó
        if (userCreated) {
          // Si se creó un usuario nuevo, esperar un momento para asegurar que AsyncStorage se actualizó
          // Usar Promise para evitar problemas con setTimeout y hooks
          await new Promise(resolve => setTimeout(resolve, 100));
          await Promise.all([
            loadBalances(signal),
            loadMovements(signal),
          ]);
        } else {
          // Si el usuario ya existía, cargar inmediatamente
          await Promise.all([
            loadBalances(signal),
            loadMovements(signal),
          ]);
        }
      } catch (error: any) {
        // Ignorar AbortError (operación cancelada intencionalmente)
        if (error.name !== 'AbortError') {
          console.error('Error cargando datos iniciales:', error);
        }
      }
    };
    loadInitialData();
    
    // Cleanup: cancelar todas las operaciones async cuando el componente se desmonte
    return () => {
      abortController.abort();
    };
  }, []);

  /**
   * Función para refrescar datos cuando el usuario hace pull-to-refresh
   */
  const onRefresh = async () => {
    setRefreshing(true);
    addLog('🔄 HomeScreen - Pull to refresh iniciado');
    
    try {
      // Refrescar balances, datos del usuario y movimientos en paralelo
      // Pasamos isRefresh=true para que no muestre el loading inicial
      // Crear AbortController para el refresh
      const refreshAbortController = new AbortController();
      const refreshSignal = refreshAbortController.signal;
      
      await Promise.all([
        loadBalances(refreshSignal, true),
        loadUserData(refreshSignal, true),
        loadMovements(refreshSignal, true),
      ]);
      
      addLog('✅ HomeScreen - Pull to refresh completado');
    } catch (error: any) {
      addLog(`❌ HomeScreen - Error en pull to refresh: ${error.message}`);
    } finally {
      setRefreshing(false);
    }
  };

  const loadBalances = async (signal?: AbortSignal, isRefresh = false) => {
    // Evitar llamadas duplicadas
    if (loadingRef.current.balances) {
      addLog('⚠️ HomeScreen - loadBalances ya está en progreso, ignorando llamada duplicada');
      return;
    }
    
    try {
      loadingRef.current.balances = true;
      
      if (isRefresh) {
        addLog('🔄 HomeScreen - Refrescando balances del backend...');
      } else {
        addLog('💰 HomeScreen - Cargando balances del backend...');
      }
      
      // Obtener userId de AsyncStorage (puede ser UUID o KSUID)
      const userId = await AsyncStorage.getItem('currentUserId');
      
      if (!userId) {
        addLog('⚠️ HomeScreen - No hay userId en AsyncStorage, usando mock');
        setBalances(getMockBalances());
        return;
      }
      
      // Si el userId es un UUID (no tiene prefijo usr-), esperar a que loadUserData lo convierta a KSUID
      if (!userId.startsWith('usr-')) {
        addLog(`⚠️ HomeScreen - UserId no es un KSUID válido (${userId}), esperando a que se cree el usuario...`);
        setBalances(getMockBalances());
        return;
      }
      
      addLog(`👤 HomeScreen - UserId obtenido: ${userId}`);
      
      // Llamar al backend
      addLog('📤 HomeScreen - Llamando balanceService.getBalances()');
      const balancesData = await balanceService.getBalances(userId, signal);
      
      if (balancesData.balances && balancesData.balances.length > 0) {
        addLog(`✅ HomeScreen - Balances obtenidos: ${balancesData.balances.length}`);
        balancesData.balances.forEach((balance, index) => {
          addLog(`  ${index + 1}. ${balance.currency}: ${balance.amount}`);
        });
        setBalances(balancesData.balances);
      } else {
        addLog('⚠️ HomeScreen - No hay balances, usando mock');
      setBalances(getMockBalances());
      }
    } catch (error: any) {
      // Ignorar AbortError (operación cancelada intencionalmente)
      if (error.name === 'AbortError') {
        // No hacer nada, la operación fue cancelada intencionalmente
        return;
      }
      
      const errorMsg = `❌ HomeScreen - Error cargando balances: ${error.message || String(error)}`;
      addLog(errorMsg);
      console.error('❌ Error cargando balances:', error);
      
      // Fallback a mock en caso de error
      addLog('🔄 HomeScreen - Usando balances mock como fallback');
      setBalances(getMockBalances());
    } finally {
      loadingRef.current.balances = false;
    }
  };

  const loadUserData = async (signal?: AbortSignal, isRefresh = false): Promise<boolean> => {
    // Evitar llamadas duplicadas
    if (loadingRef.current.userData) {
      addLog('⚠️ HomeScreen - loadUserData ya está en progreso, ignorando llamada duplicada');
      return false;
    }
    
    try {
      loadingRef.current.userData = true;
      
      // Solo mostrar loading si no es un refresh (para evitar conflictos con el spinner del refresh)
      if (!isRefresh) {
      setIsLoading(true);
      }
      
      if (isRefresh) {
        addLog('🔄 HomeScreen - Refrescando datos del usuario...');
      } else {
        addLog('👤 HomeScreen - Cargando datos del usuario...');
      }

      // Inicializar la base de datos si no está inicializada
      try {
        await db.init();
        addLog('✅ HomeScreen - Base de datos inicializada');
      } catch (dbError) {
        addLog(`⚠️ HomeScreen - Error inicializando base de datos: ${dbError}`);
      }

      // Obtener userId (UUID) de AsyncStorage
      const userId = await AsyncStorage.getItem('currentUserId');
      
      if (!userId) {
        addLog('⚠️ HomeScreen - No hay userId en AsyncStorage, usando datos mock');
        setCurrentUser(getMockUser());
        return false;
      }

      // Si el userId es un UUID (no tiene prefijo usr-), el usuario no existe en el backend todavía
      // Intentaremos obtenerlo con getUserById, y si falla con 400, se creará automáticamente
      if (!userId.startsWith('usr-')) {
        addLog(`⚠️ HomeScreen - UserId no es un KSUID válido (${userId}), el usuario se creará automáticamente si no existe`);
      }
      
      addLog(`👤 HomeScreen - UserId obtenido: ${userId}`);
      
      try {
        // Intentar obtener datos del usuario desde el backend
        addLog('📤 HomeScreen - Llamando userService.getUserById()');
        const userData = await userService.getUserById(userId, signal);
        
        if (userData) {
          addLog(`✅ HomeScreen - Usuario obtenido del backend: ${userData.fullName}`);
          addLog(`📧 HomeScreen - Email: ${userData.email}`);
          addLog(`📱 HomeScreen - Phone: ${userData.phone || 'N/A'}`);
          setCurrentUser(userData);
          
          // También guardar en la base de datos local como caché
          try {
            const userEmail = userData.email || userId;
            const existingUser = await db.getUser(userEmail);
            if (existingUser) {
              await db.updateUser(userEmail, userData);
              addLog('💾 HomeScreen - Usuario actualizado en base de datos local');
            } else {
              await db.createUser({
                ...userData,
                id: userEmail, // Usar email como ID para DB local
              });
              addLog('💾 HomeScreen - Usuario guardado en base de datos local');
            }
          } catch (dbError) {
            addLog(`⚠️ HomeScreen - Error guardando en DB local: ${dbError}`);
            // Continuar aunque falle la DB local
          }
          
          // Retornar false porque el usuario ya existía
          return false;
        } else {
          throw new Error('Usuario no encontrado en el backend');
        }
      } catch (backendError: any) {
        // Ignorar AbortError (operación cancelada intencionalmente)
        if (backendError.name === 'AbortError') {
          addLog('⚠️ HomeScreen - Carga de datos de usuario cancelada');
          return false;
        }
        
        addLog(`⚠️ HomeScreen - Error obteniendo usuario del backend: ${backendError.message}`);
        
        // Si el error es 404 (usuario no encontrado) o 400 (ID inválido - usuario no existe con ese formato),
        // intentar crearlo en el backend
        const isUserNotFound = backendError.message && (
          backendError.message.includes('404') || 
          backendError.message.includes('ID de usuario inválido') ||
          backendError.message.includes('Invalid user ID')
        );
        
        if (isUserNotFound) {
          const errorType = backendError.message.includes('404') ? '404' : '400';
          addLog(`🔄 HomeScreen - Usuario no encontrado (${errorType}), intentando crear en el backend...`);
          
          try {
            // Obtener atributos de Cognito para crear el usuario
            const cognitoAttributes = await cognitoService.getUserAttributes();
            
            if (cognitoAttributes) {
              addLog('✅ HomeScreen - Atributos de Cognito obtenidos, creando usuario en backend...');
              const createdUser = await userService.createUser(userId, cognitoAttributes);
              
              if (createdUser) {
                addLog(`✅ HomeScreen - Usuario creado exitosamente en backend: ${createdUser.fullName}`);
                addLog(`🔗 HomeScreen - ID del usuario creado: ${createdUser.id}`);
                setCurrentUser(createdUser);
                
                // Actualizar el userId en AsyncStorage con el KSUID que devolvió el backend (usr-xxxxx)
                if (createdUser.id) {
                  await AsyncStorage.setItem('currentUserId', createdUser.id);
                  addLog(`💾 HomeScreen - KSUID actualizado en AsyncStorage: ${createdUser.id}`);
                  
                  // Guardar en la base de datos local como caché
                  try {
                    const userEmail = createdUser.email || userId;
                    const existingUser = await db.getUser(userEmail);
                    if (existingUser) {
                      await db.updateUser(userEmail, createdUser);
                      addLog('💾 HomeScreen - Usuario actualizado en base de datos local');
                    } else {
                      await db.createUser({
                        ...createdUser,
                        id: userEmail, // Usar email como ID para DB local
                      });
                      addLog('💾 HomeScreen - Usuario guardado en base de datos local');
                    }
                  } catch (dbError) {
                    addLog(`⚠️ HomeScreen - Error guardando en DB local: ${dbError}`);
                    // Continuar aunque falle la DB local
                  }
                  
                  // Retornar true para indicar que se creó un usuario nuevo y se necesita recargar balances/movimientos
                  return true;
                }
              }
            } else {
              addLog('⚠️ HomeScreen - No se pudieron obtener atributos de Cognito');
            }
          } catch (createError: any) {
            addLog(`❌ HomeScreen - Error creando usuario en backend: ${createError.message}`);
            // Continuar con fallback a DB local
          }
        }
        
        // Fallback: intentar obtener de la base de datos local
        try {
          const userEmail = await AsyncStorage.getItem('currentUserEmail') || userId;
          setIsLoading(false);
          const localUserData = await db.getUser(userEmail);
          
          if (localUserData) {
            addLog('✅ HomeScreen - Usuario obtenido de base de datos local (fallback)');
            setCurrentUser(localUserData);
          } else {
            throw new Error('Usuario no encontrado en DB local');
          }
        } catch (localError) {
          addLog('⚠️ HomeScreen - Usuario no encontrado en DB local, usando datos mock');
          setCurrentUser(getMockUser());
        }
        
        // Retornar false porque no se creó un usuario nuevo
        return false;
      }
    } catch (error: any) {
      // Ignorar AbortError (operación cancelada intencionalmente)
      if (error.name === 'AbortError') {
        addLog('⚠️ HomeScreen - Carga de datos de usuario cancelada');
        return false;
      }
      
      const errorMsg = `❌ HomeScreen - Error en loadUserData: ${error.message || String(error)}`;
      addLog(errorMsg);
      console.error('❌ Error en loadUserData:', error);
      setCurrentUser(getMockUser());
      return false; // Retornar false en caso de error
    } finally {
      // Solo mostrar loading y animaciones si no es un refresh
      if (!isRefresh) {
      // Simular un delay mínimo para la animación
      setTimeout(() => {
        setIsLoading(false);
        
        // Animación de fade in
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.spring(slideAnim, {
            toValue: 0,
            useNativeDriver: true,
            tension: 40,
            friction: 7,
          }),
        ]).start();
      }, 500);
    }
      loadingRef.current.userData = false;
    }
  };

  const loadMovements = async (signal?: AbortSignal, isRefresh = false) => {
    // Evitar llamadas duplicadas
    if (loadingRef.current.movements) {
      addLog('⚠️ HomeScreen - loadMovements ya está en progreso, ignorando llamada duplicada');
      return;
    }
    
    try {
      loadingRef.current.movements = true;
      
      if (isRefresh) {
        addLog('🔄 HomeScreen - Refrescando movimientos del backend...');
      } else {
        addLog('📊 HomeScreen - Cargando movimientos del backend...');
      }

      // Obtener userId de AsyncStorage
      const userId = await AsyncStorage.getItem('currentUserId');
      
      if (!userId) {
        addLog('⚠️ HomeScreen - No hay userId en AsyncStorage, mostrando estado vacío');
        setMovements([]);
        return;
      }

      // Si el userId es un UUID (no tiene prefijo usr-), esperar a que loadUserData lo convierta a KSUID
      if (!userId.startsWith('usr-')) {
        addLog(`⚠️ HomeScreen - UserId no es un KSUID válido (${userId}), esperando a que se cree el usuario...`);
        setMovements([]);
        return;
      }

      addLog(`👤 HomeScreen - UserId obtenido para movimientos: ${userId}`);
      
      // Llamar al backend - obtener últimos 50 movimientos
      const movementsData = await movementsService.getMovementsByUser(userId, 50, 0, signal);
      
      if (movementsData && movementsData.length > 0) {
        addLog(`✅ HomeScreen - Movimientos obtenidos: ${movementsData.length}`);
        setMovements(movementsData);
      } else {
        addLog('✅ HomeScreen - No hay movimientos del backend (array vacío)');
        setMovements([]); // Mostrar estado vacío, no mock
      }
    } catch (error: any) {
      // Ignorar AbortError (operación cancelada intencionalmente)
      if (error.name === 'AbortError') {
        // No hacer nada, la operación fue cancelada intencionalmente
        return;
      }
      
      const errorMsg = `❌ HomeScreen - Error cargando movimientos: ${error.message || String(error)}`;
      addLog(errorMsg);
      console.error('❌ Error cargando movimientos:', error);
      
      // En caso de error, mostrar estado vacío (no mock)
      addLog('⚠️ HomeScreen - Error al obtener movimientos, mostrando estado vacío');
      setMovements([]);
    } finally {
      loadingRef.current.movements = false;
    }
  };

  // Mock movements - Usado cuando el backend no tiene la API de movimientos
  const getMockMovements = (): Movement[] => {
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const twoDaysAgo = new Date(now);
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    const threeDaysAgo = new Date(now);
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    return [
      {
        id: 'mock-movement-1',
        userId: 'mock-user',
        balanceId: 'mock-balance-1',
        movementType: 'transfer_in',
        amount: 5000.00,
        currency: 'UYU',
        direction: 'in',
        status: 'completed',
        description: 'Transferencia recibida de Juan M. Alvarez',
        title: 'Transferencia recibida',
        date: now.toISOString(),
        assetType: 'fiat',
        assetCode: 'UYU',
        isIncome: true,
      },
      {
        id: 'mock-movement-2',
        userId: 'mock-user',
        balanceId: 'mock-balance-2',
        movementType: 'transfer_out',
        amount: 250.50,
        currency: 'USD',
        direction: 'out',
        status: 'completed',
        description: 'Transferencia enviada a María Virginia Burgos',
        title: 'Transferencia enviada',
        date: yesterday.toISOString(),
        assetType: 'fiat',
        assetCode: 'USD',
        isIncome: false,
      },
      {
        id: 'mock-movement-3',
        userId: 'mock-user',
        balanceId: 'mock-balance-3',
        movementType: 'deposit',
        amount: 10000.00,
        currency: 'USDc',
        direction: 'in',
        status: 'completed',
        description: 'Depósito realizado',
        title: 'Depósito',
        date: twoDaysAgo.toISOString(),
        assetType: 'crypto',
        assetCode: 'USDc',
        isIncome: true,
      },
      {
        id: 'mock-movement-4',
        userId: 'mock-user',
        balanceId: 'mock-balance-1',
        movementType: 'transfer_out',
        amount: 1500.00,
        currency: 'UYU',
        direction: 'out',
        status: 'completed',
        description: 'Pago de servicios',
        title: 'Pago de servicios',
        date: threeDaysAgo.toISOString(),
        assetType: 'fiat',
        assetCode: 'UYU',
        isIncome: false,
      },
    ];
  };

  // Datos mock como fallback
  const getMockUser = (): User => ({
    id: 'mock-user-1',
    fullName: 'Usuario Demo',
    email: 'demo@ondabank.com',
    phone: '+54 9 11 0000-0000',
    documentType: 'DNI',
    documentNumber: '00000000',
    birthDate: '1990-01-01',
    nationality: 'Argentina',
    address: 'Dirección de ejemplo',
    countryOfResidence: 'Argentina',
    countryOfFundsOrigin: 'Argentina',
    isPEP: false,
    onboardingStatus: 'completed',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  return (
    <View style={styles.container}>
      {isLoading ? (
        <SkeletonScreen />
      ) : (
        <>
          {/* Layer 3: Gradiente SVG - Negro hasta 70%, luego transición a transparencia hasta 90%, transparente del 90% al 100% */}
          <Svg
            width={SCREEN_WIDTH}
            height={SCREEN_HEIGHT}
            style={styles.gradientBackground}
          >
            <Defs>
              <SvgLinearGradient 
                id="blackToTransparentGradient" 
                x1="0%" 
                y1="0%" 
                x2="0%" 
                y2="100%"
              >
                <Stop offset="0%" stopColor="#000000" stopOpacity="1" />
                <Stop offset="70%" stopColor="#000000" stopOpacity="1" />
                <Stop offset="70%" stopColor="#000000" stopOpacity="1" />
                <Stop offset="90%" stopColor="#000000" stopOpacity="0" />
                <Stop offset="100%" stopColor="#000000" stopOpacity="0" />
              </SvgLinearGradient>
            </Defs>
            <Rect
              x="0"
              y="0"
              width={SCREEN_WIDTH}
              height={SCREEN_HEIGHT}
              fill="url(#blackToTransparentGradient)"
            />
          </Svg>
          
          <Animated.View
            style={[
              styles.content,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <View style={styles.header} ref={avatarRef} onLayout={handleAvatarLayout}>
              <View style={styles.avatarRow}>
                <UserAvatar
                  fullName={currentUser?.fullName}
                  onPress={() => setIsProfileVisible(true)}
                  onLongPress={handleAvatarLongPress}
                />
                <ColorPickerCircles />
              </View>
            </View>
            <View style={styles.mainContentContainer}>
              <View style={styles.headerSpacer} />
              <View 
                ref={balanceCardRef}
                onLayout={(event) => {
                  const { height } = event.nativeEvent.layout;
                  setBalanceCardHeight(height);
                }}
              >
              <BalanceCard 
                balances={balances.length > 0 ? balances : getMockBalances()} 
                onExpandedChange={setIsBalanceExpanded}
                  onContactSelect={(contact, currency) => {
                    addLog(`✅ HomeScreen - Contacto seleccionado para transferencia: ${contact.fullName}, moneda destino: ${currency}`);
                    setSelectedContact(contact);
                    setTransferDestinationCurrency(currency);
                    setShowTransferScreen(true);
                  }}
                />
              </View>
              
              {/* ScrollView independiente para los contenedores - puede hacer scroll por debajo del balance */}
              <ScrollView
                ref={contentScrollViewRef}
                style={[
                  styles.contentScrollView,
                  { 
                    top: balanceCardHeight + 63, // headerSpacer height (63) + balanceCard height dinámico
                    height: SCREEN_HEIGHT - (balanceCardHeight + 63) // Altura disponible desde balance hasta abajo
                  }
                ]}
                contentContainerStyle={styles.contentScrollContent}
                showsVerticalScrollIndicator={false}
                scrollEnabled={true}
                bounces={true}
                nestedScrollEnabled={true}
                refreshControl={
                  <RefreshControl
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                    tintColor={COLORS.white}
                    colors={[COLORS.white]}
                  />
                }
              >
                <View style={styles.emptyCard}>
                  <View style={styles.movementsHeader}>
                  <Text style={styles.cardTitle}>Movimientos Unificados</Text>
                    {movements.length > 4 && (
                      <TouchableOpacity
                        onPress={() => setShowAllMovements(true)}
                        style={styles.seeAllButton}
                      >
                        <Text style={styles.seeAllText}>Ver todos</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                  {movements.length === 0 ? (
                    <View style={styles.emptyMovementsContainer}>
                      <Text style={styles.emptyMovementsIcon}>📋</Text>
                      <Text style={styles.emptyMovementsText}>No hay movimientos registrados</Text>
                      <Text style={styles.emptyMovementsSubtext}>Tus transacciones aparecerán aquí</Text>
                    </View>
                  ) : (
                    <View style={styles.movementsList}>
                      {movements.slice(0, 4).map((movement) => (
                        <MovementCard key={movement.id} movement={movement} />
                      ))}
                    </View>
                  )}
                </View>
                <View style={styles.debugBelowCard}>
                  <Text style={styles.cardTitle}>Pago de servicios</Text>
                </View>
                <View style={styles.debugBelowCardDarker}>
                  <Text style={styles.cardTitle}>Promociones ofertas y descuentos</Text>
                </View>
            </ScrollView>
            </View>
          </Animated.View>

          <ProfileSheet
            visible={isProfileVisible}
            onClose={() => setIsProfileVisible(false)}
            user={currentUser}
            onLogout={onLogout}
          />

                  {/* Pantalla de transferencia - Modal fullscreen */}
                  <TransferScreen
                    visible={showTransferScreen}
                    contact={selectedContact}
                    balances={balances.length > 0 ? balances : getMockBalances()}
                    destinationCurrency={transferDestinationCurrency}
                    onClose={() => {
                      // Resetear estado al cerrar
                      setShowTransferScreen(false);
                      setSelectedContact(null);
                    }}
                    onContinue={(amount, sourceCurrency, destinationCurrency) => {
                      addLog(`✅ HomeScreen - Transferencia iniciada: ${amount} ${destinationCurrency} (desde ${sourceCurrency}) a ${selectedContact?.fullName}`);
                      // TODO: Implementar lógica de transferencia
                      // Por ahora cerramos la pantalla y reseteamos
                      setShowTransferScreen(false);
                      setSelectedContact(null);
                    }}
                  />

                  {/* Pantalla de todos los movimientos */}
                  <AllMovementsScreen
                    visible={showAllMovements}
                    onClose={() => setShowAllMovements(false)}
          />
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: '100%',
    backgroundColor: 'transparent', // Layer 1: Container HomeScreen - Transparente
  },
  gradientBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
    backgroundColor: 'transparent', // Layer 3: Gradiente SVG - Transparente para ver el background seleccionable
  },
  content: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  mainContentContainer: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  contentScrollView: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
  },
  contentScrollContent: {
    paddingBottom: SPACING.xl * 2,
    backgroundColor: 'transparent',
  },
  headerSpacer: {
    height: 63, // Aumentado 5% (60 * 1.05 = 63) para bajar el BalanceCard
  },
  header: {
    paddingTop: 60,
    paddingBottom: SPACING.lg,
    paddingHorizontal: SPACING.lg,
    backgroundColor: 'transparent', // 100% transparente
    borderBottomWidth: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'absolute', // Posicionar absolutamente para que no oculte el BalanceCard
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10, // Asegurar que esté sobre el contenido pero no bloquee el BalanceCard
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative', // Para que los círculos posicionados absolutamente se posicionen relativos a este contenedor
  },
  versionBadge: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  emptyCard: {
    width: '95%',
    minHeight: 180, // Aumentado 20% (150 * 1.2 = 180), minHeight para que crezca con contenido
    backgroundColor: '#1e1e1e', // Cambiado de CYAN a color oscuro para mejor legibilidad
    borderRadius: 24,
    alignSelf: 'center',
    marginTop: SPACING.xl,
    padding: SPACING.lg,
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
  },
  movementsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: SPACING.md,
  },
  cardTitle: {
    fontSize: 18, // Un poco más chico que 20px
    fontFamily: FONTS.poppins.bold,
    color: COLORS.white,
  },
  seeAllButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  seeAllText: {
    fontSize: 14,
    fontFamily: FONTS.poppins.semiBold,
    color: COLORS.primary,
  },
  movementsList: {
    width: '100%',
  },
  emptyMovementsContainer: {
    padding: SPACING.xl,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
  },
  emptyMovementsIcon: {
    fontSize: 48,
    marginBottom: SPACING.md,
  },
  emptyMovementsText: {
    fontSize: 16,
    fontFamily: FONTS.poppins.semiBold,
    color: COLORS.white,
    marginBottom: SPACING.xs,
    textAlign: 'center',
  },
  emptyMovementsSubtext: {
    fontSize: 14,
    fontFamily: FONTS.poppins.regular,
    color: '#888',
    textAlign: 'center',
  },
  debugBelowCard: {
    width: '95%',
    height: 150,
    backgroundColor: '#FFA500', // Layer 7: Debug Below Card 1 - NARANJA
    borderRadius: 24,
    alignSelf: 'center',
    marginTop: SPACING.xl,
    padding: SPACING.lg,
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
  },
  debugBelowCardDarker: {
    width: '95%',
    height: 150,
    backgroundColor: '#800080', // Layer 8: Debug Below Card 2 - PURPURA
    borderRadius: 24,
    alignSelf: 'center',
    marginTop: SPACING.xl,
    padding: SPACING.lg,
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
  },
});

