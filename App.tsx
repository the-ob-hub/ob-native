import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { OnboardingScreen } from './src/features/onboarding/ui/OnboardingScreen';
import { MainTabs } from './src/navigation/MainTabs';
import { COLORS } from './src/constants';

const SplashScreen = ({ onFinish }: { onFinish: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onFinish();
    }, 2000); // 2 segundos de splash

    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <View style={styles.splashContainer}>
      <Text style={styles.splashLogo}>OndaBank</Text>
      <Text style={styles.splashTagline}>Tu banco, completamente agéntico</Text>
      <ActivityIndicator size="large" color={COLORS.white} style={styles.loader} />
    </View>
  );
};

function App() {
  const [currentScreen, setCurrentScreen] = useState<'splash' | 'onboarding' | 'main'>('splash');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkOnboardingStatus();
  }, []);

  const checkOnboardingStatus = async () => {
    try {
      const hasCompleted = await AsyncStorage.getItem('hasCompletedOnboarding');
      console.log('📱 Onboarding completado:', hasCompleted);
      
      // Si ya completó el onboarding, skip directo a main después del splash
      if (hasCompleted === 'true') {
        setIsLoading(false);
        // El splash mostrará y luego irá a main
      } else {
        setIsLoading(false);
        // El splash mostrará y luego irá a onboarding
      }
    } catch (error) {
      console.error('Error checking onboarding status:', error);
      setIsLoading(false);
    }
  };

  const handleSplashFinish = async () => {
    const hasCompleted = await AsyncStorage.getItem('hasCompletedOnboarding');
    if (hasCompleted === 'true') {
      setCurrentScreen('main');
    } else {
      setCurrentScreen('onboarding');
    }
  };

  const handleOnboardingComplete = () => {
    setCurrentScreen('main');
  };

  if (currentScreen === 'splash') {
    return <SplashScreen onFinish={handleSplashFinish} />;
  }

  if (currentScreen === 'onboarding') {
    return <OnboardingScreen onComplete={handleOnboardingComplete} />;
  }

  return <MainTabs />;
}

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
  },
  splashLogo: {
    fontSize: 48,
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: 16,
  },
  splashTagline: {
    fontSize: 16,
    color: COLORS.white,
    opacity: 0.9,
  },
  loader: {
    marginTop: 48,
  },
});

export default App;
