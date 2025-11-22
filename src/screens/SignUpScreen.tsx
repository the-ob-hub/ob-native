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
import Svg, { Rect, Defs, LinearGradient, Stop, Path } from 'react-native-svg';
import { COLORS, SPACING, BORDER_RADIUS, FONTS } from '../constants';
import { cognitoService, SignUpData } from '../services/auth/cognitoService';
import { LoginBackground } from '../components/LoginBackground';
import { LogViewer } from '../components/LogViewer';
import { useLogs } from '../contexts/LogContext';
import { DatePickerLATAM, formatDateForService } from '../components/DatePickerLATAM';
import { PasswordValidator } from '../components/PasswordValidator';

const LogoRegistro = () => (
  <View style={styles.logoWrapper}>
    <Svg width={200} height={200} viewBox="0 0 1024 1024" fill="none">
      <Defs>
        <LinearGradient id="paint0_linear_104_56" x1="-47.7867" y1="-9.22114e-06" x2="952.32" y2="1068.37" gradientUnits="userSpaceOnUse">
          <Stop stopColor="#045CFF" />
          <Stop offset="1" stopColor="#002B6C" />
        </LinearGradient>
      </Defs>
      <Rect width="1024" height="1024" rx="222" fill="url(#paint0_linear_104_56)" />
      <Path d="M266 841V654H341.046C354.835 654 366.336 656.039 375.549 660.118C384.762 664.196 391.687 669.857 396.324 677.101C400.961 684.284 403.279 692.563 403.279 701.937C403.279 709.242 401.815 715.664 398.886 721.203C395.958 726.682 391.931 731.186 386.806 734.717C381.742 738.187 375.946 740.652 369.417 742.113V743.939C376.556 744.243 383.237 746.252 389.46 749.965C395.744 753.679 400.839 758.883 404.744 765.579C408.648 772.214 410.601 780.128 410.601 789.319C410.601 799.242 408.13 808.098 403.188 815.89C398.307 823.621 391.077 829.739 381.498 834.243C371.919 838.748 360.113 841 346.08 841H266ZM305.628 808.677H337.934C348.978 808.677 357.031 806.577 362.096 802.376C367.16 798.115 369.692 792.454 369.692 785.393C369.692 780.219 368.441 775.653 365.939 771.697C363.438 767.74 359.869 764.636 355.232 762.383C350.656 760.131 345.195 759.005 338.85 759.005H305.628V808.677ZM305.628 732.251H335.006C340.436 732.251 345.256 731.308 349.466 729.421C353.737 727.473 357.092 724.734 359.533 721.203C362.035 717.673 363.285 713.442 363.285 708.511C363.285 701.754 360.875 696.306 356.055 692.167C351.296 688.028 344.524 685.958 335.738 685.958H305.628V732.251Z" fill="white" />
      <Path d="M580.274 654V841H546.045L464.501 723.303H463.129V841H423.501V654H458.278L539.181 771.605H540.829V654H580.274Z" fill="white" />
      <Path d="M600.129 841V654H639.757V736.452H642.228L709.678 654H757.176L687.621 737.73L758 841H710.593L659.25 764.118L639.757 787.858V841H600.129Z" fill="white" />
      <Rect x="266" y="182" width="236" height="416" rx="91" fill="white" />
      <Rect x="522" y="276" width="236" height="322" rx="91" fill="white" />
    </Svg>
    
    {/* Textos debajo del logo */}
    <Text style={styles.welcomeText}>bienvenido a OoBnk</Text>
    <Text style={styles.subtitleText}>Crear una cuenta sin costos ni comisiones!</Text>
  </View>
);

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
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [birthDate, setBirthDate] = useState<Date | null>(null);
  const [address, setAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLogViewerVisible, setIsLogViewerVisible] = useState(false);
  const { addLog } = useLogs();

  const validateForm = (): { isValid: boolean; message?: string } => {
    if (!firstName.trim()) {
      return { isValid: false, message: 'El nombre es obligatorio' };
    }

    if (!lastName.trim()) {
      return { isValid: false, message: 'El apellido es obligatorio' };
    }

    if (!email.trim()) {
      return { isValid: false, message: 'El email es obligatorio' };
    }

    // Validación básica de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return { isValid: false, message: 'Por favor ingresa un email válido' };
    }

    if (!birthDate) {
      return { isValid: false, message: 'La fecha de nacimiento es obligatoria' };
    }

    if (!phoneNumber.trim()) {
      return { isValid: false, message: 'El teléfono es obligatorio' };
    }

    // Validar formato de teléfono (debe empezar con + y código de país)
    if (!/^\+[1-9]\d{1,14}$/.test(phoneNumber.trim())) {
      return { isValid: false, message: 'El teléfono debe tener formato internacional (ej: +59812345678)' };
    }

    if (!address.trim()) {
      return { isValid: false, message: 'La dirección es obligatoria' };
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
      // Concatenar nombre y apellido para fullName
      const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
      
      // Convertir fecha al formato YYYY-MM-DD para el servicio
      const birthDateFormatted = birthDate ? formatDateForService(birthDate) : '';

      const signUpData: SignUpData = {
        email: email.trim(),
        password: password,
        fullName: fullName,
        phoneNumber: phoneNumber.trim(),
        birthDate: birthDateFormatted,
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
          fullName: fullName,
          phoneNumber: phoneNumber.trim(),
          birthDate: birthDateFormatted,
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
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <LoginBackground />
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={true}
        bounces={true}
        scrollEnabled={true}
        nestedScrollEnabled={true}
      >
          <View style={styles.content}>
            {/* Logo con textos */}
            <LogoRegistro />

            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Crear cuenta</Text>
              <Text style={styles.subtitle}>
                Completa los siguientes campos para crear tu cuenta
              </Text>
            </View>

            {/* Form */}
            <View style={styles.form}>
              {/* 1. Nombre/s */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>
                  Nombre/s <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder="Juan"
                  placeholderTextColor={COLORS.textSecondary}
                  value={firstName}
                  onChangeText={setFirstName}
                  autoCapitalize="words"
                  autoCorrect={false}
                  editable={!isLoading}
                />
              </View>

              {/* 2. Apellido/s */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>
                  Apellido/s <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder="Pérez"
                  placeholderTextColor={COLORS.textSecondary}
                  value={lastName}
                  onChangeText={setLastName}
                  autoCapitalize="words"
                  autoCorrect={false}
                  editable={!isLoading}
                />
              </View>

              {/* 3. Fecha de Nacimiento */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>
                  Fecha de Nacimiento <Text style={styles.required}>*</Text>
                </Text>
                <DatePickerLATAM
                  value={birthDate}
                  onChange={setBirthDate}
                  placeholder="DD/MM/AAAA"
                  disabled={isLoading}
                />
              </View>

              {/* 4. Teléfono */}
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

              {/* 5. Dirección */}
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

              {/* 6. Email */}
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

              {/* 7. Contraseña */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>
                  Contraseña <Text style={styles.required}>*</Text>
                </Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={styles.passwordInput}
                    placeholder="Ingresa tu contraseña"
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

              {/* 8. Repetir contraseña */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>
                  Repetir contraseña <Text style={styles.required}>*</Text>
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

              {/* Validador de contraseña - debajo de repetir contraseña */}
              {password && <PasswordValidator password={password} />}

              {/* Texto legal antes del botón */}
              <Text style={styles.legalText}>
                Al crear la cuenta aceptas nuestros términos y condiciones de uso y política de privacidad.
              </Text>

              {/* Botón crear cuenta */}
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

              {/* Footer con link a login */}
              <View style={styles.footer}>
                <TouchableOpacity
                  onPress={onBack}
                  disabled={isLoading}
                  style={styles.loginLink}
                >
                  <Text style={styles.loginLinkText}>¿Ya tienes cuenta? - Iniciar sesión</Text>
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
        <Text style={styles.versionBadgeText}>v1.87</Text>
      </TouchableOpacity>

      {/* LogViewer */}
      <LogViewer
        visible={isLogViewerVisible}
        onClose={() => setIsLogViewerVisible(false)}
      />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: SPACING.xl * 2,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.xl,
    zIndex: 1,
  },
  logoWrapper: {
    width: 200,
    alignSelf: 'center',
    marginTop: SPACING.lg * 2, // Doble del margen actual
    marginBottom: SPACING.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  welcomeText: {
    fontSize: 18,
    fontFamily: FONTS.inter.bold,
    color: COLORS.white,
    marginTop: SPACING.md,
    textAlign: 'center',
  },
  subtitleText: {
    fontSize: 14,
    fontFamily: FONTS.inter.regular,
    color: COLORS.white,
    opacity: 0.9,
    marginTop: SPACING.xs,
    textAlign: 'center',
  },
  header: {
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
  legalText: {
    fontSize: 11,
    color: COLORS.white,
    opacity: 0.7,
    textAlign: 'center',
    fontFamily: FONTS.inter.regular,
    marginTop: SPACING.md,
    marginBottom: SPACING.md,
    paddingHorizontal: SPACING.sm,
  },
  signUpButton: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.sm,
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
  footer: {
    marginTop: SPACING.lg,
    alignItems: 'center',
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
