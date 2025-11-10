import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import Svg, { Circle, G, Defs, LinearGradient, Stop, Path, RadialGradient } from 'react-native-svg';

interface SiriOrbAgentProps {
  size?: number;
  isActive?: boolean;
}

export const SiriOrbAgent: React.FC<SiriOrbAgentProps> = ({ 
  size = 47, 
  isActive = false 
}) => {
  const center = size / 2;
  const radius = size * 0.4;

  // Simple pulse animation
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    if (isActive) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(scale, {
              toValue: 1.2,
              duration: 2000,
              useNativeDriver: false,
            }),
            Animated.timing(opacity, {
              toValue: 1,
              duration: 2000,
              useNativeDriver: true,
            }),
          ]),
          Animated.parallel([
            Animated.timing(scale, {
              toValue: 1,
              duration: 2000,
              useNativeDriver: false,
            }),
            Animated.timing(opacity, {
              toValue: 0.7,
              duration: 2000,
              useNativeDriver: true,
            }),
          ]),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    } else {
      scale.setValue(1);
      opacity.setValue(0.5);
    }
  }, [isActive]);

  const [scaleValue, setScaleValue] = React.useState(1);
  const [opacityValue, setOpacityValue] = React.useState(0.8);

  useEffect(() => {
    const scaleListener = scale.addListener(({ value }) => setScaleValue(value));
    const opacityListener = opacity.addListener(({ value }) => setOpacityValue(value));
    return () => {
      scale.removeListener(scaleListener);
      opacity.removeListener(opacityListener);
    };
  }, []);

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Defs>
          <RadialGradient id="orbGradient" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor="#00E0B8" stopOpacity="0.9" />
            <Stop offset="100%" stopColor="#0066FF" stopOpacity="0.5" />
          </RadialGradient>
        </Defs>
        <Circle
          cx={center}
          cy={center}
          r={radius * scaleValue}
          fill="url(#orbGradient)"
          opacity={opacityValue}
        />
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'visible',
  },
});
