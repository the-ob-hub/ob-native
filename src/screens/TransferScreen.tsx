import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Dimensions,
  Vibration,
  Modal,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import AnimatedReanimated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { COLORS, SPACING, FONTS, BORDER_RADIUS } from '../constants';
import { ContactAvatar } from '../components/ContactAvatar';
import { UserContact } from '../models/contacts';
import { Currency, Balance } from '../models';
import { useLogs } from '../contexts/LogContext';
import { SharedBackground } from '../components/SharedBackground';
import { formatAmountInput, formatCurrency, splitFormattedAmount } from '../utils/numberFormatter';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');
const KEYBOARD_HEIGHT = 307; // Altura total del teclado (aumentada 10% desde 279)

interface TransferScreenProps {
  visible: boolean;
  contact: UserContact | null;
  balances: Balance[];
  destinationCurrency: Currency; // Moneda destino (siempre la del balance origen)
  onClose: () => void;
  onContinue: (amount: number, sourceCurrency: Currency, destinationCurrency: Currency) => void;
  isTransferring?: boolean; // Indica si la transferencia está en progreso
  transferError?: string | null; // Mensaje de error si la transferencia falla
}

const BackIcon = () => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path
      d="M19 12H5M5 12L12 19M5 12L12 5"
      stroke={COLORS.white}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const ChevronDownIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path
      d="M6 9L12 15L18 9"
      stroke={COLORS.white}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const SendIcon = () => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path
      d="M22 2L11 13M22 2L15 22L11 13L2 9L22 2Z"
      stroke={COLORS.white}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// Componente SlideToSendButton
interface SlideToSendButtonProps {
  onSend: () => void;
  disabled?: boolean;
}

const SlideToSendButton: React.FC<SlideToSendButtonProps> = ({ onSend, disabled = false }) => {
  const translateX = useSharedValue(0);
  const progress = useSharedValue(0);
  const [isComplete, setIsComplete] = useState(false);
  const buttonWidth = SCREEN_WIDTH * 0.88; // Mismo ancho que el buscador
  const thumbWidth = 56;
  const slideThreshold = buttonWidth - thumbWidth - 4; // Ancho total menos el thumb

  const handleComplete = () => {
    setIsComplete(true);
    Vibration.vibrate(100);
    onSend();
  };

  const panGesture = Gesture.Pan()
    .enabled(!disabled && !isComplete)
    .onUpdate((event) => {
      if (event.translationX >= 0 && event.translationX <= slideThreshold) {
        translateX.value = event.translationX;
        progress.value = event.translationX / slideThreshold;
      }
    })
    .onEnd((event) => {
      if (event.translationX >= slideThreshold * 0.8) {
        // Completado si llega al 80% - enviar
        translateX.value = withSpring(slideThreshold);
        progress.value = withSpring(1);
        runOnJS(handleComplete)();
      } else {
        // Resetear si no se completó
        translateX.value = withSpring(0);
        progress.value = withSpring(0);
      }
    });

  const slideButtonStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
    };
  });

  const progressStyle = useAnimatedStyle(() => {
    return {
      width: translateX.value + thumbWidth,
    };
  });

  const textOpacityStyle = useAnimatedStyle(() => {
    return {
      opacity: 1 - progress.value * 0.8,
    };
  });

  const iconOpacityStyle = useAnimatedStyle(() => {
    return {
      opacity: progress.value,
      transform: [{ scale: 0.5 + progress.value * 0.5 }],
    };
  });

  // Resetear cuando se deshabilita o cambia el monto
  React.useEffect(() => {
    if (disabled) {
      translateX.value = 0;
      progress.value = 0;
      setIsComplete(false);
    }
  }, [disabled]);

  return (
    <View style={styles.slideButtonContainer}>
      <GestureDetector gesture={panGesture}>
        <AnimatedReanimated.View style={[styles.slideButton, disabled && styles.slideButtonDisabled]}>
          {/* Barra de progreso */}
          <AnimatedReanimated.View style={[styles.slideProgress, progressStyle]} />
          
          {/* Contenido del botón */}
          <View style={styles.slideButtonContent}>
            <AnimatedReanimated.View style={[styles.slideButtonTextContainer, textOpacityStyle]}>
              <Text style={styles.slideButtonText}>Desliza para enviar</Text>
            </AnimatedReanimated.View>
            <AnimatedReanimated.View style={[styles.slideButtonIconContainer, iconOpacityStyle]}>
              <SendIcon />
            </AnimatedReanimated.View>
          </View>
          
          {/* Thumb deslizable */}
          <AnimatedReanimated.View style={[styles.slideThumb, slideButtonStyle]}>
            <SendIcon />
          </AnimatedReanimated.View>
        </AnimatedReanimated.View>
      </GestureDetector>
    </View>
  );
};

