/**
 * Servicio para endpoints de Balances
 * Transforma la respuesta del backend al formato esperado por la app
 */
import { apiClient } from './base';
import { BackendBalance, BackendBalancesResponse } from './types';
import { Balance, BalancesResponse, Currency, ActionId } from '../../models';
import { logger } from '../../utils/logger';

/**
 * Mapea assetCode del backend a Currency de la app
 */
function mapAssetCodeToCurrency(assetCode: string): Currency {
  const upperCode = assetCode.toUpperCase();
  if (upperCode === 'UYU') return 'UYU';
  if (upperCode === 'USD') return 'USD';
  if (upperCode === 'USDC' || upperCode === 'USDc') return 'USDc';
  
  // Fallback: intentar inferir del código
  logger.log(`⚠️ BalanceService - AssetCode desconocido: ${assetCode}, usando USD como fallback`);
  return 'USD';
}

/**
 * Obtiene las acciones disponibles según la moneda
 */
function getAvailableActions(currency: Currency): ActionId[] {
  switch (currency) {
    case 'UYU':
      return ['agregar', 'pagar', 'exchange'];
    case 'USD':
      return ['agregar', 'enviar', 'exchange'];
    case 'USDc':
      return ['agregar', 'enviar', 'exchange', 'pagar'];
    default:
      return ['agregar', 'enviar', 'exchange'];
  }
}

/**
 * Convierte un balance del backend al formato de la app
 */
function transformBackendBalance(backendBalance: BackendBalance): Balance {
  const currency = mapAssetCodeToCurrency(backendBalance.assetCode);
  const amount = parseFloat(backendBalance.availableBalance) || 0;
  const availableActions = getAvailableActions(currency);

  return {
    currency,
    amount,
    availableActions,
  };
}

/**
 * Ordena los balances según el orden requerido: UYU → USD → USDc
 */
function sortBalances(balances: Balance[]): Balance[] {
  const order: Currency[] = ['UYU', 'USD', 'USDc'];
  
  return balances.sort((a, b) => {
    const indexA = order.indexOf(a.currency);
    const indexB = order.indexOf(b.currency);
    
    // Si no están en el orden, mantener su posición relativa
    if (indexA === -1 && indexB === -1) return 0;
    if (indexA === -1) return 1;
    if (indexB === -1) return -1;
    
    return indexA - indexB;
  });
}

export interface DepositInput {
  assetCode: string; // "UYU" | "USD" | "USDc"
  assetType: 'fiat' | 'crypto';
  amount: number; // Monto como number (se convertirá a string para el backend)
  externalReference?: string;
  description?: string;
}

export const balanceService = {
  /**
   * Realiza un depósito en el balance de un usuario
   * POST /api/v1/users/:userId/deposit
   */
  async deposit(userId: string, input: DepositInput): Promise<void> {
    try {
      logger.log(`💰 BalanceService - Realizando depósito para userId: ${userId}`);
      logger.log(`📊 BalanceService - AssetCode: ${input.assetCode}, Amount: ${input.amount}`);
      
      // El backend espera amount como string (decimal.Decimal)
      const depositPayload = {
        assetCode: input.assetCode,
        assetType: input.assetType,
        amount: input.amount.toString(), // Convertir a string para el backend
        externalReference: input.externalReference,
        description: input.description,
      };
      
      logger.log(`📤 BalanceService - Payload: ${JSON.stringify(depositPayload)}`);
      
      // Llamar al backend
      const response = await apiClient.post<{ success: boolean; data: any; error?: string }>(
        `/api/v1/users/${userId}/deposit`,
        depositPayload
      );
      
      logger.log(`✅ BalanceService - Depósito realizado exitosamente`);
      logger.log(`📊 BalanceService - Response: ${JSON.stringify(response)}`);
      
      if (!response.success) {
        throw new Error(response.error || 'Error al realizar depósito');
      }
    } catch (error: any) {
      logger.error(`❌ BalanceService - Error al realizar depósito: ${error.message}`);
      logger.error(`❌ BalanceService - Error stack: ${error.stack || 'N/A'}`);
      throw error;
    }
  },

  /**
   * Obtiene los balances de un usuario desde el backend
   * GET /api/v1/users/:userId/balances
   * 
   * Transforma la respuesta del backend al formato esperado por la app
   */
  async getBalances(userId: string, signal?: AbortSignal): Promise<BalancesResponse> {
    try {
      logger.log(`💰 BalanceService - Obteniendo balances para userId: ${userId}`);
      
      // Llamar al backend
      const backendResponse = await apiClient.get<BackendBalancesResponse>(
        `/api/v1/users/${userId}/balances`,
        undefined,
        signal
      );
      
      logger.log(`✅ BalanceService - Respuesta del backend recibida`);
      logger.log(`📊 BalanceService - Success: ${backendResponse.success}`);
      logger.log(`📊 BalanceService - Balances recibidos: ${backendResponse.data?.length || 0}`);
      
      // Validar respuesta
      if (!backendResponse.success) {
        throw new Error(backendResponse.error || 'Error al obtener balances');
      }
      
      if (!backendResponse.data || backendResponse.data.length === 0) {
        logger.log(`⚠️ BalanceService - No hay balances para el usuario`);
        return { balances: [] };
      }
      
      // Transformar cada balance del backend al formato de la app
      const transformedBalances = backendResponse.data.map((backendBalance) => {
        logger.log(`🔄 BalanceService - Transformando balance: ${backendBalance.assetCode} = ${backendBalance.availableBalance}`);
        return transformBackendBalance(backendBalance);
      });
      
      // Ordenar según el orden requerido: UYU → USD → USDc
      const sortedBalances = sortBalances(transformedBalances);
      
      logger.log(`✅ BalanceService - Balances transformados y ordenados: ${sortedBalances.length}`);
      sortedBalances.forEach((balance, index) => {
        logger.log(`  ${index + 1}. ${balance.currency}: ${balance.amount} (acciones: ${balance.availableActions.join(', ')})`);
      });
      
      return {
        balances: sortedBalances,
      };
    } catch (error: any) {
      // Si es AbortError, re-lanzar sin loggear como error (fue cancelado intencionalmente)
      if (error.name === 'AbortError') {
        throw error;
      }
      logger.error(`❌ BalanceService - Error al obtener balances: ${error.message}`);
      logger.error(`❌ BalanceService - Error stack: ${error.stack || 'N/A'}`);
      throw error;
    }
  },
};

