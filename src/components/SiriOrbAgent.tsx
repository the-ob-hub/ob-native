import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';

interface SiriOrbAgentProps {
  size?: number;
  isActive?: boolean;
}

export const SiriOrbAgent: React.FC<SiriOrbAgentProps> = ({ 
  size = 36, 
  isActive = false 
}) => {
  const center = size / 2;
  
  // Core orb animations
  const coreScale = useRef(new Animated.Value(1)).current;
  const coreOpacity = useRef(new Animated.Value(1)).current;
  
  // Outer ring animations
  const ring1Scale = useRef(new Animated.Value(1)).current;
  const ring1Opacity = useRef(new Animated.Value(0.8)).current;
  const ring1Rotation = useRef(new Animated.Value(0)).current;
  
  const ring2Scale = useRef(new Animated.Value(1)).current;
  const ring2Opacity = useRef(new Animated.Value(0.6)).current;
  const ring2Rotation = useRef(new Animated.Value(0)).current;
  
  // Particle dots
  const particle1Scale = useRef(new Animated.Value(1)).current;
  const particle1Opacity = useRef(new Animated.Value(0.7)).current;
  const particle1Rotation = useRef(new Animated.Value(0)).current;
  
  const particle2Scale = useRef(new Animated.Value(1)).current;
  const particle2Opacity = useRef(new Animated.Value(0.7)).current;
  const particle2Rotation = useRef(new Animated.Value(180)).current;

  useEffect(() => {
    if (isActive) {
      // Core breathing pulse
      const corePulse = Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(coreScale, {
              toValue: 1.25,
              duration: 1800,
              useNativeDriver: false,
            }),
            Animated.timing(coreOpacity, {
              toValue: 1,
              duration: 1800,
              useNativeDriver: true,
            }),
          ]),
          Animated.parallel([
            Animated.timing(coreScale, {
              toValue: 1,
              duration: 1800,
              useNativeDriver: false,
            }),
            Animated.timing(coreOpacity, {
              toValue: 0.85,
              duration: 1800,
              useNativeDriver: true,
            }),
          ]),
        ])
      );

      // Ring 1 - rotating pulse
      const ring1Pulse = Animated.loop(
        Animated.parallel([
          Animated.sequence([
            Animated.timing(ring1Scale, {
              toValue: 1.3,
              duration: 2000,
              useNativeDriver: false,
            }),
            Animated.timing(ring1Scale, {
              toValue: 1,
              duration: 2000,
              useNativeDriver: false,
            }),
          ]),
          Animated.sequence([
            Animated.timing(ring1Opacity, {
              toValue: 1,
              duration: 2000,
              useNativeDriver: true,
            }),
            Animated.timing(ring1Opacity, {
              toValue: 0.6,
              duration: 2000,
              useNativeDriver: true,
            }),
          ]),
          Animated.loop(
            Animated.timing(ring1Rotation, {
              toValue: 360,
              duration: 8000,
              useNativeDriver: true,
            })
          ),
        ])
      );

      // Ring 2 - counter rotating pulse
      const ring2Pulse = Animated.loop(
        Animated.parallel([
          Animated.sequence([
            Animated.timing(ring2Scale, {
              toValue: 1.4,
              duration: 2200,
              useNativeDriver: false,
            }),
            Animated.timing(ring2Scale, {
              toValue: 1,
              duration: 2200,
              useNativeDriver: false,
            }),
          ]),
          Animated.sequence([
            Animated.timing(ring2Opacity, {
              toValue: 0.8,
              duration: 2200,
              useNativeDriver: true,
            }),
            Animated.timing(ring2Opacity, {
              toValue: 0.4,
              duration: 2200,
              useNativeDriver: true,
            }),
          ]),
          Animated.loop(
            Animated.timing(ring2Rotation, {
              toValue: -360,
              duration: 10000,
              useNativeDriver: true,
            })
          ),
        ])
      );

      // Particles - orbiting dots
      const particle1Anim = Animated.loop(
        Animated.parallel([
          Animated.sequence([
            Animated.timing(particle1Scale, {
              toValue: 1.5,
              duration: 1500,
              useNativeDriver: false,
            }),
            Animated.timing(particle1Scale, {
              toValue: 1,
              duration: 1500,
              useNativeDriver: false,
            }),
          ]),
          Animated.sequence([
            Animated.timing(particle1Opacity, {
              toValue: 1,
              duration: 1500,
              useNativeDriver: true,
            }),
            Animated.timing(particle1Opacity, {
              toValue: 0.5,
              duration: 1500,
              useNativeDriver: true,
            }),
          ]),
          Animated.loop(
            Animated.timing(particle1Rotation, {
              toValue: 360,
              duration: 6000,
              useNativeDriver: true,
            })
          ),
        ])
      );

      const particle2Anim = Animated.loop(
        Animated.parallel([
          Animated.sequence([
            Animated.timing(particle2Scale, {
              toValue: 1.5,
              duration: 1500,
              useNativeDriver: false,
            }),
            Animated.timing(particle2Scale, {
              toValue: 1,
              duration: 1500,
              useNativeDriver: false,
            }),
          ]),
          Animated.sequence([
            Animated.timing(particle2Opacity, {
              toValue: 1,
              duration: 1500,
              useNativeDriver: true,
            }),
            Animated.timing(particle2Opacity, {
              toValue: 0.5,
              duration: 1500,
              useNativeDriver: true,
            }),
          ]),
          Animated.loop(
            Animated.timing(particle2Rotation, {
              toValue: 540,
              duration: 6000,
              useNativeDriver: true,
            })
          ),
        ])
      );

      corePulse.start();
      ring1Pulse.start();
      ring2Pulse.start();
      particle1Anim.start();
      particle2Anim.start();

      return () => {
        corePulse.stop();
        ring1Pulse.stop();
        ring2Pulse.stop();
        particle1Anim.stop();
        particle2Anim.stop();
      };
    } else {
      // Reset to initial state
      coreScale.setValue(1);
      coreOpacity.setValue(0.7);
      ring1Scale.setValue(1);
      ring1Opacity.setValue(0.5);
      ring1Rotation.setValue(0);
      ring2Scale.setValue(1);
      ring2Opacity.setValue(0.3);
      ring2Rotation.setValue(0);
      particle1Scale.setValue(1);
      particle1Opacity.setValue(0.4);
      particle1Rotation.setValue(0);
      particle2Scale.setValue(1);
      particle2Opacity.setValue(0.4);
      particle2Rotation.setValue(180);
    }
  }, [isActive]);

  // Convert animated values to numbers for SVG
  const [ring1ScaleValue, setRing1ScaleValue] = React.useState(1);
  const [ring2ScaleValue, setRing2ScaleValue] = React.useState(1);
  const [coreScaleValue, setCoreScaleValue] = React.useState(1);
  const [particle1ScaleValue, setParticle1ScaleValue] = React.useState(1);
  const [particle2ScaleValue, setParticle2ScaleValue] = React.useState(1);
  const [particle1RotationValue, setParticle1RotationValue] = React.useState(0);
  const [particle2RotationValue, setParticle2RotationValue] = React.useState(180);
  const [ring1RotationValue, setRing1RotationValue] = React.useState(0);
  const [ring2RotationValue, setRing2RotationValue] = React.useState(0);
  const [ring1OpacityValue, setRing1OpacityValue] = React.useState(0.8);
  const [ring2OpacityValue, setRing2OpacityValue] = React.useState(0.6);
  const [particle1OpacityValue, setParticle1OpacityValue] = React.useState(0.7);
  const [particle2OpacityValue, setParticle2OpacityValue] = React.useState(0.7);
  const [coreOpacityValue, setCoreOpacityValue] = React.useState(1);

  useEffect(() => {
    const listeners = [
      ring1Scale.addListener(({ value }) => setRing1ScaleValue(value)),
      ring2Scale.addListener(({ value }) => setRing2ScaleValue(value)),
      coreScale.addListener(({ value }) => setCoreScaleValue(value)),
      particle1Scale.addListener(({ value }) => setParticle1ScaleValue(value)),
      particle2Scale.addListener(({ value }) => setParticle2ScaleValue(value)),
      particle1Rotation.addListener(({ value }) => setParticle1RotationValue(value)),
      particle2Rotation.addListener(({ value }) => setParticle2RotationValue(value)),
      ring1Rotation.addListener(({ value }) => setRing1RotationValue(value)),
      ring2Rotation.addListener(({ value }) => setRing2RotationValue(value)),
      ring1Opacity.addListener(({ value }) => setRing1OpacityValue(value)),
      ring2Opacity.addListener(({ value }) => setRing2OpacityValue(value)),
      particle1Opacity.addListener(({ value }) => setParticle1OpacityValue(value)),
      particle2Opacity.addListener(({ value }) => setParticle2OpacityValue(value)),
      coreOpacity.addListener(({ value }) => setCoreOpacityValue(value)),
    ];

    return () => {
      listeners.forEach(listener => {
        ring1Scale.removeListener(listener);
        ring2Scale.removeListener(listener);
        coreScale.removeListener(listener);
        particle1Scale.removeListener(listener);
        particle2Scale.removeListener(listener);
        particle1Rotation.removeListener(listener);
        particle2Rotation.removeListener(listener);
        ring1Rotation.removeListener(listener);
        ring2Rotation.removeListener(listener);
        ring1Opacity.removeListener(listener);
        ring2Opacity.removeListener(listener);
        particle1Opacity.removeListener(listener);
        particle2Opacity.removeListener(listener);
        coreOpacity.removeListener(listener);
      });
    };
  }, []);

  // Calculate particle positions using trigonometry
  const particleRadius = size * 0.35;
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
  
  const particle1Angle = toRadians(particle1RotationValue);
  const particle1X = center + particleRadius * Math.sin(particle1Angle);
  const particle1Y = center - particleRadius * Math.cos(particle1Angle);
  
  const particle2Angle = toRadians(particle2RotationValue);
  const particle2X = center + particleRadius * Math.sin(particle2Angle);
  const particle2Y = center - particleRadius * Math.cos(particle2Angle);

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Outer Ring 2 - Counter rotating */}
        <G
          transform={`rotate(${ring2RotationValue} ${center} ${center})`}
          opacity={ring2OpacityValue}
        >
          <Circle
            cx={center}
            cy={center}
            r={size * 0.45 * ring2ScaleValue}
            fill="none"
            stroke="#0066FF"
            strokeWidth={1.5}
            opacity={0.6}
          />
        </G>

        {/* Outer Ring 1 - Rotating */}
        <G
          transform={`rotate(${ring1RotationValue} ${center} ${center})`}
          opacity={ring1OpacityValue}
        >
          <Circle
            cx={center}
            cy={center}
            r={size * 0.4 * ring1ScaleValue}
            fill="none"
            stroke="#0066FF"
            strokeWidth={2}
            opacity={0.8}
          />
        </G>

        {/* Particle 1 - Orbiting dot */}
        <Circle
          cx={particle1X}
          cy={particle1Y}
          r={2 * particle1ScaleValue}
          fill="#00E0B8"
          opacity={particle1OpacityValue}
        />

        {/* Particle 2 - Counter orbiting dot */}
        <Circle
          cx={particle2X}
          cy={particle2Y}
          r={2 * particle2ScaleValue}
          fill="#0066FF"
          opacity={particle2OpacityValue}
        />

        {/* Core Orb - Breathing */}
        <G opacity={coreOpacityValue}>
          <Circle
            cx={center}
            cy={center}
            r={size * 0.25 * coreScaleValue}
            fill="#00E0B8"
          />
          {/* Inner highlight */}
          <Circle
            cx={center - size * 0.08}
            cy={center - size * 0.08}
            r={size * 0.1 * coreScaleValue}
            fill="#0066FF"
            opacity={0.6}
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
  absolute: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
});

