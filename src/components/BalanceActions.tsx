import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  withSequence,
  withDelay,
  interpolate,
  Extrapolation,
  Easing,
} from 'react-native-reanimated';
import Svg, { Circle, Path } from 'react-native-svg';
import { COLORS, SPACING, FONTS } from '../constants';
import { BalanceCardState } from './BalanceCard';
import { useLogs } from '../contexts/LogContext';
import { ActionId, Balance } from '../models';
import { trackingService } from '../services/analytics/trackingService';

interface BalanceActionsProps {
  currentState: BalanceCardState;
  onActionPress: (state: BalanceCardState, actionId: string) => void;
  availableActions?: ActionId[];
  currentBalance?: Balance;
  isExpanded?: boolean; // Control para animación de ocultar/mostrar
  animationDelay?: number; // Delay para animación secuencial (después de expandir/colapsar)
}

// Iconos de acción basados en el diseño del menú
// Agregar: flecha hacia abajo simple
const AgregarIcon = ({ isActive }: { isActive: boolean }) => (
  <Svg width={44} height={44} viewBox="0 0 44 44">
    <Circle cx="22" cy="22" r="21" fill={isActive ? '#000000' : 'transparent'} stroke={COLORS.white} strokeWidth="2" />
    <Path
      d="M22 14L22 30M14 22L22 30L30 22"
      stroke={COLORS.white}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  </Svg>
);

// Enviar: mismo icono que Agregar pero rotado 180 grados a la izquierda + 45 grados más
const EnviarIcon = ({ isActive }: { isActive: boolean }) => (
  <Svg width={44} height={44} viewBox="0 0 44 44">
    <Circle cx="22" cy="22" r="21" fill={isActive ? '#000000' : 'transparent'} stroke={COLORS.white} strokeWidth="2" />
    <Path
      d="M22 14L22 30M14 22L22 30L30 22"
      stroke={COLORS.white}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
      transform="rotate(-135 22 22)"
    />
  </Svg>
);

// Exchange: 2 flechas horizontales con ligera diferencia de altura
const ExchangeIcon = ({ isActive }: { isActive: boolean }) => (
  <Svg width={44} height={44} viewBox="0 0 44 44">
    <Circle cx="22" cy="22" r="21" fill={isActive ? '#000000' : 'transparent'} stroke={COLORS.white} strokeWidth="2" />
    {/* Flecha hacia la derecha (arriba) */}
    <Path
      d="M12 18L20 18M20 18L16 14M20 18L16 22"
      stroke={COLORS.white}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
    {/* Flecha hacia la izquierda (abajo) */}
    <Path
      d="M32 26L24 26M24 26L28 22M24 26L28 30"
      stroke={COLORS.white}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  </Svg>
);

