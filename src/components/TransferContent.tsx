import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { COLORS, SPACING } from '../constants';
import { RecurrentContactsScroll } from './RecurrentContactsScroll';
import { ContactSearchBar } from './ContactSearchBar';
import { ContactList } from './ContactList';
import { AddContactSheet } from './AddContactSheet';
import { contactsService } from '../services/api/contactsService';
import { UserContact } from '../models/contacts';
import { Currency } from '../models';
import { useLogs } from '../contexts/LogContext';

interface TransferContentProps {
  currency: Currency;
  onContactSelect: (contact: UserContact) => void;
}

export const TransferContent: React.FC<TransferContentProps> = ({
  currency,
  onContactSelect,
}) => {
  const [recentContacts, setRecentContacts] = useState<UserContact[]>([]);
  const [allContacts, setAllContacts] = useState<UserContact[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<UserContact[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [isAddContactSheetVisible, setIsAddContactSheetVisible] = useState(false);
  const { addLog } = useLogs();

  // Cargar contactos recurrentes
  useEffect(() => {
    const loadRecentContacts = async () => {
      try {
        addLog('📞 TransferContent - Cargando contactos recurrentes');
        const response = await contactsService.getRecentContacts({ currency, limit: 10 });
        if (response.success) {
          setRecentContacts(response.contacts);
          addLog(`✅ TransferContent - ${response.contacts.length} contactos recurrentes cargados`);
        }
      } catch (error: any) {
        addLog(`❌ TransferContent - Error cargando contactos recurrentes: ${error.message}`);
      }
    };

    loadRecentContacts();
  }, [currency, addLog]);

  // Cargar todos los contactos
  useEffect(() => {
    const loadAllContacts = async () => {
      try {
        setIsLoading(true);
        addLog('📞 TransferContent - Cargando todos los contactos');
        const response = await contactsService.getAllContacts({ currency });
        if (response.success) {
          // Ordenar por fecha de última transacción (más reciente primero)
          const sorted = [...response.contacts].sort((a, b) => {
            const dateA = a.metadata?.lastTransactionDate || a.lastTransactionDate || '';
            const dateB = b.metadata?.lastTransactionDate || b.lastTransactionDate || '';
            if (dateA && dateB) {
              return new Date(dateB).getTime() - new Date(dateA).getTime();
            }
            if (dateA) return -1;
            if (dateB) return 1;
            
            return 0;
          });
          
          setAllContacts(sorted);
          setFilteredContacts(sorted);
          addLog(`✅ TransferContent - ${sorted.length} contactos cargados`);
        }
      } catch (error: any) {
        addLog(`❌ TransferContent - Error cargando contactos: ${error.message}`);
      } finally {
        setIsLoading(false);
      }
    };

    loadAllContacts();
  }, [currency, addLog]);

  // Búsqueda predictiva
  const handleSearch = useCallback(async (query: string) => {
    setSearchQuery(query);
    
    if (!query.trim()) {
      // Si no hay búsqueda, mostrar todos los contactos
      setFilteredContacts(allContacts);
      setIsSearching(false);
      return;
    }

    try {
      setIsSearching(true);
      addLog(`🔍 TransferContent - Buscando: "${query}"`);
      
      const response = await contactsService.searchContacts({
        query: query.trim(),
        currency,
        limit: 50,
      });

      if (response.success) {
        // Combinar resultados: contactos con historial primero, luego usuarios, luego externos
        const combined: UserContact[] = [
          ...response.results.contacts,
          ...response.results.users,
          ...response.results.external.map(ext => ({
            cvu: ext.cvu,
            fullName: ext.fullName || 'Usuario externo',
            isSaved: false,
            metadata: {
              hasPreviousTransaction: ext.hasPreviousTransaction,
              lastTransactionDate: ext.lastTransactionDate,
            },
          })),
        ];

        setFilteredContacts(combined);
        addLog(`✅ TransferContent - ${combined.length} resultados encontrados`);
      }
    } catch (error: any) {
      addLog(`❌ TransferContent - Error en búsqueda: ${error.message}`);
      setFilteredContacts([]);
    } finally {
      setIsSearching(false);
    }
  }, [currency, allContacts, addLog]);

  const handleContactPress = (contact: UserContact) => {
    addLog(`👆 TransferContent - Contacto seleccionado: ${contact.fullName} (ID: ${contact.contactId || 'N/A'}, CVU: ${contact.cvu || 'N/A'}, Alias: ${contact.alias || 'N/A'})`);
    onContactSelect(contact);
  };

  const handleAddContact = async (contactData: {
    contactId?: string;
    cvu?: string;
    alias?: string;
    fullName?: string;
    phone?: string;
  }) => {
    try {
      addLog(`➕ TransferContent - Agregando nuevo contacto: ${contactData.fullName || 'Sin nombre'}`);
      
      // Crear el nuevo contacto
      const newContact: UserContact = {
        contactId: contactData.contactId,
        cvu: contactData.cvu,
        alias: contactData.alias,
        fullName: contactData.fullName || 'Nuevo contacto',
        phone: contactData.phone,
        hasDolarApp: !!contactData.contactId,
        isSaved: true,
      };

      // Recargar contactos desde el servicio para obtener la lista actualizada
      const response = await contactsService.getAllContacts({ currency });
      if (response.success) {
        setAllContacts(response.contacts);
        setFilteredContacts(response.contacts);
      } else {
        // Fallback: agregar localmente si falla la recarga
        const updatedContacts = [newContact, ...allContacts];
        setAllContacts(updatedContacts);
        setFilteredContacts(updatedContacts);
      }
      
      // También agregar a contactos recientes si hay espacio
      if (recentContacts.length < 10) {
        setRecentContacts([newContact, ...recentContacts]);
      }

      addLog(`✅ TransferContent - Contacto agregado exitosamente`);
    } catch (error: any) {
      addLog(`❌ TransferContent - Error agregando contacto: ${error.message}`);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.white} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Sección fija arriba: contactos recurrentes y buscador */}
      <View style={styles.fixedHeader}>
        {/* Scroll horizontal de contactos recurrentes */}
        <RecurrentContactsScroll
          contacts={recentContacts}
          onContactPress={handleContactPress}
        />

        {/* Barra de búsqueda */}
        <ContactSearchBar 
          onSearchChange={handleSearch} 
          onAddPress={() => setIsAddContactSheetVisible(true)}
        />
      </View>

      {/* ScrollView solo para la lista de contactos - puede pasar por debajo del buscador */}
      <ScrollView
        style={styles.contactsScrollView}
        contentContainerStyle={styles.contactsScrollContent}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled={true}
      >
        {isSearching ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={COLORS.white} />
          </View>
        ) : (
          <ContactList
            contacts={filteredContacts}
            onContactPress={handleContactPress}
            emptyMessage={searchQuery ? 'No se encontraron resultados' : 'No hay contactos disponibles'}
            onAddContactPress={() => setIsAddContactSheetVisible(true)}
            showAddButton={searchQuery.trim().length > 0 && filteredContacts.length === 0}
          />
        )}
      </ScrollView>

      {/* Modal para agregar contacto */}
      <AddContactSheet
        visible={isAddContactSheetVisible}
        onClose={() => setIsAddContactSheetVisible(false)}
        onAddContact={handleAddContact}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  fixedHeader: {
    // Sección fija: contactos recurrentes + buscador
    zIndex: 10,
    backgroundColor: 'transparent',
  },
  contactsScrollView: {
    flex: 1,
    // El scroll puede pasar por debajo del buscador
  },
  contactsScrollContent: {
    paddingBottom: SPACING.xl,
  },
  loadingContainer: {
    minHeight: 200,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.xl,
  },
});

