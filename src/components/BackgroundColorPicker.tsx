import React, { useEffect } from 'react';
import { StyleSheet, Dimensions, TouchableOpacity, Animated, Text, View } from 'react-native';
import Svg, { Defs, LinearGradient as SvgLinearGradient, Stop, Circle } from 'react-native-svg';
import { useBackgroundColor, BACKGROUND_GRADIENTS } from '../contexts/BackgroundColorContext';
import { COLORS, SPACING } from '../constants';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const gradientOptions = [
  { name: 'original', label: 'Original', gradient: BACKGROUND_GRADIENTS.original },
  { name: 'blue', label: 'Azul', gradient: BACKGROUND_GRADIENTS.blue },
  { name: 'purple', label: 'Morado', gradient: BACKGROUND_GRADIENTS.purple },
  { name: 'orange', label: 'Naranja', gradient: BACKGROUND_GRADIENTS.orange },
];

export const BackgroundColorPicker: React.FC = () => {
  const { selectedGradient, setSelectedGradient, showColorPicker, setShowColorPicker, avatarPosition } =
    useBackgroundColor();

  // Animaciones individuales para cada selector
  const animations = gradientOptions.map(() => ({
    scale: React.useRef(new Animated.Value(0)).current,
    opacity: React.useRef(new Animated.Value(0)).current,
    translateX: React.useRef(new Animated.Value(0)).current,
  }));

  // Posición inicial (avatar) y final (a la derecha)
  const avatarSize = 40; // Mismo tamaño que el avatar
  const avatarX = avatarPosition?.x || SPACING.lg + avatarSize / 2; // Posición del centro del avatar
  const avatarY = avatarPosition?.y || 60 + avatarSize / 2; // paddingTop + mitad del avatar
  const startX = avatarX; // Centro del avatar (punto de origen)
  const startY = avatarY;
  const distanceFromAvatar = SPACING.sm; // Distancia entre avatar y primer círculo
  const itemSpacing = avatarSize + distanceFromAvatar; // Distancia entre centros de círculos (misma que avatar-primer círculo)
  const itemSize = avatarSize; // Mismo tamaño que el avatar

  useEffect(() => {
    if (showColorPicker && avatarPosition) {
      // Animar cada selector con delay escalonado
      animations.forEach((anim, index) => {
        const delay = index * 100; // 100ms entre cada animación
        // Calcular posición final: centro del avatar + radio del avatar + distancia + radio del círculo + espaciado * índice
        const finalX = startX + avatarSize / 2 + distanceFromAvatar + avatarSize / 2 + index * itemSpacing;

        Animated.parallel([
          Animated.spring(anim.scale, {
            toValue: 1,
            delay,
            useNativeDriver: true,
            tension: 50,
            friction: 7,
          }),
          Animated.timing(anim.opacity, {
            toValue: 1,
            delay,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.spring(anim.translateX, {
            toValue: finalX - startX,
            delay,
            useNativeDriver: true,
            tension: 50,
            friction: 7,
          }),
        ]).start();
      });
    } else {
      // Reset animaciones
      animations.forEach((anim) => {
        anim.scale.setValue(0);
        anim.opacity.setValue(0);
        anim.translateX.setValue(0);
      });
    }
  }, [showColorPicker, avatarPosition]);

  const handleGradientSelect = (gradientName: string) => {
    // Aplicar el degradé seleccionado
    setSelectedGradient(gradientName);

    // Animación de salida (inversa)
    animations.forEach((anim, index) => {
      const delay = index * 50; // Más rápido al salir
      Animated.parallel([
        Animated.spring(anim.scale, {
          toValue: 0,
          delay,
          useNativeDriver: true,
          tension: 50,
          friction: 7,
        }),
        Animated.timing(anim.opacity, {
          toValue: 0,
          delay,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(anim.translateX, {
          toValue: 0,
          delay,
          useNativeDriver: true,
          tension: 50,
          friction: 7,
        }),
      ]).start(() => {
        if (index === animations.length - 1) {
          setShowColorPicker(false);
        }
      });
    });
  };

  if (!showColorPicker || !avatarPosition) return null;

  return (
    <View style={styles.container} pointerEvents="box-none">
      {gradientOptions.map((option, index) => {
        const anim = animations[index];
        return (
          <Animated.View
            key={index}
            style={[
              styles.gradientOptionContainer,
              {
                position: 'absolute',
                left: startX,
                top: startY - itemSize / 2, // Centrado verticalmente con el avatar
                opacity: anim.opacity,
                transform: [
                  { scale: anim.scale },
                  { translateX: anim.translateX },
                ],
              },
            ]}
            pointerEvents="auto"
          >
            <TouchableOpacity
              onPress={() => handleGradientSelect(option.name)}
              activeOpacity={0.8}
            >
              {option.name === 'original' ? (
                <View style={[styles.gradientCircle, styles.originalCircle]}>
                  <Text style={styles.originalText}>O</Text>
                </View>
              ) : (
                <Svg width={itemSize} height={itemSize} style={styles.gradientCircle}>
                  <Defs>
                    <SvgLinearGradient id={`gradient-${index}`} x1="0%" y1="0%" x2="0%" y2="100%">
                      {option.gradient.colors.map((color, colorIndex) => (
                        <Stop
                          key={colorIndex}
                          offset={`${(colorIndex / (option.gradient.colors.length - 1)) * 100}%`}
                          stopColor={color}
                          stopOpacity="1"
                        />
                      ))}
                    </SvgLinearGradient>
                  </Defs>
                  <Circle
                    cx={itemSize / 2}
                    cy={itemSize / 2}
                    r={itemSize / 2 - 2}
                    fill={`url(#gradient-${index})`}
                    stroke={COLORS.white}
                    strokeWidth="2"
                  />
                </Svg>
              )}
              <Text style={styles.gradientLabel}>{option.label}</Text>
            </TouchableOpacity>
          </Animated.View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10000,
  },
  gradientOptionContainer: {
    alignItems: 'center',
  },
  gradientCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginBottom: SPACING.xs,
  },
  originalCircle: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    width: 40,
    height: 40,
    borderRadius: 20,
    marginBottom: SPACING.xs,
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  originalText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  gradientLabel: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: '500',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});
