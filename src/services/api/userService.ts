/**
 * Servicio para endpoints de Users
 * Transforma la respuesta del backend al formato esperado por la app
 */
import { apiClient } from './base';
import { BackendUser, BackendUserResponse } from './types';
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
  if (backendUser.addressStreet) addressParts.push(backendUser.addressStreet);
  if (backendUser.addressCity) addressParts.push(backendUser.addressCity);
  if (backendUser.addressState) addressParts.push(backendUser.addressState);
  if (backendUser.addressPostalCode) addressParts.push(backendUser.addressPostalCode);
  if (backendUser.addressCountry) addressParts.push(backendUser.addressCountry);
  
  const address = addressParts.length > 0 
    ? addressParts.join(', ') 
    : backendUser.addressCountry || '';

  // Formatear fecha de nacimiento (backend devuelve ISO string)
  const birthDate = backendUser.birthDate ? backendUser.birthDate.split('T')[0] : '';

  // Mapear status del backend a onboardingStatus de la app
  let onboardingStatus: User['onboardingStatus'] = 'completed';
  if (backendUser.status === 'pending_review' || backendUser.identityPendingManualReview) {
    onboardingStatus = 'pending_validation';
  } else if (backendUser.status === 'active' || backendUser.status === 'approved') {
    onboardingStatus = 'completed';
  } else if (backendUser.status === 'rejected' || backendUser.status === 'failed') {
    onboardingStatus = 'failed';
  }

  return {
    id: backendUser.id,
    email: backendUser.email,
    fullName: backendUser.fullName,
    phone: backendUser.phone,
    documentType: backendUser.documentType,
    documentNumber: backendUser.documentNumber,
    birthDate: birthDate,
    nationality: backendUser.nationality,
    address: address,
    countryOfResidence: backendUser.countryOfResidence,
    countryOfFundsOrigin: backendUser.countryOfFundsOrigin,
    isPEP: backendUser.isPEP,
    onboardingStatus: onboardingStatus,
    createdAt: backendUser.createdAt,
    updatedAt: backendUser.updatedAt,
  };
}

export const userService = {
  /**
   * Obtiene un usuario por ID desde el backend
   * GET /api/v1/users/:userId
   * 
   * Transforma la respuesta del backend al formato esperado por la app
   */
  async getUserById(userId: string): Promise<User> {
    try {
      logger.log(`👥 UserService - Obteniendo usuario del backend: ${userId}`);
      
      // Llamar al backend
      const backendResponse = await apiClient.get<BackendUserResponse>(
        `/api/v1/users/${userId}`
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
      
      logger.log(`👤 UserService - Usuario encontrado: ${backendResponse.data.fullName}`);
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
};

