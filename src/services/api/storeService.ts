/**
 * Servicio para endpoints de Store
 */
import { apiClient } from './base';
import { Inventory, Order } from './types';

export const storeService = {
  /**
   * Obtiene el inventario de pets por status
   * GET /store/inventory
   * 
   * Retorna un mapa de status a cantidades
   * Ejemplo: { "available": 123, "pending": 45, "sold": 67 }
   */
  async getInventory(): Promise<Inventory> {
    try {
      console.log('📦 StoreService - Obteniendo inventario...');
      const inventory = await apiClient.get<Inventory>('/store/inventory');
      console.log('📦 StoreService - Inventario obtenido:', inventory);
      return inventory;
    } catch (error) {
      console.error('❌ StoreService - Error al obtener inventario:', error);
      throw error;
    }
  },

  /**
   * Crea una nueva orden
   * POST /store/order
   */
  async placeOrder(order: Order): Promise<Order> {
    try {
      console.log('📦 StoreService - Creando orden...', order);
      const createdOrder = await apiClient.post<Order>('/store/order', order);
      console.log('📦 StoreService - Orden creada:', createdOrder);
      return createdOrder;
    } catch (error) {
      console.error('❌ StoreService - Error al crear orden:', error);
      throw error;
    }
  },

  /**
   * Obtiene una orden por ID
   * GET /store/order/{orderId}
   */
  async getOrderById(orderId: number): Promise<Order> {
    try {
      console.log('📦 StoreService - Obteniendo orden:', orderId);
      const order = await apiClient.get<Order>(`/store/order/${orderId}`);
      console.log('📦 StoreService - Orden obtenida:', order);
      return order;
    } catch (error) {
      console.error('❌ StoreService - Error al obtener orden:', error);
      throw error;
    }
  },

  /**
   * Elimina una orden
   * DELETE /store/order/{orderId}
   */
  async deleteOrder(orderId: number): Promise<void> {
    try {
      console.log('📦 StoreService - Eliminando orden:', orderId);
      await apiClient.delete(`/store/order/${orderId}`);
      console.log('📦 StoreService - Orden eliminada');
    } catch (error) {
      console.error('❌ StoreService - Error al eliminar orden:', error);
      throw error;
    }
  },
};

