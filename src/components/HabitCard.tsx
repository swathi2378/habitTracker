import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Card } from './Card';
import { THEME } from '../utilities/theme';
import { Ionicons } from '@expo/vector-icons';
import { Habit, Entry } from '../utilities/types';

interface HabitCardProps {
  habit: Habit;
  entries: Record<string, Entry>;
  weekDates: string[];
  onDayPress: (date: string) => void;
  onPress: () => void;
}

export const HabitCard: React.FC<HabitCardProps> = ({
  habit,
  entries,
  weekDates,
  onDayPress,
  onPress
}) => {
  return (
    <Card style={styles.card} onPress={onPress}>
      <View style={styles.header}>
          <Text style={styles.title} numberOfLines={1}>{habit.name}</Text>
          <Ionicons name="chevron-forward" size={16} color={THEME.colors.textLight} />
      </View>
      
      <View style={styles.datesRow}>
          {weekDates.map(date => {
              const entry = entries[date];
              const isToday = date === new Date().toISOString().split('T')[0];
              const dateObj = new Date(date);
              const isFuture = dateObj > new Date();
              const isPast = dateObj < new Date() && !isToday;
              
              let content = null;
              let backgroundColor = 'transparent';
              let borderColor = 'transparent';

              if (habit.type === 'yes-no') {
                  if (entry?.value === true) {
                      content = <Ionicons name="checkmark" size={18} color="#FFF" />;
                      backgroundColor = THEME.colors.success;
                  } else if (entry?.value === false) {
                      content = <Ionicons name="close" size={18} color="#FFF" />;
                      backgroundColor = THEME.colors.error;
                  } else if (isPast && (habit.frequency === 'everyday' || !habit.frequency)) {
                      // Missed
                      content = <View style={styles.dotMissed} />;
                      backgroundColor = THEME.colors.background;
                      borderColor = THEME.colors.border;
                  } else {
                      // Empty / Future
                      backgroundColor = THEME.colors.background;
                  }
              } else {
                  // Fill-in
                  if (entry?.value !== undefined && entry?.value !== null && entry?.value !== '') {
                        content = <Text style={styles.valueText}>{String(entry.value)}</Text>;
                        backgroundColor = THEME.colors.primary + '20'; // 20% opacity
                        borderColor = THEME.colors.primary;
                  } else if (isPast) {
                        content = <Text style={styles.placeholderText}>-</Text>;
                        backgroundColor = THEME.colors.background;
                  }
              }

              return (
                  <TouchableOpacity
                      key={date}
                      style={[
                          styles.dayCell, 
                          { backgroundColor, borderColor: borderColor !== 'transparent' ? borderColor : backgroundColor },
                          isToday && styles.todayIndicator
                      ]}
                      onPress={() => onDayPress(date)}
                      activeOpacity={0.7}
                      disabled={isFuture} // Disable future interaction
                  >
                      {content}
                  </TouchableOpacity>
              )
          })}
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
      marginBottom: THEME.spacing.md,
      marginHorizontal: THEME.spacing.md,
      paddingVertical: THEME.spacing.md,
      paddingHorizontal: THEME.spacing.md
  },
  header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: THEME.spacing.md
  },
  title: {
      fontSize: THEME.fonts.size.body,
      fontWeight: '600',
      color: THEME.colors.text,
      flex: 1,
      marginRight: 8
  },
  datesRow: {
      flexDirection: 'row',
      justifyContent: 'space-between'
  },
  dayCell: {
      width: 36,
      height: 36,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: 'transparent'
  },
  todayIndicator: {
      borderWidth: 1,
      borderColor: THEME.colors.primary
  },
  dotMissed: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: THEME.colors.error,
      opacity: 0.5
  },
  valueText: {
      fontSize: 10,
      fontWeight: 'bold',
      color: THEME.colors.primary
  },
  placeholderText: {
      fontSize: 12,
      color: THEME.colors.textLight
  }
});
