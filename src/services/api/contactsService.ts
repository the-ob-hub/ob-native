/**
 * Contacts Service
 * Servicio para manejar contactos del usuario (agenda personal)
 * Por ahora usa datos mock, luego se conectará a la API real
 */

import { 
  RecentContactsResponse, 
  SearchContactsResponse, 
  AllContactsResponse,
  UserContact 
} from '../../models/contacts';
import { logger } from '../../utils/logger';

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
    
    // Filtrar resultados mock basado en la búsqueda
    const mockResponse = searchContactsMock as SearchContactsResponse;
    
    // Filtrar contactos que coincidan con la búsqueda
    const filteredContacts = mockResponse.results.contacts.filter(contact => {
      return (
        contact.fullName.toLowerCase().includes(queryLower) ||
        contact.alias?.toLowerCase().includes(queryLower) ||
        contact.phone?.includes(query) ||
        contact.cvu?.includes(query)
      );
    });
    
    const filteredUsers = mockResponse.results.users.filter(user => {
      return (
        user.fullName.toLowerCase().includes(queryLower) ||
        user.alias?.toLowerCase().includes(queryLower) ||
        user.phone?.includes(query) ||
        user.cvu?.includes(query)
      );
    });
    
    const filteredExternal = mockResponse.results.external.filter(external => {
      return (
        external.fullName?.toLowerCase().includes(queryLower) ||
        external.cvu.includes(query)
      );
    });
    
    const totalResults = filteredContacts.length + filteredUsers.length + filteredExternal.length;
    logger.log(`✅ ContactsService.searchContacts() - Resultados: ${totalResults} (${filteredContacts.length} contactos, ${filteredUsers.length} usuarios, ${filteredExternal.length} externos)`);
    
    return {
      success: true,
      results: {
        contacts: filteredContacts,
        users: filteredUsers,
        external: filteredExternal,
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

