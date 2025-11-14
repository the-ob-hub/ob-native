import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { COLORS, SPACING, FONTS } from '../constants';
import { ContactAvatar } from './ContactAvatar';
import { UserContact } from '../models/contacts';
import { useLogs } from '../contexts/LogContext';

interface ContactListProps {
  contacts: UserContact[];
  onContactPress: (contact: UserContact) => void;
  emptyMessage?: string;
}

export const ContactList: React.FC<ContactListProps> = ({
  contacts,
  onContactPress,
  emptyMessage = 'No se encontraron contactos',
}) => {
  const { addLog } = useLogs();
  const hasLoggedRef = React.useRef(false);

  React.useEffect(() => {
    if (!hasLoggedRef.current) {
      addLog(`📋 ContactList - Renderizando ${contacts.length} contactos en lista`);
      hasLoggedRef.current = true;
    }
  }, [contacts.length, addLog]);
  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Hoy';
    if (diffDays === 1) return 'Ayer';
    if (diffDays < 7) return `Hace ${diffDays} días`;
    if (diffDays < 30) return `Hace ${Math.floor(diffDays / 7)} semanas`;
    return `Hace ${Math.floor(diffDays / 30)} meses`;
  };

  const renderContact = ({ item }: { item: UserContact }) => {
    const lastTransactionDate = item.metadata?.lastTransactionDate || item.lastTransactionDate;
    const hasTransaction = item.metadata?.hasPreviousTransaction !== false && lastTransactionDate;

    return (
      <TouchableOpacity
        style={styles.contactItem}
        onPress={() => {
          addLog(`👆 ContactList - Contacto presionado: ${item.fullName} (${item.hasDolarApp ? 'Dolar App' : 'Externo'})`);
          onContactPress(item);
        }}
        activeOpacity={0.7}
      >
        <ContactAvatar contact={item} size={50} showBadge={true} />
        <View style={styles.contactInfo}>
          <View style={styles.contactHeader}>
            <Text style={styles.contactName} numberOfLines={1}>
              {item.fullName}
            </Text>
            {item.hasDolarApp && (
              <View style={styles.dolarAppBadge}>
                <Text style={styles.dolarAppText}>Dolar App</Text>
              </View>
            )}
          </View>
          <Text style={styles.contactCvu} numberOfLines={1}>
            {item.cvu || 'CVU no disponible'}
          </Text>
          {hasTransaction && (
            <Text style={styles.lastTransaction}>
              Última transferencia: {formatDate(lastTransactionDate)}
            </Text>
          )}
        </View>
        <View style={styles.arrowContainer}>
          <Text style={styles.arrow}>›</Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (contacts.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>{emptyMessage}</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={contacts}
      renderItem={renderContact}
      keyExtractor={(item, index) => item.contactId || item.cvu || `contact-${index}`}
      style={styles.list}
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}
    />
  );
};

const styles = StyleSheet.create({
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  contactInfo: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  contactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  contactName: {
    fontSize: 16,
    fontFamily: FONTS.inter.semiBold,
    color: COLORS.white,
    flex: 1,
  },
  dolarAppBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: SPACING.xs,
  },
  dolarAppText: {
    fontSize: 10,
    fontFamily: FONTS.inter.bold,
    color: COLORS.white,
  },
  contactCvu: {
    fontSize: 12,
    fontFamily: FONTS.inter.regular,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  lastTransaction: {
    fontSize: 11,
    fontFamily: FONTS.inter.regular,
    color: COLORS.textSecondary,
    opacity: 0.7,
  },
  arrowContainer: {
    marginLeft: SPACING.sm,
  },
  arrow: {
    fontSize: 24,
    color: COLORS.textSecondary,
    fontFamily: FONTS.inter.regular,
  },
  emptyContainer: {
    padding: SPACING.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    fontFamily: FONTS.inter.regular,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});

