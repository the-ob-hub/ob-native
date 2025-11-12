import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Svg, { Path, Defs, LinearGradient, RadialGradient, Stop, Circle } from 'react-native-svg';
import { COLORS, SPACING, BORDER_RADIUS, FONTS } from '../constants';
import { BalanceActions } from './BalanceActions';
import { useLogs } from '../contexts/LogContext';
import { Balance, ActionId } from '../models';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

// Estados del componente
export enum BalanceCardState {
  COLLAPSED = 'collapsed',
  EXPANDED_LOW = 'expanded_low',
  EXPANDED_MEDIUM = 'expanded_medium',
  EXPANDED_HIGH = 'expanded_high',
}

interface BalanceCardProps {
  balances: Balance[];
}

// Componente para mostrar moneda y saldo con animación mejorada
const BalanceDisplay: React.FC<{ 
  balance: number; 
  currency: string; 
  onCollapse?: () => void;
  isActive: boolean;
}> = ({ balance, currency, onCollapse, isActive }) => {
  const animatedBalance = useSharedValue(balance);
  const [displayBalance, setDisplayBalance] = useState(balance);
  const previousBalance = useSharedValue(balance);

  useEffect(() => {
    if (isActive && previousBalance.value !== balance) {
      // Animar desde el valor anterior al nuevo
      animatedBalance.value = withTiming(balance, {
        duration: 800,
      });
      previousBalance.value = balance;
    } else if (!isActive) {
      // Si no está activo, mantener el valor actual
      animatedBalance.value = balance;
      previousBalance.value = balance;
    }
  }, [balance, isActive]);

  // Actualizar el valor mostrado durante la animación
  useEffect(() => {
    if (isActive) {
      const interval = setInterval(() => {
        setDisplayBalance(animatedBalance.value);
      }, 16); // ~60fps

      return () => clearInterval(interval);
    } else {
      setDisplayBalance(balance);
    }
  }, [balance, isActive]);

  // Formatear el número con separadores de miles y decimales
  const balanceStr = displayBalance.toLocaleString('es-AR', { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2,
    useGrouping: true,
  });
  
  // Dividir en parte entera y decimal (sin coma)
  const parts = balanceStr.replace(/\./g, '|').split(',');
  const integerPart = parts[0].replace(/\|/g, '.'); // Restaurar puntos de miles
  const decimalPart = parts[1] || '00';
  
  return (
    <TouchableOpacity 
      style={styles.balanceDisplayContainer}
      onPress={onCollapse}
      activeOpacity={0.8}
    >
      <View style={styles.balanceContentWrapper}>
        {/* Texto "Saldo" */}
        <Text style={styles.saldoLabel}>Saldo</Text>
        
        <View style={styles.balanceRow}>
          <Text style={styles.currencyText}>{currency}</Text>
          <View style={styles.balanceAmountContainer}>
            <Text style={styles.balanceInteger}>{integerPart}</Text>
            <Text style={styles.balanceDecimal}>{decimalPart}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

// Indicadores de posición (dots)
const BalanceIndicators: React.FC<{ 
  total: number; 
  currentIndex: number;
}> = ({ total, currentIndex }) => {
  return (
    <View style={styles.indicatorsContainer}>
      {Array.from({ length: total }).map((_, index) => (
        <View
          key={index}
          style={[
            styles.indicator,
            index === currentIndex && styles.indicatorActive,
          ]}
        />
      ))}
    </View>
  );
};

const COLLAPSED_HEIGHT = 240;
const NAVBAR_HEIGHT = 80;
const HEADER_HEIGHT = 140;
const NAVBAR_MARGIN_PERCENT = 0.05;

// Calcular alturas para cada estado
const getHeightForState = (state: BalanceCardState): number => {
  const spaceFromHeaderToNavbar = SCREEN_HEIGHT - HEADER_HEIGHT - NAVBAR_HEIGHT;
  const marginBeforeNavbar = spaceFromHeaderToNavbar * NAVBAR_MARGIN_PERCENT;
  const baseMaxHeight = spaceFromHeaderToNavbar - marginBeforeNavbar + 10;
  const maxHeight = baseMaxHeight * 1.05;

  switch (state) {
    case BalanceCardState.COLLAPSED:
      return COLLAPSED_HEIGHT;
    case BalanceCardState.EXPANDED_LOW:
      return COLLAPSED_HEIGHT + (maxHeight - COLLAPSED_HEIGHT) * 0.2;
    case BalanceCardState.EXPANDED_MEDIUM:
      return COLLAPSED_HEIGHT + (maxHeight - COLLAPSED_HEIGHT) * 0.5;
    case BalanceCardState.EXPANDED_HIGH:
      return maxHeight;
    default:
      return COLLAPSED_HEIGHT;
  }
};

export const BalanceCard: React.FC<BalanceCardProps> = ({
  balances,
}) => {
  // Validar que haya balances
  if (!balances || balances.length === 0) {
    balances = [
      { currency: 'USDc', amount: 0, availableActions: ['agregar', 'enviar', 'exchange', 'pagar'] },
    ];
  }

  const [currentBalanceIndex, setCurrentBalanceIndex] = useState(0);
  const [currentState, setCurrentState] = useState<BalanceCardState>(
    BalanceCardState.COLLAPSED
  );
  const [selectedAction, setSelectedAction] = useState<string>('');
  const { addLog } = useLogs();

  const currentBalance = balances[currentBalanceIndex];

  // Shared values para swipe
  const translateX = useSharedValue(-(currentBalanceIndex * SCREEN_WIDTH));
  const contextX = useSharedValue(0);
  const isGestureActive = useSharedValue(false);

  // Shared value para la altura animada
  const height = useSharedValue(COLLAPSED_HEIGHT);

  // Función para cambiar de balance (desde worklet)
  const changeBalance = useCallback((newIndex: number) => {
    if (newIndex >= 0 && newIndex < balances.length) {
      setCurrentBalanceIndex(newIndex);
      addLog(`🔄 BalanceCard: Cambio a balance ${balances[newIndex].currency}`);
    }
  }, [balances, addLog]);

  // Gesture handler para swipe horizontal (solo cuando está COLLAPSED)
  const panGesture = Gesture.Pan()
    .enabled(currentState === BalanceCardState.COLLAPSED)
    .onStart(() => {
      contextX.value = translateX.value;
      isGestureActive.value = true;
    })
    .onUpdate((event) => {
      translateX.value = contextX.value + event.translationX;
    })
    .onEnd((event) => {
      isGestureActive.value = false;
      
      const threshold = SCREEN_WIDTH * 0.3; // 30% del ancho
      const velocity = event.velocityX;
      const shouldSwipe = Math.abs(event.translationX) > threshold || Math.abs(velocity) > 500;

      if (shouldSwipe) {
        let newIndex = currentBalanceIndex;
        
        if (event.translationX > 0 && currentBalanceIndex > 0) {
          // Swipe derecha -> balance anterior
          newIndex = currentBalanceIndex - 1;
        } else if (event.translationX < 0 && currentBalanceIndex < balances.length - 1) {
          // Swipe izquierda -> balance siguiente
          newIndex = currentBalanceIndex + 1;
        }

        if (newIndex !== currentBalanceIndex) {
          const targetX = -(newIndex * SCREEN_WIDTH);
          translateX.value = withSpring(targetX, {
            damping: 20,
            stiffness: 300,
            mass: 0.5,
          }, () => {
            runOnJS(changeBalance)(newIndex);
            // Reset a posición exacta después de la animación
            translateX.value = targetX;
          });
        } else {
          // Snap back a posición actual
          translateX.value = withSpring(-(currentBalanceIndex * SCREEN_WIDTH), {
            damping: 20,
            stiffness: 300,
          });
        }
      } else {
        // Snap back si no se alcanzó el umbral
        translateX.value = withSpring(-(currentBalanceIndex * SCREEN_WIDTH), {
          damping: 20,
          stiffness: 300,
        });
      }
    });

  // Sincronizar translateX cuando cambia el índice manualmente
  useEffect(() => {
    translateX.value = withSpring(-(currentBalanceIndex * SCREEN_WIDTH), {
      damping: 20,
      stiffness: 300,
    });
  }, [currentBalanceIndex]);

  // Estilo animado para el contenedor de cards
  const cardStackWidth = SCREEN_WIDTH * balances.length;
  const cardStackStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
      width: cardStackWidth,
    };
  });

  // Estilo animado para cada card individual (efecto stack)
  const getCardStyle = (index: number) => {
    return useAnimatedStyle(() => {
      const offset = index - currentBalanceIndex;
      const baseTranslateX = offset * SCREEN_WIDTH;
      
      // Efecto de escala y opacidad para cards adyacentes
      const scale = interpolate(
        translateX.value,
        [-SCREEN_WIDTH * (index + 1), -SCREEN_WIDTH * index, -SCREEN_WIDTH * (index - 1)],
        [0.9, 1, 0.9],
        Extrapolation.CLAMP
      );
      
      const opacity = interpolate(
        translateX.value,
        [-SCREEN_WIDTH * (index + 1), -SCREEN_WIDTH * index, -SCREEN_WIDTH * (index - 1)],
        [0.6, 1, 0.6],
        Extrapolation.CLAMP
      );

      return {
        transform: [{ scale }],
        opacity,
      };
    });
  };

  // Estilo animado para la altura
  const animatedStyle = useAnimatedStyle(() => {
    'worklet';
    return {
      height: height.value,
    };
  });

  // Función para cambiar de estado con animación
  const handleStateChange = (newState: BalanceCardState, actionId?: string) => {
    const targetHeight = getHeightForState(newState);
    
    const stateLabels: Record<BalanceCardState, string> = {
      [BalanceCardState.COLLAPSED]: 'Colapsado',
      [BalanceCardState.EXPANDED_LOW]: 'Expandido Bajo',
      [BalanceCardState.EXPANDED_MEDIUM]: 'Expandido Medio',
      [BalanceCardState.EXPANDED_HIGH]: 'Expandido Alto',
    };
    
    addLog(`🔄 BalanceCard: Cambio de estado a "${stateLabels[newState]}" (${newState})`);
    if (actionId) {
      addLog(`📱 BalanceCard: Acción seleccionada: "${actionId}"`);
    }
    
    height.value = withSpring(targetHeight, {
      damping: 15,
      stiffness: 150,
      mass: 1,
    });

    setCurrentState(newState);
    if (actionId) {
      setSelectedAction(actionId);
    }
  };

  // Función para colapsar el card cuando se toca el saldo
  const handleCollapse = () => {
    addLog(`👆 BalanceCard: Tap en componente Saldo - Colapsando card`);
    handleStateChange(BalanceCardState.COLLAPSED);
    setSelectedAction('');
  };

  // Renderizar un card individual
  const renderCard = (balance: Balance, index: number) => {
    const cardStyle = getCardStyle(index);
    
    return (
      <Animated.View
        key={`${balance.currency}-${index}`}
        style={[
          styles.cardWrapper,
          cardStyle,
        ]}
      >
        {/* Background SVG */}
        <View style={styles.backgroundContainer}>
          <Svg 
            width={SCREEN_WIDTH} 
            height={(SCREEN_WIDTH / 390) * 782} 
            viewBox="0 0 390 782" 
            style={styles.backgroundSvg}
            preserveAspectRatio="xMidYMin slice"
          >
            <Defs>
              <LinearGradient id={`paint0_linear_${index}`} x1="124" y1="468" x2="54.8275" y2="739.71" gradientUnits="userSpaceOnUse">
                <Stop offset="0" stopColor="#45002D" stopOpacity="0" />
                <Stop offset="1" stopColor="#AB006F" stopOpacity="0.34" />
              </LinearGradient>
              <RadialGradient id={`paint1_radial_${index}`} cx="0" cy="0" r="1" gradientTransform="matrix(369 830.5 -780.554 340.303 21 75.5)" gradientUnits="userSpaceOnUse">
                <Stop offset="0.673912" stopColor="#C31E20" stopOpacity="0" />
                <Stop offset="1" stopColor="#DA7D03" />
              </RadialGradient>
            </Defs>
            <Path
              d="M0 50C0 22.3857 22.3858 0 50 0H340C367.614 0 390 22.3858 390 50V731.5C390 759.114 367.614 781.5 340 781.5H50C22.3858 781.5 0 759.114 0 731.5V50Z"
              fill="#000000"
              fillOpacity="1"
            />
            <Path
              d="M0 50C0 22.3857 22.3858 0 50 0H340C367.614 0 390 22.3858 390 50V731.5C390 759.114 367.614 781.5 340 781.5H50C22.3858 781.5 0 759.114 0 731.5V50Z"
              fill={`url(#paint0_linear_${index})`}
            />
            <Path
              d="M0 50C0 22.3857 22.3858 0 50 0H340C367.614 0 390 22.3858 390 50V731.5C390 759.114 367.614 781.5 340 781.5H50C22.3858 781.5 0 759.114 0 731.5V50Z"
              fill={`url(#paint1_radial_${index})`}
            />
          </Svg>
        </View>

        {/* Header - Moneda y Saldo */}
        <View style={styles.header}>
          <BalanceDisplay 
            balance={balance.amount} 
            currency={balance.currency} 
            onCollapse={handleCollapse}
            isActive={index === currentBalanceIndex}
          />
        </View>

        {/* Actions Row - Botones de acción */}
        <View style={styles.actionsRow}>
          <BalanceActions
            currentState={currentState}
            onActionPress={(state, actionId) => handleStateChange(state, actionId)}
            availableActions={balance.availableActions}
          />
        </View>

        {/* Expandable Area */}
        <View style={styles.expandableArea}>
          <Text style={styles.expandableContent}>
            {currentState === BalanceCardState.COLLAPSED && 'Colapsado'}
            {currentState === BalanceCardState.EXPANDED_LOW && 'Exchange'}
            {currentState === BalanceCardState.EXPANDED_MEDIUM && 
              (selectedAction === 'agregar' ? 'Agregar' : 'Pagar')}
            {currentState === BalanceCardState.EXPANDED_HIGH && 'Enviar'}
          </Text>
        </View>
      </Animated.View>
    );
  };

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <GestureDetector gesture={panGesture}>
        <Animated.View style={[styles.cardStackContainer, cardStackStyle]}>
          {balances.map((balance, index) => renderCard(balance, index))}
        </Animated.View>
      </GestureDetector>
      
      {/* Indicadores de posición */}
      {balances.length > 1 && (
        <BalanceIndicators 
          total={balances.length} 
          currentIndex={currentBalanceIndex}
        />
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'transparent',
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    borderBottomLeftRadius: BORDER_RADIUS.xl,
    borderBottomRightRadius: BORDER_RADIUS.xl,
    width: SCREEN_WIDTH,
    marginHorizontal: 0,
    marginTop: 0,
    padding: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
    position: 'relative',
  },
  cardStackContainer: {
    flexDirection: 'row',
    height: '100%',
  },
  cardWrapper: {
    width: SCREEN_WIDTH,
    height: '100%',
    padding: SPACING.lg,
    position: 'relative',
  },
  backgroundContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    width: SCREEN_WIDTH,
    height: (SCREEN_WIDTH / 390) * 782,
    zIndex: 0,
  },
  backgroundSvg: {
    position: 'absolute',
    bottom: 0,
  },
  header: {
    marginTop: SCREEN_HEIGHT * 0.0075,
    marginBottom: SCREEN_HEIGHT * 0.03,
    position: 'relative',
    zIndex: 1,
  },
  balanceDisplayContainer: {
    alignItems: 'center',
    width: '100%',
  },
  balanceContentWrapper: {
    alignItems: 'center',
    width: '100%',
  },
  saldoLabel: {
    fontSize: 18,
    fontFamily: FONTS.poppins.light,
    color: COLORS.textSecondary,
    marginTop: 0,
    marginBottom: SPACING.lg,
    alignSelf: 'center',
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  currencyText: {
    fontSize: 14,
    fontFamily: FONTS.poppins.light,
    color: COLORS.textSecondary,
    marginRight: SPACING.xs,
  },
  balanceAmountContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    position: 'relative',
  },
  balanceInteger: {
    fontSize: 56,
    fontFamily: FONTS.inter.bold,
    color: COLORS.white,
    fontWeight: '700',
    letterSpacing: -0.5,
    lineHeight: 56,
  },
  balanceDecimal: {
    fontSize: 28,
    fontFamily: FONTS.poppins.light,
    color: COLORS.textSecondary,
    marginLeft: 2,
    lineHeight: 28,
    alignSelf: 'flex-start',
    paddingTop: 0,
  },
  actionsRow: {
    position: 'relative',
    zIndex: 1,
  },
  expandableArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.lg,
    position: 'relative',
    zIndex: 1,
  },
  expandableContent: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  indicatorsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    bottom: SPACING.md,
    left: 0,
    right: 0,
    zIndex: 10,
    gap: SPACING.xs,
  },
  indicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.white,
    opacity: 0.4,
  },
  indicatorActive: {
    opacity: 1,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
