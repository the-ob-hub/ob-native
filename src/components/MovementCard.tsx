/**
 * MovementCard Component
 * Basado en la UI de referencia de billeterasmassimple
 */
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Movement } from '../models';
import { formatCurrency, formatDateForDisplay, getInitials, getColorFromInitials } from '../utils/helpers';

interface MovementCardProps {
  movement: Movement;
  onPress?: () => void;
}

export const MovementCard: React.FC<MovementCardProps> = ({ movement, onPress }) => {
  const initials = getInitials(movement.title || movement.description || 'Movimiento');
  const color = getColorFromInitials(initials);
  const isIncome = movement.isIncome;
  
  const formattedAmount = formatCurrency(Math.abs(movement.amount), movement.currency);
  
  return (
    <TouchableOpacity 
      style={styles.card} 
      onPress={onPress} 
      activeOpacity={0.7}
    >
      <View style={[styles.avatar, { backgroundColor: color }]}>
        <Text style={styles.avatarText}>{initials}</Text>
      </View>
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={1}>
          {movement.title || movement.description || 'Movimiento'}
        </Text>
        <View style={styles.meta}>
          <Text style={styles.date}>{formatDateForDisplay(movement.date)}</Text>
          {movement.currency && (
            <View style={styles.tagContainer}>
              <Text style={styles.tag}>{movement.currency}</Text>
            </View>
          )}
        </View>
      </View>
      <View
        style={[
          styles.amountContainer,
          {
            backgroundColor: isIncome ? '#1a5f3f' : '#5f1a1a',
          },
        ]}>
        <Text
          style={[
            styles.amount,
            { color: isIncome ? '#2ecc71' : '#e74c3c' },
          ]}>
          {isIncome ? '+' : '-'} {formattedAmount}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#1e1e1e',
    marginBottom: 5,
    borderRadius: 8,
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  avatarText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    marginRight: 8,
  },
  title: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 3,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  date: {
    color: '#888',
    fontSize: 11,
    marginRight: 6,
  },
  tagContainer: {
    backgroundColor: '#333',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
  },
  tag: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '500',
  },
  amountContainer: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 85,
  },
  amount: {
    fontSize: 13,
    fontWeight: 'bold',
  },
});

