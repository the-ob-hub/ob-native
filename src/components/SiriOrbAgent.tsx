import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import Svg, { Ellipse, G } from 'react-native-svg';

interface SiriOrbAgentProps {
  size?: number;
  isActive?: boolean;
}

export const SiriOrbAgent: React.FC<SiriOrbAgentProps> = ({ 
  size = 44, 
  isActive = false 
}) => {
  const center = size / 2;

  // Eyes blink animation - random timing
  const eyesOpacity = useRef(new Animated.Value(1)).current;
  const blinkTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isActive) {
      // Random blink function
      const scheduleBlink = () => {
        const delay = Math.random() * 2000 + 1000; // 1-3 seconds
        blinkTimeoutRef.current = setTimeout(() => {
          Animated.sequence([
            Animated.timing(eyesOpacity, {
              toValue: 0.1,
              duration: 100,
              useNativeDriver: true,
            }),
            Animated.timing(eyesOpacity, {
              toValue: 1,
              duration: 100,
              useNativeDriver: true,
            }),
          ]).start(() => {
            scheduleBlink(); // Schedule next blink
          });
        }, delay);
      };

      scheduleBlink();

      return () => {
        if (blinkTimeoutRef.current) {
          clearTimeout(blinkTimeoutRef.current);
        }
      };
    } else {
      eyesOpacity.setValue(1);
      if (blinkTimeoutRef.current) {
        clearTimeout(blinkTimeoutRef.current);
      }
    }
  }, [isActive]);

  const [eyesOpacityValue, setEyesOpacityValue] = React.useState(1);

  useEffect(() => {
    const eyesListener = eyesOpacity.addListener(({ value }) => setEyesOpacityValue(value));
    return () => {
      eyesOpacity.removeListener(eyesListener);
    };
  }, []);

  // Eye dimensions - vertical ovals
  const eyeWidth = size * 0.14;
  const eyeHeight = size * 0.2;
  const eyeSpacing = size * 0.18;
  const eyeY = center - size * 0.08;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Eyes (ojitos) - vertical ovals */}
        <G opacity={eyesOpacityValue}>
          {/* Left eye */}
          <Ellipse
            cx={center - eyeSpacing/2}
            cy={eyeY}
            rx={eyeWidth/2}
            ry={eyeHeight/2}
            fill="#FFFFFF"
          />
          
          {/* Right eye */}
          <Ellipse
            cx={center + eyeSpacing/2}
            cy={eyeY}
            rx={eyeWidth/2}
            ry={eyeHeight/2}
            fill="#FFFFFF"
          />
        </G>
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
