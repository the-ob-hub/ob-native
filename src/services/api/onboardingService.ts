/**
 * Servicio para Onboarding
 */
import { apiClient } from './base';

export interface OnboardingSubmitRequest {
  email: string;
  fullName: string;
  phone: string;
  documentType: string;
  documentNumber: string;
  birthDate: string;
  nationality: string;
  address: string;
  countryOfResidence: string;
  countryOfFundsOrigin: string;
  isPEP: boolean;
  // Agregar más campos según sea necesario
}

export interface OnboardingSubmitResponse {
  userId: string;
  status: string;
  message?: string;
  // Agregar más campos según la respuesta real
}

export const onboardingService = {
  /**
   * Envía datos de onboarding
   * POST /api/v1/onboarding/submit
   * 
   * Crea usuario + validaciones (biometric, OCR, PEP, AML)
   */
  async submitOnboarding(data: OnboardingSubmitRequest): Promise<OnboardingSubmitResponse> {
    try {
      console.log('📝 OnboardingService - Enviando datos de onboarding...', data);
      const response = await apiClient.post<OnboardingSubmitResponse>(
        '/api/v1/onboarding/submit',
        data
      );
      console.log('📝 OnboardingService - Onboarding enviado exitosamente:', response);
      return response;
    } catch (error) {
      console.error('❌ OnboardingService - Error al enviar onboarding:', error);
      throw error;
    }
  },
};

