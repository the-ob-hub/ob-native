import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { COLORS, SPACING, FONTS } from '../constants';
import { ContactAvatar } from './ContactAvatar';
import { UserContact } from '../models/contacts';
import { useLogs } from '../contexts/LogContext';

const SCREEN_WIDTH = Dimensions.get('window').width;

const PlusIcon = () => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 5V19M5 12H19"
      stroke={COLORS.white}
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

interface ContactListProps {
  contacts: UserContact[];
  onContactPress: (contact: UserContact) => void;
  emptyMessage?: string;
  onAddContactPress?: () => void;
  showAddButton?: boolean;
}

const SendIcon = () => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path
      d="M22 2L11 13"
      stroke={COLORS.white}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M22 2L15 22L11 13L2 9L22 2Z"
      stroke={COLORS.white}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const ContactList: React.FC<ContactListProps> = ({
  contacts,
  onContactPress,
  emptyMessage = 'No se encontraron contactos',
  onAddContactPress,
  showAddButton = false,
}) => {
  const { addLog } = useLogs();
  const hasLoggedRef = React.useRef(false);
  const rowWidthsRef = React.useRef<Map<string, number>>(new Map());

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
    const contactKey = item.contactId || item.cvu || `contact-${item.fullName}`;

    return (
      <TouchableOpacity
        style={styles.contactItem}
        onLayout={(event) => {
          const { width } = event.nativeEvent.layout;
          rowWidthsRef.current.set(contactKey, width);
        }}
        onPress={() => {
          const width = rowWidthsRef.current.get(contactKey);
          const widthStr = width !== undefined ? `${width.toFixed(2)}px` : 'N/A (no medido aún)';
          addLog(`👆 ContactList - Contacto presionado: ${item.fullName} (ID: ${item.contactId || 'N/A'}, CVU: ${item.cvu || 'N/A'}, Alias: ${item.alias || 'N/A'}, Ancho del row: ${widthStr})`);
          onContactPress(item);
        }}
        activeOpacity={0.7}
      >
        <ContactAvatar contact={item} size={50} />
        <View style={styles.contactInfo}>
          <View style={styles.contactHeader}>
            <Text style={styles.contactName} numberOfLines={1}>
              {item.fullName}
            </Text>
          </View>
          <Text style={styles.contactCvu} numberOfLines={1}>
            {item.cvu || 'CVU no disponible'}
          </Text>
          {item.alias && (
            <Text style={styles.alias}>
              Alias: {item.alias}
            </Text>
          )}
        </View>
        <View style={styles.sendIconContainer}>
          <SendIcon />
        </View>
      </TouchableOpacity>
    );
  };

  if (contacts.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>{emptyMessage}</Text>
        {showAddButton && onAddContactPress && (
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => {
              addLog('➕ ContactList - Botón agregar contacto presionado desde lista vacía');
              onAddContactPress();
            }}
            activeOpacity={0.8}
          >
            <PlusIcon />
            <Text style={styles.addButtonText}>Agregar contacto</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  // Usar mapeo simple en lugar de FlatList para compatibilidad con ScrollView padre
  return (
    <View style={styles.list}>
      <View style={styles.listContent}>
        {contacts.map((item, index) => (
          <View key={item.contactId || item.cvu || `contact-${index}`}>
            {renderContact({ item })}
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  list: {
    flex: 1,
  },
  listContent: {
    paddingLeft: 0, // Sin padding a la izquierda
    paddingRight: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 0, // Sin margen a la izquierda
    paddingRight: SPACING.lg,
    paddingVertical: SPACING.md,
    minHeight: SPACING.md * 2 + 50, // padding vertical + tamaño mínimo del avatar
    width: SCREEN_WIDTH * 0.9, // 90% del ancho de la pantalla (equivalente a ~360px en iPhone estándar)
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
    fontFamily: FONTS.inter.bold,
    color: COLORS.white,
    flex: 1,
  },
  contactCvu: {
    fontSize: 12,
    fontFamily: FONTS.inter.regular,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  alias: {
    fontSize: 11,
    fontFamily: FONTS.inter.regular,
    color: COLORS.textSecondary,
    opacity: 0.7,
  },
  sendIconContainer: {
    marginLeft: SPACING.sm,
    opacity: 0.7,
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
    marginBottom: SPACING.lg,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    marginTop: SPACING.md,
    gap: SPACING.sm,
  },
  addButtonText: {
    fontSize: 16,
    fontFamily: FONTS.inter.bold,
    color: COLORS.white,
  },
});

