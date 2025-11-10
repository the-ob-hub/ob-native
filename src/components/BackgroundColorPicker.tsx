import React, { useState, useRef } from 'react';
import { StyleSheet, Dimensions, TouchableOpacity, Animated, Text, View } from 'react-native';
import { useBackgroundColor, BACKGROUND_COLORS } from '../contexts/BackgroundColorContext';
import { COLORS, SPACING, BORDER_RADIUS } from '../constants';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export const BackgroundColorPicker: React.FC = () => {
  const { backgroundColor, setBackgroundColor } = useBackgroundColor();
  const [showColorPicker, setShowColorPicker] = useState(false);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  const handlePressIn = () => {
    console.log('🔵 BackgroundColorPicker - PressIn iniciado');
    // Limpiar timer si existe
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
    }

    // Iniciar timer de 1.5 segundos
    longPressTimerRef.current = setTimeout(() => {
      console.log('🔵 BackgroundColorPicker - LongPress completado, mostrando selector');
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
    }, 1500);
  };

  const handlePressOut = () => {
    console.log('🔵 BackgroundColorPicker - PressOut, cancelando timer');
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
      {/* Área táctil invisible que captura el LongPress */}
      <View
        style={styles.touchableArea}
        onStartShouldSetResponder={() => {
          // Solo capturar si no hay selector visible
          if (showColorPicker) return false;
          return true;
        }}
        onMoveShouldSetResponder={() => false}
        onResponderGrant={handlePressIn}
        onResponderRelease={handlePressOut}
        onResponderTerminate={handlePressOut}
        onResponderTerminationRequest={() => {
          // No permitir terminación si estamos esperando el long press
          // Esto permite que el componente capture el toque durante 3 segundos
          return false;
        }}
      />

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
          pointerEvents="auto"
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
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 50, // Menor zIndex para que no bloquee las pantallas
    backgroundColor: 'transparent',
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

