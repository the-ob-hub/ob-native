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
    loadUserData();
    loadBalances();
  }, []);

  /**
   * Función para refrescar datos cuando el usuario hace pull-to-refresh
   */
  const onRefresh = async () => {
    setRefreshing(true);
    addLog('🔄 HomeScreen - Pull to refresh iniciado');
    
    try {
      // Refrescar balances y datos del usuario en paralelo
      // Pasamos isRefresh=true para que no muestre el loading inicial
      await Promise.all([
        loadBalances(true),
        loadUserData(true),
      ]);
      
      addLog('✅ HomeScreen - Pull to refresh completado');
    } catch (error: any) {
      addLog(`❌ HomeScreen - Error en pull to refresh: ${error.message}`);
    } finally {
      setRefreshing(false);
    }
  };

  const loadBalances = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        addLog('🔄 HomeScreen - Refrescando balances del backend...');
      } else {
        addLog('💰 HomeScreen - Cargando balances del backend...');
      }
      
      // Obtener userId (UUID) de AsyncStorage
      const userId = await AsyncStorage.getItem('currentUserId');
      
      if (!userId) {
        addLog('⚠️ HomeScreen - No hay userId en AsyncStorage, usando mock');
        setBalances(getMockBalances());
        return;
      }
      
      addLog(`👤 HomeScreen - UserId obtenido: ${userId}`);
      
      // Llamar al backend
      addLog('📤 HomeScreen - Llamando balanceService.getBalances()');
      const balancesData = await balanceService.getBalances(userId);
      
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
      const errorMsg = `❌ HomeScreen - Error cargando balances: ${error.message || String(error)}`;
      addLog(errorMsg);
      console.error('❌ Error cargando balances:', error);
      
      // Fallback a mock en caso de error
      addLog('🔄 HomeScreen - Usando balances mock como fallback');
      setBalances(getMockBalances());
    }
  };

  const loadUserData = async (isRefresh = false) => {
    try {
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
        return;
      }

      addLog(`👤 HomeScreen - UserId obtenido: ${userId}`);
      
      try {
        // Intentar obtener datos del usuario desde el backend
        addLog('📤 HomeScreen - Llamando userService.getUserById()');
        const userData = await userService.getUserById(userId);
        
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
        } else {
          throw new Error('Usuario no encontrado en el backend');
        }
      } catch (backendError: any) {
        addLog(`⚠️ HomeScreen - Error obteniendo usuario del backend: ${backendError.message}`);
        
        // Fallback: intentar obtener de la base de datos local
        try {
          const userEmail = await AsyncStorage.getItem('currentUserEmail') || userId;
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
      }
    } catch (error: any) {
      const errorMsg = `❌ HomeScreen - Error en loadUserData: ${error.message || String(error)}`;
      addLog(errorMsg);
      console.error('❌ Error en loadUserData:', error);
      setCurrentUser(getMockUser());
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
    }
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
                  <Text style={styles.cardTitle}>Movimientos Unificados</Text>
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
    height: 180, // Aumentado 20% (150 * 1.2 = 180)
    backgroundColor: '#00FFFF', // Layer 6: Movimientos Unificados - CYAN
    borderRadius: 24,
    alignSelf: 'center',
    marginTop: SPACING.xl,
    padding: SPACING.lg,
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
  },
  cardTitle: {
    fontSize: 18, // Un poco más chico que 20px
    fontFamily: FONTS.poppins.bold,
    color: '#6E6E6E',
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

