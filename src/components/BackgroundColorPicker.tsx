import React, { useState } from 'react';
import { StyleSheet, Dimensions, TouchableOpacity, Animated, Text, View, Pressable } from 'react-native';
import Svg, { Defs, LinearGradient as SvgLinearGradient, Stop, Circle } from 'react-native-svg';
import { useBackgroundColor, BACKGROUND_GRADIENTS } from '../contexts/BackgroundColorContext';
import { COLORS, SPACING, BORDER_RADIUS } from '../constants';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export const BackgroundColorPicker: React.FC = () => {
  const { selectedGradient, setSelectedGradient } = useBackgroundColor();
  const [showColorPicker, setShowColorPicker] = useState(false);
  const scaleAnim = React.useRef(new Animated.Value(0)).current;
  const opacityAnim = React.useRef(new Animated.Value(0)).current;

  const handleLongPress = () => {
    console.log('🔵 BackgroundColorPicker - LongPress detectado');
    setShowColorPicker(true);
    // Animación de entrada
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 50,
        friction: 7,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleGradientSelect = (gradientName: string) => {
    // Aplicar el degradé seleccionado
    setSelectedGradient(gradientName);
    
    // Animación de salida
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 50,
        friction: 7,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowColorPicker(false);
    });
  };

  const gradientOptions = [
    { name: 'original', label: 'Original', gradient: BACKGROUND_GRADIENTS.original },
    { name: 'blue', label: 'Azul', gradient: BACKGROUND_GRADIENTS.blue },
    { name: 'purple', label: 'Morado', gradient: BACKGROUND_GRADIENTS.purple },
    { name: 'orange', label: 'Naranja', gradient: BACKGROUND_GRADIENTS.orange },
  ];

  return (
    <>
      {/* Área táctil invisible que captura el LongPress */}
      {!showColorPicker && (
        <Pressable
          style={styles.touchableArea}
          onLongPress={handleLongPress}
          delayLongPress={1500}
          pointerEvents="box-none"
        />
      )}

      {/* Selector de degradés */}
      {showColorPicker && (
        <Animated.View
          style={[
            styles.colorPickerContainer,
            {
              opacity: opacityAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
          pointerEvents="auto"
        >
          <Text style={styles.colorPickerTitle}>Selecciona un fondo</Text>
          <View style={styles.gradientOptionsContainer}>
            {gradientOptions.map((option, index) => (
              <TouchableOpacity
                key={index}
                style={styles.gradientOption}
                onPress={() => handleGradientSelect(option.name)}
              >
                {option.name === 'original' ? (
                  <View style={[styles.gradientCircle, styles.originalCircle]}>
                    <Text style={styles.originalText}>O</Text>
                  </View>
                ) : (
                  <Svg width={50} height={50} style={styles.gradientCircle}>
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
                      cx="25"
                      cy="25"
                      r="23"
                      fill={`url(#gradient-${index})`}
                      stroke={COLORS.white}
                      strokeWidth="2"
                    />
                  </Svg>
                )}
                <Text style={styles.gradientLabel}>{option.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  touchableArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0, // Debajo de las pantallas para no bloquear toques
    backgroundColor: 'transparent',
  },
  colorPickerContainer: {
    position: 'absolute',
    top: SCREEN_HEIGHT / 2 - 60,
    left: SCREEN_WIDTH / 2 - 140,
    width: 280,
    backgroundColor: 'rgba(0, 0, 0, 1)',
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.md,
    alignItems: 'center',
    zIndex: 10000,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  colorPickerTitle: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: SPACING.sm,
  },
  gradientOptionsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  gradientOption: {
    alignItems: 'center',
    width: 55,
  },
  gradientCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginBottom: SPACING.xs,
  },
  originalCircle: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    width: 50,
    height: 50,
    borderRadius: 25,
    marginBottom: SPACING.xs,
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  originalText: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: 'bold',
  },
  gradientLabel: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: '500',
    textAlign: 'center',
  },
});
