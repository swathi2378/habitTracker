import React, { useState, useCallback, useMemo, useLayoutEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  Modal,
  TextInput,
  Alert,
  StatusBar,
  LayoutAnimation,
  Platform,
  TouchableOpacity,
  Animated,
  Easing,
  Image
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getHabits, getEntriesBetweenDates, saveEntry } from '../utilities/storage';
import { Habit, Entry } from '../utilities/types';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { Ionicons } from '@expo/vector-icons';
import { THEME } from '../utilities/theme';
import { Header } from '../components/Header';
import { HabitCard } from '../components/HabitCard';
import { Button } from '../components/Button';

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
  const [referenceDate, setReferenceDate] = useState(new Date());

  // Animation State
  const [scaleAnim] = useState(new Animated.Value(0));

  useLayoutEffect(() => {
      navigation.setOptions({ headerShown: false });
  }, [navigation]);

  const isCurrentWeek = useMemo(() => {
    const today = new Date();
    return referenceDate.toDateString() === today.toDateString();
  }, [referenceDate]);

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
      const endDate = weekDates[weekDates.length - 1]; 
      const fetchedEntries = await getEntriesBetweenDates(startDate, endDate);
      
      const entriesMap: Record<string, Record<string, Entry>> = {};
      fetchedEntries.forEach(e => {
        if (!entriesMap[e.habitId]) entriesMap[e.habitId] = {};
        entriesMap[e.habitId][e.date] = e;
      });

      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
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
          if (isCurrentWeek) return; 
          newRefDate.setDate(newRefDate.getDate() + 7);
          const today = new Date();
          if (newRefDate > today) setReferenceDate(today);
          else setReferenceDate(newRefDate);
      }
      setReferenceDate(newRefDate);
  };

  const handleDayPress = async (habit: Habit, date: string) => {
    const todayStr = new Date().toISOString().split('T')[0];
    if (date > todayStr) {
        Alert.alert("Future Date", "You cannot add entries for future dates.");
        return;
    }

    const currentEntry = entries[habit.id]?.[date];

    if (habit.type === 'yes-no') {
        setSelectedHabitId(habit.id);
        setSelectedDate(date);
        setActionModalVisible(true);
        // Animate in
        scaleAnim.setValue(0);
        Animated.spring(scaleAnim, {
            toValue: 1,
            friction: 5,
            useNativeDriver: true
        }).start();
    } else {
      setSelectedHabitId(habit.id);
      setSelectedDate(date);
      setInputValue(currentEntry ? String(currentEntry.value) : '');
      setInputModalVisible(true);
    }
  };

  const saveEntryValue = async (habitId: string, date: string, value: boolean | string | null) => {
      const newEntry: Entry = {
        habitId,
        date,
        value: value as any, 
      };
      
      setEntries(prev => {
          const habitEntries = { ...prev[habitId] };
          if (value === null) {
             delete habitEntries[date]; 
          } else {
             habitEntries[date] = newEntry;
          }
          return { ...prev, [habitId]: habitEntries };
      });

      await saveEntry(newEntry);
  };

  const handleSaveInput = async () => {
    if (selectedHabitId && selectedDate) {
      await saveEntryValue(selectedHabitId, selectedDate, inputValue);
    }
    setInputModalVisible(false);
  };

  const renderHeader = () => {
      const startDate = new Date(weekDates[0]);
      const endDate = new Date(weekDates[6]);
      const dateRange = `${startDate.toLocaleDateString(undefined, {month:'short', day:'numeric'})} - ${endDate.toLocaleDateString(undefined, {month:'short', day:'numeric'})}`;

      return (
          <View style={styles.calendarStrip}>
              <View style={styles.calendarHeader}>
                  <TouchableOpacity onPress={() => handleWeekChange('prev')} style={styles.navButton}>
                     <Ionicons name="chevron-back" size={20} color={THEME.colors.primary} />
                  </TouchableOpacity>
                  
                  <Text style={styles.weekTitle}>{dateRange}</Text>

                  <TouchableOpacity 
                    onPress={() => handleWeekChange('next')} 
                    disabled={isCurrentWeek}
                    style={[styles.navButton, isCurrentWeek && { opacity: 0.3 }]}
                  >
                      <Ionicons name="chevron-forward" size={20} color={THEME.colors.primary} />
                  </TouchableOpacity>
              </View>

              <View style={styles.daysRow}>
                   {weekDates.map(date => {
                       const d = new Date(date);
                       const dayName = d.toLocaleDateString('en-US', { weekday: 'narrow' });
                       const dayNum = d.getDate();
                       const isToday = date === new Date().toISOString().split('T')[0];
                       return (
                           <View key={date} style={[styles.dayHeaderCell, isToday && styles.todayHeaderCell]}>
                               <Text style={[styles.dayName, isToday && styles.todayHeaderText]}>{dayName}</Text>
                               <Text style={[styles.dayNum, isToday && styles.todayHeaderText]}>{dayNum}</Text>
                           </View>
                       )
                   })}
              </View>
          </View>
      )
  }

  const renderHabitRow = ({ item }: { item: Habit }) => {
    return (
      <HabitCard 
        habit={item}
        entries={entries[item.id] || {}}
        weekDates={weekDates}
        onDayPress={(date) => handleDayPress(item, date)}
        onPress={() => navigation.navigate('Analytics', { habitId: item.id, habitName: item.name })}
      />
    );
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning ☀️';
    if (hour < 18) return 'Good Afternoon 🌤️';
    return 'Good Evening 🌙';
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={THEME.colors.background} />
      <Header 
        title={getGreeting()}
        subtitle="Let's crush your goals today!"
        rightAction={
            <TouchableOpacity onPress={() => navigation.navigate('OverallReport')}>
                 <Ionicons name="stats-chart" size={24} color={THEME.colors.primary} />
            </TouchableOpacity>
        }
      />
      {renderHeader()}
      
      <FlatList
        data={habits}
        keyExtractor={(item) => item.id}
        renderItem={renderHabitRow}
        contentContainerStyle={styles.listContent}
        refreshControl={
            <RefreshControl 
                refreshing={loading} 
                onRefresh={loadData} 
                tintColor={THEME.colors.primary}
            />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconContainer}>
               <Ionicons name="leaf-outline" size={64} color={THEME.colors.success} />
            </View>
            <Text style={styles.emptyTitle}>No habits yet</Text>
            <Text style={styles.emptyText}>Small steps lead to big changes. Start your journey now!</Text>
            <Button 
                title="Create First Habit" 
                onPress={() => navigation.navigate('AddHabit')} 
                size="md"
            />
          </View>
        }
      />
      
      <TouchableOpacity
           style={styles.fab}
           onPress={() => navigation.navigate('AddHabit')}
           activeOpacity={0.8}
         >
           <Ionicons name="add" size={32} color="#FFF" />
      </TouchableOpacity>

      {/* Action Modal */}
      <Modal
        visible={actionModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setActionModalVisible(false)}
      >
        <TouchableOpacity 
            style={styles.modalOverlay} 
            activeOpacity={1} 
            onPress={() => setActionModalVisible(false)}
        >
            <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
                <Text style={styles.modalTitle}>Update Progress</Text>
                <Text style={styles.modalSubtitle}>{selectedDate}</Text>
                
                <View style={styles.modalActionRow}>
                     <TouchableOpacity 
                        style={[styles.actionBtn, { backgroundColor: THEME.colors.success + '20' }]}
                        onPress={() => {
                            if(selectedHabitId && selectedDate) saveEntryValue(selectedHabitId, selectedDate, true);
                            setActionModalVisible(false);
                        }}
                     >
                         <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
                            <Ionicons name="checkmark-circle" size={48} color={THEME.colors.success} />
                         </Animated.View>
                         <Text style={[styles.actionLabel, { color: THEME.colors.success }]}>Completed</Text>
                     </TouchableOpacity>

                     <TouchableOpacity 
                        style={[styles.actionBtn, { backgroundColor: THEME.colors.error + '20' }]}
                        onPress={() => {
                            if(selectedHabitId && selectedDate) saveEntryValue(selectedHabitId, selectedDate, false);
                            setActionModalVisible(false);
                        }}
                     >
                         <Ionicons name="close-circle" size={48} color={THEME.colors.error} />
                         <Text style={[styles.actionLabel, { color: THEME.colors.error }]}>Missed</Text>
                     </TouchableOpacity>
                </View>

                <Button 
                    title="Clear Entry" 
                    variant="text" 
                    onPress={() => {
                        if(selectedHabitId && selectedDate) saveEntryValue(selectedHabitId, selectedDate, null);
                        setActionModalVisible(false);
                    }}
                    style={{ marginTop: 16 }}
                />
            </View>
        </TouchableOpacity>
      </Modal>

      {/* Input Modal */}
      <Modal
        visible={inputModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setInputModalVisible(false)}
      >
         <TouchableOpacity 
            style={styles.modalOverlay} 
            activeOpacity={1} 
            onPress={() => setInputModalVisible(false)}
        >
          <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
            <Text style={styles.modalTitle}>Log Value</Text>
            <Text style={styles.modalSubtitle}>{selectedDate}</Text>
            <TextInput 
                style={styles.modalInput}
                value={inputValue}
                onChangeText={setInputValue}
                placeholder="Enter value (e.g., 5, 10mins)"
                autoFocus
                keyboardType="default"
                placeholderTextColor={THEME.colors.textLight}
            />
            <View style={styles.modalBtnRow}>
                <Button 
                    title="Cancel" 
                    variant="text" 
                    onPress={() => setInputModalVisible(false)} 
                    style={{ flex: 1, marginRight: 8 }}
                />
                <Button 
                    title="Save" 
                    onPress={handleSaveInput} 
                    style={{ flex: 1, marginLeft: 8 }}
                />
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  listContent: {
    paddingBottom: 100,
    paddingTop: THEME.spacing.md
  },
  calendarStrip: {
      backgroundColor: THEME.colors.surface,
      paddingVertical: THEME.spacing.sm,
      borderBottomLeftRadius: THEME.borderRadius.lg,
      borderBottomRightRadius: THEME.borderRadius.lg,
      ...THEME.shadows.light,
      zIndex: 1,
      marginBottom: THEME.spacing.xs
  },
  calendarHeader: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: THEME.spacing.sm
  },
  navButton: {
      padding: 8,
  },
  weekTitle: {
      fontSize: THEME.fonts.size.subhead,
      fontWeight: '600',
      color: THEME.colors.text,
      marginHorizontal: 16,
      minWidth: 120,
      textAlign: 'center'
  },
  daysRow: {
      flexDirection: 'row',
      paddingHorizontal: THEME.spacing.md + 12, // Align roughly with cards
      justifyContent: 'space-between'
  },
  dayHeaderCell: {
      alignItems: 'center',
      width: 36,
      justifyContent: 'center',
      borderRadius: 18,
      height: 50
  },
  todayHeaderCell: {
      backgroundColor: THEME.colors.primary,
  },
  dayName: {
      fontSize: 10,
      color: THEME.colors.textLight,
      marginBottom: 2,
      fontWeight: '600'
  },
  dayNum: {
      fontSize: 14,
      fontWeight: 'bold',
      color: THEME.colors.text
  },
  todayHeaderText: {
      color: '#FFF'
  },
  fab: {
    position: 'absolute',
    bottom: 32,
    right: 32,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: THEME.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...THEME.shadows.strong,
  },
  emptyContainer: {
      alignItems: 'center',
      marginTop: 60,
      paddingHorizontal: 40
  },
  emptyIconContainer: {
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: THEME.colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 24,
      ...THEME.shadows.medium
  },
  emptyTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: THEME.colors.text,
      marginBottom: 8
  },
  emptyText: {
      marginBottom: 32,
      fontSize: 16,
      color: THEME.colors.textLight,
      textAlign: 'center',
      lineHeight: 24
  },
  modalOverlay: {
      flex: 1,
      backgroundColor: THEME.colors.overlay,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 24
  },
  modalContent: {
      backgroundColor: THEME.colors.surface,
      padding: 24,
      borderRadius: THEME.borderRadius.xl,
      width: '100%',
      ...THEME.shadows.strong,
      alignItems: 'center'
  },
  modalTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: THEME.colors.text,
      marginBottom: 4
  },
  modalSubtitle: {
      fontSize: 14,
      color: THEME.colors.textLight,
      marginBottom: 24
  },
  modalActionRow: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      width: '100%',
      marginBottom: 16
  },
  actionBtn: {
      alignItems: 'center',
      justifyContent: 'center',
      padding: 16,
      borderRadius: THEME.borderRadius.lg,
      width: 100,
      height: 100
  },
  actionLabel: {
      marginTop: 8,
      fontWeight: '600',
      fontSize: 12
  },
  modalInput: {
      borderWidth: 1,
      borderColor: THEME.colors.border,
      borderRadius: THEME.borderRadius.md,
      padding: 16,
      fontSize: 18,
      width: '100%',
      marginBottom: 24,
      backgroundColor: THEME.colors.background,
      color: THEME.colors.text
  },
  modalBtnRow: {
      flexDirection: 'row',
      width: '100%'
  }
});
