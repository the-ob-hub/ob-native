import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, ScrollView } from 'react-native';
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
import { COLORS, SPACING, BORDER_RADIUS, FONTS } from '../constants';
import { BalanceActions } from './BalanceActions';
import { BalanceBackground } from './BalanceBackground';
import { TransferContent } from './TransferContent';
import { useLogs } from '../contexts/LogContext';
import { Balance, ActionId } from '../models';
import { UserContact } from '../models/contacts';
import { trackingService } from '../services/analytics/trackingService';
import { formatCurrency, splitFormattedAmount } from '../utils/numberFormatter';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

// Estados del componente
export enum BalanceCardState {
  COLLAPSED = 'collapsed',
  EXPANDED_LOW = 'expanded_low',
  EXPANDED_MEDIUM = 'expanded_medium',
  EXPANDED_HIGH = 'expanded_high',
  EXPANDED_XXL = 'expanded_xxl',
}

interface BalanceCardProps {
  balances: Balance[];
  onExpandedChange?: (isExpanded: boolean) => void;
  onContactSelect?: (contact: UserContact, currency: Currency) => void;
}

// Componente para mostrar moneda y saldo con animación mejorada
const BalanceDisplay: React.FC<{ 
  balance: number; 
  currency: string; 
  onCollapse?: () => void;
  isActive: boolean;
  shouldAnimate?: boolean; // Control para animar después del swipe
}> = ({ balance, currency, onCollapse, isActive, shouldAnimate = true }) => {
  const animatedBalance = useSharedValue(balance);
  const [displayBalance, setDisplayBalance] = useState(balance);
  const previousBalanceRef = useRef<number>(balance);
  const balanceBeforeSwipeRef = useRef<number>(balance);

  // Efecto para cuando cambia el balance
  useEffect(() => {
    if (isActive && previousBalanceRef.current !== balance) {
      // Balance cambió
      if (shouldAnimate) {
        // Animar desde el valor anterior al nuevo
        animatedBalance.value = withTiming(balance, {
          duration: 800,
        });
      } else {
        // Guardar el valor anterior antes de actualizar sin animar (durante el swipe)
        balanceBeforeSwipeRef.current = previousBalanceRef.current;
        animatedBalance.value = balance;
      }
      previousBalanceRef.current = balance;
    } else if (!isActive) {
      // Si no está activo, mantener el valor actual
      animatedBalance.value = balance;
      previousBalanceRef.current = balance;
      balanceBeforeSwipeRef.current = balance;
    }
  }, [balance, isActive]);

  // Efecto separado para cuando shouldAnimate cambia a true después del swipe
  useEffect(() => {
    if (isActive && shouldAnimate && previousBalanceRef.current === balance) {
      // shouldAnimate cambió a true después del swipe, animar desde el valor guardado
      const startValue = balanceBeforeSwipeRef.current;
      animatedBalance.value = startValue; // Reset al valor anterior
      animatedBalance.value = withTiming(balance, {
        duration: 800,
      });
    }
  }, [shouldAnimate, balance, isActive]);

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

  // Formatear el número según el estándar: miles con coma, decimales con punto
  const formattedBalance = formatCurrency(displayBalance);
  const { integer: integerPart, decimal: decimalPart } = splitFormattedAmount(formattedBalance);
  
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
            {decimalPart && (
              <Text style={styles.balanceDecimal}>{decimalPart}</Text>
            )}
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
    case BalanceCardState.EXPANDED_XXL:
      // 4 veces el tamaño colapsado + ancho total del celular
      return (COLLAPSED_HEIGHT * 4) + SCREEN_WIDTH;
    default:
      return COLLAPSED_HEIGHT;
  }
};

