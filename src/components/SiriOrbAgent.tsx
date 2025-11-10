import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import Svg, { Circle, G, Defs, LinearGradient, Stop, Path, RadialGradient, Ellipse } from 'react-native-svg';

interface SiriOrbAgentProps {
  size?: number;
  isActive?: boolean;
}

export const SiriOrbAgent: React.FC<SiriOrbAgentProps> = ({ 
  size = 52, 
  isActive = false 
}) => {
  const center = size / 2;
  // Circle radius matches the bubble size (44px diameter = 22px radius)
  const circleRadius = 22;

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

  // Tail (patita) position - small triangle pointing down-right
  const tailSize = size * 0.06;
  const tailX = center + circleRadius * 0.4;
  const tailY = center + circleRadius * 0.7;

  // Eye dimensions - vertical ovals
  const eyeWidth = size * 0.08;
  const eyeHeight = size * 0.12;
  const eyeSpacing = size * 0.1;
  const eyeY = center - size * 0.05;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Defs>
          {/* Blue bubble gradient - brighter at top/center */}
          <LinearGradient id="bubbleGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor="#4A9EFF" stopOpacity="1" />
            <Stop offset="50%" stopColor="#0066FF" stopOpacity="1" />
            <Stop offset="100%" stopColor="#0052CC" stopOpacity="1" />
          </LinearGradient>

          {/* Bubble highlight for 3D effect */}
          <RadialGradient id="bubbleHighlight" cx="40%" cy="30%" r="60%">
            <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.3" />
            <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </RadialGradient>
        </Defs>

        {/* Main circle */}
        <G>
          <Circle
            cx={center}
            cy={center}
            r={circleRadius}
            fill="url(#bubbleGradient)"
          />
          
          {/* Highlight overlay */}
          <Circle
            cx={center - circleRadius * 0.2}
            cy={center - circleRadius * 0.2}
            r={circleRadius * 0.7}
            fill="url(#bubbleHighlight)"
          />
        </G>

        {/* Tail (patita) - small triangle */}
        <Path
          d={`M ${tailX} ${tailY} L ${tailX + tailSize} ${tailY + tailSize * 1.5} L ${tailX - tailSize} ${tailY + tailSize * 1.5} Z`}
          fill="url(#bubbleGradient)"
        />

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
