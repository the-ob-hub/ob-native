import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, SPACING, FONTS } from '../constants';
import { SkeletonScreen } from '../components/SkeletonScreen';
import { UserAvatar } from '../components/UserAvatar';
import { ProfileSheet } from '../components/ProfileSheet';
import { ColorPickerCircles } from '../components/ColorPickerCircles';
import { BalanceCard } from '../components/BalanceCard';
import { User, Balance } from '../models';
import { db } from '../data/database';
import { useBackgroundColor } from '../contexts/BackgroundColorContext';

interface HomeScreenProps {
  onLogout?: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ onLogout }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isProfileVisible, setIsProfileVisible] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [balances, setBalances] = useState<Balance[]>([]);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const avatarRef = useRef<View | null>(null);
  const { setShowColorPicker, setAvatarPosition } = useBackgroundColor();

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

  const loadBalances = async () => {
    try {
      // TODO: Implementar llamada al backend
      // const balancesData = await balanceService.getBalances(userId);
      // setBalances(balancesData.balances);
      
      // Por ahora usar mock
      setBalances(getMockBalances());
    } catch (error) {
      console.error('❌ Error cargando balances:', error);
      // Fallback a mock en caso de error
      setBalances(getMockBalances());
    }
  };

  const loadUserData = async () => {
    try {
      setIsLoading(true);

      // Inicializar la base de datos si no está inicializada
      try {
        await db.init();
        console.log('✅ Base de datos inicializada');
      } catch (dbError) {
        console.log('⚠️ Error inicializando base de datos, continuando con datos mock:', dbError);
      }

      // Obtener userId de AsyncStorage
      const userId = await AsyncStorage.getItem('currentUserId');
      
      if (userId) {
        console.log('📱 Cargando datos del usuario:', userId);
        
        try {
          // Obtener datos del usuario desde la base de datos
          const userData = await db.getUser(userId);
          
          if (userData) {
            console.log('✅ Datos del usuario cargados:', userData);
            setCurrentUser(userData);
          } else {
            console.log('⚠️ No se encontró el usuario, usando datos mock');
            setCurrentUser(getMockUser());
          }
        } catch (dbError) {
          console.log('⚠️ Error obteniendo usuario de la base de datos, usando datos mock:', dbError);
          setCurrentUser(getMockUser());
        }
      } else {
        console.log('⚠️ No hay userId en AsyncStorage, usando datos mock');
        setCurrentUser(getMockUser());
      }
    } catch (error) {
      console.error('❌ Error en loadUserData:', error);
      setCurrentUser(getMockUser());
    } finally {
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
          {/* Fondo negro absoluto para pull-to-refresh */}
          <View style={styles.blackBackground} />
          
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
            <ScrollView 
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              contentInsetAdjustmentBehavior="automatic"
              bounces={true}
              alwaysBounceVertical={true}
              contentInset={{ top: 0, bottom: 0 }}
              contentOffset={{ x: 0, y: 0 }}
            >
              <View style={styles.headerSpacer} />
              <BalanceCard balances={balances.length > 0 ? balances : getMockBalances()} />
              <View style={styles.emptyCard}>
                <Text style={styles.cardTitle}>Movimientos Unificados</Text>
              </View>
            </ScrollView>
          </Animated.View>

          <ProfileSheet
            visible={isProfileVisible}
            onClose={() => setIsProfileVisible(false)}
            user={currentUser}
            onLogout={onLogout}
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
    backgroundColor: '#000000', // Fondo negro para pull-to-refresh
  },
  blackBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000000',
    zIndex: 0,
  },
  content: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollView: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollContent: {
    paddingBottom: SPACING.xl,
    backgroundColor: 'transparent',
  },
  headerSpacer: {
    height: 60, // Solo el paddingTop del header (60px) para que el BalanceCard quede más arriba
  },
  header: {
    paddingTop: 60,
    paddingBottom: SPACING.lg,
    paddingHorizontal: SPACING.lg,
    backgroundColor: '#000000', // Negro pleno
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
    height: 300,
    backgroundColor: 'rgba(0, 0, 0, 0.3)', // Negro 70% transparente (30% opacidad)
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
});