export const BalanceCard: React.FC<BalanceCardProps> = ({
  balances,
  onExpandedChange,
  onContactSelect,
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
  const [shouldAnimateBalance, setShouldAnimateBalance] = useState(true);
  const [showExpandedContent, setShowExpandedContent] = useState(false); // Control de visibilidad del contenido
  const [menuAnimationDelay, setMenuAnimationDelay] = useState(0); // Delay para animación del menú
  const { addLog } = useLogs();

  const currentBalance = balances[currentBalanceIndex];

  // Shared values para swipe
  const translateX = useSharedValue(-(currentBalanceIndex * SCREEN_WIDTH));
  const contextX = useSharedValue(0);
  const isGestureActive = useSharedValue(false);

  // Shared value para la altura animada
  const height = useSharedValue(COLLAPSED_HEIGHT);

  // Función para activar animación después del swipe
  const enableBalanceAnimation = useCallback(() => {
    setTimeout(() => {
      setShouldAnimateBalance(true);
    }, 100);
  }, []);

  // Función para cambiar de balance (desde worklet)
  const changeBalance = useCallback((newIndex: number, swipeDirection?: 'left' | 'right') => {
    if (newIndex >= 0 && newIndex < balances.length && newIndex !== currentBalanceIndex) {
      const fromCurrency = balances[currentBalanceIndex].currency;
      const toCurrency = balances[newIndex].currency;
      
      // Trackear el evento de swipe
      if (swipeDirection) {
        trackingService.trackBalanceSwipe(
          fromCurrency,
          toCurrency,
          currentBalanceIndex,
          newIndex,
          swipeDirection
        );
      }
      
      setCurrentBalanceIndex(newIndex);
      addLog(`🔄 BalanceCard: Cambio a balance ${toCurrency}`);
      
      // Activar animación de números después del swipe
      enableBalanceAnimation();
    }
  }, [balances, currentBalanceIndex, addLog, enableBalanceAnimation]);

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
          const swipeDirection: 'left' | 'right' = event.translationX < 0 ? 'left' : 'right';
          const targetX = -(newIndex * SCREEN_WIDTH);
          
          // Desactivar animación durante el swipe
          runOnJS(setShouldAnimateBalance)(false);
          
          translateX.value = withSpring(targetX, {
            damping: 20,
            stiffness: 300,
            mass: 0.5,
          }, () => {
            runOnJS(changeBalance)(newIndex, swipeDirection);
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
    const isExpanding = newState !== BalanceCardState.COLLAPSED;
    const wasExpanded = currentState !== BalanceCardState.COLLAPSED;
    
    const stateLabels: Record<BalanceCardState, string> = {
      [BalanceCardState.COLLAPSED]: 'Colapsado',
      [BalanceCardState.EXPANDED_LOW]: 'Expandido Bajo',
      [BalanceCardState.EXPANDED_MEDIUM]: 'Expandido Medio',
      [BalanceCardState.EXPANDED_HIGH]: 'Expandido Alto',
      [BalanceCardState.EXPANDED_XXL]: 'Expandido XXL',
    };
    
    addLog(`🔄 BalanceCard: Cambio de estado a "${stateLabels[newState]}" (${newState})`);
    if (actionId) {
      addLog(`📱 BalanceCard: Acción seleccionada: "${actionId}"`);
    }
    
    // Si estamos expandiendo, mostrar contenido inmediatamente
    if (isExpanding && !wasExpanded) {
      setShowExpandedContent(true);
    }
    
    // Calcular delay para animación del menú (después de que termine la animación de altura)
    // La animación spring tarda aproximadamente 500-600ms
    const heightAnimationDuration = 550;
    
    // Resetear delay primero para que BalanceActions reaccione
    setMenuAnimationDelay(0);
    
    // Luego establecer el delay después de un pequeño timeout para que BalanceActions detecte el cambio
    setTimeout(() => {
      setMenuAnimationDelay(heightAnimationDuration);
    }, 10);
    
    // Animar altura
    height.value = withSpring(targetHeight, {
      damping: 15,
      stiffness: 150,
      mass: 1,
    });

    setCurrentState(newState);
    if (actionId) {
      setSelectedAction(actionId);
    }
    
    // Notificar cambio de estado expandido
    if (onExpandedChange) {
      const isExpanded = newState === BalanceCardState.EXPANDED_XXL && actionId === 'enviar';
      setTimeout(() => {
        onExpandedChange(isExpanded);
      }, 100);
    }
  };

  // Función para colapsar el card cuando se toca el saldo
  const handleCollapse = () => {
    addLog(`👆 BalanceCard: Tap en componente Saldo - Colapsando card`);
    
    // Notificar que ya no está expandido
    if (onExpandedChange) {
      onExpandedChange(false);
    }
    
    // Secuencia: 1) Ocultar contenido, 2) Colapsar, 3) Mostrar botones
    // Paso 1: Ocultar contenido primero
    setShowExpandedContent(false);
    
    // Paso 2: Esperar un poco y luego colapsar
    setTimeout(() => {
      handleStateChange(BalanceCardState.COLLAPSED);
      setSelectedAction('');
    }, 200); // Pequeño delay para que se oculte el contenido
  };

  // Renderizar un card individual
  const renderCard = (balance: Balance, index: number) => {
    const cardStyle = getCardStyle(index);
    const isExpandedWithTransfer = currentState === BalanceCardState.EXPANDED_XXL && selectedAction === 'enviar';
    
    // Contenido común del card
    const cardContent = (
      <>
        {/* Background SVG - Diferente según moneda */}
        <BalanceBackground currency={balance.currency} index={index} />

        {/* Indicadores de posición - Dentro del card cuando está expandido */}
        {isExpandedWithTransfer && balances.length > 1 && (
          <View style={styles.indicatorsInsideCard}>
            <BalanceIndicators 
              total={balances.length} 
              currentIndex={currentBalanceIndex}
            />
          </View>
        )}

        {/* Header - Moneda y Saldo */}
        <View style={styles.header}>
          <BalanceDisplay 
            balance={balance.amount} 
            currency={balance.currency} 
            onCollapse={handleCollapse}
            isActive={index === currentBalanceIndex}
            shouldAnimate={shouldAnimateBalance}
          />
        </View>

        {/* Actions Row - Botones de acción */}
        <View style={[
          styles.actionsRow,
          currentState !== BalanceCardState.COLLAPSED && styles.actionsRowExpanded
        ]}>
          <BalanceActions
            currentState={currentState}
            onActionPress={(state, actionId) => handleStateChange(state, actionId)}
            availableActions={balance.availableActions}
            currentBalance={balance}
            isExpanded={currentState !== BalanceCardState.COLLAPSED}
            animationDelay={menuAnimationDelay}
          />
        </View>

        {/* Expandable Area */}
        <View style={styles.expandableArea}>
          {currentState === BalanceCardState.COLLAPSED && (
            <Text style={styles.expandableContent}>Colapsado</Text>
          )}
          {showExpandedContent && currentState === BalanceCardState.EXPANDED_LOW && (
            <Text style={styles.expandableContent}>Exchange</Text>
          )}
          {showExpandedContent && currentState === BalanceCardState.EXPANDED_MEDIUM && (
            <Text style={styles.expandableContent}>
              {selectedAction === 'agregar' ? 'Agregar' : 'Pagar'}
            </Text>
          )}
          {showExpandedContent && isExpandedWithTransfer && (
                  <TransferContent
                    currency={balance.currency}
                    onContactSelect={(contact) => {
                      addLog(`✅ BalanceCard - Contacto seleccionado para transferencia: ${contact.fullName}`);
                      if (onContactSelect) {
                        onContactSelect(contact, balance.currency);
                      }
                    }}
                  />
          )}
        </View>
      </>
    );
    
    return (
      <Animated.View
        key={`${balance.currency}-${index}`}
        style={[
          styles.cardWrapper,
          isExpandedWithTransfer && styles.cardWrapperExpanded,
          cardStyle,
        ]}
      >
        {isExpandedWithTransfer ? (
          // Cuando está expandido con transferencia, usar ScrollView unificado
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled={true}
          >
            {cardContent}
          </ScrollView>
        ) : (
          // Cuando no está expandido, renderizar normalmente
          cardContent
        )}
      </Animated.View>
    );
  };

  const isExpandedWithTransfer = currentState === BalanceCardState.EXPANDED_XXL && selectedAction === 'enviar';
  
  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      {/* Indicadores de posición - Fuera del card stack solo cuando NO está expandido con transferencia */}
      {balances.length > 1 && !isExpandedWithTransfer && (
        <BalanceIndicators 
          total={balances.length} 
          currentIndex={currentBalanceIndex}
        />
      )}
      
      <GestureDetector gesture={panGesture}>
        <Animated.View style={[styles.cardStackContainer, cardStackStyle]}>
          {balances.map((balance, index) => renderCard(balance, index))}
        </Animated.View>
      </GestureDetector>
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
    overflow: 'hidden', // Cambiado a hidden para que el fondo mantenga el border radius
    position: 'relative',
  },
  cardStackContainer: {
    flexDirection: 'row',
    height: '100%',
    overflow: 'hidden', // Ocultar cards fuera del área visible
  },
  cardWrapper: {
    width: SCREEN_WIDTH,
    height: '100%',
    padding: SPACING.lg,
    position: 'relative',
  },
  cardWrapperExpanded: {
    padding: 0,
    paddingHorizontal: 0,
  },
  header: {
    marginTop: SCREEN_HEIGHT * 0.0075,
    marginBottom: SCREEN_HEIGHT * 0.02, // Reducir espacio inferior
    position: 'relative',
    zIndex: 1,
  },
  saldoLabel: {
    fontSize: 18,
    fontFamily: FONTS.poppins.light,
    color: COLORS.textSecondary,
    marginTop: 0,
    marginBottom: SPACING.lg,
    alignSelf: 'center',
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
    marginBottom: SPACING.md,
  },
  actionsRowExpanded: {
    // Cuando está expandido, el menú se oculta, así que no necesitamos espacio
    marginBottom: 0,
    height: 0,
    overflow: 'hidden',
  },
  expandableArea: {
    flex: 1,
    paddingTop: 0, // Sin padding top cuando el menú está oculto
    paddingBottom: SPACING.md,
    position: 'relative',
    zIndex: 1,
  },
  expandableContent: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: SPACING.xl,
    paddingHorizontal: SPACING.lg,
  },
  indicatorsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    top: SCREEN_HEIGHT * 0.0075 - SPACING.sm + 3, // Justo arriba de "Saldo" + 3px más abajo
    left: 0,
    right: 0,
    zIndex: 20, // Mayor zIndex para estar sobre todo
    gap: SPACING.xs,
  },
  indicatorsInsideCard: {
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
    zIndex: 10,
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
