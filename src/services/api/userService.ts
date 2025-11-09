/**
 * Servicio para endpoints de Users
 */
import { apiClient } from './base';

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
  // Agregar más campos según la respuesta real
}

export const userService = {
  /**
   * Obtiene un usuario por ID
   * GET /api/v1/users/:userId
   */
  async getUserById(userId: string): Promise<UserDetail> {
    try {
      console.log('👥 UserService - Obteniendo usuario:', userId);
      const user = await apiClient.get<UserDetail>(`/api/v1/users/${userId}`);
      console.log('👥 UserService - Usuario obtenido:', user);
      return user;
    } catch (error) {
      console.error('❌ UserService - Error al obtener usuario:', error);
      throw error;
    }
  },
};

