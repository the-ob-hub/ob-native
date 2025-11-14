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
} from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS, FONTS } from '../constants';
import { cognitoService } from '../services/auth/cognitoService';
import { LoginBackground } from '../components/LoginBackground';
import { useLogs } from '../contexts/LogContext';

interface ForgotPasswordScreenProps {
  onBack: () => void;
  onSuccess: () => void;
}

type Step = 'email' | 'code';

export const ForgotPasswordScreen: React.FC<ForgotPasswordScreenProps> = ({
  onBack,
  onSuccess,
}) => {
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { addLog } = useLogs();

  const handleSendCode = async () => {
    if (!email.trim()) {
      addLog('⚠️ ForgotPasswordScreen - Validación: Email vacío');
      Alert.alert('Error', 'Por favor ingresa tu email');
      return;
    }

    setIsLoading(true);
    addLog(`📧 ForgotPasswordScreen - Solicitando código para: ${email.trim()}`);

    try {
      const result = await cognitoService.forgotPassword(email.trim());
      
      if (result.success) {
        addLog('✅ ForgotPasswordScreen - Código enviado exitosamente');
        Alert.alert('Código enviado', result.message || 'Revisa tu email para el código de verificación');
        setStep('code');
      } else {
        addLog(`❌ ForgotPasswordScreen - Error: ${result.message || 'Error desconocido'}`);
        Alert.alert('Error', result.message || 'Error al enviar código');
      }
    } catch (error: any) {
      const errorMsg = `❌ ForgotPasswordScreen - Error: ${error.message || String(error)}`;
      addLog(errorMsg);
      Alert.alert('Error', error.message || 'Error al enviar código');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!code.trim() || !newPassword.trim() || !confirmPassword.trim()) {
      addLog('⚠️ ForgotPasswordScreen - Validación: Campos incompletos');
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }

    if (newPassword !== confirmPassword) {
      addLog('⚠️ ForgotPasswordScreen - Validación: Contraseñas no coinciden');
      Alert.alert('Error', 'Las contraseñas no coinciden');
      return;
    }

    if (newPassword.length < 8) {
      addLog('⚠️ ForgotPasswordScreen - Validación: Contraseña muy corta');
      Alert.alert('Error', 'La contraseña debe tener al menos 8 caracteres');
      return;
    }

    setIsLoading(true);
    addLog(`🔐 ForgotPasswordScreen - Restableciendo contraseña para: ${email.trim()}`);

    try {
      const result = await cognitoService.confirmPassword(
        email.trim(),
        code.trim(),
        newPassword
      );
      
      if (result.success) {
        addLog('✅ ForgotPasswordScreen - Contraseña restablecida exitosamente');
        Alert.alert(
          'Éxito',
          'Tu contraseña ha sido restablecida. Puedes iniciar sesión ahora.',
          [
            {
              text: 'OK',
              onPress: onSuccess,
            },
          ]
        );
      } else {
        addLog(`❌ ForgotPasswordScreen - Error: ${result.message || 'Error desconocido'}`);
        Alert.alert('Error', result.message || 'Error al restablecer contraseña');
      }
    } catch (error: any) {
      const errorMsg = `❌ ForgotPasswordScreen - Error: ${error.message || String(error)}`;
      addLog(errorMsg);
      Alert.alert('Error', error.message || 'Error al restablecer contraseña');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    setIsLoading(true);
    addLog(`📨 ForgotPasswordScreen - Reenviando código para: ${email.trim()}`);

    try {
      const result = await cognitoService.forgotPassword(email.trim());
      
      if (result.success) {
        addLog('✅ ForgotPasswordScreen - Código reenviado exitosamente');
        Alert.alert('Código reenviado', 'Revisa tu email para el nuevo código');
      } else {
        addLog(`❌ ForgotPasswordScreen - Error: ${result.message || 'Error desconocido'}`);
        Alert.alert('Error', result.message || 'Error al reenviar código');
      }
    } catch (error: any) {
      const errorMsg = `❌ ForgotPasswordScreen - Error: ${error.message || String(error)}`;
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
        
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={onBack}
              disabled={isLoading}
            >
              <Text style={styles.backButtonText}>← Volver</Text>
            </TouchableOpacity>
            <Text style={styles.title}>
              {step === 'email' ? 'Olvidé mi contraseña' : 'Ingresa el código'}
            </Text>
            <Text style={styles.subtitle}>
              {step === 'email'
                ? 'Ingresa tu email y te enviaremos un código de verificación'
                : `Ingresa el código que enviamos a ${email}`}
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {step === 'email' ? (
              <>
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Email</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="tu@email.com"
                    placeholderTextColor={COLORS.textSecondary}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!isLoading}
                  />
                </View>

                <TouchableOpacity
                  style={[styles.button, isLoading && styles.buttonDisabled]}
                  onPress={handleSendCode}
                  disabled={isLoading}
                  activeOpacity={0.8}
                >
                  {isLoading ? (
                    <ActivityIndicator color={COLORS.primary} />
                  ) : (
                    <Text style={styles.buttonText}>Enviar código</Text>
                  )}
                </TouchableOpacity>
              </>
            ) : (
              <>
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
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Nueva contraseña</Text>
                  <View style={styles.passwordContainer}>
                    <TextInput
                      style={styles.passwordInput}
                      placeholder="••••••••"
                      placeholderTextColor={COLORS.textSecondary}
                      value={newPassword}
                      onChangeText={setNewPassword}
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                      autoCorrect={false}
                      editable={!isLoading}
                    />
                    <TouchableOpacity
                      style={styles.eyeButton}
                      onPress={() => setShowPassword(!showPassword)}
                      disabled={isLoading}
                    >
                      <Text style={styles.eyeButtonText}>{showPassword ? '👁️' : '👁️‍🗨️'}</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Confirmar contraseña</Text>
                  <View style={styles.passwordContainer}>
                    <TextInput
                      style={styles.passwordInput}
                      placeholder="••••••••"
                      placeholderTextColor={COLORS.textSecondary}
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      secureTextEntry={!showConfirmPassword}
                      autoCapitalize="none"
                      autoCorrect={false}
                      editable={!isLoading}
                    />
                    <TouchableOpacity
                      style={styles.eyeButton}
                      onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                      disabled={isLoading}
                    >
                      <Text style={styles.eyeButtonText}>
                        {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <TouchableOpacity
                  style={[styles.button, isLoading && styles.buttonDisabled]}
                  onPress={handleResetPassword}
                  disabled={isLoading}
                  activeOpacity={0.8}
                >
                  {isLoading ? (
                    <ActivityIndicator color={COLORS.primary} />
                  ) : (
                    <Text style={styles.buttonText}>Restablecer contraseña</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.resendButton}
                  onPress={handleResendCode}
                  disabled={isLoading}
                >
                  <Text style={styles.resendButtonText}>Reenviar código</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: SPACING.lg,
    zIndex: 1,
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.xxl,
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: SPACING.md,
  },
  backButtonText: {
    fontSize: 16,
    color: COLORS.white,
    opacity: 0.9,
    fontFamily: FONTS.inter.regular,
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
    fontFamily: FONTS.inter.semiBold,
  },
  input: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    fontSize: 16,
    color: COLORS.text,
    fontFamily: FONTS.inter.regular,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
  },
  passwordInput: {
    flex: 1,
    paddingVertical: SPACING.md,
    fontSize: 16,
    color: COLORS.text,
    fontFamily: FONTS.inter.regular,
  },
  eyeButton: {
    padding: SPACING.xs,
  },
  eyeButtonText: {
    fontSize: 20,
  },
  button: {
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
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
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
});


