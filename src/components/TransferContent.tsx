import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { COLORS, SPACING, FONTS } from '../constants';
import { RecurrentContactsScroll } from './RecurrentContactsScroll';
import { ContactSearchBar } from './ContactSearchBar';
import { ContactList } from './ContactList';
import { AddContactSheet } from './AddContactSheet';
import { contactsService } from '../services/api/contactsService';
import { userService } from '../services/api/userService';
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
  const [phoneSearchResult, setPhoneSearchResult] = useState<UserContact | null>(null);
  const [isSearchingPhone, setIsSearchingPhone] = useState(false);
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

  // Función auxiliar para detectar si un string es un número de teléfono válido
  const isValidPhone = (text: string): boolean => {
    // Remover espacios, guiones, paréntesis y el símbolo +
    const cleaned = text.replace(/[\s\-\(\)\+]/g, '');
    // Verificar que tenga al menos 8 dígitos y solo contenga números
    return cleaned.length >= 8 && /^\d+$/.test(cleaned);
  };

  // Búsqueda predictiva con detección de teléfono
  const handleSearch = useCallback(async (query: string) => {
    setSearchQuery(query);
    setPhoneSearchResult(null);
    
    if (!query.trim()) {
      // Si no hay búsqueda, mostrar todos los contactos
      setFilteredContacts(allContacts);
      setIsSearching(false);
      setIsSearchingPhone(false);
      return;
    }

    const trimmedQuery = query.trim();
    
    // Verificar si la búsqueda es un teléfono válido
    if (isValidPhone(trimmedQuery)) {
      setIsSearchingPhone(true);
      try {
        addLog(`📱 TransferContent - Detectado teléfono en búsqueda: ${trimmedQuery}`);
        
        // Buscar usuario por teléfono
        const user = await userService.getUserByPhone(trimmedQuery);
        
        if (user) {
          addLog(`✅ TransferContent - Usuario encontrado por teléfono: ${user.fullName} (ID: ${user.id})`);
          
          // Crear contacto temporal con la información del usuario encontrado
          const phoneContact: UserContact = {
            contactId: user.id,
            fullName: user.fullName || 'Usuario sin nombre',
            phone: trimmedQuery,
            hasDolarApp: true,
            isSaved: false, // Aún no está guardado localmente
            cvu: user.id, // Usar ID como CVU temporalmente
          };
          
          setPhoneSearchResult(phoneContact);
          
          // También buscar en contactos existentes para combinar resultados
          try {
            const response = await contactsService.searchContacts({
              query: trimmedQuery,
              currency,
              limit: 50,
            });

            if (response.success) {
              // Combinar resultados: contacto encontrado por teléfono primero, luego otros resultados
              const combined: UserContact[] = [
                phoneContact, // Contacto encontrado por teléfono primero
                ...response.results.contacts,
                ...response.results.users.filter(u => u.contactId !== user.id), // Excluir duplicados
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
              addLog(`✅ TransferContent - ${combined.length} resultados encontrados (incluyendo teléfono)`);
            } else {
              // Si no hay otros resultados, mostrar solo el contacto encontrado por teléfono
              setFilteredContacts([phoneContact]);
            }
          } catch (error: any) {
            // Si falla la búsqueda normal, mostrar solo el contacto encontrado por teléfono
            setFilteredContacts([phoneContact]);
            addLog(`⚠️ TransferContent - Error en búsqueda normal, mostrando solo contacto por teléfono`);
          }
        } else {
          addLog(`⚠️ TransferContent - No se encontró usuario con teléfono: ${trimmedQuery}`);
          setPhoneSearchResult(null);
          
          // Buscar normalmente en contactos
          try {
            setIsSearching(true);
            const response = await contactsService.searchContacts({
              query: trimmedQuery,
              currency,
              limit: 50,
            });

            if (response.success) {
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
        }
      } catch (error: any) {
        addLog(`❌ TransferContent - Error buscando usuario por teléfono: ${error.message}`);
        setPhoneSearchResult(null);
        setFilteredContacts([]);
      } finally {
        setIsSearchingPhone(false);
      }
      return;
    }

    // Búsqueda normal (no es teléfono)
    try {
      setIsSearching(true);
      addLog(`🔍 TransferContent - Buscando: "${trimmedQuery}"`);
      
      const response = await contactsService.searchContacts({
        query: trimmedQuery,
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
        {(isSearching || isSearchingPhone) ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={COLORS.white} />
            {isSearchingPhone && (
              <Text style={styles.loadingText}>Verificando usuario...</Text>
            )}
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
        onContactSelect={(contactData) => {
          // Crear UserContact completo desde los datos
          const contact: UserContact = {
            contactId: contactData.contactId,
            cvu: contactData.cvu,
            alias: contactData.alias,
            fullName: contactData.fullName || 'Contacto sin nombre',
            phone: contactData.phone,
            hasDolarApp: !!contactData.contactId,
            isSaved: true,
          };
          
          // Seleccionar contacto para abrir pantalla de transferencia
          addLog(`🚀 TransferContent - Abriendo transferencia para contacto recién agregado: ${contact.fullName}`);
          onContactSelect(contact);
        }}
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
  loadingText: {
    marginTop: SPACING.md,
    fontSize: 14,
    fontFamily: FONTS.inter.regular,
    color: COLORS.textSecondary,
  },
});

