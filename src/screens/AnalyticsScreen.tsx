import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput, Button } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';
import { getEntriesForHabit, getHabits, updateHabit } from '../utilities/storage';
import { Entry, Habit } from '../utilities/types';
import { Ionicons } from '@expo/vector-icons';

type Props = NativeStackScreenProps<RootStackParamList, 'Analytics'>;

export default function AnalyticsScreen({ route, navigation }: Props) {
  const { habitId, habitName } = route.params;
  const [entries, setEntries] = useState<Entry[]>([]);
  const [stats, setStats] = useState({
    totalCount: 0,
    completionRate: 0,
    currentStreak: 0,
    score: 0,
    message: '',
    yesCount: 0,
    noCount: 0,
  });

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editName, setEditName] = useState(habitName);
  const [habitDetails, setHabitDetails] = useState<Habit | null>(null);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [habitId])
  );

  const loadData = async () => {
    // 1. Fetch Habit Details First
    const allHabits = await getHabits();
    const currentHabit = allHabits.find(h => h.id === habitId);
    
    if (currentHabit) {
        setHabitDetails(currentHabit);
        setEditName(currentHabit.name);
        navigation.setOptions({ 
            headerRight: () => (
                <TouchableOpacity onPress={() => setEditModalVisible(true)} style={{ marginRight: 10 }}>
                    <Ionicons name="pencil" size={24} color="#007AFF" />
                </TouchableOpacity>
            )
        });
    }

    // 2. Fetch Entries
    const data = await getEntriesForHabit(habitId);
    setEntries(data);
    
    // 3. Calculate Stats with both
    calculateStats(data, currentHabit);
  };

  const calculateStats = (explicitEntries: Entry[], habit: Habit | undefined) => {
    // Create a map for easy lookup
    const entryMap = new Map();
    explicitEntries.forEach(e => entryMap.set(e.date, e));

    let yes = 0;
    let no = 0;
    let currentStreak = 0;
    let streakBroken = false;

    // Determine Date Range
    // From createdAt to Today, OR earliest entry date if older
    const today = new Date();
    // note: Do NOT setHours(0,0,0,0) on 'today' used for string gen, otherwise UTC date might shift back
    // relative to HomeScreen's new Date().ToISOString().
    
    let startDate = habit ? new Date(habit.createdAt) : new Date();
    
    // Check if we have entries older than createdAt
    if (explicitEntries.length > 0) {
        const sorted = [...explicitEntries].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        const firstEntryDate = new Date(sorted[0].date);
        if (firstEntryDate < startDate) {
            startDate = firstEntryDate;
        }
    }
    
    // Normalize for day count calculation ONLY
    const todayFloored = new Date(today);
    todayFloored.setHours(0,0,0,0);
    const startFloored = new Date(startDate);
    startFloored.setHours(0,0,0,0);
    
    // Safety check for crazy dates
    const diffTime = Math.abs(todayFloored.getTime() - startFloored.getTime());
    const totalDays = Math.max(1, Math.min(Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1, 3650)); 
    
    // Check habits from Today backwards
    for (let i = 0; i < totalDays; i++) {
        const d = new Date(today); // Use 'today' with current time to match HomeScreen ISO generation
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        
        const entry = entryMap.get(dateStr);
        let isSuccess = false;

        if (entry) {
            // Explicit entry exists
            if (entry.value === true) {
                yes++;
                isSuccess = true;
            }
            else if (entry.value === false) {
                 no++;
                 isSuccess = false;
            }
            else if (entry.value !== null && entry.value !== '') {
                 yes++; // value exists means success
                 isSuccess = true;
            }
        } else {
            // No explicit entry - infer based on frequency
            if (habit?.frequency === 'everyday' || !habit?.frequency) {
                // If it's today (i===0), and no entry, it's not "missed" yet? 
                // BUT user wants correct completion rate. Usually "today pending" doesn't count as missed.
                // However, if we don't count it, completion is 100% if only yesterday was done.
                // Let's count it as missed if it's NOT today.
                if (i > 0) {
                   no++;
                }
                isSuccess = false;
            }
        }

        // Streak Calculation
        if (!streakBroken) {
            if (isSuccess) {
                currentStreak++;
            } else {
                // If it's today and not done, streak is maintained from yesterday?
                // Standard logic: Current Streak is contiguous days ENDING today or yesterday.
                // If today is done -> Streak++
                // If today is NOT done -> Streak is yesterday's streak.
                // UNLESS yesterday was also not done -> Streak = 0.
                if (i === 0 && !isSuccess) {
                    // Today not done. Continue to check yesterday.
                    // Do nothing.
                } else {
                    streakBroken = true;
                }
            }
        }
    }

    const totalCalculated = yes + no;
    const rate = totalCalculated > 0 ? Math.round((yes / totalCalculated) * 100) : 0;
    
    // Motivational Message
    let msg = "Start building your habit!";
    if (rate >= 90) msg = "You're on fire! 🔥";
    else if (rate >= 50) msg = "Keep it up! 👍";
    else if (totalCalculated > 0) msg = "Don't give up! 🌱";

    setStats({
      totalCount: totalCalculated,
      completionRate: rate,
      currentStreak: currentStreak,
      score: rate,
      message: msg,
      yesCount: yes,
      noCount: no,
    });
  };

  const handleSaveEdit = async () => {
      if (!habitDetails || !editName.trim()) return;
      
      const updated: Habit = { ...habitDetails, name: editName };
      await updateHabit(updated);
      
      setHabitDetails(updated);
      setEditModalVisible(false);
      
      navigation.setOptions({ title: editName }); 
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{habitDetails ? habitDetails.name : habitName}</Text>
      
      {/* Score Card */}
      <View style={[styles.card, styles.scoreCard]}>
          <Text style={styles.scoreTitle}>Habit Score</Text>
          <Text style={styles.scoreValue}>{stats.score}</Text>
          <Text style={styles.motive}>{stats.message}</Text>
      </View>

      <View style={styles.statsRow}>
          <View style={[styles.miniCard, { backgroundColor: '#e3f2fd' }]}>
              <Text style={styles.miniLabel}>Streak</Text>
              <Text style={[styles.miniValue, { color: '#1565c0' }]}>{stats.currentStreak} days</Text>
          </View>
          <View style={[styles.miniCard, { backgroundColor: '#e8f5e9' }]}>
              <Text style={styles.miniLabel}>Completion</Text>
              <Text style={[styles.miniValue, { color: '#2e7d32' }]}>{stats.completionRate}%</Text>
          </View>
      </View>

      <View style={styles.card}>
          <Text style={styles.subHeader}>Breakdown</Text>
          <View style={styles.breakdownRow}>
              <Text style={styles.breakdownText}>✅ Completed: {stats.yesCount}</Text>
              <Text style={styles.breakdownText}>❌ Missed: {stats.noCount}</Text>
              <Text style={styles.breakdownText}>📝 Total Logged: {stats.totalCount}</Text>
          </View>
      </View>

      <Text style={styles.subHeader}>History Log</Text>
      {entries.map((entry, index) => (
        <View key={index} style={styles.historyRow}>
          <Text style={styles.date}>{entry.date}</Text>
          <Text style={styles.value}>
              {entry.value === true ? 'Yes' : entry.value === false ? 'No' : String(entry.value)}
          </Text>
        </View>
      ))}

      <Modal
        visible={editModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Edit Habit</Text>
                <Text style={styles.label}>Name</Text>
                <TextInput
                    style={styles.input}
                    value={editName}
                    onChangeText={setEditName}
                    placeholder="Habit Name"
                />
                <View style={styles.modalActions}>
                    <Button title="Cancel" onPress={() => setEditModalVisible(false)} color="#999" />
                    <Button title="Save" onPress={handleSaveEdit} />
                </View>
            </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#fff',
    flexGrow: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 2,
  },
  scoreCard: {
      alignItems: 'center',
      backgroundColor: '#f8f9fa',
      borderColor: '#e9ecef'
  },
  scoreTitle: {
      fontSize: 14,
      textTransform: 'uppercase',
      color: '#6c757d',
      fontWeight: '600'
  },
  scoreValue: {
      fontSize: 48,
      fontWeight: 'bold',
      color: '#333',
      marginVertical: 4
  },
  motive: {
      fontSize: 16,
      color: '#007AFF',
      fontWeight: '500'
  },
  statsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 20
  },
  miniCard: {
      flex: 1,
      padding: 16,
      borderRadius: 12,
      alignItems: 'center',
      marginHorizontal: 4
  },
  miniLabel: {
      fontSize: 12,
      color: '#555',
      marginBottom: 4
  },
  miniValue: {
      fontSize: 20,
      fontWeight: 'bold'
  },
  subHeader: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
    color: '#333',
    marginLeft: 4
  },
  breakdownRow: {
      marginTop: 8
  },
  breakdownText: {
      fontSize: 16,
      color: '#444',
      marginBottom: 8
  },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
    alignItems: 'center'
  },
  date: {
    fontSize: 16,
    color: '#555',
  },
  value: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
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
    marginBottom: 16,
    textAlign: 'center'
  },
  label: {
      fontSize: 14,
      color: '#666',
      marginBottom: 8
  },
  input: {
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
