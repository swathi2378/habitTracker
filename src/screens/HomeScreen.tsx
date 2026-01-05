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
  TextInput,
  Alert,
  ActionSheetIOS,
  Platform
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getHabits, getEntriesBetweenDates, saveEntry } from '../utilities/storage';
import { Habit, Entry } from '../utilities/types';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';

// Use strict typescript import for vector icons will require installing it or using expo/vector-icons
// Since this is an Expo project, we can use @expo/vector-icons
import { Ionicons } from '@expo/vector-icons';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export default function HomeScreen({ navigation }: Props) {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [entries, setEntries] = useState<Record<string, Record<string, Entry>>>({});
  const [loading, setLoading] = useState(false);
  
  // Interaction State
  const [inputModalVisible, setInputModalVisible] = useState(false);
  const [actionModalVisible, setActionModalVisible] = useState(false);
  const [selectedHabitId, setSelectedHabitId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState('');

  // Calendar State
  // weekStart is the date of the first day (say, 6 days ago relative to view reference).
  // But easier to track "referenceDate" (usually end of the week).
  // Initial state is Today.
  const [referenceDate, setReferenceDate] = useState(new Date());

  // Check if we are viewing the current week (to restrict "Next")
  const isCurrentWeek = useMemo(() => {
    const today = new Date();
    // Compare dates only
    return referenceDate.toDateString() === today.toDateString();
  }, [referenceDate]);

  // Calculate the 7 days ending at referenceDate
  const weekDates = useMemo(() => {
    const dates = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(referenceDate);
      d.setDate(d.getDate() - i);
      dates.push(d.toISOString().split('T')[0]);
    }
    return dates;
  }, [referenceDate]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const storedHabits = await getHabits();
      const startDate = weekDates[0];
      const endDate = weekDates[weekDates.length - 1]; // This is referenceDate string
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

  const handleWeekChange = (direction: 'prev' | 'next') => {
      const newRefDate = new Date(referenceDate);
      if (direction === 'prev') {
          newRefDate.setDate(newRefDate.getDate() - 7);
      } else {
          // Prevent going to future weeks beyond "Today" being the last day? 
          // User requirement: "restrict from adding data to future dates".
          // Viewing future dates is generally useless if you can't add data, but maybe they want to see blank?
          // Let's allow browsing but enforce "Today" as max boundary for simplicity if that's what "restrict" implies visually.
          // Or just allow browsing any week. "restrict from adding data" is specific to action.
          // I will block going past "Today" for now to keep it simple and clean.
          if (isCurrentWeek) return; 
          newRefDate.setDate(newRefDate.getDate() + 7);
          
          // Cap at today
          const today = new Date();
          if (newRefDate > today) {
              setReferenceDate(today);
              return;
          }
      }
      setReferenceDate(newRefDate);
  };

  const handleDayPress = async (habit: Habit, date: string) => {
    // 1. Future Date Validation
    const todayStr = new Date().toISOString().split('T')[0];
    if (date > todayStr) {
        Alert.alert("Future Date", "You cannot add entries for future dates.");
        return;
    }

    const currentEntry = entries[habit.id]?.[date];

    // 2. Interaction by Type
    if (habit.type === 'yes-no') {
        setSelectedHabitId(habit.id);
        setSelectedDate(date);
        setActionModalVisible(true);
    } else {
      // Fill-in logic
      setSelectedHabitId(habit.id);
      setSelectedDate(date);
      setInputValue(currentEntry ? String(currentEntry.value) : '');
      setInputModalVisible(true);
    }
  };

  // Helper to save logic
  const saveEntryValue = async (habitId: string, date: string, value: boolean | string | null) => {
      // If null, we might want to delete. simpler to just store null or handle in UI.
      // But my Entry type expects value to be boolean | string | number.
      // Let's strictly delete or update. 
      // Storage.ts `saveEntry` does upsert. 
      // If value is null, I should probably handle "Delete".
      // Updating `saveEntry` to handle null/undefined deletion is safer, OR just store it.
      // Assuming my boolean logic:
      // true = Yes
      // false = No (X)
      // undefined/null = Empty
      
      const newEntry: Entry = {
        habitId,
        date,
        value: value as any, // Cast for transparency if we allow null in practice or strict check
      };
      
      // Update local state
      setEntries(prev => {
          const habitEntries = { ...prev[habitId] };
          if (value === null) {
             delete habitEntries[date]; // Remove from UI
          } else {
             habitEntries[date] = newEntry;
          }
          return { ...prev, [habitId]: habitEntries };
      });

      // Persist (Need to handle null in storage? simpler to just save whatever for now)
      // If I send null value, `saveEntry` will stringify it.
      // Warning: if types.ts assumes strict boolean, this might break.
      // I'll assume standard json serialization handles it.
      await saveEntry(newEntry);
  };

  const handleSaveInput = async () => {
    if (selectedHabitId && selectedDate) {
      await saveEntryValue(selectedHabitId, selectedDate, inputValue);
    }
    setInputModalVisible(false);
  };

  const renderHeader = () => {
      return (
          <View>
             {/* Navigation Header */}
             <View style={styles.navHeader}>
                 <TouchableOpacity onPress={() => handleWeekChange('prev')} style={styles.navButton}>
                     <Ionicons name="chevron-back" size={24} color="#007AFF" />
                     <Text style={styles.navText}>Prev</Text>
                 </TouchableOpacity>
                 
                 <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                     <Text style={styles.weekTitle}>
                         {new Date(weekDates[0]).toLocaleDateString(undefined, {month:'short', day:'numeric'})} 
                         {' - '} 
                         {new Date(weekDates[6]).toLocaleDateString(undefined, {month:'short', day:'numeric'})}
                     </Text>
                     <TouchableOpacity 
                        onPress={() => navigation.navigate('OverallReport')}
                        style={{ marginLeft: 10 }}
                     >
                         <Ionicons name="stats-chart" size={20} color="#007AFF" />
                     </TouchableOpacity>
                 </View>

                 <TouchableOpacity 
                    onPress={() => handleWeekChange('next')} 
                    disabled={isCurrentWeek}
                    style={[styles.navButton, isCurrentWeek && styles.navButtonDisabled]}
                 >
                     <Text style={[styles.navText, isCurrentWeek && styles.navTextDisabled]}>Next</Text>
                     <Ionicons name="chevron-forward" size={24} color={isCurrentWeek ? "#ccc" : "#007AFF"} />
                 </TouchableOpacity>
             </View>

             {/* Days Header */}
             <View style={styles.headerRow}>
                  <View style={styles.habitNameColumn}><Text style={styles.headerText}>Habit</Text></View>
                  {weekDates.map(date => {
                      const d = new Date(date);
                      const dayName = d.toLocaleDateString('en-US', { weekday: 'narrow' });
                      const dayNum = d.getDate();
                      const isToday = date === new Date().toISOString().split('T')[0];
                      return (
                          <View key={date} style={styles.dateCell}>
                              <Text style={[styles.dayName, isToday && styles.todayText]}>{dayName}</Text>
                              <Text style={[styles.dayNum, isToday && styles.todayText]}>{dayNum}</Text>
                          </View>
                      )
                  })}
              </View>
          </View>
      )
  }

  const renderHabitRow = ({ item }: { item: Habit }) => {
    return (
      <View style={styles.row}>
        <TouchableOpacity 
            style={styles.habitNameColumn} 
            onPress={() => navigation.navigate('Analytics', { habitId: item.id, habitName: item.name })}
        >
            <Text style={styles.habitName} numberOfLines={2}>{item.name}</Text>
            {item.type === 'fill-in' && <Text style={styles.habitType}>123</Text>}
        </TouchableOpacity>
        
        {weekDates.map(date => {
            const entry = entries[item.id]?.[date];
            const isToday = date === new Date().toISOString().split('T')[0];
            
            let content = null;
            if (item.type === 'yes-no') {
                if (entry?.value === true) {
                    content = <Ionicons name="checkmark-circle" size={24} color="#34C759" />;
                } else if (entry?.value === false) {
                    content = <Ionicons name="close-circle" size={24} color="#FF3B30" />;
                } else if (!isToday && new Date(date) < new Date() && (item.frequency === 'everyday' || !item.frequency)) {
                    // Default to visual 'No' for past days if everyday freq (or legacy default)
                    // We use opacity to distinguish "auto-no" from "explicit-no" if desired, or just same icon
                    content = <Ionicons name="close-circle" size={24} color="#FF3B30" style={{ opacity: 0.3 }} />;
                }
            } else {
                 if (entry?.value !== undefined && entry?.value !== null && entry?.value !== '') {
                     content = <Text style={styles.valueText}>{String(entry.value)}</Text>;
                 } else if (!isToday && new Date(date) < new Date() && (item.frequency === 'everyday' || !item.frequency)) {
                     // Default for numeric
                     content = <Text style={[styles.valueText, { color: '#FF3B30', opacity: 0.5 }]}>0</Text>;
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
        visible={actionModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setActionModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Mark Habit</Text>
                <Text style={styles.modalSubtitle}>{selectedDate}</Text>
                
                <TouchableOpacity 
                    style={[styles.actionButton, { backgroundColor: '#34C759' }]} // Green
                    onPress={() => {
                        if(selectedHabitId && selectedDate) saveEntryValue(selectedHabitId, selectedDate, true);
                        setActionModalVisible(false);
                    }}
                >
                    <Ionicons name="checkmark-circle-outline" size={24} color="#fff" />
                    <Text style={styles.actionButtonText}>Completed (Yes)</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                    style={[styles.actionButton, { backgroundColor: '#FF3B30' }]} // Red
                    onPress={() => {
                        if(selectedHabitId && selectedDate) saveEntryValue(selectedHabitId, selectedDate, false);
                        setActionModalVisible(false);
                    }}
                >
                    <Ionicons name="close-circle-outline" size={24} color="#fff" />
                    <Text style={styles.actionButtonText}>Missed (No)</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                    style={[styles.actionButton, { backgroundColor: '#ffcc00' }]} // Yellow/Orange for Clear
                    onPress={() => {
                        if(selectedHabitId && selectedDate) saveEntryValue(selectedHabitId, selectedDate, null);
                        setActionModalVisible(false);
                    }}
                >
                    <Ionicons name="trash-outline" size={24} color="#fff" />
                    <Text style={styles.actionButtonText}>Clear Entry</Text>
                </TouchableOpacity>

                <Button title="Cancel" onPress={() => setActionModalVisible(false)} color="#666" />
            </View>
        </View>
      </Modal>

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
                keyboardType={
                    habits.find(h => h.id === selectedHabitId)?.type === 'fill-in' ? 'default' : 'default'
                    // Could optimize keyboard type based on implicit user need, but string is safest default
                }
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
  navHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 12,
      backgroundColor: '#f9f9f9',
      borderBottomWidth: 1,
      borderBottomColor: '#eee'
  },
  navButton: {
      flexDirection: 'row',
      alignItems: 'center',
  },
  navButtonDisabled: {
      opacity: 0.5
  },
  navText: {
      color: '#007AFF',
      fontSize: 16,
      fontWeight: '600',
      marginHorizontal: 4
  },
  navTextDisabled: {
      color: '#ccc'
  },
  weekTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      color: '#333'
  },
  headerRow: {
      flexDirection: 'row',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: '#eee',
      backgroundColor: '#fff'
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
  actionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 14,
      borderRadius: 12,
      marginBottom: 12,
      width: '100%'
  },
  actionButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: 'bold',
      marginLeft: 10
  },
  modalActions: {
      flexDirection: 'row',
      justifyContent: 'space-between'
  }
});
