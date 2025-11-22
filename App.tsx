import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import AsyncStorage from '@react-native-async-storage/async-storage';
// import { OnboardingScreen } from './src/features/onboarding/ui/OnboardingScreen'; // Deshabilitado temporalmente
import { LoginScreen } from './src/screens/LoginScreen';
import { SignUpScreen } from './src/screens/SignUpScreen';
import { ConfirmSignUpScreen } from './src/screens/ConfirmSignUpScreen';
import { MainTabs } from './src/navigation/MainTabs';
import { COLORS, SPACING } from './src/constants';
import { LogProvider } from './src/contexts/LogContext';
import { BackgroundColorProvider } from './src/contexts/BackgroundColorContext';
import { cognitoService } from './src/services/auth/cognitoService';
import { LoginBackground } from './src/components/LoginBackground';
import { logger } from './src/utils/logger';

const SplashScreen = ({ onFinish }: { onFinish: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onFinish();
    }, 2000); // 2 segundos de splash

    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <View style={styles.splashContainer}>
      {/* Background SVG */}
      <LoginBackground />
      
      <View style={styles.splashContent}>
        <Text style={styles.splashLogo}>OndaBank</Text>
        <Text style={styles.splashLab}>Lab</Text>
        <ActivityIndicator size="large" color={COLORS.white} style={styles.loader} />
      </View>
    </View>
  );
};

