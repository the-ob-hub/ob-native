import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import Svg, { Circle, G, Defs, LinearGradient, Stop, Path, RadialGradient, Rect } from 'react-native-svg';

interface SiriOrbAgentProps {
  size?: number;
  isActive?: boolean;
}

export const SiriOrbAgent: React.FC<SiriOrbAgentProps> = ({ 
  size = 47, 
  isActive = false 
}) => {
  const center = size / 2;
  const buttonRadius = size * 0.3;
  const ringRadius = size * 0.38;
  const ringWidth = size * 0.08;

  // Ring rotation animation
  const ringRotation = useRef(new Animated.Value(0)).current;
  
  // Eyes blink animation - random timing
  const eyesOpacity = useRef(new Animated.Value(1)).current;
  const blinkTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isActive) {
      // Continuous ring rotation
      const rotateAnim = Animated.loop(
        Animated.timing(ringRotation, {
          toValue: 360,
          duration: 6000,
          useNativeDriver: true,
        })
      );
      rotateAnim.start();

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
        rotateAnim.stop();
        if (blinkTimeoutRef.current) {
          clearTimeout(blinkTimeoutRef.current);
        }
      };
    } else {
      ringRotation.setValue(0);
      eyesOpacity.setValue(1);
      if (blinkTimeoutRef.current) {
        clearTimeout(blinkTimeoutRef.current);
      }
    }
  }, [isActive]);

  const [ringRotationValue, setRingRotationValue] = React.useState(0);
  const [eyesOpacityValue, setEyesOpacityValue] = React.useState(1);

  useEffect(() => {
    const rotationListener = ringRotation.addListener(({ value }) => setRingRotationValue(value));
    const eyesListener = eyesOpacity.addListener(({ value }) => setEyesOpacityValue(value));
    return () => {
      ringRotation.removeListener(rotationListener);
      eyesOpacity.removeListener(eyesListener);
    };
  }, []);

  // Calculate arc paths for color segments
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
  
  const createArc = (startAngle: number, endAngle: number, innerRadius: number, outerRadius: number) => {
    const startRad = toRadians(startAngle);
    const endRad = toRadians(endAngle);
    
    const x1 = center + innerRadius * Math.cos(startRad);
    const y1 = center + innerRadius * Math.sin(startRad);
    const x2 = center + outerRadius * Math.cos(startRad);
    const y2 = center + outerRadius * Math.sin(startRad);
    const x3 = center + outerRadius * Math.cos(endRad);
    const y3 = center + outerRadius * Math.sin(endRad);
    const x4 = center + innerRadius * Math.cos(endRad);
    const y4 = center + innerRadius * Math.sin(endRad);
    
    const largeArc = endAngle - startAngle > 180 ? 1 : 0;
    
    return `M ${x2} ${y2} A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${x3} ${y3} L ${x4} ${y4} A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${x1} ${y1} Z`;
  };

  // Eye dimensions
  const eyeWidth = size * 0.06;
  const eyeHeight = size * 0.12;
  const eyeSpacing = size * 0.08;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Defs>
          {/* Color ring gradients */}
          <LinearGradient id="greenYellow" x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor="#00FF88" stopOpacity="1" />
            <Stop offset="100%" stopColor="#FFD700" stopOpacity="1" />
          </LinearGradient>

          <LinearGradient id="yellowOrange" x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor="#FFD700" stopOpacity="1" />
            <Stop offset="100%" stopColor="#FF8C00" stopOpacity="1" />
          </LinearGradient>

          <LinearGradient id="orangeRed" x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor="#FF8C00" stopOpacity="1" />
            <Stop offset="100%" stopColor="#FF4444" stopOpacity="1" />
          </LinearGradient>

          <LinearGradient id="redMagenta" x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor="#FF4444" stopOpacity="1" />
            <Stop offset="100%" stopColor="#FF00FF" stopOpacity="1" />
          </LinearGradient>

          <LinearGradient id="magentaPurple" x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor="#FF00FF" stopOpacity="1" />
            <Stop offset="100%" stopColor="#9B59B6" stopOpacity="1" />
          </LinearGradient>

          <LinearGradient id="purpleBlue" x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor="#9B59B6" stopOpacity="1" />
            <Stop offset="100%" stopColor="#4D96FF" stopOpacity="1" />
          </LinearGradient>

          <LinearGradient id="blueGreen" x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor="#4D96FF" stopOpacity="1" />
            <Stop offset="100%" stopColor="#00FF88" stopOpacity="1" />
          </LinearGradient>

          {/* Button gradient - dark glossy */}
          <RadialGradient id="buttonGradient" cx="30%" cy="30%" r="70%">
            <Stop offset="0%" stopColor="#1a1a1a" stopOpacity="1" />
            <Stop offset="50%" stopColor="#0a0a0a" stopOpacity="1" />
            <Stop offset="100%" stopColor="#000000" stopOpacity="1" />
          </RadialGradient>

          {/* Button highlight */}
          <RadialGradient id="buttonHighlight" cx="30%" cy="30%" r="50%">
            <Stop offset="0%" stopColor="#ffffff" stopOpacity="0.3" />
            <Stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </RadialGradient>
        </Defs>

        {/* Color ring - rotating */}
        <G transform={`rotate(${ringRotationValue} ${center} ${center})`}>
          <Path
            d={createArc(-90, -45, ringRadius - ringWidth/2, ringRadius + ringWidth/2)}
            fill="url(#greenYellow)"
          />
          <Path
            d={createArc(-45, 0, ringRadius - ringWidth/2, ringRadius + ringWidth/2)}
            fill="url(#yellowOrange)"
          />
          <Path
            d={createArc(0, 45, ringRadius - ringWidth/2, ringRadius + ringWidth/2)}
            fill="url(#orangeRed)"
          />
          <Path
            d={createArc(45, 90, ringRadius - ringWidth/2, ringRadius + ringWidth/2)}
            fill="url(#redMagenta)"
          />
          <Path
            d={createArc(90, 135, ringRadius - ringWidth/2, ringRadius + ringWidth/2)}
            fill="url(#magentaPurple)"
          />
          <Path
            d={createArc(135, 180, ringRadius - ringWidth/2, ringRadius + ringWidth/2)}
            fill="url(#purpleBlue)"
          />
          <Path
            d={createArc(180, 225, ringRadius - ringWidth/2, ringRadius + ringWidth/2)}
            fill="url(#blueGreen)"
          />
          <Path
            d={createArc(225, 270, ringRadius - ringWidth/2, ringRadius + ringWidth/2)}
            fill="url(#greenYellow)"
          />
        </G>

        {/* Dark glossy button */}
        <Circle
          cx={center}
          cy={center}
          r={buttonRadius}
          fill="url(#buttonGradient)"
        />
        
        {/* Button highlight */}
        <Circle
          cx={center - buttonRadius * 0.3}
          cy={center - buttonRadius * 0.3}
          r={buttonRadius * 0.6}
          fill="url(#buttonHighlight)"
        />

        {/* Eyes (ojitos) - two vertical rectangles */}
        <G opacity={eyesOpacityValue}>
          {/* Left eye */}
          <Rect
            x={center - eyeSpacing/2 - eyeWidth}
            y={center - eyeHeight/2}
            width={eyeWidth}
            height={eyeHeight}
            rx={eyeWidth/2}
            ry={eyeWidth/2}
            fill="#FFFFFF"
          />
          
          {/* Right eye */}
          <Rect
            x={center + eyeSpacing/2}
            y={center - eyeHeight/2}
            width={eyeWidth}
            height={eyeHeight}
            rx={eyeWidth/2}
            ry={eyeWidth/2}
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
