import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
  Dimensions,
  Platform,
  Linking,
} from 'react-native';
import { COLORS, SPACING, FONTS, BORDER_RADIUS } from '../constants';
import { SharedBackground } from '../components/SharedBackground';
import { formatCurrency } from '../utils/numberFormatter';
import { Currency } from '../models';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface TransactionSuccessScreenProps {
  visible: boolean;
  recipientName: string;
  amount: number;
  currency: Currency;
  senderName: string;
  senderDocument: string;
  transactionId: string;
  transactionDate: string;
  onClose: () => void;
}

const CelebrationEmoji = () => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animación de celebración simple: escala y rotación
    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(scaleAnim, {
            toValue: 1.2,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(rotateAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(rotateAnim, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }),
        ]),
      ])
    ).start();
  }, []);

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '15deg'],
  });

  return (
    <Animated.Text
      style={[
        styles.celebrationEmoji,
        {
          transform: [{ scale: scaleAnim }, { rotate }],
        },
      ]}
    >
      🎉
    </Animated.Text>
  );
};

export const TransactionSuccessScreen: React.FC<TransactionSuccessScreenProps> = ({
  visible,
  recipientName,
  amount,
  currency,
  senderName,
  senderDocument,
  transactionId,
  transactionDate,
  onClose,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      fadeAnim.setValue(0);
      slideAnim.setValue(50);
    }
  }, [visible]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  };

  const handleWhatsAppShare = () => {
    // Por ahora sin función, solo log
    console.log('WhatsApp share - función pendiente');
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.container}>
        <SharedBackground />

        <Animated.View
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Onda Bank</Text>
            <View style={styles.subtitleContainer}>
              <Text style={styles.subtitle}>Comprobante de transacción exitosa</Text>
              <CelebrationEmoji />
            </View>
          </View>

          {/* Contenido principal */}
          <View style={styles.mainContent}>
            {/* Nombre del destinatario */}
            <Text style={styles.recipientLabel}>{recipientName}</Text>
            <Text style={styles.recipientText}>recibiste</Text>

            {/* Monto */}
            <View style={styles.amountContainer}>
              <Text style={styles.amountValue}>{formatCurrency(amount)}</Text>
              <Text style={styles.amountCurrency}>{currency}</Text>
            </View>

            {/* Remitente */}
            <View style={styles.senderContainer}>
              <Text style={styles.senderLabel}>De parte de:</Text>
              <Text style={styles.senderName}>{senderName}</Text>
              {senderDocument && (
                <Text style={styles.senderDocument}>{senderDocument}</Text>
              )}
            </View>
          </View>

          {/* Detalles de la transacción */}
          <View style={styles.detailsContainer}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Número de transacción:</Text>
              <Text style={styles.detailValue}>{transactionId}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Fecha y hora:</Text>
              <Text style={styles.detailValue}>{formatDate(transactionDate)}</Text>
            </View>
          </View>

          {/* Botón WhatsApp */}
          <TouchableOpacity
            style={styles.whatsappButton}
            onPress={handleWhatsAppShare}
            activeOpacity={0.8}
          >
            <Text style={styles.whatsappButtonText}>Enviar por WhatsApp</Text>
          </TouchableOpacity>

          {/* Botón Cerrar */}
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            activeOpacity={0.8}
          >
            <Text style={styles.closeButtonText}>Cerrar</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  title: {
    fontSize: 28,
    fontFamily: FONTS.inter.bold,
    color: COLORS.white,
    marginBottom: SPACING.sm,
  },
  subtitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: FONTS.inter.regular,
    color: COLORS.textSecondary,
  },
  celebrationEmoji: {
    fontSize: 24,
  },
  mainContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xl,
  },
  recipientLabel: {
    fontSize: 20,
    fontFamily: FONTS.inter.bold,
    color: COLORS.white,
    marginBottom: SPACING.xs,
  },
  recipientText: {
    fontSize: 16,
    fontFamily: FONTS.inter.regular,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xl,
  },
  amountContainer: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  amountValue: {
    fontSize: 48,
    fontFamily: FONTS.inter.bold,
    color: COLORS.white,
    marginBottom: SPACING.xs,
  },
  amountCurrency: {
    fontSize: 24,
    fontFamily: FONTS.inter.bold,
    color: COLORS.primary,
  },
  senderContainer: {
    alignItems: 'center',
    marginTop: SPACING.xl,
  },
  senderLabel: {
    fontSize: 14,
    fontFamily: FONTS.inter.regular,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  senderName: {
    fontSize: 18,
    fontFamily: FONTS.inter.bold,
    color: COLORS.white,
    marginBottom: SPACING.xs,
  },
  senderDocument: {
    fontSize: 14,
    fontFamily: FONTS.inter.regular,
    color: COLORS.textSecondary,
  },
  detailsContainer: {
    marginBottom: SPACING.lg,
    paddingHorizontal: SPACING.md,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  detailLabel: {
    fontSize: 12,
    fontFamily: FONTS.inter.regular,
    color: COLORS.textSecondary,
  },
  detailValue: {
    fontSize: 12,
    fontFamily: FONTS.inter.bold,
    color: COLORS.white,
  },
  whatsappButton: {
    backgroundColor: '#25D366',
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  whatsappButtonText: {
    fontSize: 16,
    fontFamily: FONTS.inter.bold,
    color: COLORS.white,
  },
  closeButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    fontFamily: FONTS.inter.regular,
    color: COLORS.white,
  },
});

