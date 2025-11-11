import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { COLORS, SPACING, BORDER_RADIUS } from '../constants';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

// Estados del componente
export enum BalanceCardState {
  COLLAPSED = 'collapsed',
  EXPANDED_LOW = 'expanded_low',
  EXPANDED_MEDIUM = 'expanded_medium',
  EXPANDED_HIGH = 'expanded_high',
}

interface BalanceCardProps {
  balance?: number;
  currency?: string;
}

const COLLAPSED_HEIGHT = 120; // Altura colapsada (header + acciones)
const NAVBAR_HEIGHT = 80; // Altura aproximada del navbar
const HEADER_HEIGHT = 140; // Altura aproximada del header (60 paddingTop + 24 paddingBottom + avatar)
const HEADER_MARGIN_PERCENT = 0.05; // 5% de margen respecto al header
const NAVBAR_MARGIN_PERCENT = 0.05; // 5% antes del navbar

// Calcular alturas para cada estado
const getHeightForState = (state: BalanceCardState): number => {
  // Altura máxima: desde el header hasta 5% antes del navbar
  // El card empieza justo después del header, así que el espacio disponible es:
  const spaceFromHeaderToNavbar = SCREEN_HEIGHT - HEADER_HEIGHT - NAVBAR_HEIGHT;
  const marginBeforeNavbar = spaceFromHeaderToNavbar * NAVBAR_MARGIN_PERCENT;
  const baseMaxHeight = spaceFromHeaderToNavbar - marginBeforeNavbar + 10;
  const maxHeight = baseMaxHeight * 1.05; // +5% más del largo actual

  switch (state) {
    case BalanceCardState.COLLAPSED:
      return COLLAPSED_HEIGHT;
    case BalanceCardState.EXPANDED_LOW:
      return COLLAPSED_HEIGHT + (maxHeight - COLLAPSED_HEIGHT) * 0.2; // +20%
    case BalanceCardState.EXPANDED_MEDIUM:
      return COLLAPSED_HEIGHT + (maxHeight - COLLAPSED_HEIGHT) * 0.5; // +50%
    case BalanceCardState.EXPANDED_HIGH:
      return maxHeight; // Hasta 5% antes del navbar
    default:
      return COLLAPSED_HEIGHT;
  }
};

export const BalanceCard: React.FC<BalanceCardProps> = ({
  balance = 0,
  currency = 'ARS',
}) => {
  const [currentState, setCurrentState] = useState<BalanceCardState>(
    BalanceCardState.COLLAPSED
  );

  // Shared value para la altura animada
  const height = useSharedValue(COLLAPSED_HEIGHT);

  // Estilo animado para la altura
  const animatedStyle = useAnimatedStyle(() => {
    'worklet';
    return {
      height: height.value,
    };
  });

  // Función para cambiar de estado con animación
  const handleStateChange = (newState: BalanceCardState) => {
    const targetHeight = getHeightForState(newState);
    
    // Animación suave usando spring
    height.value = withSpring(targetHeight, {
      damping: 15,
      stiffness: 150,
      mass: 1,
    });

    setCurrentState(newState);
  };

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      {/* Header - Balance y Moneda */}
      <View style={styles.header}>
        <View style={styles.balanceContainer}>
          <Text style={styles.currencyLabel}>Balance</Text>
          <Text style={styles.balanceAmount}>
            {currency} {balance.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </Text>
        </View>
      </View>

      {/* Actions Row - Botones de expansión */}
      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={[
            styles.actionButton,
            currentState === BalanceCardState.EXPANDED_LOW && styles.actionButtonActive,
          ]}
          onPress={() => handleStateChange(BalanceCardState.EXPANDED_LOW)}
        >
          <Text
            style={[
              styles.actionButtonText,
              currentState === BalanceCardState.EXPANDED_LOW && styles.actionButtonTextActive,
            ]}
          >
            Low
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.actionButton,
            currentState === BalanceCardState.EXPANDED_MEDIUM && styles.actionButtonActive,
          ]}
          onPress={() => handleStateChange(BalanceCardState.EXPANDED_MEDIUM)}
        >
          <Text
            style={[
              styles.actionButtonText,
              currentState === BalanceCardState.EXPANDED_MEDIUM && styles.actionButtonTextActive,
            ]}
          >
            Medium
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.actionButton,
            currentState === BalanceCardState.EXPANDED_HIGH && styles.actionButtonActive,
          ]}
          onPress={() => handleStateChange(BalanceCardState.EXPANDED_HIGH)}
        >
          <Text
            style={[
              styles.actionButtonText,
              currentState === BalanceCardState.EXPANDED_HIGH && styles.actionButtonTextActive,
            ]}
          >
            High
          </Text>
        </TouchableOpacity>
      </View>

      {/* Expandable Area - Contenido que crece */}
      <View style={styles.expandableArea}>
        <Text style={styles.expandableContent}>
          {currentState === BalanceCardState.COLLAPSED && 'Colapsado'}
          {currentState === BalanceCardState.EXPANDED_LOW && 'Expandido Low (20%)'}
          {currentState === BalanceCardState.EXPANDED_MEDIUM && 'Expandido Medium (50%)'}
          {currentState === BalanceCardState.EXPANDED_HIGH && 'Expandido High (hasta navbar)'}
        </Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.xl,
    width: SCREEN_WIDTH, // 100% del ancho
    marginHorizontal: 0, // Sin márgenes horizontales
    marginTop: 0, // Pegado al header (el headerSpacer ya compensa la altura del header)
    padding: SPACING.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
  },
  header: {
    marginBottom: SPACING.md,
  },
  balanceContainer: {
    alignItems: 'flex-start',
  },
  currencyLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '500',
    marginBottom: SPACING.xs,
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.text,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  actionButton: {
    flex: 1,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  actionButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  actionButtonTextActive: {
    color: COLORS.white,
  },
  expandableArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.lg,
  },
  expandableContent: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});

