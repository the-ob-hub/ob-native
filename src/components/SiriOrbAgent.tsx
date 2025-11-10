import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import Svg, { Circle, G, Defs, LinearGradient, Stop, Path, RadialGradient, Ellipse } from 'react-native-svg';

interface SiriOrbAgentProps {
  size?: number;
  isActive?: boolean;
}

export const SiriOrbAgent: React.FC<SiriOrbAgentProps> = ({ 
  size = 47, 
  isActive = false 
}) => {
  const center = size / 2;
  const bubbleWidth = size * 0.7;
  const bubbleHeight = size * 0.6;
  const cornerRadius = size * 0.12;

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

  // Speech bubble path
  const bubbleX = center - bubbleWidth / 2;
  const bubbleY = center - bubbleHeight / 2;
  const tailSize = size * 0.08;
  const tailX = center + bubbleWidth * 0.25;
  const tailY = center + bubbleHeight / 2;

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

        {/* Speech bubble */}
        <G>
          {/* Main bubble body */}
          <Path
            d={`M ${bubbleX + cornerRadius} ${bubbleY} 
                L ${bubbleX + bubbleWidth - cornerRadius} ${bubbleY} 
                Q ${bubbleX + bubbleWidth} ${bubbleY}, ${bubbleX + bubbleWidth} ${bubbleY + cornerRadius}
                L ${bubbleX + bubbleWidth} ${bubbleY + bubbleHeight - cornerRadius}
                Q ${bubbleX + bubbleWidth} ${bubbleY + bubbleHeight}, ${bubbleX + bubbleWidth - cornerRadius} ${bubbleY + bubbleHeight}
                L ${tailX} ${bubbleY + bubbleHeight}
                L ${tailX + tailSize} ${tailY}
                L ${tailX} ${tailY - tailSize}
                L ${bubbleX + cornerRadius} ${tailY - tailSize}
                Q ${bubbleX} ${tailY - tailSize}, ${bubbleX} ${tailY - tailSize - cornerRadius}
                L ${bubbleX} ${bubbleY + cornerRadius}
                Q ${bubbleX} ${bubbleY}, ${bubbleX + cornerRadius} ${bubbleY} Z`}
            fill="url(#bubbleGradient)"
          />
          
          {/* Highlight overlay */}
          <Path
            d={`M ${bubbleX + cornerRadius} ${bubbleY} 
                L ${bubbleX + bubbleWidth - cornerRadius} ${bubbleY} 
                Q ${bubbleX + bubbleWidth} ${bubbleY}, ${bubbleX + bubbleWidth} ${bubbleY + cornerRadius}
                L ${bubbleX + bubbleWidth} ${bubbleY + bubbleHeight - cornerRadius}
                Q ${bubbleX + bubbleWidth} ${bubbleY + bubbleHeight}, ${bubbleX + bubbleWidth - cornerRadius} ${bubbleY + bubbleHeight}
                L ${tailX} ${bubbleY + bubbleHeight}
                L ${tailX + tailSize} ${tailY}
                L ${tailX} ${tailY - tailSize}
                L ${bubbleX + cornerRadius} ${tailY - tailSize}
                Q ${bubbleX} ${tailY - tailSize}, ${bubbleX} ${tailY - tailSize - cornerRadius}
                L ${bubbleX} ${bubbleY + cornerRadius}
                Q ${bubbleX} ${bubbleY}, ${bubbleX + cornerRadius} ${bubbleY} Z`}
            fill="url(#bubbleHighlight)"
          />
        </G>

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
