import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  useAnimatedProps,
} from 'react-native-reanimated';
import Svg, { Path, Defs, LinearGradient, RadialGradient, Stop } from 'react-native-svg';
import { COLORS, SPACING, BORDER_RADIUS, FONTS } from '../constants';
import { BalanceActions } from './BalanceActions';

const AnimatedText = Animated.createAnimatedComponent(Text);

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

// Componente para mostrar moneda y saldo
const BalanceDisplay: React.FC<{ balance: number; currency: string; onCollapse?: () => void }> = ({ balance, currency, onCollapse }) => {
  // Animación del saldo: empezar desde 90% del valor
  const animatedBalance = useSharedValue(balance * 0.9);
  const [displayBalance, setDisplayBalance] = useState(balance * 0.9);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    if (!hasAnimated) {
      // Animar desde 90% hasta el valor completo solo la primera vez
      animatedBalance.value = withTiming(balance, {
        duration: 1500,
      });
      setHasAnimated(true);
    } else {
      // Si ya animó, solo actualizar el valor directamente
      animatedBalance.value = balance;
      setDisplayBalance(balance);
    }
  }, [balance, hasAnimated]);

  // Actualizar el valor mostrado durante la animación
  useEffect(() => {
    if (!hasAnimated) {
      const interval = setInterval(() => {
        setDisplayBalance(animatedBalance.value);
      }, 16); // ~60fps

      return () => clearInterval(interval);
    }
  }, [hasAnimated]);

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

