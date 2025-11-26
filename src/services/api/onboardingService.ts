/**
 * Servicio para Onboarding
 */
import { apiClient } from './base';

/**
 * Estructura de dirección esperada por el backend
 */
export interface Address {
  street: string;
  number: string;
  city: string;
  postal_code?: string;
  province?: string;
  country?: string;
}

export interface OnboardingSubmitRequest {
  email: string;
  full_name: string;
  phone: string;
  document_type: string;
  document_number: string;
  birth_date: string;
  nationality: string;
  address: Address; // Objeto estructurado, no string
  country_of_residence: string;
  country_of_funds_origin: string;
  is_pep: boolean;
  // Agregar más campos según sea necesario
}

/**
 * Estructura de validaciones del backend
 */
export interface OnboardingValidations {
  aml: string;
  biometric: string;
  documentOCR: string;
  pep: string;
}

/**
 * Datos del usuario creado en el backend
 */
export interface OnboardingData {
  user_id: string;
  status: string;
  message?: string;
  identity_pending_manual_review?: boolean;
  validations?: OnboardingValidations;
}

/**
 * Respuesta completa del backend
 */
export interface OnboardingSubmitResponse {
  success: boolean;
  data: OnboardingData;
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

