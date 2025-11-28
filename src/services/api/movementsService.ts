/**
 * Servicio para endpoints de Movements
 * Transforma la respuesta del backend al formato esperado por la app
 */
import { apiClient } from './base';
import { BackendMovement, BackendMovementsResponse } from './types';
import { Movement, Currency } from '../../models';
import { logger } from '../../utils/logger';
import { validateUserId } from '../../utils/helpers';

/**
 * Obtiene los movimientos de un usuario desde el backend
 * GET /api/v1/users/:userId/movements
 * 
 * Transforma la respuesta del backend al formato esperado por la app
 * El userId puede ser UUID o KSUID (con o sin prefijo usr-)
 */
export const movementsService = {
  async getMovementsByUser(userId: string, limit?: number, offset?: number, signal?: AbortSignal): Promise<Movement[]> {
    try {
      // Validar userId
      const validatedUserId = validateUserId(userId);
      if (!validatedUserId) {
        throw new Error(`Invalid user ID format: ${userId}`);
      }
      
      logger.log(`📊 MovementsService - Obteniendo movimientos para userId: ${validatedUserId}`);
      
      // Si tiene prefijo usr-, lo removemos para el backend
      const userIdForBackend = validatedUserId.startsWith('usr-') 
        ? validatedUserId.substring(4) 
        : validatedUserId;
      
      // Construir query params
      const params = new URLSearchParams();
      if (limit) params.append('limit', limit.toString());
      if (offset) params.append('offset', offset.toString());
      const queryString = params.toString();
      const endpoint = `/api/v1/users/${userIdForBackend}/movements${queryString ? `?${queryString}` : ''}`;
      
      // Llamar al backend
      const backendResponse = await apiClient.get<BackendMovementsResponse>(endpoint, undefined, signal);
      
      logger.log(`✅ MovementsService - Respuesta del backend recibida`);
      logger.log(`📊 MovementsService - Success: ${backendResponse.success}`);
      logger.log(`📊 MovementsService - Movimientos recibidos: ${backendResponse.data?.length || 0}`);
      
      // Validar respuesta
      if (!backendResponse.success) {
        throw new Error(backendResponse.error || 'Error al obtener movimientos');
      }
      
      if (!backendResponse.data || backendResponse.data.length === 0) {
        logger.log(`⚠️ MovementsService - No hay movimientos para el usuario`);
        return [];
      }
      
      // Transformar cada movimiento del backend al formato de la app
      const transformedMovements = backendResponse.data.map((backendMovement) => {
        logger.log(`🔄 MovementsService - Transformando movimiento: ${backendMovement.movement_type} - ${backendMovement.amount}`);
        return transformBackendMovement(backendMovement);
      });
      
      logger.log(`✅ MovementsService - Movimientos transformados: ${transformedMovements.length}`);
      return transformedMovements;
    } catch (error: any) {
      // Si es AbortError, re-lanzar sin loggear como error (fue cancelado intencionalmente)
      if (error.name === 'AbortError') {
        throw error;
      }
      logger.error(`❌ MovementsService - Error al obtener movimientos: ${error.message}`);
      logger.error(`❌ MovementsService - Error stack: ${error.stack || 'N/A'}`);
      logger.log(`🔄 MovementsService - Usando datos mock como fallback`);
      // Retornar array vacío en lugar de lanzar error - el componente manejará el fallback
      return [];
    }
  },
};

/**
 * Transforma un movimiento del backend al formato de la app
 */
function transformBackendMovement(backendMovement: BackendMovement): Movement {
  const currency = mapAssetCodeToCurrency(backendMovement.asset_code);
  const amount = parseFloat(backendMovement.amount);
  const isIncome = backendMovement.direction === 'in';
  
  // Generar título basado en el tipo de movimiento
  const title = getMovementTitle(backendMovement.movement_type, backendMovement.description);
  
  return {
    id: backendMovement.id,
    userId: backendMovement.user_id,
    balanceId: backendMovement.balance_id,
    movementType: backendMovement.movement_type,
    amount: amount,
    currency: currency,
    direction: backendMovement.direction,
    status: backendMovement.status,
    description: backendMovement.description || title,
    title: title,
    date: backendMovement.created_at,
    assetType: backendMovement.asset_type,
    assetCode: backendMovement.asset_code,
    metadata: backendMovement.metadata,
    externalReference: backendMovement.external_reference,
    balanceBefore: backendMovement.balance_before ? parseFloat(backendMovement.balance_before) : undefined,
    balanceAfter: backendMovement.balance_after ? parseFloat(backendMovement.balance_after) : undefined,
    counterpartUserId: backendMovement.counterpart_user_id,
    counterpartAccount: backendMovement.counterpart_account,
    isIncome: isIncome,
  };
}

/**
 * Mapea assetCode del backend a Currency de la app
 */
function mapAssetCodeToCurrency(assetCode: string): Currency {
  const upperCode = assetCode.toUpperCase();
  if (upperCode === 'UYU') return 'UYU';
  if (upperCode === 'USD') return 'USD';
  if (upperCode === 'USDC' || upperCode === 'USDc') return 'USDc';
  logger.log(`⚠️ MovementsService - AssetCode desconocido: ${assetCode}, usando USD como fallback`);
  return 'USD';
}

/**
 * Genera un título legible basado en el tipo de movimiento
 */
function getMovementTitle(movementType: string, description?: string): string {
  if (description) {
    return description;
  }
  
  const titles: { [key: string]: string } = {
    deposit: 'Depósito',
    withdrawal: 'Retiro',
    transfer_in: 'Transferencia recibida',
    transfer_out: 'Transferencia enviada',
    fee: 'Comisión',
    refund: 'Reembolso',
    adjustment: 'Ajuste',
    swap: 'Intercambio',
    stake: 'Staking',
    unstake: 'Unstaking',
  };
  
  return titles[movementType] || 'Movimiento';
}

