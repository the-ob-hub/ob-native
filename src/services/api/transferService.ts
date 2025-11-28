/**
 * Servicio para endpoints de Transferencias
 * Maneja las transferencias entre usuarios
 */
import { apiClient } from './base';
import { logger } from '../../utils/logger';
import { validateUserId } from '../../utils/helpers';

export interface TransferInput {
  assetCode: string; // "USD" | "USDc" | "UYU"
  assetType: 'fiat' | 'crypto';
  amount: number; // Monto como number (se convertirá a string para el backend)
  destinationUserId?: string; // ID del usuario destino (si es usuario de la app)
  destinationCvu?: string; // CVU del destinatario (si es externo o usuario de la app)
  description?: string;
}

export interface TransferResponse {
  success: boolean;
  data?: {
    id: string;
    movement_type: string;
    amount: string;
    status: string;
    created_at: string;
  };
  error?: string;
}

export const transferService = {
  /**
   * Realiza una transferencia desde el usuario actual a otro usuario
   * POST /api/v1/users/:userId/transfer
   * El userId puede ser UUID o KSUID (con o sin prefijo usr-)
   */
  async transfer(userId: string, input: TransferInput): Promise<TransferResponse> {
    try {
      // Validar userId
      const validatedUserId = validateUserId(userId);
      if (!validatedUserId) {
        throw new Error(`Invalid user ID format: ${userId}`);
      }
      
      logger.log(`💸 TransferService - Realizando transferencia para userId: ${validatedUserId}`);
      logger.log(`📊 TransferService - AssetCode: ${input.assetCode}, Amount: ${input.amount}`);
      logger.log(`📊 TransferService - Destino: ${input.destinationUserId ? `userId: ${input.destinationUserId}` : `cvu: ${input.destinationCvu}`}`);
      
      // El backend espera snake_case según la documentación
      const transferPayload: any = {
        asset_code: input.assetCode,
        asset_type: input.assetType,
        amount: input.amount.toString(), // Convertir a string para el backend (decimal.Decimal)
        description: input.description || `Transferencia de ${input.amount} ${input.assetCode}`,
      };
      
      // Agregar destino según lo que esté disponible
      // El backend espera counterpart_user_id (KSUID con prefijo) o counterpart_account (CVU) en snake_case
      if (input.destinationUserId) {
        // Validar y normalizar el destinationUserId
        const validatedDestUserId = validateUserId(input.destinationUserId);
        if (validatedDestUserId) {
          // Enviar el userId completo (con prefijo usr- si lo tiene)
          transferPayload.counterpart_user_id = validatedDestUserId;
        } else {
          throw new Error(`Invalid destination user ID format: ${input.destinationUserId}`);
        }
      } else if (input.destinationCvu) {
        transferPayload.counterpart_account = input.destinationCvu;
      } else {
        throw new Error('Se requiere destinationUserId o destinationCvu');
      }
      
      logger.log(`📤 TransferService - Payload: ${JSON.stringify(transferPayload)}`);

      // Llamar al backend con el userId completo (con prefijo usr- si lo tiene)
      const response = await apiClient.post<TransferResponse>(
        `/api/v1/users/${validatedUserId}/transfer`,
        transferPayload
      );
      
      logger.log(`✅ TransferService - Transferencia realizada exitosamente`);
      logger.log(`📊 TransferService - Response: ${JSON.stringify(response)}`);
      
      if (!response.success) {
        throw new Error(response.error || 'Error al realizar transferencia');
      }
      
      return response;
    } catch (error: any) {
      logger.error(`❌ TransferService - Error al realizar transferencia: ${error.message}`);
      logger.error(`❌ TransferService - Error stack: ${error.stack || 'N/A'}`);
      throw error;
    }
  },
};

