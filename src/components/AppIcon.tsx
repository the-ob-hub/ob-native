import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Circle, Ellipse, G, Defs, RadialGradient, Stop } from 'react-native-svg';

interface AppIconProps {
  size?: number;
}

/**
 * Componente del icono de la app: círculo azul con degradado y ojitos
 * Basado en el diseño del SiriOrbAgent con fondo azul degradado
 */
export const AppIcon: React.FC<AppIconProps> = ({ size = 1024 }) => {
  const center = size / 2;
  const radius = size / 2 - size * 0.05; // Margen del 5%
  
  // Eye dimensions - vertical ovals
  const eyeWidth = size * 0.14;
  const eyeHeight = size * 0.2;
  const eyeSpacing = size * 0.18;
  const eyeY = center - size * 0.08;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Defs>
          {/* Gradiente radial azul para el fondo */}
          <RadialGradient id="blueGradient" cx="50%" cy="30%" r="70%">
            <Stop offset="0%" stopColor="#0066FF" stopOpacity="1" />
            <Stop offset="50%" stopColor="#0052CC" stopOpacity="1" />
            <Stop offset="100%" stopColor="#003D99" stopOpacity="1" />
          </RadialGradient>
        </Defs>
        
        {/* Círculo azul con degradado */}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          fill="url(#blueGradient)"
        />
        
        {/* Eyes (ojitos) - vertical ovals */}
        <G>
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
    backgroundColor: 'transparent',
  },
});





