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
import { db } from '../../data/database';

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
    
    // Asegurar que la base esté inicializada
    await db.init();
    
    // Obtener todos los contactos y filtrar por fecha de última transacción
    const allContacts = await db.getAllContacts();
    
    // Filtrar contactos con transacciones recientes y ordenar por fecha
    const recentContacts = allContacts
      .filter(c => c.lastTransactionDate)
      .sort((a, b) => {
        const dateA = new Date(a.lastTransactionDate || 0).getTime();
        const dateB = new Date(b.lastTransactionDate || 0).getTime();
        return dateB - dateA;
      })
      .slice(0, params?.limit || 10);
    
    logger.log(`✅ ContactsService.getRecentContacts() - Retornando ${recentContacts.length} contactos`);
    return {
      success: true,
      contacts: recentContacts,
    };
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
    
    // Asegurar que la base esté inicializada
    await db.init();
    
    // Obtener todos los contactos de la base de datos
    let contacts = await db.getAllContacts();
    
    // Filtrar contactos guardados si se especifica
    if (params?.includeSaved === false) {
      const before = contacts.length;
      contacts = contacts.filter(c => !c.isSaved);
      logger.log(`✂️ ContactsService.getAllContacts() - Filtrados contactos guardados: ${before} -> ${contacts.length}`);
    }
    
    logger.log(`✅ ContactsService.getAllContacts() - Retornando ${contacts.length} contactos`);
    return {
      success: true,
      contacts,
    };
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
    
    // Asegurar que la base esté inicializada
    await db.init();
    
    // Buscar en la base de datos
    const filteredContacts = await db.searchContacts(params.query);
    
    // Separar en contactos con historial y usuarios sin historial
    const contactsWithHistory = filteredContacts.filter(c => 
      c.lastTransactionDate || (c.transactionCount || 0) > 0
    );
    
    // Usuarios sin historial: tienen contactId pero no tienen transacciones
    const usersWithoutHistory = filteredContacts.filter(c => 
      c.contactId && 
      !c.lastTransactionDate &&
      (c.transactionCount || 0) === 0
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
          lastTransactionDate: ext.lastTransactionDate,
        })),
      },
    };
  }

  /**
   * Agregar contacto manualmente
   * POST /api/v1/contacts
   * 
   * Guarda un contacto en el backend. Si el contacto tiene contactId (usuario de la app),
   * el backend verifica que el usuario existe antes de guardarlo.
   */
  async addContact(contact: {
    contactId?: string;
    cvu?: string;
    alias?: string;
    notes?: string;
  }): Promise<{ success: boolean; contact: UserContact }> {
    try {
      logger.log(`➕ ContactsService.addContact() - Agregando contacto`);
      logger.log(`📋 ContactsService.addContact() - ContactId: ${contact.contactId || 'N/A'}`);
      logger.log(`📋 ContactsService.addContact() - CVU: ${contact.cvu || 'N/A'}`);
      logger.log(`📋 ContactsService.addContact() - Alias: ${contact.alias || 'N/A'}`);
      
      // Validar que tenga al menos contactId o cvu
      if (!contact.contactId && !contact.cvu) {
        throw new Error('Se requiere contactId o cvu para agregar contacto');
      }
      
      // Preparar payload para el backend (snake_case)
      const payload: any = {};
      if (contact.contactId) {
        payload.contact_id = contact.contactId;
      }
      if (contact.cvu) {
        payload.cvu = contact.cvu;
      }
      if (contact.alias) {
        payload.alias = contact.alias;
      }
      if (contact.notes) {
        payload.notes = contact.notes;
      }
      
      logger.log(`📤 ContactsService.addContact() - Payload: ${JSON.stringify(payload)}`);
      
      // Llamar al backend
      const response = await apiClient.post<{
        success: boolean;
        contact: {
          contactId?: string;
          cvu?: string;
          fullName: string;
          alias?: string;
          phone?: string;
          hasDolarApp: boolean;
          isSaved: boolean;
        };
        error?: string;
      }>('/api/v1/contacts', payload);
      
      logger.log(`✅ ContactsService.addContact() - Respuesta del backend recibida`);
      logger.log(`📊 ContactsService.addContact() - Success: ${response.success}`);
      
      if (!response.success) {
        throw new Error(response.error || 'Error al agregar contacto');
      }
      
      if (!response.contact) {
        throw new Error('No se recibió información del contacto guardado');
      }
      
      // Transformar respuesta del backend al formato de la app
      const userContact: UserContact = {
        contactId: response.contact.contactId,
        cvu: response.contact.cvu,
        alias: response.contact.alias,
        fullName: response.contact.fullName,
        phone: response.contact.phone,
        hasDolarApp: response.contact.hasDolarApp,
        isSaved: response.contact.isSaved,
      };
      
      logger.log(`✅ ContactsService.addContact() - Contacto guardado exitosamente: ${userContact.fullName}`);
      
      return {
        success: true,
        contact: userContact,
      };
    } catch (error: any) {
      logger.error(`❌ ContactsService.addContact() - Error: ${error.message}`);
      logger.error(`❌ ContactsService.addContact() - Error stack: ${error.stack || 'N/A'}`);
      
      // Si el endpoint no existe aún en el backend, usar mock como fallback
      if (error.message?.includes('404') || error.message?.includes('Not Found')) {
        logger.log(`⚠️ ContactsService.addContact() - Endpoint no disponible, usando mock como fallback`);
        
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
      
      throw error;
    }
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

