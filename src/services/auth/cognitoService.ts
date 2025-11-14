/**
 * Servicio de autenticación con AWS Cognito
 * Basado en: https://github.com/the-ob-hub/test-cognito-mobile/blob/main/App.tsx
 */
import {
  CognitoUserPool,
  CognitoUser,
  AuthenticationDetails,
  CognitoUserAttribute,
} from 'amazon-cognito-identity-js';
import { logger } from '../../utils/logger';

// Configuración del User Pool (debe coincidir con el código de referencia)
const poolData = {
  UserPoolId: 'us-east-1_v7P5nP83f',
  ClientId: '2c2812k3909sdau7j2874u09j7',
};

logger.log(`🔧 CognitoService - Inicializando User Pool`);
logger.log(`📋 CognitoService - UserPoolId: ${poolData.UserPoolId}`);
logger.log(`📋 CognitoService - ClientId: ${poolData.ClientId}`);

const userPool = new CognitoUserPool(poolData);
logger.log(`✅ CognitoService - User Pool inicializado`);

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignUpData {
  email: string;
  password: string;
  fullName?: string;
  phoneNumber: string; // Formato: +59812345678 (con código de país)
  birthDate: string; // Formato: YYYY-MM-DD
  address: string; // Dirección completa como string
}

export interface AuthResult {
  success: boolean;
  message?: string;
  user?: CognitoUser;
  username?: string; // Username usado en el registro (para confirmSignUp)
  tokens?: {
    idToken: string;
    accessToken: string;
    refreshToken: string;
  };
}

class CognitoAuthService {
  /**
   * Iniciar sesión con email y contraseña
   */
  async signIn(credentials: LoginCredentials): Promise<AuthResult> {
    return new Promise((resolve, reject) => {
      const { email, password } = credentials;

      logger.log(`🔐 CognitoService.signIn() - Iniciando autenticación`);
      logger.log(`📧 CognitoService.signIn() - Email: ${email}`);
      logger.log(`🔑 CognitoService.signIn() - Password length: ${password.length}`);

      const authenticationDetails = new AuthenticationDetails({
        Username: email,
        Password: password,
      });

      logger.log(`📦 CognitoService.signIn() - AuthenticationDetails creado`);

      const cognitoUser = new CognitoUser({
        Username: email,
        Pool: userPool,
      });

      logger.log(`👤 CognitoService.signIn() - CognitoUser creado para: ${email}`);
      logger.log(`🚀 CognitoService.signIn() - Llamando authenticateUser()`);

      cognitoUser.authenticateUser(authenticationDetails, {
        onSuccess: (result) => {
          logger.log(`✅ CognitoService.signIn() - onSuccess callback ejecutado`);
          logger.log(`🎫 CognitoService.signIn() - Obteniendo tokens...`);
          
          const idToken = result.getIdToken().getJwtToken();
          const accessToken = result.getAccessToken().getJwtToken();
          const refreshToken = result.getRefreshToken().getToken();
          
          logger.log(`🔑 CognitoService.signIn() - ID Token obtenido (length: ${idToken.length})`);
          logger.log(`🔑 CognitoService.signIn() - Access Token obtenido (length: ${accessToken.length})`);
          logger.log(`🔑 CognitoService.signIn() - Refresh Token obtenido (length: ${refreshToken.length})`);
          logger.log(`✅ CognitoService.signIn() - Login exitoso`);
          
          resolve({
            success: true,
            user: cognitoUser,
            tokens: {
              idToken,
              accessToken,
              refreshToken,
            },
          });
        },
        onFailure: (err) => {
          const errorMsg = err.message || 'Error desconocido';
          const errorCode = (err as any).code || 'N/A';
          logger.error(`❌ CognitoService.signIn() - onFailure callback ejecutado`);
          logger.error(`❌ CognitoService.signIn() - Error code: ${errorCode}`);
          logger.error(`❌ CognitoService.signIn() - Error message: ${errorMsg}`);
          logger.error(`❌ CognitoService.signIn() - Error completo: ${JSON.stringify(err)}`);
          
          resolve({
            success: false,
            message: errorMsg || 'Error al iniciar sesión',
          });
        },
        newPasswordRequired: (userAttributes, requiredAttributes) => {
          logger.log(`⚠️ CognitoService.signIn() - newPasswordRequired callback ejecutado`);
          logger.log(`⚠️ CognitoService.signIn() - Se requiere cambiar la contraseña`);
          logger.log(`📋 CognitoService.signIn() - User attributes: ${JSON.stringify(userAttributes)}`);
          logger.log(`📋 CognitoService.signIn() - Required attributes: ${JSON.stringify(requiredAttributes)}`);
          
          resolve({
            success: false,
            message: 'Se requiere cambiar la contraseña',
            user: cognitoUser,
          });
        },
      });
    });
  }

