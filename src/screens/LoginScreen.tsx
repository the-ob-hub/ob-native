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
import { cognitoService, LoginCredentials } from '../services/auth/cognitoService';
import { LoginBackground } from '../components/LoginBackground';
import { LogViewer } from '../components/LogViewer';
import { useLogs } from '../contexts/LogContext';
import { ForgotPasswordScreen } from './ForgotPasswordScreen';

interface LoginScreenProps {
  onLoginSuccess: () => void;
  onShowSignUp?: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess, onShowSignUp }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLogViewerVisible, setIsLogViewerVisible] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const { addLog } = useLogs();

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      addLog('⚠️ LoginScreen - Validación: Campos incompletos');
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }

    setIsLoading(true);
    addLog(`🔐 LoginScreen - Iniciando login para: ${email.trim()}`);

    try {
      const credentials: LoginCredentials = {
        email: email.trim(),
        password: password,
      };

      addLog(`📤 LoginScreen - Llamando cognitoService.signIn()`);
      const result = await cognitoService.signIn(credentials);

      if (result.success) {
        addLog('✅ LoginScreen - Login exitoso');
        addLog(`🎫 LoginScreen - Tokens recibidos: ${result.tokens ? 'Sí' : 'No'}`);
        if (result.tokens) {
          addLog(`🔑 LoginScreen - ID Token length: ${result.tokens.idToken.length}`);
          addLog(`🔑 LoginScreen - Access Token length: ${result.tokens.accessToken.length}`);
          addLog(`🔑 LoginScreen - Refresh Token length: ${result.tokens.refreshToken.length}`);
        }
        onLoginSuccess();
      } else {
        addLog(`❌ LoginScreen - Login fallido: ${result.message || 'Error desconocido'}`);
        Alert.alert('Error', result.message || 'Error al iniciar sesión');
      }
    } catch (error: any) {
      const errorMsg = `❌ LoginScreen - Error en login: ${error.message || String(error)}`;
      addLog(errorMsg);
      console.error('❌ Error en login:', error);
      Alert.alert('Error', error.message || 'Error al iniciar sesión');
    } finally {
      setIsLoading(false);
      addLog('🏁 LoginScreen - Proceso de login finalizado');
    }
  };

  if (showForgotPassword) {
    return (
      <ForgotPasswordScreen
        onBack={() => setShowForgotPassword(false)}
        onSuccess={() => {
          setShowForgotPassword(false);
          // Opcional: mostrar mensaje de éxito o limpiar campos
        }}
      />
    );
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Background SVG */}
        <LoginBackground />
        
        <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>OoBk</Text>
          <Text style={styles.tagline}>Existe una nueva generación de servicios Bancarios y Financieros ;)</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
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

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Contraseña</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="••••••••"
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

          <TouchableOpacity
            style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
            onPress={handleLogin}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.loginButtonText}>Iniciar sesión</Text>
            )}
          </TouchableOpacity>

          {/* Links adicionales */}
          <View style={styles.linksContainer}>
            <TouchableOpacity
              onPress={() => setShowForgotPassword(true)}
              disabled={isLoading}
            >
              <Text style={styles.linkText}>¿Olvidaste tu contraseña?</Text>
            </TouchableOpacity>
            {onShowSignUp && (
              <TouchableOpacity
                onPress={onShowSignUp}
                disabled={isLoading}
                style={styles.signUpLink}
              >
                <Text style={styles.signUpLinkText}>¿No tienes cuenta? Crear una</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      {/* Badge de versión flotante */}
      <TouchableOpacity
        style={styles.versionBadge}
        onPress={() => setIsLogViewerVisible(true)}
        activeOpacity={0.7}
      >
          <Text style={styles.versionBadgeText}>v1.79</Text>
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
    backgroundColor: '#000000', // Fondo negro base
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: SPACING.lg,
    zIndex: 1, // Asegurar que el contenido esté sobre el fondo
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.xxl,
  },
  logo: {
    fontSize: 48,
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: SPACING.sm,
    fontFamily: FONTS.inter.extraBold,
  },
  tagline: {
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
  loginButton: {
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
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
    fontFamily: FONTS.inter.bold,
  },
  linksContainer: {
    marginTop: SPACING.lg,
    alignItems: 'center',
    gap: SPACING.md,
  },
  linkText: {
    fontSize: 14,
    color: COLORS.white,
    opacity: 0.9,
    textDecorationLine: 'underline',
    fontFamily: FONTS.inter.regular,
  },
  signUpLink: {
    marginTop: SPACING.sm,
  },
  signUpLinkText: {
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

