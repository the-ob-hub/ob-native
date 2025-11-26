/**
 * Servicio para endpoints de Users
 * Transforma la respuesta del backend al formato esperado por la app
 */
import { apiClient } from './base';
import { BackendUser, BackendUserResponse, CreateUserInput, CreateUserResponse } from './types';
import { User } from '../../models';
import { logger } from '../../utils/logger';

export interface UserDetail {
  id: string;
  email?: string;
  fullName?: string;
  phone?: string;
  documentType?: string;
  documentNumber?: string;
  birthDate?: string;
  nationality?: string;
  address?: string;
  countryOfResidence?: string;
  countryOfFundsOrigin?: string;
  isPEP?: boolean;
  onboardingStatus?: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Convierte un usuario del backend al formato de la app
 */
function transformBackendUser(backendUser: BackendUser): User {
  // Construir dirección como string (formato esperado por la app)
  const addressParts: string[] = [];
  if (backendUser.address_street) addressParts.push(backendUser.address_street);
  if (backendUser.address_city) addressParts.push(backendUser.address_city);
  if (backendUser.address_state) addressParts.push(backendUser.address_state);
  if (backendUser.address_postal_code) addressParts.push(backendUser.address_postal_code);
  if (backendUser.address_country) addressParts.push(backendUser.address_country);
  
  const address = addressParts.length > 0 
    ? addressParts.join(', ') 
    : backendUser.address_country || '';

  // Formatear fecha de nacimiento (backend devuelve ISO string)
  const birthDate = backendUser.birth_date ? backendUser.birth_date.split('T')[0] : '';

  // Mapear status del backend a onboardingStatus de la app
  let onboardingStatus: User['onboardingStatus'] = 'completed';
  if (backendUser.status === 'pending_review' || backendUser.identity_pending_manual_review) {
    onboardingStatus = 'pending_validation';
  } else if (backendUser.status === 'active' || backendUser.status === 'approved') {
    onboardingStatus = 'completed';
  } else if (backendUser.status === 'rejected' || backendUser.status === 'failed') {
    onboardingStatus = 'failed';
  }

  return {
    id: backendUser.id,
    email: backendUser.email,
    fullName: backendUser.full_name,
    phone: backendUser.phone,
    documentType: backendUser.document_type,
    documentNumber: backendUser.document_number,
    birthDate: birthDate,
    nationality: backendUser.nationality,
    address: address,
    countryOfResidence: backendUser.country_of_residence,
    countryOfFundsOrigin: backendUser.country_of_funds_origin,
    isPEP: backendUser.is_pep,
    onboardingStatus: onboardingStatus,
    createdAt: backendUser.created_at,
    updatedAt: backendUser.updated_at,
  };
}

export const userService = {
  /**
   * Busca un usuario por email en el backend
   * Usa el endpoint /api/v1/users/pending-review y filtra por email
   * 
   * @param email Email del usuario a buscar
   * @returns Usuario encontrado o null si no existe
   */
  async getUserByEmail(email: string, signal?: AbortSignal): Promise<User | null> {
    try {
      logger.log(`🔍 UserService - Buscando usuario por email: ${email}`);
      
      // Obtener usuarios pendientes y buscar por email
      const backendResponse = await apiClient.get<{ success: boolean; data: BackendUser[]; count: number }>(
        '/api/v1/users/pending-review',
        undefined,
        signal
      );
      
      if (backendResponse.success && backendResponse.data) {
        const user = backendResponse.data.find((u) => u.email === email);
        if (user) {
      logger.log(`✅ UserService - Usuario encontrado por email: ${user.full_name}`);
      logger.log(`🔗 UserService - KSUID: ${user.id}`);
          return transformBackendUser(user);
        }
      }
      
      logger.log(`⚠️ UserService - Usuario no encontrado por email: ${email}`);
      return null;
    } catch (error: any) {
      logger.error(`❌ UserService - Error al buscar usuario por email: ${error.message}`);
      return null;
    }
  },

  /**
   * Obtiene un usuario por ID desde el backend
   * GET /api/v1/users/:userId
   * 
   * Transforma la respuesta del backend al formato esperado por la app
   * El userId ahora es un KSUID con prefijo (ej: usr-35zOFEAAauXtfzUkDIxWx34tpLh)
   */
  async getUserById(userId: string, signal?: AbortSignal): Promise<User> {
    try {
      logger.log(`👥 UserService - Obteniendo usuario del backend: ${userId}`);
      
      // Llamar al backend
      const backendResponse = await apiClient.get<BackendUserResponse>(
        `/api/v1/users/${userId}`,
        undefined,
        signal
      );
      
      logger.log(`✅ UserService - Respuesta del backend recibida`);
      logger.log(`📊 UserService - Success: ${backendResponse.success}`);
      
      // Validar respuesta
      if (!backendResponse.success) {
        throw new Error(backendResponse.error || 'Error al obtener usuario');
      }
      
      if (!backendResponse.data) {
        throw new Error('Usuario no encontrado en el backend');
      }
      
      logger.log(`👤 UserService - Usuario encontrado: ${backendResponse.data.full_name}`);
      logger.log(`📧 UserService - Email: ${backendResponse.data.email}`);
      
      // Transformar al formato de la app
      const transformedUser = transformBackendUser(backendResponse.data);
      
      logger.log(`✅ UserService - Usuario transformado correctamente`);
      logger.log(`📋 UserService - OnboardingStatus: ${transformedUser.onboardingStatus}`);
      
      return transformedUser;
    } catch (error: any) {
      logger.error(`❌ UserService - Error al obtener usuario: ${error.message}`);
      logger.error(`❌ UserService - Error stack: ${error.stack || 'N/A'}`);
      throw error;
    }
  },

  /**
   * Crea un usuario en el backend
   * POST /api/v1/users
   * 
   * Se usa cuando el usuario existe en Cognito pero no en el backend
   * (por ejemplo, si el Lambda PostConfirmation falló)
   */
  async createUser(userId: string, cognitoAttributes: Record<string, string>): Promise<User> {
    try {
      logger.log(`👥 UserService - Creando usuario en el backend: ${userId}`);
      logger.log(`📧 UserService - Email: ${cognitoAttributes.email || 'N/A'}`);
      
      // Parsear datos de Cognito
      const email = cognitoAttributes.email || '';
      const fullName = cognitoAttributes.name || 'Usuario';
      const phone = cognitoAttributes.phone_number || '';
      const birthDateRaw = cognitoAttributes.birthdate || '';
      
      // Convertir fecha de formato YYYY-MM-DD a ISO completo (YYYY-MM-DDTHH:mm:ssZ)
      // El backend espera formato RFC3339: 2006-01-02T15:04:05Z07:00
      let birthDateISO = '';
      if (birthDateRaw) {
        // Si ya tiene formato ISO completo, usarlo; si no, agregar hora y timezone
        if (birthDateRaw.includes('T')) {
          birthDateISO = birthDateRaw;
        } else {
          // Convertir YYYY-MM-DD a YYYY-MM-DDTHH:mm:ssZ
          birthDateISO = `${birthDateRaw}T00:00:00Z`;
        }
      } else {
        birthDateISO = '1990-01-01T00:00:00Z';
      }
      
      // Parsear address de Cognito (formato: [{"formatted":"Melo 2883"}])
      let addressStreet = '';
      let addressCountry = 'UY'; // Default a Uruguay
      
      if (cognitoAttributes.address) {
        try {
          const addressArray = JSON.parse(cognitoAttributes.address);
          const formatted = addressArray[0]?.formatted || '';
          // Intentar extraer calle y país del string formateado
          addressStreet = formatted || '';
        } catch (e) {
          addressStreet = cognitoAttributes.address;
        }
      }
      
      // Preparar datos para crear usuario
      // El backend requiere campos obligatorios, usamos valores por defecto si faltan
      // El backend ahora usa KSUID con prefijo (usr-xxxxx), no enviamos id y el backend lo genera
      const createUserInput: CreateUserInput = {
        // No enviamos id, el backend genera un KSUID con prefijo usr-
        full_name: fullName,
        document_type: 'CI', // Por defecto Cédula de Identidad
        document_number: `TEMP-${userId.substring(0, 8)}`, // Temporal hasta que el usuario complete onboarding
        birth_date: birthDateISO, // ISO date string completo (RFC3339)
        nationality: 'UY', // Por defecto Uruguay
        email: email,
        phone: phone,
        address: {
          street: addressStreet || 'Sin dirección',
          country: addressCountry,
        },
        country_of_residence: 'UY', // Por defecto Uruguay
        country_of_funds_origin: 'UY', // Por defecto Uruguay
        is_pep: false,
      };
      
      logger.log(`📤 UserService - Enviando datos de creación al backend`);
      logger.log(`👤 UserService - FullName: ${createUserInput.full_name}`);
      logger.log(`📧 UserService - Email: ${createUserInput.email}`);
      logger.log(`📱 UserService - Phone: ${createUserInput.phone}`);
      
      // Llamar al backend para crear usuario
      const backendResponse = await apiClient.post<CreateUserResponse>(
        '/api/v1/users',
        createUserInput
      );
      
      logger.log(`✅ UserService - Respuesta del backend recibida`);
      logger.log(`📊 UserService - Success: ${backendResponse.success}`);
      
      // Validar respuesta
      if (!backendResponse.success) {
        throw new Error(backendResponse.error || 'Error al crear usuario');
      }
      
      if (!backendResponse.data) {
        throw new Error('Usuario no creado en el backend');
      }
      
      logger.log(`✅ UserService - Usuario creado exitosamente: ${backendResponse.data.full_name}`);
      logger.log(`📧 UserService - Email: ${backendResponse.data.email}`);
      logger.log(`🔗 UserService - KSUID del usuario creado: ${backendResponse.data.id}`);
      
      // Transformar al formato de la app
      const transformedUser = transformBackendUser(backendResponse.data);
      
      logger.log(`✅ UserService - Usuario transformado correctamente`);
      logger.log(`📋 UserService - OnboardingStatus: ${transformedUser.onboardingStatus}`);
      logger.log(`🔗 UserService - KSUID final: ${transformedUser.id}`);
      
      return transformedUser;
    } catch (error: any) {
      logger.error(`❌ UserService - Error al crear usuario: ${error.message}`);
      logger.error(`❌ UserService - Error stack: ${error.stack || 'N/A'}`);
      throw error;
    }
  },

  /**
   * Elimina un usuario del backend
   * DELETE /api/v1/users
   * 
   * Intenta eliminar un usuario por email o ID
   * Nota: Este endpoint puede tener problemas en el backend (error 500)
   */
  async deleteUser(userIdOrEmail: string): Promise<boolean> {
    try {
      logger.log(`🗑️ UserService - Intentando eliminar usuario: ${userIdOrEmail}`);
      
      // Intentar DELETE con el ID/email en el body
      const backendResponse = await apiClient.delete<{ success: boolean; error?: string }>(
        '/api/v1/users',
        {
          body: JSON.stringify({ email: userIdOrEmail }),
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      
      if (backendResponse.success) {
        logger.log(`✅ UserService - Usuario eliminado exitosamente`);
        return true;
      } else {
        logger.warn(`⚠️ UserService - Error al eliminar usuario: ${backendResponse.error || 'Error desconocido'}`);
        return false;
      }
    } catch (error: any) {
      logger.error(`❌ UserService - Error al eliminar usuario: ${error.message}`);
      logger.error(`❌ UserService - Error stack: ${error.stack || 'N/A'}`);
      // El endpoint puede fallar con error 500, pero lo intentamos
      return false;
    }
  },
};

