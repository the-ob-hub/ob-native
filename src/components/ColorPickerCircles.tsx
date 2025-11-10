import React, { useEffect } from 'react';
import { StyleSheet, TouchableOpacity, Animated, Text, View } from 'react-native';
import Svg, { Defs, LinearGradient as SvgLinearGradient, Stop, Circle } from 'react-native-svg';
import { useBackgroundColor, BACKGROUND_GRADIENTS } from '../contexts/BackgroundColorContext';
import { COLORS, SPACING } from '../constants';

const gradientOptions = [
  { name: 'original', label: 'Original', gradient: BACKGROUND_GRADIENTS.original },
  { name: 'dark', label: 'Oscuro', gradient: BACKGROUND_GRADIENTS.dark },
  { name: 'blue', label: 'Azul', gradient: BACKGROUND_GRADIENTS.blue },
  { name: 'purple', label: 'Morado', gradient: BACKGROUND_GRADIENTS.purple },
  { name: 'orange', label: 'Naranja', gradient: BACKGROUND_GRADIENTS.orange },
];

const avatarSize = 40;
const itemSize = avatarSize;
const distanceFromAvatar = SPACING.sm;
const itemSpacing = (avatarSize + distanceFromAvatar) * 0.1; // 10% de la distancia original

export const ColorPickerCircles: React.FC = () => {
  const { selectedGradient, setSelectedGradient, showColorPicker, setShowColorPicker } =
    useBackgroundColor();

  // Animaciones individuales para cada selector
  const animations = gradientOptions.map(() => ({
    scale: React.useRef(new Animated.Value(0)).current,
    opacity: React.useRef(new Animated.Value(0)).current,
    translateX: React.useRef(new Animated.Value(-avatarSize)).current, // Empezar desde el avatar (izquierda)
  }));

  useEffect(() => {
    if (showColorPicker) {
      // Animar cada selector con delay escalonado
      animations.forEach((anim, index) => {
        const delay = index * 100; // 100ms entre cada animación
        // Calcular posición final: distancia desde avatar + espaciado * índice
        const finalX = distanceFromAvatar + index * itemSpacing;

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
            toValue: finalX,
            delay,
            useNativeDriver: true,
            tension: 60,
            friction: 8,
          }),
        ]).start();
      });
    } else {
      // Reset animaciones
      animations.forEach((anim) => {
        anim.scale.setValue(0);
        anim.opacity.setValue(0);
        anim.translateX.setValue(-avatarSize);
      });
    }
  }, [showColorPicker]);

  const handleGradientSelect = (gradientName: string) => {
    setSelectedGradient(gradientName);
    
    // Animación de salida (inversa a la entrada)
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
          toValue: -avatarSize, // Volver a la posición inicial (detrás del avatar)
          delay,
          useNativeDriver: true,
          tension: 60,
          friction: 8,
        }),
      ]).start(() => {
        // Ocultar el picker solo después de que todas las animaciones terminen
        if (index === animations.length - 1) {
          setShowColorPicker(false);
        }
      });
    });
  };

  if (!showColorPicker) return null;

  return (
    <View style={styles.container}>
      {gradientOptions.map((option, index) => {
        const anim = animations[index];
        return (
          <Animated.View
            key={index}
            style={[
              styles.gradientOptionContainer,
              {
                opacity: anim.opacity,
                transform: [
                  { scale: anim.scale },
                  { translateX: anim.translateX },
                ],
              },
            ]}
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
    position: 'absolute', // Posicionamiento absoluto para no afectar el layout
    left: avatarSize + SPACING.sm, // Posición a la derecha del avatar
    top: avatarSize * 0.2 - 8, // 20% más abajo menos 8px (5px más arriba que antes)
    flexDirection: 'row',
    alignItems: 'center',
  },
  gradientOptionContainer: {
    alignItems: 'center',
    marginRight: itemSpacing, // Espacio entre círculos (10% del original)
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

