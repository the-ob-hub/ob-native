/**
 * Contacts Service
 * Servicio para manejar contactos del usuario (agenda personal)
 * Por ahora usa datos mock, luego se conectará a la API real usando apiClient
 */

import { 
  RecentContactsResponse, 
  SearchContactsResponse, 
  AllContactsResponse,
  UserContact 
} from '../../models/contacts';
import { logger } from '../../utils/logger';
import { apiClient } from './base';

// Importar JSONs mock
import recentContactsMock from '../../mocks/recentContacts.json';
import allContactsMock from '../../mocks/allContacts.json';
import searchContactsMock from '../../mocks/searchContacts.json';

class ContactsService {
  /**
   * Obtener contactos recurrentes (top 10 de últimos 35 días)
   * GET /api/contacts/recent
   */
  async getRecentContacts(params?: {
    currency?: 'USDc' | 'USD' | 'UYU';
    limit?: number;
    days?: number;
  }): Promise<RecentContactsResponse> {
    logger.log(`📞 ContactsService.getRecentContacts() - Iniciando`);
    logger.log(`📋 ContactsService.getRecentContacts() - Params: ${JSON.stringify(params)}`);
    
    // Simular delay de red
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const response = recentContactsMock as RecentContactsResponse;
    
    // Aplicar límite si se especifica
    if (params?.limit && params.limit < response.contacts.length) {
      response.contacts = response.contacts.slice(0, params.limit);
      logger.log(`✂️ ContactsService.getRecentContacts() - Aplicando límite: ${params.limit}`);
    }
    
    logger.log(`✅ ContactsService.getRecentContacts() - Retornando ${response.contacts.length} contactos`);
    return response;
  }

  /**
   * Obtener todos los contactos del usuario
   * GET /api/contacts
   */
  async getAllContacts(params?: {
    currency?: 'USDc' | 'USD' | 'UYU';
    includeSaved?: boolean;
    includeHistory?: boolean;
  }): Promise<AllContactsResponse> {
    logger.log(`📞 ContactsService.getAllContacts() - Iniciando`);
    logger.log(`📋 ContactsService.getAllContacts() - Params: ${JSON.stringify(params)}`);
    
    // Simular delay de red
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const response = allContactsMock as AllContactsResponse;
    
    // Filtrar contactos guardados si se especifica
    if (params?.includeSaved === false) {
      const before = response.contacts.length;
      response.contacts = response.contacts.filter(c => !c.isSaved);
      logger.log(`✂️ ContactsService.getAllContacts() - Filtrados contactos guardados: ${before} -> ${response.contacts.length}`);
    }
    
    logger.log(`✅ ContactsService.getAllContacts() - Retornando ${response.contacts.length} contactos`);
    return response;
  }

  /**
   * Buscar usuarios/contactos
   * GET /api/contacts/search
   */
  async searchContacts(params: {
    query: string;
    currency?: 'USDc' | 'USD' | 'UYU';
    limit?: number;
  }): Promise<SearchContactsResponse> {
    logger.log(`🔍 ContactsService.searchContacts() - Iniciando búsqueda`);
    logger.log(`📋 ContactsService.searchContacts() - Query: "${params.query}"`);
    logger.log(`📋 ContactsService.searchContacts() - Params: ${JSON.stringify(params)}`);
    
    // Simular delay de red
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const { query } = params;
    const queryLower = query.toLowerCase();
    
    // Buscar en todos los contactos disponibles (allContactsMock) en lugar de solo searchContactsMock
    const allContactsData = allContactsMock as AllContactsResponse;
    
    // Filtrar contactos que coincidan con la búsqueda
    const filteredContacts = allContactsData.contacts.filter(contact => {
      return (
        contact.fullName.toLowerCase().includes(queryLower) ||
        contact.alias?.toLowerCase().includes(queryLower) ||
        contact.phone?.includes(query) ||
        contact.cvu?.includes(query)
      );
    });
    
    // Separar en contactos con historial y usuarios sin historial
    // Un contacto tiene historial si tiene lastTransactionDate o transactionCount > 0
    const contactsWithHistory = filteredContacts.filter(c => 
      (c.metadata?.lastTransactionDate || c.lastTransactionDate) ||
      (c.metadata?.transactionCount || c.transactionCount || 0) > 0
    );
    
    // Usuarios sin historial: tienen contactId pero no tienen transacciones
    const usersWithoutHistory = filteredContacts.filter(c => 
      c.contactId && 
      !c.metadata?.lastTransactionDate && 
      !c.lastTransactionDate &&
      (c.metadata?.transactionCount || c.transactionCount || 0) === 0
    );
    
    // Contactos externos (sin contactId pero con CVU)
    const external = filteredContacts.filter(c => 
      !c.contactId && c.cvu
    );
    
    const totalResults = contactsWithHistory.length + usersWithoutHistory.length + external.length;
    logger.log(`✅ ContactsService.searchContacts() - Resultados: ${totalResults} (${contactsWithHistory.length} contactos, ${usersWithoutHistory.length} usuarios, ${external.length} externos)`);
    
    return {
      success: true,
      results: {
        contacts: contactsWithHistory,
        users: usersWithoutHistory,
        external: external.map(ext => ({
          cvu: ext.cvu || '',
          fullName: ext.fullName,
          hasDolarApp: false,
          hasPreviousTransaction: !!ext.lastTransactionDate,
          lastTransactionDate: ext.metadata?.lastTransactionDate || ext.lastTransactionDate,
        })),
      },
    };
  }

  /**
   * Agregar contacto manualmente
   * POST /api/contacts
   */
  async addContact(contact: {
    contactId?: string;
    cvu?: string;
    alias?: string;
    notes?: string;
  }): Promise<{ success: boolean; contact: UserContact }> {
    // Simular delay de red
    await new Promise(resolve => setTimeout(resolve, 400));
    
    return {
      success: true,
      contact: {
        contactId: contact.contactId,
        cvu: contact.cvu,
        alias: contact.alias,
        fullName: contact.alias || 'Contacto sin nombre',
        hasDolarApp: !!contact.contactId,
        isSaved: true,
      },
    };
  }

  /**
   * Eliminar contacto
   * DELETE /api/contacts/{id}
   */
  async deleteContact(contactId: string): Promise<{ success: boolean }> {
    // Simular delay de red
    await new Promise(resolve => setTimeout(resolve, 300));
    
    return { success: true };
  }
}

export const contactsService = new ContactsService();

