import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Button,
  Modal,
  TextInput
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getHabits, getEntriesBetweenDates, saveEntry } from '../utilities/storage';
import { Habit, Entry } from '../utilities/types';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export default function HomeScreen({ navigation }: Props) {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [entries, setEntries] = useState<Record<string, Record<string, Entry>>>({});
  const [loading, setLoading] = useState(false);
  const [inputModalVisible, setInputModalVisible] = useState(false);
  const [selectedHabitId, setSelectedHabitId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState('');

  // Calculate last 7 days
  const weekDates = useMemo(() => {
    const dates = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      dates.push(d.toISOString().split('T')[0]);
    }
    return dates;
  }, []);

  const today = weekDates[weekDates.length - 1];

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const storedHabits = await getHabits();
      const startDate = weekDates[0];
      const endDate = weekDates[weekDates.length - 1];
      const fetchedEntries = await getEntriesBetweenDates(startDate, endDate);
      
      const entriesMap: Record<string, Record<string, Entry>> = {};
      fetchedEntries.forEach(e => {
        if (!entriesMap[e.habitId]) entriesMap[e.habitId] = {};
        entriesMap[e.habitId][e.date] = e;
      });

      setHabits(storedHabits);
      setEntries(entriesMap);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [weekDates]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handleDayPress = async (habit: Habit, date: string) => {
    const currentEntry = entries[habit.id]?.[date];
    
    if (habit.type === 'yes-no') {
      const newValue = !currentEntry?.value;
      const newEntry: Entry = {
        habitId: habit.id,
        date: date,
        value: newValue,
      };
      // Optimistic update
      setEntries(prev => ({
          ...prev,
          [habit.id]: {
              ...prev[habit.id],
              [date]: newEntry
          }
      }));
      await saveEntry(newEntry);
    } else {
      // Open modal for Fill-in
      setSelectedHabitId(habit.id);
      setSelectedDate(date);
      setInputValue(currentEntry ? String(currentEntry.value) : '');
      setInputModalVisible(true);
    }
  };

  const handleSaveInput = async () => {
    if (selectedHabitId && selectedDate) {
      const newEntry: Entry = {
        habitId: selectedHabitId,
        date: selectedDate,
        value: inputValue,
      };
      
      setEntries(prev => ({
        ...prev,
        [selectedHabitId]: {
            ...prev[selectedHabitId],
            [selectedDate]: newEntry
        }
    }));
      await saveEntry(newEntry);
    }
    setInputModalVisible(false);
  };

  const renderHeader = () => {
      return (
          <View style={styles.headerRow}>
              <View style={styles.habitNameColumn}><Text style={styles.headerText}>Habit</Text></View>
              {weekDates.map(date => {
                  const d = new Date(date);
                  const dayName = d.toLocaleDateString('en-US', { weekday: 'narrow' });
                  const dayNum = d.getDate();
                  const isToday = date === today;
                  return (
                      <View key={date} style={styles.dateCell}>
                          <Text style={[styles.dayName, isToday && styles.todayText]}>{dayName}</Text>
                          <Text style={[styles.dayNum, isToday && styles.todayText]}>{dayNum}</Text>
                      </View>
                  )
              })}
          </View>
      )
  }

  const renderHabitRow = ({ item }: { item: Habit }) => {
    return (
      <View style={styles.row}>
        <View style={styles.habitNameColumn}>
            <Text style={styles.habitName} numberOfLines={2}>{item.name}</Text>
            {item.type === 'fill-in' && <Text style={styles.habitType}>123</Text>}
        </View>
        
        {weekDates.map(date => {
            const entry = entries[item.id]?.[date];
            const isToday = date === today;
            
            let content = null;
            if (item.type === 'yes-no') {
                if (entry?.value) {
                    content = <View style={styles.checkMark} />;
                }
            } else {
                 if (entry?.value) {
                     content = <Text style={styles.valueText}>{String(entry.value)}</Text>;
                 } else {
                     content = <Text style={styles.placeholderText}>-</Text>;
                 }
            }

            return (
                <TouchableOpacity 
                    key={date} 
                    style={[styles.cell, isToday && styles.todayCell]}
                    onPress={() => handleDayPress(item, date)}
                >
                    {content}
                </TouchableOpacity>
            )
        })}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {renderHeader()}
      <FlatList
        data={habits}
        keyExtractor={(item) => item.id}
        renderItem={renderHabitRow}
        contentContainerStyle={styles.listContent}
        refreshControl={
            <RefreshControl refreshing={loading} onRefresh={loadData} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No habits yet.</Text>
            <Button title="Create First Habit" onPress={() => navigation.navigate('AddHabit')} />
          </View>
        }
      />
      
      <TouchableOpacity
           style={styles.fab}
           onPress={() => navigation.navigate('AddHabit')}
         >
           <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      <Modal
        visible={inputModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setInputModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Update Entry</Text>
            <Text style={styles.modalSubtitle}>{selectedDate}</Text>
            <TextInput 
                style={styles.modalInput}
                value={inputValue}
                onChangeText={setInputValue}
                placeholder="Enter value"
                autoFocus
            />
            <View style={styles.modalActions}>
                <Button title="Cancel" onPress={() => setInputModalVisible(false)} color="#999" />
                <Button title="Save" onPress={handleSaveInput} />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  listContent: {
    paddingBottom: 80,
  },
  headerRow: {
      flexDirection: 'row',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: '#eee',
      backgroundColor: '#f9f9f9'
  },
  habitNameColumn: {
      width: 100,
      paddingHorizontal: 8,
      justifyContent: 'center',
  },
  headerText: {
      fontWeight: 'bold',
      color: '#333'
  },
  dateCell: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
  },
  dayName: {
      fontSize: 10,
      color: '#666',
      textTransform: 'uppercase'
  },
  dayNum: {
      fontSize: 14,
      fontWeight: '600',
      color: '#333'
  },
  todayText: {
      color: '#007AFF',
      fontWeight: 'bold'
  },
  row: {
      flexDirection: 'row',
      borderBottomWidth: 1,
      borderBottomColor: '#f0f0f0',
      height: 60,
  },
  cell: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      borderLeftWidth: 1,
      borderLeftColor: '#f9f9f9'
  },
  todayCell: {
      backgroundColor: '#f0f8ff'
  },
  habitName: {
      fontSize: 14,
      fontWeight: '500',
      color: '#333'
  },
  habitType: {
      fontSize: 10,
      color: '#999',
      marginTop: 2
  },
  checkMark: {
      width: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: '#34C759'
  },
  valueText: {
      fontSize: 12,
      fontWeight: 'bold',
      color: '#333'
  },
  placeholderText: {
      color: '#ddd',
      fontSize: 18
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
    elevation: 5,
  },
  fabText: {
    fontSize: 32,
    color: '#fff',
    marginTop: -4, 
  },
  emptyContainer: {
      alignItems: 'center',
      marginTop: 50,
  },
  emptyText: {
      marginBottom: 20
  },
  modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      alignItems: 'center'
  },
  modalContent: {
      backgroundColor: '#fff',
      padding: 24,
      borderRadius: 12,
      width: '80%',
      elevation: 5
  },
  modalTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      marginBottom: 4
  },
  modalSubtitle: {
      fontSize: 14,
      color: '#666',
      marginBottom: 16
  },
  modalInput: {
      borderWidth: 1,
      borderColor: '#ddd',
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
      marginBottom: 24
  },
  modalActions: {
      flexDirection: 'row',
      justifyContent: 'space-between'
  }
});