const COLLAPSED_HEIGHT = 240; // Altura colapsada (doble del anterior: 120 * 2)
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
  const [selectedAction, setSelectedAction] = useState<string>('');

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
  const handleStateChange = (newState: BalanceCardState, actionId?: string) => {
    const targetHeight = getHeightForState(newState);
    
    // Animación suave usando spring
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
    handleStateChange(BalanceCardState.COLLAPSED);
    setSelectedAction('');
  };

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      {/* Background SVG en la parte inferior */}
      <View style={styles.backgroundContainer}>
        <Svg 
          width={SCREEN_WIDTH} 
          height={(SCREEN_WIDTH / 390) * 782} 
          viewBox="0 0 390 782" 
          style={styles.backgroundSvg}
          preserveAspectRatio="xMidYMin slice"
        >
          <Defs>
            <LinearGradient id="paint0_linear_30_1301" x1="124" y1="468" x2="54.8275" y2="739.71" gradientUnits="userSpaceOnUse">
              <Stop offset="0" stopColor="#45002D" stopOpacity="0" />
              <Stop offset="1" stopColor="#AB006F" stopOpacity="0.34" />
            </LinearGradient>
            <RadialGradient id="paint1_radial_30_1301" cx="0" cy="0" r="1" gradientTransform="matrix(369 830.5 -780.554 340.303 21 75.5)" gradientUnits="userSpaceOnUse">
              <Stop offset="0.673912" stopColor="#C31E20" stopOpacity="0" />
              <Stop offset="1" stopColor="#DA7D03" />
            </RadialGradient>
            <LinearGradient id="paint2_linear_30_1301" x1="195" y1="-133" x2="195" y2="353.5" gradientUnits="userSpaceOnUse">
              <Stop offset="0" stopColor="#000000" stopOpacity="1" />
              <Stop offset="1" stopColor="#000000" stopOpacity="1" />
            </LinearGradient>
          </Defs>
          {/* Tercer layer - Negro sólido (debajo) */}
          <Path
            d="M0 50C0 22.3857 22.3858 0 50 0H340C367.614 0 390 22.3858 390 50V731.5C390 759.114 367.614 781.5 340 781.5H50C22.3858 781.5 0 759.114 0 731.5V50Z"
            fill="#000000"
            fillOpacity="1"
          />
          {/* Primer layer - Gradiente lineal (medio) */}
          <Path
            d="M0 50C0 22.3857 22.3858 0 50 0H340C367.614 0 390 22.3858 390 50V731.5C390 759.114 367.614 781.5 340 781.5H50C22.3858 781.5 0 759.114 0 731.5V50Z"
            fill="url(#paint0_linear_30_1301)"
          />
          {/* Segundo layer - Gradiente radial (arriba) */}
          <Path
            d="M0 50C0 22.3857 22.3858 0 50 0H340C367.614 0 390 22.3858 390 50V731.5C390 759.114 367.614 781.5 340 781.5H50C22.3858 781.5 0 759.114 0 731.5V50Z"
            fill="url(#paint1_radial_30_1301)"
          />
        </Svg>
      </View>

      {/* Header - Moneda y Saldo */}
      <View style={styles.header}>
        <BalanceDisplay balance={balance} currency={currency} onCollapse={handleCollapse} />
      </View>

      {/* Actions Row - Botones de acción */}
      <View style={styles.actionsRow}>
        <BalanceActions
          currentState={currentState}
          onActionPress={(state, actionId) => handleStateChange(state, actionId)}
        />
      </View>

      {/* Expandable Area - Contenido que crece */}
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

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'transparent',
    borderTopLeftRadius: 0, // Esquina superior izquierda recta
    borderTopRightRadius: 0, // Esquina superior derecha recta
    borderBottomLeftRadius: BORDER_RADIUS.xl, // Esquina inferior izquierda con radio
    borderBottomRightRadius: BORDER_RADIUS.xl, // Esquina inferior derecha con radio
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
    position: 'relative',
  },
  backgroundContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    width: SCREEN_WIDTH,
    height: (SCREEN_WIDTH / 390) * 782, // Escalar proporcionalmente (nueva altura: 782)
    zIndex: 0,
  },
  backgroundSvg: {
    position: 'absolute',
    bottom: 0,
  },
  header: {
    marginTop: SCREEN_HEIGHT * 0.0075, // 0.75% margen superior (50% menos que antes)
    marginBottom: SCREEN_HEIGHT * 0.03, // 3% margen inferior
    position: 'relative',
    zIndex: 1, // Asegurar que el contenido esté sobre el fondo
  },
  balanceDisplayContainer: {
    alignItems: 'center', // Centrado respecto al BalanceCard
    width: '100%',
  },
  balanceContentWrapper: {
    alignItems: 'center', // Contenido centrado
    width: '100%',
  },
  saldoLabel: {
    fontSize: 18, // Más grande que USDc (14) pero más chico que centavos (28)
    fontFamily: FONTS.poppins.light,
    color: COLORS.textSecondary, // Mismo color que los centavos
    marginTop: 0, // Sin margen superior para pegarse más al techo
    marginBottom: SPACING.lg, // 50% más del margen anterior (SPACING.md * 1.5 = 24px)
    alignSelf: 'center', // Centrado
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center', // USDc en el medio verticalmente
    flexWrap: 'wrap',
  },
  currencyText: {
    fontSize: 14, // Mismo tamaño que tenía "Balance"
    fontFamily: FONTS.poppins.light,
    color: COLORS.textSecondary,
    marginRight: SPACING.xs,
  },
  balanceAmountContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start', // Centavos arriba (ontop)
    position: 'relative',
  },
  balanceInteger: {
    fontSize: 56, // 4x más grande que base (14 * 4)
    fontFamily: FONTS.inter.bold, // Inter Bold
    color: COLORS.white, // Blanco puro
    fontWeight: '700',
    letterSpacing: -0.5, // Letter spacing de -0.5
    lineHeight: 56, // Mismo que fontSize para alineación precisa
  },
  balanceDecimal: {
    fontSize: 28, // Doble del tamaño actual (14 * 2)
    fontFamily: FONTS.poppins.light,
    color: COLORS.textSecondary,
    marginLeft: 2, // Pequeño espacio después del número
    lineHeight: 28, // Mismo que fontSize
    alignSelf: 'flex-start', // Pegado arriba (ontop)
    paddingTop: 0, // Sin padding superior para que esté pegado arriba
  },
  actionsRow: {
    position: 'relative',
    zIndex: 1, // Asegurar que los botones estén sobre el fondo
  },
  expandableArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.lg,
    position: 'relative',
    zIndex: 1, // Asegurar que el contenido expandible esté sobre el fondo
  },
  expandableContent: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});