  /**
   * Generar un username único (no email) para Cognito cuando email alias está habilitado
   */
  private generateUsername(): string {
    // Generar un UUID simple basado en timestamp y random
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 9);
    return `user_${timestamp}_${random}`;
  }

  /**
   * Registrar nuevo usuario
   */
  async signUp(data: SignUpData): Promise<AuthResult> {
    return new Promise((resolve, reject) => {
      const { email, password, fullName } = data;

      // Generar username único (no email) porque el User Pool está configurado con email alias
      const username = this.generateUsername();

      logger.log(`📝 CognitoService.signUp() - Iniciando registro de usuario`);
      logger.log(`👤 CognitoService.signUp() - Username generado: ${username}`);
      logger.log(`📧 CognitoService.signUp() - Email: ${email}`);
      logger.log(`🔑 CognitoService.signUp() - Password length: ${password.length}`);
      logger.log(`👤 CognitoService.signUp() - FullName: ${fullName || 'N/A'}`);

      const attributeList: CognitoUserAttribute[] = [];
      
      if (fullName) {
        attributeList.push(
          new CognitoUserAttribute({
            Name: 'name',
            Value: fullName,
          })
        );
        logger.log(`📋 CognitoService.signUp() - Attribute 'name' agregado: ${fullName}`);
      }

      attributeList.push(
        new CognitoUserAttribute({
          Name: 'email',
          Value: email,
        })
      );
      logger.log(`📋 CognitoService.signUp() - Attribute 'email' agregado: ${email}`);

      // Atributos obligatorios según el schema de Cognito
      attributeList.push(
        new CognitoUserAttribute({
          Name: 'phone_number',
          Value: data.phoneNumber,
        })
      );
      logger.log(`📋 CognitoService.signUp() - Attribute 'phone_number' agregado: ${data.phoneNumber}`);

      attributeList.push(
        new CognitoUserAttribute({
          Name: 'birthdate',
          Value: data.birthDate,
        })
      );
      logger.log(`📋 CognitoService.signUp() - Attribute 'birthdate' agregado: ${data.birthDate}`);

      // Address debe ser un JSON string según el schema
      const addressJson = JSON.stringify([{ formatted: data.address }]);
      attributeList.push(
        new CognitoUserAttribute({
          Name: 'address',
          Value: addressJson,
        })
      );
      logger.log(`📋 CognitoService.signUp() - Attribute 'address' agregado: ${addressJson}`);

      logger.log(`📋 CognitoService.signUp() - Total attributes: ${attributeList.length}`);

      logger.log(`🚀 CognitoService.signUp() - Llamando userPool.signUp() con username: ${username}`);
      userPool.signUp(username, password, attributeList, [], (err, result) => {
        if (err) {
          const errorMsg = err.message || 'Error desconocido';
          const errorCode = (err as any).code || 'N/A';
          logger.error(`❌ CognitoService.signUp() - Error en registro`);
          logger.error(`❌ CognitoService.signUp() - Error code: ${errorCode}`);
          logger.error(`❌ CognitoService.signUp() - Error message: ${errorMsg}`);
          logger.error(`❌ CognitoService.signUp() - Error completo: ${JSON.stringify(err)}`);
          
          resolve({
            success: false,
            message: errorMsg || 'Error al registrar usuario',
          });
          return;
        }

        const registeredUsername = result?.user?.getUsername() || username;
        logger.log(`✅ CognitoService.signUp() - Usuario registrado exitosamente`);
        logger.log(`👤 CognitoService.signUp() - Username usado: ${username}`);
        logger.log(`👤 CognitoService.signUp() - Username del resultado: ${registeredUsername}`);
        resolve({
          success: true,
          message: 'Usuario registrado. Verifica tu email.',
          user: result?.user,
          username: registeredUsername, // Devolver el username para usarlo en confirmSignUp
        });
      });
    });
  }

  /**
   * Cerrar sesión
   */
  async signOut(): Promise<void> {
    return new Promise((resolve) => {
      logger.log(`🚪 CognitoService.signOut() - Iniciando cierre de sesión`);
      const cognitoUser = userPool.getCurrentUser();
      if (cognitoUser) {
        logger.log(`👤 CognitoService.signOut() - Usuario encontrado, cerrando sesión`);
        cognitoUser.signOut();
        logger.log(`✅ CognitoService.signOut() - Sesión cerrada exitosamente`);
      } else {
        logger.log(`⚠️ CognitoService.signOut() - No hay usuario activo para cerrar sesión`);
      }
      resolve();
    });
  }

  /**
   * Obtener usuario actual
   */
  getCurrentUser(): CognitoUser | null {
    return userPool.getCurrentUser();
  }

  /**
   * Obtener atributos del usuario actual desde Cognito
   */
  async getUserAttributes(): Promise<{ [key: string]: string } | null> {
    return new Promise((resolve) => {
      const cognitoUser = userPool.getCurrentUser();
      
      if (!cognitoUser) {
        logger.log(`⚠️ CognitoService.getUserAttributes() - No hay usuario actual`);
        resolve(null);
        return;
      }

      logger.log(`👤 CognitoService.getUserAttributes() - Obteniendo atributos del usuario`);
      cognitoUser.getUserAttributes((err, attributes) => {
        if (err) {
          logger.error(`❌ CognitoService.getUserAttributes() - Error: ${err.message}`);
          resolve(null);
          return;
        }

        if (!attributes) {
          logger.log(`⚠️ CognitoService.getUserAttributes() - No se encontraron atributos`);
          resolve(null);
          return;
        }

        // Convertir array de atributos a objeto
        const attributesObj: { [key: string]: string } = {};
        attributes.forEach((attr) => {
          attributesObj[attr.Name] = attr.Value;
        });

        logger.log(`✅ CognitoService.getUserAttributes() - Atributos obtenidos: ${Object.keys(attributesObj).join(', ')}`);
        resolve(attributesObj);
      });
    });
  }

  /**
   * Verificar si hay una sesión activa
   */
  async getCurrentSession(): Promise<AuthResult> {
    return new Promise((resolve) => {
      logger.log(`🔍 CognitoService.getCurrentSession() - Verificando sesión activa`);
      const cognitoUser = userPool.getCurrentUser();
      
      if (!cognitoUser) {
        logger.log(`⚠️ CognitoService.getCurrentSession() - No hay usuario actual`);
        resolve({
          success: false,
          message: 'No hay sesión activa',
        });
        return;
      }

      logger.log(`👤 CognitoService.getCurrentSession() - Usuario encontrado, obteniendo sesión`);
      cognitoUser.getSession((err: Error | null, session: any) => {
        if (err) {
          logger.error(`❌ CognitoService.getCurrentSession() - Error al obtener sesión: ${err.message}`);
          logger.error(`❌ CognitoService.getCurrentSession() - Error completo: ${JSON.stringify(err)}`);
          resolve({
            success: false,
            message: 'Sesión inválida o expirada',
          });
          return;
        }

        if (!session.isValid()) {
          logger.log(`⚠️ CognitoService.getCurrentSession() - Sesión inválida o expirada`);
          resolve({
            success: false,
            message: 'Sesión inválida o expirada',
          });
          return;
        }

        logger.log(`✅ CognitoService.getCurrentSession() - Sesión válida encontrada`);
        logger.log(`🎫 CognitoService.getCurrentSession() - Obteniendo tokens de la sesión`);
        
        const idToken = session.getIdToken().getJwtToken();
        const accessToken = session.getAccessToken().getJwtToken();
        const refreshToken = session.getRefreshToken().getToken();
        
        logger.log(`🔑 CognitoService.getCurrentSession() - ID Token obtenido (length: ${idToken.length})`);
        logger.log(`🔑 CognitoService.getCurrentSession() - Access Token obtenido (length: ${accessToken.length})`);
        logger.log(`🔑 CognitoService.getCurrentSession() - Refresh Token obtenido (length: ${refreshToken.length})`);
        
        resolve({
          success: true,
          user: cognitoUser,
          tokens: {
            idToken,
            accessToken,
            refreshToken,
          },
        });
      });
    });
  }

  /**
   * Confirmar código de verificación (para registro)
   * @param email - Email del usuario (para logging)
   * @param code - Código de verificación
   * @param username - Username real usado en el registro (opcional, si no se proporciona usa email)
   */
  async confirmSignUp(email: string, code: string, username?: string): Promise<AuthResult> {
    return new Promise((resolve) => {
      // Usar el username si está disponible, sino usar el email (para email alias)
      const usernameToUse = username || email;
      
      logger.log(`✅ CognitoService.confirmSignUp() - Iniciando confirmación de registro`);
      logger.log(`📧 CognitoService.confirmSignUp() - Email: ${email}`);
      logger.log(`👤 CognitoService.confirmSignUp() - Username proporcionado: ${username || 'N/A'}`);
      logger.log(`👤 CognitoService.confirmSignUp() - Username a usar: ${usernameToUse}`);
      logger.log(`🔢 CognitoService.confirmSignUp() - Code: ${code}`);
      logger.log(`🔢 CognitoService.confirmSignUp() - Code length: ${code.length}`);
      
      const cognitoUser = new CognitoUser({
        Username: usernameToUse,
        Pool: userPool,
      });

      logger.log(`👤 CognitoService.confirmSignUp() - CognitoUser creado con Username: ${usernameToUse}`);
      logger.log(`🚀 CognitoService.confirmSignUp() - Llamando confirmRegistration() con código: ${code}`);
      logger.log(`⏰ CognitoService.confirmSignUp() - Timestamp: ${new Date().toISOString()}`);
      
      cognitoUser.confirmRegistration(code, true, (err, result) => {
        if (err) {
          const errorMsg = err.message || 'Error desconocido';
          const errorCode = (err as any).code || 'N/A';
          logger.error(`❌ CognitoService.confirmSignUp() - Error al confirmar registro`);
          logger.error(`❌ CognitoService.confirmSignUp() - Error code: ${errorCode}`);
          logger.error(`❌ CognitoService.confirmSignUp() - Error message: ${errorMsg}`);
          logger.error(`❌ CognitoService.confirmSignUp() - Error completo: ${JSON.stringify(err)}`);
          logger.error(`📧 CognitoService.confirmSignUp() - Email usado: ${email}`);
          logger.error(`🔢 CognitoService.confirmSignUp() - Código usado: ${code}`);
          
          // Mensajes más específicos según el tipo de error
          let userMessage = errorMsg;
          if (errorCode === 'ExpiredCodeException') {
            userMessage = 'El código ha expirado. Por favor solicita uno nuevo.';
          } else if (errorCode === 'CodeMismatchException') {
            userMessage = 'Código incorrecto. Verifica que hayas ingresado el código correcto.';
          } else if (errorMsg.includes('Invalid code')) {
            userMessage = 'Código inválido. Verifica que hayas ingresado el código correcto o solicita uno nuevo.';
          }
          
          resolve({
            success: false,
            message: userMessage,
          });
          return;
        }

        logger.log(`✅ CognitoService.confirmSignUp() - Registro confirmado exitosamente`);
        logger.log(`📋 CognitoService.confirmSignUp() - Result: ${JSON.stringify(result)}`);
        resolve({
          success: true,
          message: 'Registro confirmado exitosamente',
        });
      });
    });
  }

  /**
   * Enviar código de verificación por email
   * @param email - Email del usuario (para logging)
   * @param username - Username real usado en el registro (opcional, si no se proporciona usa email)
   */
  async resendConfirmationCode(email: string, username?: string): Promise<AuthResult> {
    return new Promise((resolve) => {
      // Usar el username si está disponible, sino usar el email (para email alias)
      const usernameToUse = username || email;
      
      logger.log(`📨 CognitoService.resendConfirmationCode() - Reenviando código de verificación`);
      logger.log(`📧 CognitoService.resendConfirmationCode() - Email: ${email}`);
      logger.log(`👤 CognitoService.resendConfirmationCode() - Username proporcionado: ${username || 'N/A'}`);
      logger.log(`👤 CognitoService.resendConfirmationCode() - Username a usar: ${usernameToUse}`);
      logger.log(`⏰ CognitoService.resendConfirmationCode() - Timestamp: ${new Date().toISOString()}`);
      
      const cognitoUser = new CognitoUser({
        Username: usernameToUse,
        Pool: userPool,
      });

      logger.log(`👤 CognitoService.resendConfirmationCode() - CognitoUser creado con Username: ${usernameToUse}`);
      logger.log(`🚀 CognitoService.resendConfirmationCode() - Llamando resendConfirmationCode()`);
      
      cognitoUser.resendConfirmationCode((err, result) => {
        if (err) {
          const errorMsg = err.message || 'Error desconocido';
          const errorCode = (err as any).code || 'N/A';
          logger.error(`❌ CognitoService.resendConfirmationCode() - Error al reenviar código`);
          logger.error(`❌ CognitoService.resendConfirmationCode() - Error code: ${errorCode}`);
          logger.error(`❌ CognitoService.resendConfirmationCode() - Error message: ${errorMsg}`);
          logger.error(`❌ CognitoService.resendConfirmationCode() - Error completo: ${JSON.stringify(err)}`);
          logger.error(`📧 CognitoService.resendConfirmationCode() - Email usado: ${email}`);
          
          // Mensajes más específicos
          let userMessage = errorMsg;
          if (errorCode === 'LimitExceededException') {
            userMessage = 'Has solicitado demasiados códigos. Espera unos minutos antes de intentar nuevamente.';
          } else if (errorCode === 'UserNotFoundException') {
            userMessage = 'Usuario no encontrado. Verifica el email.';
          }
          
          resolve({
            success: false,
            message: userMessage,
          });
          return;
        }

        logger.log(`✅ CognitoService.resendConfirmationCode() - Código reenviado exitosamente`);
        logger.log(`📋 CognitoService.resendConfirmationCode() - Result: ${JSON.stringify(result)}`);
        resolve({
          success: true,
          message: 'Código de verificación reenviado',
        });
      });
    });
  }

  /**
   * Solicitar restablecimiento de contraseña (envía código OTP por email)
   */
  async forgotPassword(email: string): Promise<AuthResult> {
    return new Promise((resolve) => {
      logger.log(`🔐 CognitoService.forgotPassword() - Iniciando solicitud de restablecimiento`);
      logger.log(`📧 CognitoService.forgotPassword() - Email: ${email}`);
      
      const cognitoUser = new CognitoUser({
        Username: email,
        Pool: userPool,
      });

      logger.log(`👤 CognitoService.forgotPassword() - CognitoUser creado`);
      logger.log(`🚀 CognitoService.forgotPassword() - Llamando forgotPassword()`);
      
      cognitoUser.forgotPassword({
        onSuccess: (data) => {
          logger.log(`✅ CognitoService.forgotPassword() - Código enviado exitosamente`);
          logger.log(`📋 CognitoService.forgotPassword() - Data: ${JSON.stringify(data)}`);
          resolve({
            success: true,
            message: 'Código de verificación enviado a tu email',
          });
        },
        onFailure: (err) => {
          const errorMsg = err.message || 'Error desconocido';
          const errorCode = (err as any).code || 'N/A';
          logger.error(`❌ CognitoService.forgotPassword() - Error al solicitar restablecimiento`);
          logger.error(`❌ CognitoService.forgotPassword() - Error code: ${errorCode}`);
          logger.error(`❌ CognitoService.forgotPassword() - Error message: ${errorMsg}`);
          logger.error(`❌ CognitoService.forgotPassword() - Error completo: ${JSON.stringify(err)}`);
          
          // Si el usuario no existe, Cognito devuelve un error específico
          if (errorCode === 'UserNotFoundException' || errorMsg.includes('not found')) {
            resolve({
              success: false,
              message: 'No existe una cuenta con este email',
            });
          } else {
            resolve({
              success: false,
              message: errorMsg || 'Error al solicitar restablecimiento de contraseña',
            });
          }
        },
      });
    });
  }

  /**
   * Verificar si un usuario existe en Cognito (usando forgotPassword)
   * Nota: Esto enviará un código al email si el usuario existe
   */
  async checkUserExists(email: string): Promise<{ exists: boolean; message: string }> {
    return new Promise((resolve) => {
      logger.log(`🔍 CognitoService.checkUserExists() - Verificando usuario`);
      logger.log(`📧 CognitoService.checkUserExists() - Email: ${email}`);
      
      const cognitoUser = new CognitoUser({
        Username: email,
        Pool: userPool,
      });

      cognitoUser.forgotPassword({
        onSuccess: () => {
          logger.log(`✅ CognitoService.checkUserExists() - Usuario EXISTE`);
          resolve({
            exists: true,
            message: 'Usuario existe en Cognito',
          });
        },
        onFailure: (err) => {
          const errorCode = (err as any).code || 'N/A';
          const errorMsg = err.message || 'Error desconocido';
          logger.log(`❌ CognitoService.checkUserExists() - Error code: ${errorCode}`);
          logger.log(`❌ CognitoService.checkUserExists() - Error message: ${errorMsg}`);
          
          if (errorCode === 'UserNotFoundException' || errorMsg.includes('not found')) {
            logger.log(`❌ CognitoService.checkUserExists() - Usuario NO EXISTE`);
            resolve({
              exists: false,
              message: 'Usuario no encontrado en Cognito',
            });
          } else {
            logger.log(`⚠️ CognitoService.checkUserExists() - Error desconocido`);
            resolve({
              exists: false,
              message: `Error al verificar: ${errorMsg}`,
            });
          }
        },
      });
    });
  }

  /**
   * Confirmar restablecimiento de contraseña con código OTP
   */
  async confirmPassword(email: string, code: string, newPassword: string): Promise<AuthResult> {
    return new Promise((resolve) => {
      logger.log(`🔐 CognitoService.confirmPassword() - Confirmando restablecimiento`);
      logger.log(`📧 CognitoService.confirmPassword() - Email: ${email}`);
      logger.log(`🔢 CognitoService.confirmPassword() - Code length: ${code.length}`);
      logger.log(`🔑 CognitoService.confirmPassword() - New password length: ${newPassword.length}`);
      
      const cognitoUser = new CognitoUser({
        Username: email,
        Pool: userPool,
      });

      logger.log(`👤 CognitoService.confirmPassword() - CognitoUser creado`);
      logger.log(`🚀 CognitoService.confirmPassword() - Llamando confirmPassword()`);
      
      cognitoUser.confirmPassword(code, newPassword, {
        onSuccess: () => {
          logger.log(`✅ CognitoService.confirmPassword() - Contraseña restablecida exitosamente`);
          resolve({
            success: true,
            message: 'Contraseña restablecida exitosamente',
          });
        },
        onFailure: (err) => {
          const errorMsg = err.message || 'Error desconocido';
          const errorCode = (err as any).code || 'N/A';
          logger.error(`❌ CognitoService.confirmPassword() - Error al confirmar restablecimiento`);
          logger.error(`❌ CognitoService.confirmPassword() - Error code: ${errorCode}`);
          logger.error(`❌ CognitoService.confirmPassword() - Error message: ${errorMsg}`);
          logger.error(`❌ CognitoService.confirmPassword() - Error completo: ${JSON.stringify(err)}`);
          
          // Errores comunes
          if (errorCode === 'CodeMismatchException' || errorMsg.includes('Invalid verification code')) {
            resolve({
              success: false,
              message: 'Código de verificación inválido',
            });
          } else if (errorCode === 'ExpiredCodeException' || errorMsg.includes('expired')) {
            resolve({
              success: false,
              message: 'El código de verificación ha expirado',
            });
          } else if (errorMsg.includes('Password')) {
            resolve({
              success: false,
              message: 'La contraseña no cumple con los requisitos',
            });
          } else {
            resolve({
              success: false,
              message: errorMsg || 'Error al restablecer contraseña',
            });
          }
        },
      });
    });
  }
}

export const cognitoService = new CognitoAuthService();