// Pagar: símbolo de tarjeta/pago (icono original)
const PagarIcon = ({ isActive }: { isActive: boolean }) => (
  <Svg width={44} height={44} viewBox="0 0 44 44">
    <Circle cx="22" cy="22" r="21" fill={isActive ? '#000000' : 'transparent'} stroke={COLORS.white} strokeWidth="2" />
    <Path
      d="M14 22C14 18 18 16 22 18C26 16 30 18 30 22C30 26 26 28 22 30C18 28 14 26 14 22Z"
      stroke={COLORS.white}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
    <Path
      d="M18 22L22 26L26 22"
      stroke={COLORS.white}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const actions = [
  {
    id: 'agregar',
    label: 'Agregar',
    icon: AgregarIcon,
    state: BalanceCardState.EXPANDED_MEDIUM,
  },
  {
    id: 'enviar',
    label: 'Enviar',
    icon: EnviarIcon,
    state: BalanceCardState.EXPANDED_XXL,
  },
  {
    id: 'exchange',
    label: 'Exchange',
    icon: ExchangeIcon,
    state: BalanceCardState.EXPANDED_LOW,
  },
  {
    id: 'pagar',
    label: 'Pagar',
    icon: PagarIcon,
    state: BalanceCardState.EXPANDED_MEDIUM,
  },
];

export const BalanceActions: React.FC<BalanceActionsProps> = ({
  currentState,
  onActionPress,
  availableActions = ['agregar', 'enviar', 'exchange', 'pagar'], // Default: todas disponibles
  currentBalance,
  isExpanded = false,
  animationDelay = 0, // Delay para secuencia
}) => {
  const { addLog } = useLogs();
  
  // Shared values para animación
  const opacity = useSharedValue(1);
  const translateY = useSharedValue(0);
  const blur = useSharedValue(0);
  // Progress controlado con curva suave tipo Lottie para blur más fluido
  const blurProgress = useSharedValue(0);
  
  // Sincronizar animación con isExpanded (con delay para secuencia)
  React.useEffect(() => {
    if (isExpanded) {
      // Ocultar: translateY hacia arriba, blur aumenta con Lottie, opacity baja a 0
      // Primero esperamos el delay (para que termine la expansión)
      // Animación más suave y profesional usando Lottie
      translateY.value = withDelay(
        animationDelay,
        withSpring(-60, { 
          damping: 18, 
          stiffness: 280,
          mass: 0.9,
        })
      );
      // Blur con curva suave tipo Lottie (ease-in-out cubic) para animación más fluida
      blurProgress.value = withDelay(
        animationDelay,
        withTiming(1, { 
          duration: 450,
          easing: Easing.bezier(0.4, 0.0, 0.2, 1), // Curva suave tipo Lottie
        })
      );
      blur.value = withDelay(
        animationDelay,
        withTiming(10, { 
          duration: 450,
          easing: Easing.bezier(0.4, 0.0, 0.2, 1),
        })
      );
      opacity.value = withDelay(
        animationDelay,
        withTiming(0, { 
          duration: 450,
          easing: Easing.bezier(0.4, 0.0, 0.2, 1),
        })
      );
    } else {
      // Mostrar: los botones empiezan desde arriba (translateY: -60) y bajan
      // Primero aparecen con opacity 0 y blur, luego se posicionan y desaparece blur
      
      // Resetear a posición inicial (arriba) antes de animar
      translateY.value = -60;
      blur.value = 10;
      opacity.value = 0;
      blurProgress.value = 1;
      
      // Luego animar después del delay - animación más suave y profesional
      opacity.value = withDelay(
        animationDelay,
        withTiming(1, { 
          duration: 350,
          easing: Easing.bezier(0.4, 0.0, 0.2, 1),
        })
      );
      translateY.value = withDelay(
        animationDelay,
        withSpring(0, { damping: 18, stiffness: 280, mass: 0.9 })
      );
      // Blur desaparece gradualmente con curva suave mientras los botones bajan
      blurProgress.value = withDelay(
        animationDelay,
        withTiming(0, { 
          duration: 350,
          easing: Easing.bezier(0.4, 0.0, 0.2, 1),
        })
      );
      blur.value = withDelay(
        animationDelay,
        withTiming(0, { 
          duration: 350,
          easing: Easing.bezier(0.4, 0.0, 0.2, 1),
        })
      );
    }
  }, [isExpanded, animationDelay]);
  
  // Estilo animado
  const animatedStyle = useAnimatedStyle(() => {
    // Simulamos blur con un overlay semitransparente
    const blurOpacity = interpolate(
      blur.value,
      [0, 10],
      [0, 0.6],
      Extrapolation.CLAMP
    );
    
    return {
      opacity: opacity.value,
      transform: [
        { translateY: translateY.value },
      ],
    };
  });
  
  // Overlay para blur con animación suave tipo Lottie - se mueve en Y junto con los botones
  const blurOverlayStyle = useAnimatedStyle(() => {
    // Usar blurProgress con curva suave para controlar el blur de manera más fluida
    const blurOpacity = interpolate(
      blurProgress.value,
      [0, 1],
      [0, 0.8],
      Extrapolation.CLAMP
    );
    
    // El blur se mueve en Y junto con los botones para crear efecto más profesional
    const blurTranslateY = interpolate(
      translateY.value,
      [0, -60],
      [0, -30], // El blur se mueve menos que los botones para crear profundidad
      Extrapolation.CLAMP
    );
    
    return {
      opacity: blurOpacity,
      backgroundColor: COLORS.white,
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      borderRadius: 22,
      transform: [
        { translateY: blurTranslateY },
      ],
    };
  });

  const handleActionPress = (state: BalanceCardState, actionId: string) => {
    const action = actions.find(a => a.id === actionId);
    if (action) {
      addLog(`👆 BalanceActions: Tap en botón "${action.label}" (${actionId})`);
      
      // Trackear el click en la acción
      if (currentBalance) {
        trackingService.trackBalanceAction(
          actionId,
          currentBalance.currency,
          currentBalance.amount
        );
      }
    }
    onActionPress(state, actionId);
  };

  // Filtrar acciones según disponibilidad
  const filteredActions = actions.filter(action => 
    availableActions.includes(action.id as ActionId)
  );

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      {/* Overlay para blur con animación suave tipo Lottie */}
      <Animated.View style={blurOverlayStyle} pointerEvents="none" />
      
      {filteredActions.map((action) => {
        const IconComponent = action.icon;
        const isActive = currentState === action.state;
        
        return (
          <TouchableOpacity
            key={action.id}
            style={styles.actionButton}
            onPress={() => handleActionPress(action.state, action.id)}
            activeOpacity={0.8}
          >
            <IconComponent isActive={isActive} />
            <Text
              style={[
                styles.actionLabel,
                isActive && styles.actionLabelActive,
              ]}
            >
              {action.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
    position: 'relative',
    overflow: 'visible',
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: {
    fontSize: 10,
    fontFamily: FONTS.poppins.regular,
    color: COLORS.white,
    marginTop: SPACING.xs,
    opacity: 0.7,
  },
  actionLabelActive: {
    opacity: 1,
    fontWeight: '600',
  },
});

