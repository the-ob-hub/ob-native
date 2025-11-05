import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, Dimensions, Animated } from 'react-native';
import { HomeScreen } from '../screens/HomeScreen';
import { TarjetasScreen } from '../screens/TarjetasScreen';
import { InversionesScreen } from '../screens/InversionesScreen';
import { AgentScreen } from '../screens/AgentScreen';
import { BottomNav } from '../components/BottomNav';

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

  useEffect(() => {
    Animated.spring(translateX, {
      toValue: -activeIndex * SCREEN_WIDTH,
      useNativeDriver: true,
      tension: 65,
      friction: 11,
    }).start();
  }, [activeIndex]);

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.screensContainer,
          { transform: [{ translateX }] },
        ]}
      >
        {screens.map((ScreenComponent, index) => (
          <View key={index} style={[styles.screenWrapper, { width: SCREEN_WIDTH }]}>
            <ScreenComponent />
          </View>
        ))}
      </Animated.View>
      <BottomNav activeIndex={activeIndex} onItemPress={setActiveIndex} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  screensContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  screenWrapper: {
    height: '100%',
  },
});

