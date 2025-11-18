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
import { COLORS, SPACING, BORDER_RADIUS, FONTS } from '../constants';
import { cognitoService, SignUpData } from '../services/auth/cognitoService';
import { LoginBackground } from '../components/LoginBackground';
import { LogViewer } from '../components/LogViewer';
import { useLogs } from '../contexts/LogContext';

interface SignUpScreenProps {
  onBack: () => void;
  onSignUpSuccess: (email: string, username: string, signUpData?: SignUpData) => void;
  onShowConfirm: (email: string, username: string) => void;
}

export const SignUpScreen: React.FC<SignUpScreenProps> = ({
  onBack,
  onSignUpSuccess,
  onShowConfirm,
}) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [address, setAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLogViewerVisible, setIsLogViewerVisible] = useState(false);
  const { addLog } = useLogs();

  const validateForm = (): { isValid: boolean; message?: string } => {
    if (!fullName.trim()) {
      return { isValid: false, message: 'El nombre completo es obligatorio' };
    }

    if (!email.trim()) {
      return { isValid: false, message: 'El email es obligatorio' };
    }

    // Validación básica de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return { isValid: false, message: 'Por favor ingresa un email válido' };
    }

    if (!password.trim()) {
      return { isValid: false, message: 'La contraseña es obligatoria' };
    }

    if (password.length < 8) {
      return { isValid: false, message: 'La contraseña debe tener al menos 8 caracteres' };
    }

    // Validar política de Cognito: debe tener mayúsculas
    if (!/[A-Z]/.test(password)) {
      return { isValid: false, message: 'La contraseña debe contener al menos una letra mayúscula' };
    }

    // Validar minúsculas
    if (!/[a-z]/.test(password)) {
      return { isValid: false, message: 'La contraseña debe contener al menos una letra minúscula' };
    }

    // Validar números
    if (!/[0-9]/.test(password)) {
      return { isValid: false, message: 'La contraseña debe contener al menos un número' };
    }

    // Validar caracteres especiales
    if (!/[^A-Za-z0-9]/.test(password)) {
      return { isValid: false, message: 'La contraseña debe contener al menos un carácter especial' };
    }

    if (password !== confirmPassword) {
      return { isValid: false, message: 'Las contraseñas no coinciden' };
    }

    if (!phoneNumber.trim()) {
      return { isValid: false, message: 'El teléfono es obligatorio' };
    }

    // Validar formato de teléfono (debe empezar con + y código de país)
    if (!/^\+[1-9]\d{1,14}$/.test(phoneNumber.trim())) {
      return { isValid: false, message: 'El teléfono debe tener formato internacional (ej: +59812345678)' };
    }

    if (!birthDate.trim()) {
      return { isValid: false, message: 'La fecha de nacimiento es obligatoria' };
    }

    // Validar formato de fecha YYYY-MM-DD
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(birthDate.trim())) {
      return { isValid: false, message: 'La fecha debe tener formato YYYY-MM-DD (ej: 1990-01-15)' };
    }

    if (!address.trim()) {
      return { isValid: false, message: 'La dirección es obligatoria' };
    }

    return { isValid: true };
  };

  const handleSignUp = async () => {
    const validation = validateForm();
    if (!validation.isValid) {
      addLog(`⚠️ SignUpScreen - Validación fallida: ${validation.message}`);
      Alert.alert('Error', validation.message || 'Por favor completa todos los campos');
      return;
    }

    setIsLoading(true);
    addLog(`📝 SignUpScreen - Iniciando registro para: ${email.trim()}`);

    try {
      const signUpData: SignUpData = {
        email: email.trim(),
        password: password,
        fullName: fullName.trim(),
        phoneNumber: phoneNumber.trim(),
        birthDate: birthDate.trim(),
        address: address.trim(),
      };

      addLog(`📤 SignUpScreen - Llamando cognitoService.signUp()`);
      const result = await cognitoService.signUp(signUpData);

      if (result.success) {
        const username = result.username || email.trim();
        addLog('✅ SignUpScreen - Registro exitoso');
        addLog(`📧 SignUpScreen - Email de verificación enviado a: ${email.trim()}`);
        addLog(`👤 SignUpScreen - Username guardado: ${username}`);
        
        // Pasar los datos del registro para guardarlos en la base de datos
        const signUpDataForStorage: SignUpData = {
          email: email.trim(),
          password: password, // No se guarda, solo para referencia
          fullName: fullName.trim(),
          phoneNumber: phoneNumber.trim(),
          birthDate: birthDate.trim(),
          address: address.trim(),
        };
        
        // Guardar datos primero
        addLog('💾 SignUpScreen - Guardando datos del registro');
        onSignUpSuccess(email.trim(), username, signUpDataForStorage);
        
        // Navegar a pantalla de confirmación de PIN
        addLog('📱 SignUpScreen - Navegando a pantalla de confirmación de PIN');
        onShowConfirm(email.trim(), username);
      } else {
        addLog(`❌ SignUpScreen - Error en registro: ${result.message || 'Error desconocido'}`);
        Alert.alert('Error', result.message || 'Error al registrar usuario');
      }
    } catch (error: any) {
      const errorMsg = `❌ SignUpScreen - Error: ${error.message || String(error)}`;
      addLog(errorMsg);
      Alert.alert('Error', error.message || 'Error al registrar usuario');
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
        
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
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
              <Text style={styles.title}>Crear cuenta</Text>
              <Text style={styles.subtitle}>
                Completa los siguientes campos para crear tu cuenta
              </Text>
            </View>

            {/* Form */}
            <View style={styles.form}>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>
                  Nombre completo <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder="Juan Pérez"
                  placeholderTextColor={COLORS.textSecondary}
                  value={fullName}
                  onChangeText={setFullName}
                  autoCapitalize="words"
                  autoCorrect={false}
                  editable={!isLoading}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>
                  Email <Text style={styles.required}>*</Text>
                </Text>
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

              <View style={styles.inputContainer}>
                <Text style={styles.label}>
                  Contraseña <Text style={styles.required}>*</Text>
                </Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={styles.passwordInput}
                    placeholder="Mín. 8 caracteres, mayúscula, número y especial"
                    placeholderTextColor={COLORS.textSecondary}
                    value={password}
                    onChangeText={setPassword}
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
                <Text style={styles.label}>
                  Confirmar contraseña <Text style={styles.required}>*</Text>
                </Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={styles.passwordInput}
                    placeholder="Repite tu contraseña"
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

              <View style={styles.inputContainer}>
                <Text style={styles.label}>
                  Teléfono <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder="+59812345678"
                  placeholderTextColor={COLORS.textSecondary}
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  keyboardType="phone-pad"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isLoading}
                />
                <Text style={styles.helperText}>Formato internacional con código de país</Text>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>
                  Fecha de nacimiento <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder="1990-01-15"
                  placeholderTextColor={COLORS.textSecondary}
                  value={birthDate}
                  onChangeText={setBirthDate}
                  keyboardType="default"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isLoading}
                />
                <Text style={styles.helperText}>Formato: YYYY-MM-DD</Text>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>
                  Dirección <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  style={[styles.input, styles.addressInput]}
                  placeholder="Calle, número, ciudad"
                  placeholderTextColor={COLORS.textSecondary}
                  value={address}
                  onChangeText={setAddress}
                  autoCapitalize="words"
                  autoCorrect={false}
                  editable={!isLoading}
                  multiline
                  numberOfLines={2}
                />
              </View>

              <View style={styles.passwordRequirements}>
                <Text style={styles.passwordRequirementsTitle}>La contraseña debe contener:</Text>
                <Text style={styles.passwordRequirement}>• Al menos 8 caracteres</Text>
                <Text style={styles.passwordRequirement}>• Una letra mayúscula</Text>
                <Text style={styles.passwordRequirement}>• Una letra minúscula</Text>
                <Text style={styles.passwordRequirement}>• Un número</Text>
                <Text style={styles.passwordRequirement}>• Un carácter especial</Text>
              </View>

              <TouchableOpacity
                style={[styles.signUpButton, isLoading && styles.signUpButtonDisabled]}
                onPress={handleSignUp}
                disabled={isLoading}
                activeOpacity={0.8}
              >
                {isLoading ? (
                  <ActivityIndicator color={COLORS.primary} />
                ) : (
                  <Text style={styles.signUpButtonText}>Crear cuenta</Text>
                )}
              </TouchableOpacity>

              <View style={styles.footer}>
                <Text style={styles.footerText}>
                  Al crear una cuenta, aceptas nuestros términos y condiciones
                </Text>
                <TouchableOpacity
                  onPress={onBack}
                  disabled={isLoading}
                  style={styles.loginLink}
                >
                  <Text style={styles.loginLinkText}>¿Ya tienes cuenta? Iniciar sesión</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Badge de versión flotante */}
        <TouchableOpacity
          style={styles.versionBadge}
          onPress={() => setIsLogViewerVisible(true)}
          activeOpacity={0.7}
        >
          <Text style={styles.versionBadgeText}>v1.78</Text>
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
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.xl,
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
  required: {
    color: COLORS.error,
  },
  helperText: {
    fontSize: 12,
    color: COLORS.white,
    opacity: 0.7,
    marginTop: SPACING.xs / 2,
    fontFamily: FONTS.inter.regular,
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
  addressInput: {
    minHeight: 60,
    textAlignVertical: 'top',
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
  signUpButton: {
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
  signUpButtonDisabled: {
    opacity: 0.6,
  },
  signUpButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
    fontFamily: FONTS.inter.bold,
  },
  passwordRequirements: {
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
    padding: SPACING.md,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: BORDER_RADIUS.sm,
  },
  passwordRequirementsTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.white,
    marginBottom: SPACING.xs,
    fontFamily: FONTS.inter.semiBold,
  },
  passwordRequirement: {
    fontSize: 11,
    color: COLORS.white,
    opacity: 0.8,
    marginTop: SPACING.xs / 2,
    fontFamily: FONTS.inter.regular,
  },
  footer: {
    marginTop: SPACING.lg,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: COLORS.white,
    opacity: 0.7,
    textAlign: 'center',
    fontFamily: FONTS.inter.regular,
    marginBottom: SPACING.md,
  },
  loginLink: {
    marginTop: SPACING.sm,
  },
  loginLinkText: {
    fontSize: 14,
    color: COLORS.white,
    opacity: 0.9,
    textDecorationLine: 'underline',
    fontFamily: FONTS.inter.regular,
    fontWeight: '600',
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

