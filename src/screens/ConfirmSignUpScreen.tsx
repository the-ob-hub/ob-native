import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  TouchableWithoutFeedback,
  Keyboard,
  ScrollView,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { COLORS, SPACING, BORDER_RADIUS, FONTS } from '../constants';
import { cognitoService } from '../services/auth/cognitoService';
import { LoginBackground } from '../components/LoginBackground';
import { LogViewer } from '../components/LogViewer';
import { useLogs } from '../contexts/LogContext';

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

interface ConfirmSignUpScreenProps {
  email: string;
  username?: string; // Username real usado en el registro
  onBack: () => void;
  onConfirmSuccess: () => void;
}

export const ConfirmSignUpScreen: React.FC<ConfirmSignUpScreenProps> = ({
  email,
  username,
  onBack,
  onConfirmSuccess,
}) => {
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLogViewerVisible, setIsLogViewerVisible] = useState(false);
  const { addLog } = useLogs();

  const handleConfirm = async () => {
    if (!code.trim()) {
      addLog('⚠️ ConfirmSignUpScreen - Validación: Código vacío');
      Alert.alert('Error', 'Por favor ingresa el código de verificación');
      return;
    }

    setIsLoading(true);
    addLog(`✅ ConfirmSignUpScreen - Confirmando código para: ${email}`);
    addLog(`🔢 ConfirmSignUpScreen - Código ingresado: ${code.trim()}`);
    addLog(`⏰ ConfirmSignUpScreen - Timestamp: ${new Date().toISOString()}`);

    try {
      addLog(`📤 ConfirmSignUpScreen - Llamando cognitoService.confirmSignUp()`);
      addLog(`👤 ConfirmSignUpScreen - Username disponible: ${username || 'N/A'}`);
      const result = await cognitoService.confirmSignUp(email, code.trim(), username);

      if (result.success) {
        addLog('✅ ConfirmSignUpScreen - Código confirmado exitosamente');
        Alert.alert(
          'Cuenta verificada',
          'Tu cuenta ha sido verificada exitosamente. Ya puedes iniciar sesión.',
          [
            {
              text: 'OK',
              onPress: onConfirmSuccess,
            },
          ]
        );
      } else {
        addLog(`❌ ConfirmSignUpScreen - Error: ${result.message || 'Error desconocido'}`);
        Alert.alert('Error', result.message || 'Error al confirmar código');
      }
    } catch (error: any) {
      const errorMsg = `❌ ConfirmSignUpScreen - Error: ${error.message || String(error)}`;
      addLog(errorMsg);
      Alert.alert('Error', error.message || 'Error al confirmar código');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    setIsLoading(true);
    addLog(`📨 ConfirmSignUpScreen - Reenviando código para: ${email}`);
    addLog(`⏰ ConfirmSignUpScreen - Timestamp: ${new Date().toISOString()}`);

    try {
      // Limpiar el código del input antes de reenviar
      setCode('');
      addLog(`🧹 ConfirmSignUpScreen - Código limpiado del input`);

      addLog(`👤 ConfirmSignUpScreen - Username disponible para reenvío: ${username || 'N/A'}`);
      const result = await cognitoService.resendConfirmationCode(email, username);

      if (result.success) {
        addLog('✅ ConfirmSignUpScreen - Código reenviado exitosamente');
        Alert.alert('Código reenviado', 'Revisa tu email para el nuevo código');
      } else {
        addLog(`❌ ConfirmSignUpScreen - Error: ${result.message || 'Error desconocido'}`);
        Alert.alert('Error', result.message || 'Error al reenviar código');
      }
    } catch (error: any) {
      const errorMsg = `❌ ConfirmSignUpScreen - Error: ${error.message || String(error)}`;
      addLog(errorMsg);
      Alert.alert('Error', error.message || 'Error al reenviar código');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <LoginBackground />
        
        {/* Header con botón volver - Mismo estilo que TransferScreen */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBack}
            disabled={isLoading}
            activeOpacity={0.7}
          >
            <BackIcon />
          </TouchableOpacity>
        </View>

        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.content}>
            {/* Title Section */}
            <View style={styles.titleSection}>
              <Text style={styles.title}>Verifica tu cuenta</Text>
              <Text style={styles.subtitle}>
                Ingresa el código de verificación que enviamos a{'\n'}
                <Text style={styles.email}>{email}</Text>
              </Text>
            </View>

            {/* Form */}
            <View style={styles.form}>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Código de verificación</Text>
                <TextInput
                  style={styles.input}
                  placeholder="123456"
                  placeholderTextColor={COLORS.textSecondary}
                  value={code}
                  onChangeText={setCode}
                  keyboardType="number-pad"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isLoading}
                  maxLength={6}
                />
              </View>

              <TouchableOpacity
                style={[styles.confirmButton, isLoading && styles.confirmButtonDisabled]}
                onPress={handleConfirm}
                disabled={isLoading}
                activeOpacity={0.8}
              >
                {isLoading ? (
                  <ActivityIndicator color={COLORS.primary} />
                ) : (
                  <Text style={styles.confirmButtonText}>Verificar cuenta</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.resendButton}
                onPress={handleResendCode}
                disabled={isLoading}
              >
                <Text style={styles.resendButtonText}>Reenviar código</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>

        {/* Badge de versión flotante */}
        <TouchableOpacity
          style={styles.versionBadge}
          onPress={() => setIsLogViewerVisible(true)}
          activeOpacity={0.7}
        >
          <Text style={styles.versionBadgeText}>v1.86</Text>
        </TouchableOpacity>

        {/* LogViewer */}
        <LogViewer
          visible={isLogViewerVisible}
          onClose={() => setIsLogViewerVisible(false)}
        />
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: SPACING.xl,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: SPACING.lg,
    zIndex: 1,
  },
  titleSection: {
    alignItems: 'center',
    marginBottom: SPACING.xxl,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: SPACING.sm,
    fontFamily: FONTS.inter.extraBold,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.white,
    opacity: 0.9,
    fontFamily: FONTS.inter.regular,
    textAlign: 'center',
    paddingHorizontal: SPACING.md,
  },
  email: {
    fontWeight: 'bold',
    color: COLORS.white,
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: SPACING.lg,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.white,
    marginBottom: SPACING.sm,
    fontFamily: FONTS.inter.bold,
  },
  input: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    fontSize: 24,
    color: COLORS.text,
    fontFamily: FONTS.inter.regular,
    textAlign: 'center',
    letterSpacing: 8,
  },
  confirmButton: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  confirmButtonDisabled: {
    opacity: 0.6,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
    fontFamily: FONTS.inter.bold,
  },
  resendButton: {
    marginTop: SPACING.md,
    alignItems: 'center',
  },
  resendButtonText: {
    fontSize: 14,
    color: COLORS.white,
    opacity: 0.9,
    textDecorationLine: 'underline',
    fontFamily: FONTS.inter.regular,
  },
  versionBadge: {
    position: 'absolute',
    top: 50,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    zIndex: 9999,
    elevation: 9999,
  },
  versionBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.white,
  },
});

