import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';

interface SiriOrbAgentProps {
  size?: number;
  isActive?: boolean;
}

export const SiriOrbAgent: React.FC<SiriOrbAgentProps> = ({ 
  size = 32, 
  isActive = false 
}) => {
  const center = size / 2;
  const radius = size * 0.4; // Más grande
  const glowRadius = radius * 1.6; // Glow más extendido

  const pulseScale = useRef(new Animated.Value(1)).current;
  const pulseOpacity = useRef(new Animated.Value(0.7)).current;
  const glowScale = useRef(new Animated.Value(1)).current;
  const glowOpacity = useRef(new Animated.Value(0.6)).current;
  const [orbRadius, setOrbRadius] = useState(radius);
  const [glowRadiusValue, setGlowRadiusValue] = useState(glowRadius);

  useEffect(() => {
    if (isActive) {
      // Animación de pulso principal - más pronunciada y respirada
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(pulseScale, {
              toValue: 1.4, // Más pronunciado (antes 1.15)
              duration: 2000, // Más lento para efecto respiración
              useNativeDriver: false,
            }),
            Animated.timing(pulseOpacity, {
              toValue: 1,
              duration: 2000,
              useNativeDriver: true,
            }),
          ]),
          Animated.parallel([
            Animated.timing(pulseScale, {
              toValue: 1,
              duration: 2000,
              useNativeDriver: false,
            }),
            Animated.timing(pulseOpacity, {
              toValue: 0.6, // Más diferencia de opacidad
              duration: 2000,
              useNativeDriver: true,
            }),
          ]),
        ])
      );

      // Animación de glow exterior - más pronunciada
      const glowAnimation = Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(glowScale, {
              toValue: 1.6, // Más pronunciado (antes 1.3)
              duration: 2500, // Más lento
              useNativeDriver: false,
            }),
            Animated.timing(glowOpacity, {
              toValue: 0.3, // Más visible
              duration: 2500,
              useNativeDriver: true,
            }),
          ]),
          Animated.parallel([
            Animated.timing(glowScale, {
              toValue: 1,
              duration: 2500,
              useNativeDriver: false,
            }),
            Animated.timing(glowOpacity, {
              toValue: 0.7, // Más diferencia
              duration: 2500,
              useNativeDriver: true,
            }),
          ]),
        ])
      );

      // Listeners para actualizar los radios
      const pulseListener = pulseScale.addListener(({ value }) => {
        setOrbRadius(radius * value);
      });
      const glowListener = glowScale.addListener(({ value }) => {
        setGlowRadiusValue(glowRadius * value);
      });

      pulseAnimation.start();
      glowAnimation.start();

      return () => {
        pulseAnimation.stop();
        glowAnimation.stop();
        pulseScale.removeListener(pulseListener);
        glowScale.removeListener(glowListener);
      };
    } else {
      // Reset a valores iniciales cuando está inactivo
      pulseScale.setValue(1);
      pulseOpacity.setValue(0.6);
      glowScale.setValue(1);
      glowOpacity.setValue(0.3);
      setOrbRadius(radius);
      setGlowRadiusValue(glowRadius);
    }
  }, [isActive, radius, glowRadius]);

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* Glow exterior animado */}
      <Animated.View
        style={[
          styles.layer,
          {
            opacity: glowOpacity,
          },
        ]}
        pointerEvents="none"
      >
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <Defs>
            <RadialGradient id="glowGradient" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor="#00F6FF" stopOpacity="0.6" />
              <Stop offset="100%" stopColor="#5D5FEF" stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Circle
            cx={center}
            cy={center}
            r={glowRadiusValue}
            fill="url(#glowGradient)"
          />
        </Svg>
      </Animated.View>

      {/* Orb principal animado */}
      <Animated.View
        style={[
          styles.layer,
          {
            opacity: pulseOpacity,
          },
        ]}
        pointerEvents="none"
      >
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <Defs>
            <RadialGradient id="orbGradient" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor="#00F6FF" stopOpacity="1" />
              <Stop offset="60%" stopColor="#5D5FEF" stopOpacity="0.8" />
              <Stop offset="100%" stopColor="#5D5FEF" stopOpacity="0.3" />
            </RadialGradient>
          </Defs>
          <Circle
            cx={center}
            cy={center}
            r={orbRadius}
            fill="url(#orbGradient)"
          />
        </Svg>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'visible',
  },
  layer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
});

