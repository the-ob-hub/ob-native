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
  const radius = size * 0.4;
  
  // Fluid form animations - wave-like movements
  const fluid1Rotation = useRef(new Animated.Value(0)).current;
  const fluid1Scale = useRef(new Animated.Value(1)).current;
  const fluid1Opacity = useRef(new Animated.Value(0.8)).current;
  
  const fluid2Rotation = useRef(new Animated.Value(180)).current;
  const fluid2Scale = useRef(new Animated.Value(1)).current;
  const fluid2Opacity = useRef(new Animated.Value(0.7)).current;
  
  // Core orb animations
  const coreScale = useRef(new Animated.Value(1)).current;
  const coreOpacity = useRef(new Animated.Value(0.9)).current;
  
  // Outer glow
  const glowScale = useRef(new Animated.Value(1)).current;
  const glowOpacity = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    if (isActive) {
      // Core breathing pulse - subtle
      const corePulse = Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(coreScale, {
              toValue: 1.15,
              duration: 3000,
              useNativeDriver: false,
            }),
            Animated.timing(coreOpacity, {
              toValue: 1,
              duration: 3000,
              useNativeDriver: true,
            }),
          ]),
          Animated.parallel([
            Animated.timing(coreScale, {
              toValue: 1,
              duration: 3000,
              useNativeDriver: false,
            }),
            Animated.timing(coreOpacity, {
              toValue: 0.85,
              duration: 3000,
              useNativeDriver: true,
            }),
          ]),
        ])
      );

      // Fluid form 1 - slow wave rotation
      const fluid1Anim = Animated.loop(
        Animated.parallel([
          Animated.timing(fluid1Rotation, {
            toValue: 360,
            duration: 12000,
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.timing(fluid1Scale, {
              toValue: 1.2,
              duration: 4000,
              useNativeDriver: false,
            }),
            Animated.timing(fluid1Scale, {
              toValue: 1,
              duration: 4000,
              useNativeDriver: false,
            }),
          ]),
          Animated.sequence([
            Animated.timing(fluid1Opacity, {
              toValue: 1,
              duration: 4000,
              useNativeDriver: true,
            }),
            Animated.timing(fluid1Opacity, {
              toValue: 0.6,
              duration: 4000,
              useNativeDriver: true,
            }),
          ]),
        ])
      );

      // Fluid form 2 - counter rotation
      const fluid2Anim = Animated.loop(
        Animated.parallel([
          Animated.timing(fluid2Rotation, {
            toValue: 540,
            duration: 15000,
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.timing(fluid2Scale, {
              toValue: 1.15,
              duration: 5000,
              useNativeDriver: false,
            }),
            Animated.timing(fluid2Scale, {
              toValue: 1,
              duration: 5000,
              useNativeDriver: false,
            }),
          ]),
          Animated.sequence([
            Animated.timing(fluid2Opacity, {
              toValue: 0.9,
              duration: 5000,
              useNativeDriver: true,
            }),
            Animated.timing(fluid2Opacity, {
              toValue: 0.5,
              duration: 5000,
              useNativeDriver: true,
            }),
          ]),
        ])
      );

      // Outer glow pulse
      const glowAnim = Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(glowScale, {
              toValue: 1.3,
              duration: 2500,
              useNativeDriver: false,
            }),
            Animated.timing(glowOpacity, {
              toValue: 0.8,
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
              toValue: 0.4,
              duration: 2500,
              useNativeDriver: true,
            }),
          ]),
        ])
      );

      corePulse.start();
      fluid1Anim.start();
      fluid2Anim.start();
      glowAnim.start();

      return () => {
        corePulse.stop();
        fluid1Anim.stop();
        fluid2Anim.stop();
        glowAnim.stop();
      };
    } else {
      // Reset to initial state
      coreScale.setValue(1);
      coreOpacity.setValue(0.7);
      fluid1Rotation.setValue(0);
      fluid1Scale.setValue(1);
      fluid1Opacity.setValue(0.5);
      fluid2Rotation.setValue(180);
      fluid2Scale.setValue(1);
      fluid2Opacity.setValue(0.4);
      glowScale.setValue(1);
      glowOpacity.setValue(0.3);
    }
  }, [isActive]);

  // Convert animated values to numbers for SVG
  const [fluid1RotationValue, setFluid1RotationValue] = React.useState(0);
  const [fluid1ScaleValue, setFluid1ScaleValue] = React.useState(1);
  const [fluid1OpacityValue, setFluid1OpacityValue] = React.useState(0.8);
  const [fluid2RotationValue, setFluid2RotationValue] = React.useState(180);
  const [fluid2ScaleValue, setFluid2ScaleValue] = React.useState(1);
  const [fluid2OpacityValue, setFluid2OpacityValue] = React.useState(0.7);
  const [coreScaleValue, setCoreScaleValue] = React.useState(1);
  const [coreOpacityValue, setCoreOpacityValue] = React.useState(0.9);
  const [glowScaleValue, setGlowScaleValue] = React.useState(1);
  const [glowOpacityValue, setGlowOpacityValue] = React.useState(0.6);

  useEffect(() => {
    const listeners = [
      fluid1Rotation.addListener(({ value }) => setFluid1RotationValue(value)),
      fluid1Scale.addListener(({ value }) => setFluid1ScaleValue(value)),
      fluid1Opacity.addListener(({ value }) => setFluid1OpacityValue(value)),
      fluid2Rotation.addListener(({ value }) => setFluid2RotationValue(value)),
      fluid2Scale.addListener(({ value }) => setFluid2ScaleValue(value)),
      fluid2Opacity.addListener(({ value }) => setFluid2OpacityValue(value)),
      coreScale.addListener(({ value }) => setCoreScaleValue(value)),
      coreOpacity.addListener(({ value }) => setCoreOpacityValue(value)),
      glowScale.addListener(({ value }) => setGlowScaleValue(value)),
      glowOpacity.addListener(({ value }) => setGlowOpacityValue(value)),
    ];

    return () => {
      listeners.forEach(listener => {
        fluid1Rotation.removeListener(listener);
        fluid1Scale.removeListener(listener);
        fluid1Opacity.removeListener(listener);
        fluid2Rotation.removeListener(listener);
        fluid2Scale.removeListener(listener);
        fluid2Opacity.removeListener(listener);
        coreScale.removeListener(listener);
        coreOpacity.removeListener(listener);
        glowScale.removeListener(listener);
        glowOpacity.removeListener(listener);
      });
    };
  }, []);

  // Calculate fluid form paths - creating S-curve wave shapes
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
  const fluid1Angle = toRadians(fluid1RotationValue);
  const fluid2Angle = toRadians(fluid2RotationValue);

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Defs>
          {/* Outer glow gradient */}
          <RadialGradient id="glowGradient" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor="#00E0B8" stopOpacity="0.4" />
            <Stop offset="50%" stopColor="#0066FF" stopOpacity="0.2" />
            <Stop offset="100%" stopColor="#7B1FA2" stopOpacity="0" />
          </RadialGradient>

          {/* Fluid form 1 gradient - Purple to Blue */}
          <LinearGradient id="fluid1Gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#7B1FA2" stopOpacity="0.9" />
            <Stop offset="50%" stopColor="#0066FF" stopOpacity="0.8" />
            <Stop offset="100%" stopColor="#00E0B8" stopOpacity="0.7" />
          </LinearGradient>

          {/* Fluid form 2 gradient - Blue to Teal */}
          <LinearGradient id="fluid2Gradient" x1="100%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor="#0066FF" stopOpacity="0.8" />
            <Stop offset="50%" stopColor="#00E0B8" stopOpacity="0.9" />
            <Stop offset="100%" stopColor="#7B1FA2" stopOpacity="0.6" />
          </LinearGradient>

          {/* Core orb gradient */}
          <RadialGradient id="coreGradient" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor="#00E0B8" stopOpacity="0.9" />
            <Stop offset="60%" stopColor="#0066FF" stopOpacity="0.7" />
            <Stop offset="100%" stopColor="#7B1FA2" stopOpacity="0.4" />
          </RadialGradient>
        </Defs>

        {/* Outer glow */}
        <Circle
          cx={center}
          cy={center}
          r={radius * 1.2 * glowScaleValue}
          fill="url(#glowGradient)"
          opacity={glowOpacityValue}
        />

        {/* Translucent sphere border */}
        <Circle
          cx={center}
          cy={center}
          r={radius * coreScaleValue}
          fill="none"
          stroke="rgba(255, 255, 255, 0.3)"
          strokeWidth={0.5}
          opacity={coreOpacityValue}
        />

        {/* Fluid form 1 - S-curve wave */}
        <G
          transform={`rotate(${fluid1RotationValue} ${center} ${center}) scale(${fluid1ScaleValue})`}
          opacity={fluid1OpacityValue}
        >
          <Path
            d={`M ${center - radius * 0.6} ${center} 
                Q ${center - radius * 0.3} ${center - radius * 0.4}, ${center} ${center - radius * 0.2}
                T ${center + radius * 0.6} ${center}
                Q ${center + radius * 0.3} ${center + radius * 0.4}, ${center} ${center + radius * 0.2}
                T ${center - radius * 0.6} ${center} Z`}
            fill="url(#fluid1Gradient)"
            opacity={0.8}
          />
        </G>

        {/* Fluid form 2 - Counter wave */}
        <G
          transform={`rotate(${fluid2RotationValue} ${center} ${center}) scale(${fluid2ScaleValue})`}
          opacity={fluid2OpacityValue}
        >
          <Ellipse
            cx={center}
            cy={center}
            rx={radius * 0.7}
            ry={radius * 0.4}
            fill="url(#fluid2Gradient)"
            opacity={0.7}
            transform={`rotate(${-fluid2RotationValue * 0.5} ${center} ${center})`}
          />
        </G>

        {/* Core orb - translucent center */}
        <Circle
          cx={center}
          cy={center}
          r={radius * 0.5 * coreScaleValue}
          fill="url(#coreGradient)"
          opacity={coreOpacityValue * 0.6}
        />

        {/* Inner highlight */}
        <Ellipse
          cx={center - radius * 0.15}
          cy={center - radius * 0.15}
          rx={radius * 0.2 * coreScaleValue}
          ry={radius * 0.15 * coreScaleValue}
          fill="rgba(255, 255, 255, 0.3)"
          opacity={coreOpacityValue}
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
