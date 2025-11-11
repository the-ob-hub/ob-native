import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { COLORS, SPACING, FONTS } from '../constants';
import { BalanceCardState } from './BalanceCard';
import { useLogs } from '../contexts/LogContext';

interface BalanceActionsProps {
  currentState: BalanceCardState;
  onActionPress: (state: BalanceCardState, actionId: string) => void;
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
    state: BalanceCardState.EXPANDED_HIGH,
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
}) => {
  const { addLog } = useLogs();

  const handleActionPress = (state: BalanceCardState, actionId: string) => {
    const action = actions.find(a => a.id === actionId);
    if (action) {
      addLog(`👆 BalanceActions: Tap en botón "${action.label}" (${actionId})`);
    }
    onActionPress(state, actionId);
  };

  return (
    <View style={styles.container}>
      {actions.map((action) => {
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
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