function App() {
  const [currentScreen, setCurrentScreen] = useState<'splash' | 'signup' | 'confirmSignup' | 'login' | 'main'>('splash');
  const [isLoading, setIsLoading] = useState(true);
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpUsername, setSignUpUsername] = useState('');

  useEffect(() => {
    checkAuthStatus();
  }, []);

  /**
   * Verifica si hay una sesión activa en Cognito
   */
  const checkAuthStatus = async () => {
    logger.log(`🚀 App - checkAuthStatus() - Iniciando verificación de sesión`);
    try {
      logger.log(`📞 App - checkAuthStatus() - Llamando cognitoService.getCurrentSession()`);
      const sessionResult = await cognitoService.getCurrentSession();
      
      if (sessionResult.success) {
        logger.log(`✅ App - checkAuthStatus() - Sesión Cognito activa encontrada`);
        logger.log(`📱 App - checkAuthStatus() - Navegando a MainTabs después del splash`);
        setIsLoading(false);
        // El splash mostrará y luego irá a main
      } else {
        logger.log(`⚠️ App - checkAuthStatus() - No hay sesión activa`);
        logger.log(`📱 App - checkAuthStatus() - Navegando a LoginScreen después del splash`);
        setIsLoading(false);
        // El splash mostrará y luego irá a login
      }
    } catch (error: any) {
      const errorMsg = `❌ App - checkAuthStatus() - Error verificando sesión: ${error.message || String(error)}`;
      logger.error(errorMsg);
      setIsLoading(false);
      // En caso de error, mostrar login
    }
  };

  const handleSplashFinish = async () => {
    logger.log(`🏁 App - handleSplashFinish() - Splash screen finalizado`);
    logger.log(`🔍 App - handleSplashFinish() - Verificando sesión para navegación`);
    const sessionResult = await cognitoService.getCurrentSession();
    if (sessionResult.success) {
      logger.log(`✅ App - handleSplashFinish() - Sesión válida, navegando a MainTabs`);
      setCurrentScreen('main');
    } else {
      logger.log(`⚠️ App - handleSplashFinish() - Sin sesión, navegando a LoginScreen`);
      setCurrentScreen('login');
    }
  };

  const handleLoginSuccess = async () => {
    logger.log(`✅ App - handleLoginSuccess() - ========== INICIO POST-LOGIN ==========`);
    logger.log(`⏰ App - handleLoginSuccess() - Timestamp: ${new Date().toISOString()}`);
    
    try {
      // Verificar que el JWT esté guardado
      const jwtToken = await AsyncStorage.getItem('jwt_token');
      if (jwtToken) {
        logger.log(`✅ App - handleLoginSuccess() - JWT encontrado en AsyncStorage (length: ${jwtToken.length})`);
      } else {
        logger.log(`⚠️ App - handleLoginSuccess() - JWT NO encontrado en AsyncStorage`);
      }
      
      // Obtener atributos del usuario de Cognito
      // getUserAttributes ahora maneja internamente la obtención de la sesión
      logger.log(`👤 App - handleLoginSuccess() - Obteniendo atributos del usuario...`);
      const attributes = await cognitoService.getUserAttributes();
      
      if (attributes) {
        logger.log(`✅ App - handleLoginSuccess() - Atributos obtenidos: ${Object.keys(attributes).join(', ')}`);
        
        // Obtener UUID del usuario (sub de Cognito) para el backend
        const email = attributes.email || '';
        const userIdUUID = attributes.sub || attributes['cognito:username'] || 'unknown'; // UUID para backend
        const userIdEmail = email || userIdUUID; // Email para base de datos local
        const fullName = attributes.name || '';
        const phone = attributes.phone_number || '';
        const birthDate = attributes.birthdate || '';
        
        logger.log(`👤 App - handleLoginSuccess() - UserId UUID (sub): ${userIdUUID}`);
        logger.log(`👤 App - handleLoginSuccess() - UserId Email: ${userIdEmail}`);
        logger.log(`📧 App - handleLoginSuccess() - Email: ${email}`);
        logger.log(`👤 App - handleLoginSuccess() - FullName: ${fullName || 'N/A'}`);
        logger.log(`📱 App - handleLoginSuccess() - Phone: ${phone || 'N/A'}`);
        
        // Guardar UUID en AsyncStorage para llamadas al backend
        await AsyncStorage.setItem('currentUserId', userIdUUID);
        logger.log(`💾 App - handleLoginSuccess() - UserId UUID guardado en AsyncStorage: ${userIdUUID}`);
        
        // Guardar también el email para referencia local
        await AsyncStorage.setItem('currentUserEmail', userIdEmail);
        logger.log(`💾 App - handleLoginSuccess() - UserId Email guardado en AsyncStorage: ${userIdEmail}`);
        
        // Inicializar base de datos y guardar usuario
        try {
          const { db } = await import('./src/data/database');
          await db.init();
          
          // Crear o actualizar usuario en la base de datos
          const now = new Date().toISOString();
          
          // Parsear address si existe
          let address = '';
          if (attributes.address) {
            try {
              const addressArray = JSON.parse(attributes.address);
              address = addressArray[0]?.formatted || attributes.address || '';
            } catch (e) {
              address = attributes.address;
            }
          }
          
          // Verificar si el usuario ya existe (usar email como ID para DB local)
          const existingUser = await db.getUser(userIdEmail);
          
          if (existingUser) {
            // Actualizar usuario existente
            await db.updateUser(userIdEmail, {
              email: email,
              fullName: fullName,
              phone: phone,
              birthDate: birthDate,
              address: address,
              onboardingStatus: 'completed',
            });
            logger.log(`✅ App - handleLoginSuccess() - Usuario actualizado en base de datos`);
          } else {
            // Crear nuevo usuario
            const userData = {
              id: userIdEmail, // Usar email como ID para DB local
              email: email,
              fullName: fullName,
              phone: phone,
              birthDate: birthDate,
              address: address,
              onboardingStatus: 'completed' as const,
              createdAt: now,
              updatedAt: now,
            };
            await db.createUser(userData);
            logger.log(`✅ App - handleLoginSuccess() - Usuario creado en base de datos`);
          }
        } catch (dbError: any) {
          logger.error(`❌ App - handleLoginSuccess() - Error guardando en base de datos: ${dbError.message}`);
          // Continuar aunque falle la base de datos
        }
      } else {
        logger.log(`⚠️ App - handleLoginSuccess() - No se pudieron obtener atributos del usuario`);
        // Usar email como userId si no hay atributos
        const cognitoUser = cognitoService.getCurrentUser();
        if (cognitoUser) {
          const username = cognitoUser.getUsername();
          await AsyncStorage.setItem('currentUserId', username);
          logger.log(`💾 App - handleLoginSuccess() - Username guardado como userId: ${username}`);
        }
      }
    } catch (error: any) {
      logger.error(`❌ App - handleLoginSuccess() - Error guardando datos del usuario: ${error.message}`);
      logger.error(`❌ App - handleLoginSuccess() - Error stack: ${error.stack || 'N/A'}`);
      // Continuar navegando aunque falle
    }
    
    logger.log(`📱 App - handleLoginSuccess() - Navegando a MainTabs`);
    logger.log(`✅ App - handleLoginSuccess() - ========== FIN POST-LOGIN ==========`);
    setCurrentScreen('main');
  };

  const handleSignUpSuccess = async (email: string, username: string, signUpData?: any) => {
    logger.log(`✅ App - handleSignUpSuccess() - Registro exitoso, guardando datos del usuario`);
    logger.log(`👤 App - handleSignUpSuccess() - Username guardado: ${username}`);
    logger.log(`📧 App - handleSignUpSuccess() - Email: ${email}`);
    
    // Guardar datos del usuario en la base de datos local después del registro
    try {
      const { db } = await import('./src/data/database');
      await db.init();
      
      // Usar el email como userId (o el username si es necesario)
      const userId = email; // Usar email como ID consistente
      
      const now = new Date().toISOString();
      const userData = {
        id: userId,
        email: email,
        fullName: signUpData?.fullName || '',
        phone: signUpData?.phoneNumber || '',
        birthDate: signUpData?.birthDate || '',
        address: signUpData?.address || '',
        onboardingStatus: 'pending' as const, // Pendiente hasta confirmar PIN
        createdAt: now,
        updatedAt: now,
      };
      
      // Verificar si el usuario ya existe
      const existingUser = await db.getUser(userId);
      if (existingUser) {
        await db.updateUser(userId, userData);
        logger.log(`✅ App - handleSignUpSuccess() - Usuario actualizado en base de datos`);
      } else {
        await db.createUser(userData);
        logger.log(`✅ App - handleSignUpSuccess() - Usuario creado en base de datos`);
      }
      
      // Guardar userId en AsyncStorage
      await AsyncStorage.setItem('currentUserId', userId);
      logger.log(`💾 App - handleSignUpSuccess() - UserId guardado en AsyncStorage: ${userId}`);
    } catch (dbError: any) {
      logger.error(`❌ App - handleSignUpSuccess() - Error guardando datos: ${dbError.message}`);
      // Continuar aunque falle
    }
    
    // NO navegar aquí - la navegación se hace en handleShowConfirm
  };

  const handleShowConfirm = (email: string, username: string) => {
    logger.log(`📱 App - handleShowConfirm() - Mostrando pantalla de confirmación`);
    logger.log(`📧 App - handleShowConfirm() - Email: ${email}`);
    logger.log(`👤 App - handleShowConfirm() - Username: ${username}`);
    setSignUpEmail(email);
    setSignUpUsername(username);
    setCurrentScreen('confirmSignup');
  };

  const handleConfirmSignUpSuccess = async () => {
    logger.log(`✅ App - handleConfirmSignUpSuccess() - Verificación exitosa`);
    
    // Actualizar onboardingStatus a 'completed' después de confirmar
    try {
      const { db } = await import('./src/data/database');
      await db.init();
      const userId = signUpEmail;
      if (userId) {
        await db.updateUser(userId, {
          onboardingStatus: 'completed',
        });
        logger.log(`✅ App - handleConfirmSignUpSuccess() - Estado de onboarding actualizado a 'completed'`);
      }
    } catch (dbError: any) {
      logger.error(`❌ App - handleConfirmSignUpSuccess() - Error actualizando estado: ${dbError.message}`);
    }
    
    logger.log(`📱 App - handleConfirmSignUpSuccess() - Navegando a LoginScreen`);
    setCurrentScreen('login');
  };

  // Función deshabilitada - OnboardingScreen comentado temporalmente
  // const handleOnboardingComplete = () => {
  //   setCurrentScreen('main');
  // };

  const handleLogout = async () => {
    logger.log(`🚪 App - handleLogout() - Iniciando proceso de logout`);
    try {
      // Cerrar sesión en Cognito
      logger.log(`🔐 App - handleLogout() - Cerrando sesión en Cognito`);
      await cognitoService.signOut();
      
      // Limpiar AsyncStorage
      logger.log(`🗑️ App - handleLogout() - Limpiando AsyncStorage`);
      await AsyncStorage.removeItem('hasCompletedOnboarding');
      await AsyncStorage.removeItem('currentUserId');
      
      // Limpiar base de datos SQLite
      logger.log(`🗄️ App - handleLogout() - Limpiando base de datos SQLite`);
      const { db } = await import('./src/data/database');
      await db.init();
      await db.clearAllData();
      
      logger.log(`✅ App - handleLogout() - Logout completado exitosamente`);
      logger.log(`📱 App - handleLogout() - Navegando a LoginScreen`);
      
      // Volver al registro (primera pantalla)
      setCurrentScreen('signup');
    } catch (error: any) {
      const errorMsg = `❌ App - handleLogout() - Error en logout: ${error.message || String(error)}`;
      logger.error(errorMsg);
      // Aún así, intentar volver al registro
      logger.log(`📱 App - handleLogout() - Navegando a SignUpScreen (a pesar del error)`);
      setCurrentScreen('signup');
    }
  };

  if (currentScreen === 'splash') {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SplashScreen onFinish={handleSplashFinish} />
      </GestureHandlerRootView>
    );
  }

  // OnboardingScreen deshabilitado temporalmente - reemplazado por LoginScreen
  // if (currentScreen === 'onboarding') {
  //   return (
  //     <GestureHandlerRootView style={{ flex: 1 }}>
  //       <LogProvider>
  //         <BackgroundColorProvider>
  //           <OnboardingScreen onComplete={handleOnboardingComplete} />
  //         </BackgroundColorProvider>
  //       </LogProvider>
  //     </GestureHandlerRootView>
  //   );
  // }

  if (currentScreen === 'signup') {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <LogProvider>
          <BackgroundColorProvider>
            <SignUpScreen
              onBack={() => setCurrentScreen('login')}
              onSignUpSuccess={handleSignUpSuccess}
              onShowConfirm={handleShowConfirm}
            />
          </BackgroundColorProvider>
        </LogProvider>
      </GestureHandlerRootView>
    );
  }

  if (currentScreen === 'confirmSignup') {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <LogProvider>
          <BackgroundColorProvider>
          <ConfirmSignUpScreen
            email={signUpEmail}
            username={signUpUsername}
            onBack={() => setCurrentScreen('signup')}
            onConfirmSuccess={handleConfirmSignUpSuccess}
          />
          </BackgroundColorProvider>
        </LogProvider>
      </GestureHandlerRootView>
    );
  }

  if (currentScreen === 'login') {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <LogProvider>
          <BackgroundColorProvider>
            <LoginScreen
              onLoginSuccess={handleLoginSuccess}
              onShowSignUp={() => setCurrentScreen('signup')}
            />
          </BackgroundColorProvider>
        </LogProvider>
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <LogProvider>
        <BackgroundColorProvider>
          <MainTabs onLogout={handleLogout} />
        </BackgroundColorProvider>
      </LogProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    backgroundColor: '#000000', // Fondo negro base
  },
  splashContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1, // Asegurar que el contenido esté sobre el fondo
  },
  splashLogo: {
    fontSize: 48,
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: 8,
  },
  splashLab: {
    fontSize: 20,
    fontStyle: 'italic',
    color: COLORS.white,
    opacity: 0.8,
    marginBottom: 16,
  },
  loader: {
    marginTop: 48,
  },
});

export default App;
