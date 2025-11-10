import React, { useState, useRef } from 'react';
import { StyleSheet, Dimensions, Image, View, TouchableOpacity, Animated, Text } from 'react-native';
import { useBackgroundColor, BACKGROUND_COLORS } from '../contexts/BackgroundColorContext';
import { COLORS, SPACING, BORDER_RADIUS } from '../constants';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export const SharedBackground: React.FC = () => {
  const { backgroundColor, setBackgroundColor } = useBackgroundColor();
  const [showColorPicker, setShowColorPicker] = useState(false);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  const handleLongPress = () => {
    // Limpiar timer si existe
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
    }

    // Iniciar timer de 3 segundos
    longPressTimerRef.current = setTimeout(() => {
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
    }, 3000);
  };

  const handlePressOut = () => {
    // Cancelar si se suelta antes de los 3 segundos
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const handleColorSelect = (color: string) => {
    // Aplicar el color seleccionado
    setBackgroundColor(color);
    
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

  const colorOptions = [
    { color: BACKGROUND_COLORS.blue, label: 'Azul' },
    { color: BACKGROUND_COLORS.purple, label: 'Morado' },
    { color: BACKGROUND_COLORS.orange, label: 'Naranja' },
  ];

  return (
    <>
      <TouchableOpacity
        activeOpacity={1}
        onLongPress={handleLongPress}
        onPressOut={handlePressOut}
        style={styles.touchableArea}
      >
        <Image
          source={require('../../assets/background-zero.png')}
          style={[
            styles.image,
            {
              width: SCREEN_WIDTH * 4,
              height: SCREEN_HEIGHT,
            },
          ]}
          resizeMode="cover"
        />
        {/* Overlay de color si no es transparente */}
        {backgroundColor !== BACKGROUND_COLORS.default && (
          <View
            style={[
              styles.colorOverlay,
              {
                backgroundColor: backgroundColor,
                opacity: 0.6, // Ajusta la opacidad del overlay
              },
            ]}
          />
        )}
      </TouchableOpacity>

      {/* Selector de colores */}
      {showColorPicker && (
        <Animated.View
          style={[
            styles.colorPickerContainer,
            {
              opacity: opacityAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <Text style={styles.colorPickerTitle}>Selecciona un color</Text>
          <View style={styles.colorOptionsContainer}>
            {colorOptions.map((option, index) => (
              <TouchableOpacity
                key={index}
                style={styles.colorOption}
                onPress={() => handleColorSelect(option.color)}
              >
                <View
                  style={[
                    styles.colorCircle,
                    { backgroundColor: option.color },
                  ]}
                />
                <Text style={styles.colorLabel}>{option.label}</Text>
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
    width: SCREEN_WIDTH * 4,
    height: SCREEN_HEIGHT,
  },
  image: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  colorOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: SCREEN_WIDTH * 4,
    height: SCREEN_HEIGHT,
  },
  colorPickerContainer: {
    position: 'absolute',
    top: SCREEN_HEIGHT / 2 - 100,
    left: SCREEN_WIDTH / 2 - 150,
    width: 300,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
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
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: SPACING.md,
  },
  colorOptionsContainer: {
    flexDirection: 'row',
    gap: SPACING.lg,
  },
  colorOption: {
    alignItems: 'center',
  },
  colorCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: SPACING.sm,
    borderWidth: 3,
    borderColor: COLORS.white,
  },
  colorLabel: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '500',
  },
});
