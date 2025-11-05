import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Message } from '../../../models';
import { COLORS, BORDER_RADIUS, SPACING } from '../../../constants';

interface ChatMessageProps {
  message: Message;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.role === 'user';

  return (
    <View style={[styles.container, isUser ? styles.userContainer : styles.assistantContainer]}>
      {!isUser && (
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>O</Text>
        </View>
      )}

      <View style={[styles.messageBubble, isUser ? styles.userBubble : styles.assistantBubble]}>
        <Text style={[styles.messageText, isUser ? styles.userText : styles.assistantText]}>
          {message.content}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginVertical: SPACING.xs,
    paddingHorizontal: SPACING.md,
  },
  userContainer: {
    justifyContent: 'flex-end',
  },
  assistantContainer: {
    justifyContent: 'flex-start',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.round,
    backgroundColor: COLORS.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
    shadowColor: COLORS.secondary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  avatarText: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: 'bold',
  },
  messageBubble: {
    maxWidth: '75%',
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
  },
  userBubble: {
    backgroundColor: COLORS.primary,
    alignSelf: 'flex-end',
  },
  assistantBubble: {
    backgroundColor: COLORS.white,
    alignSelf: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  userText: {
    color: COLORS.white,
  },
  assistantText: {
    color: COLORS.text,
  },
});

