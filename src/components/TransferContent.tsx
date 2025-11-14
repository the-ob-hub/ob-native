import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { COLORS, SPACING } from '../constants';
import { RecurrentContactsScroll } from './RecurrentContactsScroll';
import { ContactSearchBar } from './ContactSearchBar';
import { ContactList } from './ContactList';
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
          // Ordenar: primero con Dolar App, luego por fecha de última transacción
          const sorted = [...response.contacts].sort((a, b) => {
            // Prioridad a contactos con Dolar App
            if (a.hasDolarApp && !b.hasDolarApp) return -1;
            if (!a.hasDolarApp && b.hasDolarApp) return 1;
            
            // Luego por fecha de última transacción (más reciente primero)
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
            hasDolarApp: false,
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
    addLog(`👆 TransferContent - Contacto seleccionado: ${contact.fullName}`);
    onContactSelect(contact);
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
      {/* Scroll horizontal de contactos recurrentes */}
      <RecurrentContactsScroll
        contacts={recentContacts}
        onContactPress={handleContactPress}
      />

      {/* Barra de búsqueda */}
      <ContactSearchBar onSearchChange={handleSearch} />

      {/* Lista vertical de contactos */}
      {isSearching ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={COLORS.white} />
        </View>
      ) : (
        <ContactList
          contacts={filteredContacts}
          onContactPress={handleContactPress}
          emptyMessage={searchQuery ? 'No se encontraron resultados' : 'No hay contactos disponibles'}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.xl,
  },
});

