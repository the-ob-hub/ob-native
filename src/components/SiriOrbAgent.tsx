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
  const radius = size * 0.35;
  const strokeWidth = size * 0.12; // Anillo más grueso

  // Rotation animation
  const rotation = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    if (isActive) {
      const rotateAnim = Animated.loop(
        Animated.timing(rotation, {
          toValue: 360,
          duration: 8000,
          useNativeDriver: true,
        })
      );

      const pulseAnim = Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(scale, {
              toValue: 1.1,
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
              toValue: 0.8,
              duration: 2000,
              useNativeDriver: true,
            }),
          ]),
        ])
      );

      rotateAnim.start();
      pulseAnim.start();

      return () => {
        rotateAnim.stop();
        pulseAnim.stop();
      };
    } else {
      rotation.setValue(0);
      scale.setValue(1);
      opacity.setValue(0.6);
    }
  }, [isActive]);

  const [rotationValue, setRotationValue] = React.useState(0);
  const [scaleValue, setScaleValue] = React.useState(1);
  const [opacityValue, setOpacityValue] = React.useState(0.9);

  useEffect(() => {
    const rotationListener = rotation.addListener(({ value }) => setRotationValue(value));
    const scaleListener = scale.addListener(({ value }) => setScaleValue(value));
    const opacityListener = opacity.addListener(({ value }) => setOpacityValue(value));
    return () => {
      rotation.removeListener(rotationListener);
      scale.removeListener(scaleListener);
      opacity.removeListener(opacityListener);
    };
  }, []);

  // Calculate arc paths for each color segment
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
  
  // Create arc path function - smoother segments
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

  // Star path at the end - more prominent
  const starAngle = toRadians(45); // End of purple segment
  const starX = center + radius * Math.cos(starAngle);
  const starY = center + radius * Math.sin(starAngle);
  const starSize = size * 0.08;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Defs>
          {/* Pink to Orange gradient - more vibrant */}
          <LinearGradient id="pinkOrange" x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor="#FF6B9D" stopOpacity="1" />
            <Stop offset="100%" stopColor="#FF8C42" stopOpacity="1" />
          </LinearGradient>

          {/* Orange to Yellow gradient */}
          <LinearGradient id="orangeYellow" x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor="#FF8C42" stopOpacity="1" />
            <Stop offset="100%" stopColor="#FFD93D" stopOpacity="1" />
          </LinearGradient>

          {/* Yellow to Green gradient */}
          <LinearGradient id="yellowGreen" x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor="#FFD93D" stopOpacity="1" />
            <Stop offset="100%" stopColor="#6BCB77" stopOpacity="1" />
          </LinearGradient>

          {/* Green to Blue gradient */}
          <LinearGradient id="greenBlue" x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor="#6BCB77" stopOpacity="1" />
            <Stop offset="100%" stopColor="#4D96FF" stopOpacity="1" />
          </LinearGradient>

          {/* Blue to Purple gradient */}
          <LinearGradient id="bluePurple" x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor="#4D96FF" stopOpacity="1" />
            <Stop offset="100%" stopColor="#9B59B6" stopOpacity="1" />
          </LinearGradient>

          {/* Enhanced glow gradient */}
          <RadialGradient id="glow" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor="#FF6B9D" stopOpacity="0.4" />
            <Stop offset="30%" stopColor="#FFD93D" stopOpacity="0.3" />
            <Stop offset="60%" stopColor="#4D96FF" stopOpacity="0.2" />
            <Stop offset="100%" stopColor="#9B59B6" stopOpacity="0" />
          </RadialGradient>
        </Defs>

        {/* Enhanced outer glow */}
        <Circle
          cx={center}
          cy={center}
          r={radius * 1.4 * scaleValue}
          fill="url(#glow)"
          opacity={opacityValue * 0.6}
        />

        {/* Ring segments - smoother and more vibrant */}
        <G
          transform={`rotate(${rotationValue} ${center} ${center}) scale(${scaleValue})`}
          opacity={opacityValue}
        >
          {/* Pink to Orange segment */}
          <Path
            d={createArc(-135, -90, radius - strokeWidth/2, radius + strokeWidth/2)}
            fill="url(#pinkOrange)"
          />

          {/* Orange to Yellow segment */}
          <Path
            d={createArc(-90, -45, radius - strokeWidth/2, radius + strokeWidth/2)}
            fill="url(#orangeYellow)"
          />

          {/* Yellow to Green segment */}
          <Path
            d={createArc(-45, 0, radius - strokeWidth/2, radius + strokeWidth/2)}
            fill="url(#yellowGreen)"
          />

          {/* Green to Blue segment */}
          <Path
            d={createArc(0, 45, radius - strokeWidth/2, radius + strokeWidth/2)}
            fill="url(#greenBlue)"
          />

          {/* Blue to Purple segment */}
          <Path
            d={createArc(45, 90, radius - strokeWidth/2, radius + strokeWidth/2)}
            fill="url(#bluePurple)"
          />

          {/* Enhanced star at the end */}
          <G transform={`translate(${starX}, ${starY})`}>
            <Path
              d={`M 0 ${-starSize} L ${starSize * 0.3} ${-starSize * 0.3} L ${starSize} 0 L ${starSize * 0.3} ${starSize * 0.3} L 0 ${starSize} L ${-starSize * 0.3} ${starSize * 0.3} L ${-starSize} 0 L ${-starSize * 0.3} ${-starSize * 0.3} Z`}
              fill="#9B59B6"
              opacity={opacityValue}
            />
            {/* Inner glow for star */}
            <Circle
              cx={0}
              cy={0}
              r={starSize * 0.3}
              fill="#FFFFFF"
              opacity={opacityValue * 0.6}
            />
          </G>
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
