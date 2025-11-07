import React from 'react';
import { StyleSheet, Dimensions } from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Rect, Circle } from 'react-native-svg';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export const SharedBackground: React.FC = () => {
  return (
    <Svg height={SCREEN_HEIGHT} width={SCREEN_WIDTH * 3} style={styles.svg}>
      <Defs>
        <LinearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#FF8C00" stopOpacity="1" />
          <Stop offset="0.4" stopColor="#E85D75" stopOpacity="1" />
          <Stop offset="0.7" stopColor="#7B1FA2" stopOpacity="1" />
          <Stop offset="1" stopColor="#1A0A1F" stopOpacity="1" />
        </LinearGradient>
      </Defs>

      {/* Rectángulo con gradiente que cubre las 3 pantallas */}
      <Rect x="0" y="0" width={SCREEN_WIDTH * 3} height={SCREEN_HEIGHT} fill="url(#grad)" />

      {/* Círculos decorativos - Pantalla 1 (Home) */}
      <Circle cx={30} cy={30} r={30} fill="rgba(255, 255, 255, 0.15)" />
      <Circle cx={SCREEN_WIDTH * 0.7} cy={150} r={40} fill="rgba(255, 255, 255, 0.12)" />
      <Circle cx={SCREEN_WIDTH * 0.35} cy={80} r={35} fill="rgba(255, 255, 255, 0.1)" />
      <Circle cx={30} cy={250} r={35} fill="rgba(255, 255, 255, 0.08)" />
      <Circle cx={SCREEN_WIDTH * 0.5} cy={420} r={30} fill="rgba(255, 255, 255, 0.1)" />
      <Circle cx={SCREEN_WIDTH * 0.35} cy={700} r={40} fill="rgba(255, 255, 255, 0.08)" />

      {/* Círculos decorativos - Pantalla 2 (Tarjetas) */}
      <Circle cx={SCREEN_WIDTH + 40} cy={40} r={35} fill="rgba(255, 255, 255, 0.12)" />
      <Circle cx={SCREEN_WIDTH * 1.6} cy={180} r={45} fill="rgba(255, 255, 255, 0.1)" />
      <Circle cx={SCREEN_WIDTH * 1.3} cy={90} r={30} fill="rgba(255, 255, 255, 0.15)" />
      <Circle cx={SCREEN_WIDTH * 1.8} cy={350} r={38} fill="rgba(255, 255, 255, 0.09)" />
      <Circle cx={SCREEN_WIDTH * 1.5} cy={520} r={35} fill="rgba(255, 255, 255, 0.11)" />
      <Circle cx={SCREEN_WIDTH * 1.2} cy={680} r={42} fill="rgba(255, 255, 255, 0.08)" />

      {/* Círculos decorativos - Pantalla 3 (Inversiones) */}
      <Circle cx={SCREEN_WIDTH * 2 + 50} cy={50} r={38} fill="rgba(255, 255, 255, 0.13)" />
      <Circle cx={SCREEN_WIDTH * 2.7} cy={160} r={40} fill="rgba(255, 255, 255, 0.11)" />
      <Circle cx={SCREEN_WIDTH * 2.4} cy={95} r={32} fill="rgba(255, 255, 255, 0.14)" />
      <Circle cx={SCREEN_WIDTH * 2.15} cy={280} r={35} fill="rgba(255, 255, 255, 0.1)" />
      <Circle cx={SCREEN_WIDTH * 2.6} cy={450} r={38} fill="rgba(255, 255, 255, 0.09)" />
      <Circle cx={SCREEN_WIDTH * 2.3} cy={650} r={40} fill="rgba(255, 255, 255, 0.12)" />
    </Svg>
  );
};

const styles = StyleSheet.create({
  svg: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
});
