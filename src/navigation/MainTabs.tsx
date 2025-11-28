import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, Dimensions, Animated, TouchableOpacity, Text } from 'react-native';
import { HomeScreen } from '../screens/HomeScreen';
import { TarjetasScreen } from '../screens/TarjetasScreen';
import { InversionesScreen } from '../screens/InversionesScreen';
import { AgentScreen } from '../screens/AgentScreen';
import { BottomNav } from '../components/BottomNav';
import { SharedBackground } from '../components/SharedBackground';
import { BackgroundColorPicker } from '../components/BackgroundColorPicker';
import { LogViewer } from '../components/LogViewer';
import { useLogs } from '../contexts/LogContext';
import { COLORS } from '../constants';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const screens = [
  HomeScreen,
  TarjetasScreen,
  InversionesScreen,
  AgentScreen,
];

interface MainTabsProps {
  onLogout?: () => void;
}

export const MainTabs: React.FC<MainTabsProps> = ({ onLogout }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isLogViewerVisible, setIsLogViewerVisible] = useState(false);
  const translateX = useRef(new Animated.Value(0)).current;
  const { addLog } = useLogs();

  const handleItemPress = (index: number) => {
    const msg1 = `🟢 MainTabs - handleItemPress llamado con índice: ${index}`;
    const msg2 = `🟢 MainTabs - activeIndex actual antes de cambiar: ${activeIndex}`;
    console.log(msg1);
    console.log(msg2);
    addLog(msg1);
    addLog(msg2);
    setActiveIndex(index);
    const msg3 = `🟢 MainTabs - setActiveIndex ejecutado con: ${index}`;
    console.log(msg3);
    addLog(msg3);
  };

  useEffect(() => {
    const msg1 = `🟢 MainTabs - activeIndex cambió a: ${activeIndex}`;
    const msg2 = `🟢 MainTabs - Animando translateX a: ${-activeIndex * SCREEN_WIDTH}`;
    console.log(msg1);
    console.log(msg2);
    addLog(msg1);
    addLog(msg2);
    Animated.spring(translateX, {
      toValue: -activeIndex * SCREEN_WIDTH,
      useNativeDriver: true,
      tension: 65,
      friction: 11,
    }).start(() => {
      const msg3 = '🟢 MainTabs - Animación completada';
      console.log(msg3);
      addLog(msg3);
    });
  }, [activeIndex]);

  return (
    <View style={styles.container}>
      {/* Fondo compartido animado para las 4 pantallas */}
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
          <View key={index} style={[styles.screenWrapper, { width: SCREEN_WIDTH }]} pointerEvents="auto">
            {index === 0 ? (
              <ScreenComponent onLogout={onLogout} />
            ) : (
              <ScreenComponent />
            )}
          </View>
        ))}
      </Animated.View>

      {/* Selector de color de fondo - ahora renderizado dentro del HomeScreen */}

      <BottomNav activeIndex={activeIndex} onItemPress={handleItemPress} />

      {/* Badge de versión flotante - visible en todas las pantallas */}
      <TouchableOpacity
        style={styles.versionBadge}
        onPress={() => setIsLogViewerVisible(true)}
        activeOpacity={0.7}
      >
        <Text style={styles.versionBadgeText}>v2.2.6</Text>
      </TouchableOpacity>

      {/* LogViewer */}
      <LogViewer
        visible={isLogViewerVisible}
        onClose={() => setIsLogViewerVisible(false)}
      />
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
  versionBadge: {
    position: 'absolute',
    top: 50,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    zIndex: 9999,
    elevation: 9999,
  },
  versionBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.white,
  },
});