// Tasas de cambio mock (en producción vendrían del backend)
const EXCHANGE_RATES: Record<string, Record<string, number>> = {
  UYU: { USD: 0.025, USDc: 0.025 }, // 1 UYU = 0.025 USD/USDc
  USD: { UYU: 40, USDc: 1 }, // 1 USD = 40 UYU, 1 USD = 1 USDc
  USDc: { UYU: 40, USD: 1 }, // 1 USDc = 40 UYU, 1 USDc = 1 USD
};

export const TransferScreen: React.FC<TransferScreenProps> = ({
  visible,
  contact,
  balances,
  destinationCurrency,
  onClose,
  onContinue,
  isTransferring = false,
  transferError = null,
}) => {
  const [amount, setAmount] = useState('');
  const [sourceCurrency, setSourceCurrency] = useState<Currency>(destinationCurrency); // Moneda de partida (saldo)
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(true);
  const { addLog } = useLogs();
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const keyboardSlideAnim = useRef(new Animated.Value(0)).current;
  const keyboardOpacityAnim = useRef(new Animated.Value(1)).current;
  const backgroundFadeAnim = useRef(new Animated.Value(0)).current;

  // Resetear todo cuando se abre/cierra la pantalla o cambia el contacto
  useEffect(() => {
    if (visible && contact) {
      // Resetear todo cuando se abre la pantalla con un contacto
      setAmount('');
      setShowCurrencyPicker(false);
      setIsKeyboardVisible(true);
      keyboardSlideAnim.setValue(0);
      keyboardOpacityAnim.setValue(1);
      shakeAnim.setValue(0);
      // Inicializar con la moneda destino (que es la del balance origen)
      setSourceCurrency(destinationCurrency);
      
      // Animación fade-in del fondo
      backgroundFadeAnim.setValue(0);
      Animated.timing(backgroundFadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
      
      addLog(`🔄 TransferScreen - Pantalla abierta para ${contact.fullName}, destino: ${destinationCurrency}, estado reseteado`);
    } else {
      // Ocultar y resetear cuando se cierra
      setIsKeyboardVisible(false);
      keyboardSlideAnim.setValue(KEYBOARD_HEIGHT);
      keyboardOpacityAnim.setValue(0);
      backgroundFadeAnim.setValue(0);
      setAmount('');
      setShowCurrencyPicker(false);
    }
  }, [visible, contact?.cvu, contact?.fullName, destinationCurrency]); // Resetear cuando cambia el contacto o moneda destino

  // Función para ocultar el teclado con animación (desaparece completamente)
  const hideKeyboard = () => {
    if (isKeyboardVisible) {
      setIsKeyboardVisible(false);
      Animated.parallel([
        Animated.timing(keyboardSlideAnim, {
          toValue: KEYBOARD_HEIGHT,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(keyboardOpacityAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  };

  // Función para mostrar el teclado con animación
  const showKeyboard = () => {
    if (!isKeyboardVisible) {
      setIsKeyboardVisible(true);
      Animated.parallel([
        Animated.timing(keyboardSlideAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(keyboardOpacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  };

  const sourceBalance = balances.find(b => b.currency === sourceCurrency);
  const sourceBalanceAmount = sourceBalance?.amount || 0;

  // Convertir el monto ingresado (en moneda destino) a moneda fuente para validación
  const convertToSourceCurrency = (amountInDestination: number): number => {
    if (sourceCurrency === destinationCurrency) {
      return amountInDestination;
    }
    const rate = EXCHANGE_RATES[destinationCurrency]?.[sourceCurrency] || 1;
    return amountInDestination * rate;
  };

  // Convertir el monto ingresado (en moneda destino) para mostrar en moneda fuente
  const convertedAmount = amount ? convertToSourceCurrency(parseFloat(amount)) : 0;

  // Calcular altura disponible para el contenido
  const HEADER_HEIGHT = Platform.OS === 'ios' ? 50 + SPACING.md * 2 : 20 + SPACING.md * 2;
  const SAFE_AREA_BOTTOM = Platform.OS === 'ios' ? 34 : 0; // Safe area inferior en iOS
  // Asegurar que el teclado quede visible y el contenido no se solape
  const AVAILABLE_HEIGHT = SCREEN_HEIGHT - HEADER_HEIGHT - KEYBOARD_HEIGHT - SAFE_AREA_BOTTOM;


  const handleNumberPress = (num: string) => {
    // Bloquear entrada si el teclado está oculto
    if (!isKeyboardVisible) {
      return;
    }
    
    if (num === '.' && amount.includes('.')) {
      return; // No permitir múltiples puntos decimales
    }
    if (num === 'backspace') {
      setAmount(prev => prev.slice(0, -1));
      return;
    }
    
    const newAmount = amount + num;
    
    // Validar formato numérico
    const cleaned = newAmount.replace(/[^0-9.]/g, '');
    const parts = cleaned.split('.');
    if (parts.length > 2) {
      return; // No permitir múltiples puntos
    }
    
    // Validar límite máximo: 1,000,000.18 (7 dígitos enteros + 2 decimales)
    const integerPart = parts[0] || '';
    const decimalPart = parts[1] || '';
    
    // Limitar parte entera a máximo 7 dígitos (1,000,000)
    if (integerPart.length > 7) {
      return; // No permitir más de 7 dígitos en la parte entera
    }
    
    // Limitar parte decimal a máximo 2 dígitos
    if (decimalPart.length > 2) {
      return; // No permitir más de 2 dígitos decimales
    }
    
    const numAmount = parseFloat(cleaned);
    const convertedAmount = convertToSourceCurrency(numAmount);
    const previousExceeded = convertedAmount > sourceBalanceAmount;
    const nowExceeds = convertedAmount > sourceBalanceAmount;
    
    // Vibrar y animar si ahora excede el saldo
    if (nowExceeds) {
      // Siempre vibrar cuando excede
      Vibration.vibrate(100);
      
      // Animación shake (micromovimiento) siempre que excede
      Animated.sequence([
        Animated.timing(shakeAnim, {
          toValue: 10,
          duration: 50,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnim, {
          toValue: -10,
          duration: 50,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnim, {
          toValue: 10,
          duration: 50,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnim, {
          toValue: 0,
          duration: 50,
          useNativeDriver: true,
        }),
      ]).start();
    }
    
    setAmount(cleaned);
  };

  const handleContinue = () => {
    // No permitir continuar si ya está procesando
    if (isTransferring) {
      return;
    }
    
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      addLog('❌ TransferScreen - Monto inválido');
      return;
    }
    const convertedAmount = convertToSourceCurrency(numAmount);
    if (convertedAmount > sourceBalanceAmount) {
      addLog('❌ TransferScreen - Monto excede el saldo disponible');
      return;
    }
    
    // Ocultar teclado cuando se inicia la transferencia
    hideKeyboard();
    
    addLog(`✅ TransferScreen - Continuar con transferencia: ${numAmount} ${destinationCurrency} (desde ${sourceCurrency}) a ${contact?.fullName || 'N/A'}`);
    onContinue(numAmount, sourceCurrency, destinationCurrency);
  };
  
  // Ocultar teclado cuando está procesando
  useEffect(() => {
    if (isTransferring) {
      hideKeyboard();
    }
  }, [isTransferring]);

  // Resetear error cuando cambia el monto
  useEffect(() => {
    if (transferError && amount) {
      // El error se resetea cuando el usuario modifica el monto
      // Esto se maneja desde el componente padre
    }
  }, [amount, transferError]);

  const getCurrencyLabel = (currency: Currency) => {
    switch (currency) {
      case 'UYU':
        return 'UYU';
      case 'USD':
        return 'DOLAR';
      case 'USDc':
        return 'USDc';
      default:
        return currency;
    }
  };

  if (!visible || !contact) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.container}>
        {/* Fondo con fade-in */}
        <Animated.View style={[styles.backgroundWrapper, { opacity: backgroundFadeAnim }]}>
          <SharedBackground />
        </Animated.View>
        
        {/* Header con botón volver */}
                <View style={styles.header}>
                <TouchableOpacity
                  style={styles.backButton}
                  onPress={() => {
                    addLog('🔙 TransferScreen - Botón volver presionado, reseteando estado');
                    // Resetear todo el estado antes de cerrar
                    setAmount('');
                    setShowCurrencyPicker(false);
                    setIsKeyboardVisible(true);
                    keyboardSlideAnim.setValue(0);
                    keyboardOpacityAnim.setValue(1);
                    shakeAnim.setValue(0);
                    onClose();
                  }}
                  activeOpacity={0.7}
                >
                  <BackIcon />
                </TouchableOpacity>
              </View>

      <View style={[styles.contentWrapper, { height: AVAILABLE_HEIGHT }]}>
        {/* Información del contacto */}
        <View style={styles.contactSection}>
          <ContactAvatar contact={contact} size={70} showBorder={true} />
          <Text style={styles.contactName} numberOfLines={2}>
            {contact.fullName}
          </Text>
          <Text style={styles.contactCvu} numberOfLines={1}>
            {contact.cvu || 'CVU no disponible'}
          </Text>
          {contact.alias && (
            <Text style={styles.contactAlias}>
              Alias: {contact.alias}
            </Text>
          )}
        </View>

        {/* Rectángulo para monto (AmountContainer) - con margen aumentado 2% */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => {
            if (!isKeyboardVisible) {
              showKeyboard();
              addLog('⌨️ TransferScreen - Teclado activado al tocar monto');
            }
          }}
        >
          <Animated.View 
                style={[
                  styles.amountContainer,
                  amount && convertedAmount > sourceBalanceAmount && styles.amountContainerError,
                  { transform: [{ translateX: shakeAnim }] }
                ]}
          >
          <View style={styles.amountContent}>
            {/* Valor numérico centrado en todo el contenedor */}
            <View style={styles.amountValueContainer}>
              {(() => {
                const formatted = formatAmountInput(amount) || '0';
                const { integer, decimal } = splitFormattedAmount(formatted);
                return (
                  <>
                    <Text style={[
                      styles.amountValue,
                      amount && convertedAmount > sourceBalanceAmount && styles.amountValueError,
                    ]}>
                      {integer}
                    </Text>
                    {decimal && (
                      <Text style={[
                        styles.amountValueDecimal,
                        amount && convertedAmount > sourceBalanceAmount && styles.amountValueError,
                      ]}>
                        {decimal}
                      </Text>
                    )}
                  </>
                );
              })()}
            </View>
            {/* Símbolo de moneda posicionado absolutamente a la izquierda */}
            <Text style={styles.currencyLabel}>{destinationCurrency}</Text>
          </View>
          </Animated.View>
        </TouchableOpacity>

        {/* Saldo y selector de moneda de partida */}
        <TouchableOpacity
          style={styles.balanceSelector}
          onPress={() => {
            hideKeyboard(); // Ocultar teclado al tocar selector
            setShowCurrencyPicker(!showCurrencyPicker);
            addLog(`💰 TransferScreen - Selector de moneda de partida ${showCurrencyPicker ? 'cerrado' : 'abierto'}`);
          }}
          activeOpacity={0.7}
        >
          <View style={styles.balanceInfo}>
            <Text style={styles.balanceLabel}>Desde tu cuenta:</Text>
            <Text style={styles.balanceCurrency}>{sourceCurrency}</Text>
            <Text style={styles.balanceAmount}>
              {formatCurrency(sourceBalanceAmount)}
            </Text>
          </View>
          <ChevronDownIcon />
        </TouchableOpacity>

        {/* Saldo restante - Debajo de Saldo */}
        {amount && parseFloat(amount) > 0 && (
          <View style={styles.remainingBalanceContainer}>
            <Text style={styles.remainingBalanceLabel}>
              Quedarán en tu cuenta:{' '}
            </Text>
            <Text style={[
              styles.remainingBalanceValue,
              convertedAmount > sourceBalanceAmount && styles.remainingBalanceError
            ]}>
              {sourceCurrency} {formatCurrency(Math.max(0, sourceBalanceAmount - convertedAmount))}
            </Text>
            {convertedAmount > sourceBalanceAmount && (
              <Text style={styles.remainingBalanceError}> (excede el saldo)</Text>
            )}
          </View>
        )}

        {/* Conversión - Debajo de saldo restante */}
        {amount && parseFloat(amount) > 0 && sourceCurrency !== destinationCurrency && (
          <View style={styles.conversionContainer}>
            <Text style={styles.conversionText}>
              ≈ {formatCurrency(convertedAmount)} {sourceCurrency}
            </Text>
          </View>
        )}

        {/* Selector de moneda desplegable */}
        {showCurrencyPicker && (
          <View style={styles.currencyPicker}>
            {balances.map((balance) => (
              <TouchableOpacity
                key={balance.currency}
                style={[
                  styles.currencyOption,
                  sourceCurrency === balance.currency && styles.currencyOptionSelected,
                ]}
                onPress={() => {
                  setSourceCurrency(balance.currency);
                  setShowCurrencyPicker(false);
                  addLog(`💰 TransferScreen - Moneda de partida seleccionada: ${balance.currency}`);
                  // Mostrar teclado después de seleccionar moneda
                  setTimeout(() => {
                    showKeyboard();
                  }, 100);
                }}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.currencyOptionText,
                    sourceCurrency === balance.currency && styles.currencyOptionTextSelected,
                  ]}
                >
                  {getCurrencyLabel(balance.currency)}
                </Text>
                <Text
                  style={[
                    styles.currencyOptionAmount,
                    sourceCurrency === balance.currency && styles.currencyOptionAmountSelected,
                  ]}
                >
                  {formatCurrency(balance.amount)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Mensaje de error */}
        {transferError && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{transferError}</Text>
          </View>
        )}

        {/* Indicador de carga */}
        {isTransferring && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Procesando transferencia...</Text>
          </View>
        )}

        {/* Botón Slide para Enviar */}
        <SlideToSendButton
          onSend={handleContinue}
          disabled={!amount || parseFloat(amount) <= 0 || isTransferring}
        />
      </View>

      {/* Teclado numérico */}
      <Animated.View 
        style={[
          styles.keyboardSafeArea,
          { 
            transform: [{ translateY: keyboardSlideAnim }],
            opacity: keyboardOpacityAnim,
          }
        ]}
        pointerEvents={isKeyboardVisible ? 'auto' : 'none'}
      >
        <View style={styles.keyboardContainer}>
        <View style={styles.keyboardRow}>
          {['1', '2', '3'].map((num) => (
            <TouchableOpacity
              key={num}
              style={styles.keyboardKey}
              onPress={() => handleNumberPress(num)}
              activeOpacity={0.7}
            >
              <Text style={styles.keyboardKeyText}>{num}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.keyboardRow}>
          {['4', '5', '6'].map((num) => (
            <TouchableOpacity
              key={num}
              style={styles.keyboardKey}
              onPress={() => handleNumberPress(num)}
              activeOpacity={0.7}
            >
              <Text style={styles.keyboardKeyText}>{num}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.keyboardRow}>
          {['7', '8', '9'].map((num) => (
            <TouchableOpacity
              key={num}
              style={styles.keyboardKey}
              onPress={() => handleNumberPress(num)}
              activeOpacity={0.7}
            >
              <Text style={styles.keyboardKeyText}>{num}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.keyboardRow}>
          <TouchableOpacity
            style={styles.keyboardKey}
            onPress={() => handleNumberPress('.')}
            activeOpacity={0.7}
          >
            <Text style={styles.keyboardKeyText}>.</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.keyboardKey}
            onPress={() => handleNumberPress('0')}
            activeOpacity={0.7}
          >
            <Text style={styles.keyboardKeyText}>0</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.keyboardKey}
            onPress={() => handleNumberPress('backspace')}
            activeOpacity={0.7}
          >
            <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
              <Path
                d="M21 4H8L1 12L8 20H21C21.5304 20 22.0391 19.7893 22.4142 19.4142C22.7893 19.0391 23 18.5304 23 18V6C23 5.46957 22.7893 4.96086 22.4142 4.58579C22.0391 4.21071 21.5304 4 21 4Z"
                stroke={COLORS.white}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <Path
                d="M18 9L12 15M12 9L18 15"
                stroke={COLORS.white}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </TouchableOpacity>
        </View>
        </View>
      </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000', // Fondo negro para evitar flash blanco mientras carga
  },
  backgroundWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: SPACING.md,
    paddingHorizontal: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 10,
    backgroundColor: 'transparent',
  },
  backButton: {
    padding: SPACING.sm,
  },
  contentWrapper: {
    paddingHorizontal: SPACING.lg,
    justifyContent: 'flex-start',
    zIndex: 1,
  },
  contactSection: {
    alignItems: 'center',
    marginTop: SPACING.sm,
    marginBottom: SPACING.md,
  },
  contactName: {
    fontSize: 18,
    fontFamily: FONTS.inter.bold,
    color: COLORS.white,
    marginTop: SPACING.sm,
    textAlign: 'center',
  },
  contactCvu: {
    fontSize: 12,
    fontFamily: FONTS.inter.regular,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
    textAlign: 'center',
  },
  contactAlias: {
    fontSize: 14,
    fontFamily: FONTS.inter.bold,
    color: COLORS.white,
    marginTop: SPACING.xs,
    textAlign: 'center',
  },
  amountContainer: {
    backgroundColor: 'rgba(107, 114, 128, 0.1)', // Gris oscuro con 90% transparencia (10% opacidad)
    borderRadius: 20, // Border radius de 20
    padding: SPACING.md,
    marginBottom: SPACING.md,
    minHeight: 80,
    justifyContent: 'center',
  },
  amountContainerError: {
    backgroundColor: 'rgba(88, 28, 40, 0.5)', // Bordó oscuro con 50% transparencia cuando excede
  },
  amountContent: {
    flexDirection: 'row',
    justifyContent: 'center', // Contenedor centrado
    alignItems: 'center',
    position: 'relative', // Para posicionar el símbolo de moneda absolutamente
    paddingHorizontal: SPACING.md,
  },
  amountValueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center', // Valor numérico centrado en todo el contenedor
  },
  currencyLabel: {
    position: 'absolute', // Posicionado absolutamente
    left: SPACING.md, // A la izquierda con padding
    fontSize: 16,
    fontFamily: FONTS.inter.regular,
    color: COLORS.textSecondary,
  },
  amountValue: {
    fontSize: 40,
    fontFamily: FONTS.inter.bold,
    color: COLORS.white,
    textAlign: 'center',
  },
  amountValueDecimal: {
    fontSize: 28, // Solo los decimales más pequeños
    fontFamily: FONTS.inter.bold,
    color: COLORS.white,
  },
  amountValueError: {
    color: '#6B1C2A', // Bordó oscuro en lugar de rojo fuego
  },
  conversionContainer: {
    marginTop: SPACING.sm,
    marginBottom: SPACING.xs,
    alignItems: 'flex-start', // Alineado a la izquierda igual que saldo
    paddingHorizontal: SPACING.lg, // Mismo padding que el selector de saldo
  },
  conversionText: {
    fontSize: 12,
    fontFamily: FONTS.inter.regular,
    color: COLORS.textSecondary,
  },
  remainingBalanceContainer: {
    marginTop: SPACING.sm,
    marginBottom: SPACING.sm,
    flexDirection: 'row',
    alignItems: 'flex-start', // Alineado a la izquierda
    paddingHorizontal: SPACING.lg, // Mismo padding que el selector de saldo
    flexWrap: 'wrap', // Permitir que se ajuste si es necesario
  },
  remainingBalanceLabel: {
    fontSize: 12,
    fontFamily: FONTS.inter.regular,
    color: COLORS.textSecondary,
  },
  remainingBalanceValue: {
    fontSize: 12,
    fontFamily: FONTS.inter.bold,
    color: '#00FF00', // Verde fluo
  },
  remainingBalanceError: {
    color: '#6B1C2A', // Bordó oscuro en lugar de rojo fuego
    fontFamily: FONTS.inter.bold,
  },
  balanceSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg, // Padding para alineación con otros textos
    marginBottom: SPACING.sm,
  },
  balanceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  balanceLabel: {
    fontSize: 16,
    fontFamily: FONTS.inter.regular,
    color: COLORS.white,
  },
  balanceCurrency: {
    fontSize: 16,
    fontFamily: FONTS.inter.bold,
    color: COLORS.white,
  },
  balanceAmount: {
    fontSize: 16,
    fontFamily: FONTS.inter.bold,
    color: COLORS.white,
  },
  currencyPicker: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.sm,
    overflow: 'hidden',
  },
  currencyOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  currencyOptionSelected: {
    backgroundColor: 'rgba(0, 102, 255, 0.2)',
  },
  currencyOptionText: {
    fontSize: 16,
    fontFamily: FONTS.inter.regular,
    color: COLORS.white,
  },
  currencyOptionTextSelected: {
    fontFamily: FONTS.inter.bold,
    color: COLORS.primary,
  },
  currencyOptionAmount: {
    fontSize: 16,
    fontFamily: FONTS.inter.regular,
    color: COLORS.textSecondary,
  },
  currencyOptionAmountSelected: {
    fontFamily: FONTS.inter.bold,
    color: COLORS.primary,
  },
  slideButtonContainer: {
    marginTop: SPACING.md,
    alignItems: 'center',
  },
  slideButton: {
    width: SCREEN_WIDTH * 0.88, // Mismo ancho que el buscador
    height: 56,
    backgroundColor: '#000000',
    borderRadius: 28, // 100% redondeado (height / 2)
    borderWidth: 2,
    borderColor: COLORS.white,
    overflow: 'hidden',
    position: 'relative',
  },
  slideButtonDisabled: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    opacity: 0.5,
  },
  slideProgress: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 28, // 100% redondeado (height / 2)
  },
  slideButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    paddingHorizontal: SPACING.lg,
    position: 'relative',
    zIndex: 1,
  },
  slideButtonTextContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  slideButtonText: {
    fontSize: 16,
    fontFamily: FONTS.inter.bold,
    color: COLORS.white,
  },
  slideButtonIconContainer: {
    position: 'absolute',
    right: SPACING.lg,
  },
  slideThumb: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: 56,
    height: 56,
    backgroundColor: COLORS.white,
    borderRadius: 28, // Círculo perfecto (width / 2)
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  keyboardSafeArea: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 2,
  },
  keyboardContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    paddingTop: SPACING.md, // Reducido proporcionalmente
    paddingBottom: 0, // Sin margen al borde inferior
    paddingHorizontal: SPACING.md,
    minHeight: KEYBOARD_HEIGHT,
  },
  keyboardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.xs, // Reducido proporcionalmente
    gap: SPACING.sm,
  },
  keyboardKey: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md, // Reducido proporcionalmente
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: '#000000', // Negro
    minHeight: 44, // Reducido proporcionalmente (de 46 a 44)
  },
  keyboardKeyText: {
    fontSize: 20, // Reducido proporcionalmente (de 21 a 20)
    fontFamily: FONTS.inter.bold,
    color: COLORS.white,
  },
  errorContainer: {
    marginTop: SPACING.sm,
    marginBottom: SPACING.xs,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    backgroundColor: 'rgba(107, 28, 42, 0.3)',
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: '#6B1C2A',
  },
  errorText: {
    fontSize: 14,
    fontFamily: FONTS.inter.regular,
    color: '#FF6B6B',
    textAlign: 'center',
  },
  loadingContainer: {
    marginTop: SPACING.sm,
    marginBottom: SPACING.xs,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 14,
    fontFamily: FONTS.inter.regular,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.sm,
  },
});

