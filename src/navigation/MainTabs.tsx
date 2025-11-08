import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, Dimensions, Animated } from 'react-native';
import { HomeScreen } from '../screens/HomeScreen';
import { TarjetasScreen } from '../screens/TarjetasScreen';
import { InversionesScreen } from '../screens/InversionesScreen';
import { AgentScreen } from '../screens/AgentScreen';
import { BottomNav } from '../components/BottomNav';
import { SharedBackground } from '../components/SharedBackground';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const screens = [
  HomeScreen,
  TarjetasScreen,
  InversionesScreen,
  AgentScreen,
];

export const MainTabs: React.FC = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const translateX = useRef(new Animated.Value(0)).current;

  const handleItemPress = (index: number) => {
    console.log('🟢 MainTabs - handleItemPress llamado con índice:', index);
    console.log('🟢 MainTabs - activeIndex actual antes de cambiar:', activeIndex);
    setActiveIndex(index);
    console.log('🟢 MainTabs - setActiveIndex ejecutado con:', index);
  };

  useEffect(() => {
    console.log('🟢 MainTabs - activeIndex cambió a:', activeIndex);
    console.log('🟢 MainTabs - Animando translateX a:', -activeIndex * SCREEN_WIDTH);
    Animated.spring(translateX, {
      toValue: -activeIndex * SCREEN_WIDTH,
      useNativeDriver: true,
      tension: 65,
      friction: 11,
    }).start(() => {
      console.log('🟢 MainTabs - Animación completada');
    });
  }, [activeIndex]);

  return (
    <View style={styles.container}>
      {/* Fondo compartido animado para las primeras 3 pantallas */}
      <Animated.View
        style={[
          styles.backgroundContainer,
          { transform: [{ translateX }] },
        ]}
      >
        <SharedBackground />
      </Animated.View>

      {/* Pantallas */}
      <Animated.View
        style={[
          styles.screensContainer,
          { transform: [{ translateX }] },
        ]}
        pointerEvents="box-none"
      >
        {screens.map((ScreenComponent, index) => (
          <View key={index} style={[styles.screenWrapper, { width: SCREEN_WIDTH }]}>
            <ScreenComponent />
          </View>
        ))}
      </Animated.View>

      <BottomNav activeIndex={activeIndex} onItemPress={handleItemPress} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
  },
  screensContainer: {
    flex: 1,
    flexDirection: 'row',
    zIndex: 1,
    paddingBottom: 80, // Espacio para el BottomNav
  },
  screenWrapper: {
    height: '100%',
  },
});

