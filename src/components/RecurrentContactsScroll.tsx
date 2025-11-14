import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { COLORS, SPACING, FONTS } from '../constants';
import { ContactAvatar } from './ContactAvatar';
import { UserContact } from '../models/contacts';
import { useLogs } from '../contexts/LogContext';

interface RecurrentContactsScrollProps {
  contacts: UserContact[];
  onContactPress: (contact: UserContact) => void;
}

export const RecurrentContactsScroll: React.FC<RecurrentContactsScrollProps> = ({
  contacts,
  onContactPress,
}) => {
  const { addLog } = useLogs();
  const hasLoggedRef = React.useRef(false);

  React.useEffect(() => {
    if (!hasLoggedRef.current && contacts.length > 0) {
      addLog(`📋 RecurrentContactsScroll - Renderizando ${contacts.length} contactos recurrentes`);
      hasLoggedRef.current = true;
    }
  }, [contacts.length, addLog]);

  if (contacts.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Contactos recurrentes</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {contacts.map((contact, index) => (
          <View key={contact.contactId || contact.cvu || index} style={styles.contactItem}>
            <ContactAvatar
              contact={contact}
              size={60}
              showBadge={true}
              onPress={() => {
                addLog(`👆 RecurrentContactsScroll - Contacto presionado: ${contact.fullName}`);
                onContactPress(contact);
              }}
            />
            <Text style={styles.contactName} numberOfLines={1}>
              {contact.alias || contact.fullName}
            </Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.lg,
  },
  title: {
    fontSize: 14,
    fontFamily: FONTS.inter.semiBold,
    color: COLORS.white,
    marginBottom: SPACING.md,
    paddingHorizontal: SPACING.lg,
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    gap: SPACING.md,
  },
  contactItem: {
    alignItems: 'center',
    width: 70,
  },
  contactName: {
    fontSize: 12,
    fontFamily: FONTS.inter.regular,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
    textAlign: 'center',
  },
});

