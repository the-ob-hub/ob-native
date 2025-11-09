import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, SPACING } from '../constants';
import { SkeletonScreen } from '../components/SkeletonScreen';
import { UserAvatar } from '../components/UserAvatar';
import { ProfileSheet } from '../components/ProfileSheet';
import { User } from '../models';
import { db } from '../data/database';
import { healthService } from '../services/api/healthService';
import { useLogs } from '../contexts/LogContext';

export const HomeScreen: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isProfileVisible, setIsProfileVisible] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [healthStatus, setHealthStatus] = useState<string | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const { addLog } = useLogs();

  useEffect(() => {
    loadUserData();
  }, []);

  const testHealthAPI = async () => {
    try {
      const logMsg = '🧪 Testing GET /health...';
      console.log(logMsg);
      addLog(logMsg);
      
      const result = await healthService.checkHealth();
      
      const successMsg = `✅ Health API Success: ${JSON.stringify(result)}`;
      console.log(successMsg);
      addLog(successMsg);
      
      setHealthStatus(JSON.stringify(result, null, 2));
    } catch (error) {
      const errorMsg = `❌ Health API Error: ${error instanceof Error ? error.message : String(error)}`;
      console.error(errorMsg);
      addLog(errorMsg);
      setHealthStatus(`Error: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const loadUserData = async () => {
    try {
      setIsLoading(true);

      // Obtener userId de AsyncStorage
      const userId = await AsyncStorage.getItem('currentUserId');
      
      if (userId) {
        console.log('📱 Cargando datos del usuario:', userId);
        
        // Obtener datos del usuario desde la base de datos
        const userData = await db.getUser(userId);
        
        if (userData) {
          console.log('✅ Datos del usuario cargados:', userData);
          setCurrentUser(userData);
        } else {
          console.log('⚠️ No se encontró el usuario, usando datos mock');
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
          <Animated.View
            style={[
              styles.content,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <View style={styles.header}>
              <UserAvatar
                fullName={currentUser?.fullName}
                onPress={() => setIsProfileVisible(true)}
              />
            </View>
            <View style={styles.welcomeContainer}>
              <Text style={styles.welcomeTitle}>
                ¡Bienvenido{currentUser?.fullName ? `, ${currentUser.fullName.split(' ')[0]}` : ''}!
              </Text>
              <Text style={styles.subtitle}>Esta es tu Home.</Text>
              
              {/* Botón de prueba para API */}
              <TouchableOpacity 
                style={styles.testButton}
                onPress={testHealthAPI}
              >
                <Text style={styles.testButtonText}>🏥 Probar API: GET /health</Text>
              </TouchableOpacity>
              
              {/* Mostrar health status si está disponible */}
              {healthStatus && (
                <View style={styles.healthContainer}>
                  <Text style={styles.healthTitle}>🏥 Health Check:</Text>
                  <Text style={styles.healthText}>{healthStatus}</Text>
                </View>
              )}
            </View>
          </Animated.View>

          <ProfileSheet
            visible={isProfileVisible}
            onClose={() => setIsProfileVisible(false)}
            user={currentUser}
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
    backgroundColor: 'transparent',
  },
  content: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingBottom: SPACING.lg,
    paddingHorizontal: SPACING.lg,
    backgroundColor: 'transparent',
    borderBottomWidth: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  welcomeContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
  },
  welcomeTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.white,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  subtitle: {
    fontSize: 20,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  testButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: 12,
    marginTop: SPACING.md,
  },
  testButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  healthContainer: {
    marginTop: SPACING.lg,
    padding: SPACING.md,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    minWidth: 200,
    maxWidth: '90%',
  },
  healthTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  healthText: {
    fontSize: 12,
    color: COLORS.white,
    fontFamily: 'monospace',
    textAlign: 'left',
  },
});

