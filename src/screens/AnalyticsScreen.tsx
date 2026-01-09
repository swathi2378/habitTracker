import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';
import { getEntriesForHabit, getHabits, updateHabit, deleteHabit } from '../utilities/storage';
import { Entry, Habit } from '../utilities/types';
import { Ionicons } from '@expo/vector-icons';
import { THEME } from '../utilities/theme';
import { Header } from '../components/Header';
import { Card } from '../components/Card';
import { Button } from '../components/Button';

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
    numericTotal: 0,
    numericAvg: 0,
    numericBest: 0,
    bestDay: '',
    dayStats: {} as Record<string, number>
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
    const allHabits = await getHabits();
    const currentHabit = allHabits.find(h => h.id === habitId);
    
    if (currentHabit) {
        setHabitDetails(currentHabit);
        setEditName(currentHabit.name);
    }

    const data = await getEntriesForHabit(habitId);
    setEntries(data);
    
    calculateStats(data, currentHabit);
  };

  const calculateStats = (explicitEntries: Entry[], habit: Habit | undefined) => {
    const entryMap = new Map();
    explicitEntries.forEach(e => entryMap.set(e.date, e));

    let yes = 0;
    let no = 0;
    let currentStreak = 0;
    let streakBroken = false;

    const today = new Date();
    let startDate = habit ? new Date(habit.createdAt) : new Date();
    
    if (explicitEntries.length > 0) {
        const sorted = [...explicitEntries].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        const firstEntryDate = new Date(sorted[0].date);
        if (firstEntryDate < startDate) {
            startDate = firstEntryDate;
        }
    }
    
    const todayFloored = new Date(today);
    todayFloored.setHours(0,0,0,0);
    const startFloored = new Date(startDate);
    startFloored.setHours(0,0,0,0);
    
    const diffTime = Math.abs(todayFloored.getTime() - startFloored.getTime());
    const totalDays = Math.max(1, Math.min(Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1, 3650)); 
    
    for (let i = 0; i < totalDays; i++) {
        const d = new Date(today); 
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        
        const entry = entryMap.get(dateStr);
        let isSuccess = false;

        if (entry) {
            if (entry.value === true) {
                yes++;
                isSuccess = true;
            }
            else if (entry.value === false) {
                 no++;
                 isSuccess = false;
            }
            else if (entry.value !== null && entry.value !== '') {
                 yes++; 
                 isSuccess = true;
            }
        } else {
            if (habit?.frequency === 'everyday' || !habit?.frequency) {
                if (i > 0) {
                   no++;
                }
                isSuccess = false;
            }
        }

        if (!streakBroken) {
            if (isSuccess) {
                currentStreak++;
            } else {
                if (i === 0 && !isSuccess) {
                    // today pending
                } else {
                    streakBroken = true;
                }
            }
        }
    }

    // Numeric Stats Calculation
    let numericTotal = 0;
    let numericCount = 0;
    let numericBest = 0;
    const dayTotals: Record<string, number> = {};
    const dayCounts: Record<string, number> = {};

    if (habit?.type !== 'yes-no') {
        explicitEntries.forEach(e => {
            const val = parseFloat(String(e.value));
            if (!isNaN(val)) {
                numericTotal += val;
                numericCount++;
                if (val > numericBest) numericBest = val;
                
                // Day of Week Stats
                const day = new Date(e.date).toLocaleDateString('en-US', { weekday: 'short' });
                dayTotals[day] = (dayTotals[day] || 0) + val;
                dayCounts[day] = (dayCounts[day] || 0) + 1;
            }
        });
    }

    const numericAvg = numericCount > 0 ? Math.round((numericTotal / numericCount) * 10) / 10 : 0;
    
    // Find Best Day by Average
    let bestDay = '-';
    let maxDayAvg = 0;
    Object.keys(dayTotals).forEach(day => {
        const avg = dayTotals[day] / dayCounts[day];
        if (avg > maxDayAvg) {
            maxDayAvg = avg;
            bestDay = day;
        }
    });

    const totalCalculated = yes + no;
    const rate = totalCalculated > 0 ? Math.round((yes / totalCalculated) * 100) : 0;
    
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
      numericTotal,
      numericAvg,
      numericBest,
      bestDay,
      dayStats: dayTotals // Simplified to totals for now or averages if preferred
    });
  };

  const handleSaveEdit = async () => {
      if (!habitDetails || !editName.trim()) return;
      
      const updated: Habit = { ...habitDetails, name: editName };
      await updateHabit(updated);
      
      setHabitDetails(updated);
      setEditModalVisible(false);
      setEditModalVisible(false);
  };

  const handleDelete = () => {
      Alert.alert(
          "Delete Habit",
          "Are you sure you want to delete this habit? All history will be lost.",
          [
              { text: "Cancel", style: "cancel" },
              { 
                  text: "Delete", 
                  style: "destructive",
                  onPress: async () => {
                      await deleteHabit(habitId);
                      setEditModalVisible(false);
                      navigation.navigate('Home');
                  }
              }
          ]
      );
  };

  return (
    <View style={styles.screen}>
        <Header 
            title="Analytics" 
            showBack 
            onBack={() => navigation.goBack()}
            rightAction={
                <TouchableOpacity onPress={() => setEditModalVisible(true)}>
                    <Ionicons name="pencil" size={20} color={THEME.colors.primary} />
                </TouchableOpacity>
            }
        />
        <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.habitTitle}>{habitDetails ? habitDetails.name : habitName}</Text>
        
        <Card style={styles.scoreCard}>
            <Text style={styles.scoreTitle}>Habit Score</Text>
            <Text style={styles.scoreValue}>{stats.score}</Text>
            <Text style={styles.motive}>{stats.message}</Text>
        </Card>

        <View style={styles.statsRow}>
            {habitDetails?.type === 'yes-no' ? (
                <>
                <Card style={[styles.miniCard, { backgroundColor: '#e3f2fd', borderWidth: 0 }]}>
                    <Text style={styles.miniLabel}>Streak</Text>
                    <Text style={[styles.miniValue, { color: '#1565c0' }]}>{stats.currentStreak} days</Text>
                </Card>
                <Card style={[styles.miniCard, { backgroundColor: '#e8f5e9', borderWidth: 0, marginLeft: 16 }]}>
                    <Text style={styles.miniLabel}>Completion</Text>
                    <Text style={[styles.miniValue, { color: '#2e7d32' }]}>{stats.completionRate}%</Text>
                </Card>
                </>
            ) : (
                <>
                <Card style={[styles.miniCard, { backgroundColor: '#e0f7fa', borderWidth: 0 }]}>
                    <Text style={styles.miniLabel}>Total</Text>
                    <Text style={[styles.miniValue, { color: '#006064' }]}>{stats.numericTotal}</Text>
                </Card>
                <Card style={[styles.miniCard, { backgroundColor: '#fff3e0', borderWidth: 0, marginLeft: 16 }]}>
                    <Text style={styles.miniLabel}>Average</Text>
                    <Text style={[styles.miniValue, { color: '#e65100' }]}>{stats.numericAvg}</Text>
                </Card>
                </>
            )}
        </View>

        <Card style={styles.card}>
            <Text style={styles.subHeader}>Deep Dive</Text>
            {habitDetails?.type === 'yes-no' ? (
                <View style={styles.breakdownRow}>
                    <Text style={styles.breakdownText}>✅ Completed: {stats.yesCount}</Text>
                    <Text style={styles.breakdownText}>❌ Missed: {stats.noCount}</Text>
                    <Text style={styles.breakdownText}>📝 Total Logged: {stats.totalCount}</Text>
                </View>
            ) : (
                 <View style={styles.breakdownRow}>
                    <Text style={styles.breakdownText}>🏆 Personal Best: {stats.numericBest}</Text>
                    <Text style={styles.breakdownText}>📅 Best Performer: {stats.bestDay}</Text>
                    <Text style={styles.breakdownText}>📝 Total Entries: {stats.totalCount}</Text>
                    
                    <View style={{ marginTop: 16 }}>
                        <Text style={[styles.breakdownText, { fontWeight: 'bold' }]}>Weekly Volume</Text>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
                            {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(day => (
                                <View key={day} style={{ alignItems: 'center' }}>
                                    <View style={{ 
                                        height: 60, 
                                        width: 8, 
                                        backgroundColor: '#f0f0f0', 
                                        borderRadius: 4, 
                                        justifyContent: 'flex-end',
                                        overflow: 'hidden'
                                    }}>
                                        <View style={{ 
                                            height: `${Math.min(((stats.dayStats[day] || 0) / (stats.numericBest || 1)) * 100, 100)}%`, 
                                            backgroundColor: THEME.colors.primary,
                                            borderRadius: 4
                                        }} />
                                    </View>
                                    <Text style={{ fontSize: 10, color: '#999', marginTop: 4 }}>{day.charAt(0)}</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                 </View>
            )}
        </Card>

        <View style={{ marginTop: 24 }}>
            <Text style={[styles.subHeader, { marginLeft: 4 }]}>History Log</Text>
            {entries.length === 0 ? (
                <Text style={styles.emptyText}>No entries yet.</Text>
            ) : (
                entries.map((entry, index) => (
                    <Card key={index} style={styles.historyCard} variant="flat">
                        <Text style={styles.date}>{entry.date}</Text>
                        <View style={styles.valueBadget}>
                            <Text style={styles.valueText}>
                                {entry.value === true ? 'Yes' : entry.value === false ? 'No' : String(entry.value)}
                            </Text>
                        </View>
                    </Card>
                ))
            )}
        </View>

        <Modal
            visible={editModalVisible}
            transparent
            animationType="fade"
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
                        <Button title="Cancel" variant="text" onPress={() => setEditModalVisible(false)} style={{ flex: 1 }} />
                        <Button title="Save" onPress={handleSaveEdit} style={{ flex: 1 }} />
                    </View>
                    <Button 
                        title="Delete Habit" 
                        variant="danger" 
                        onPress={handleDelete} 
                        style={{ marginTop: 16, width: '100%' }}
                    />
                </View>
            </View>
        </Modal>
        </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
      flex: 1,
      backgroundColor: THEME.colors.background
  },
  container: {
    padding: THEME.spacing.md,
    paddingBottom: 40
  },
  habitTitle: {
    fontSize: THEME.fonts.size.h2,
    fontWeight: 'bold',
    marginBottom: THEME.spacing.lg,
    color: THEME.colors.text,
    textAlign: 'center',
  },
  card: {
      marginBottom: THEME.spacing.md
  },
  scoreCard: {
      alignItems: 'center',
      marginBottom: THEME.spacing.lg,
      backgroundColor: THEME.colors.surface
  },
  scoreTitle: {
      fontSize: 12,
      textTransform: 'uppercase',
      color: THEME.colors.textLight,
      fontWeight: '600',
      letterSpacing: 1
  },
  scoreValue: {
      fontSize: 48,
      fontWeight: 'bold',
      color: THEME.colors.primary,
      marginVertical: 4
  },
  motive: {
      fontSize: 16,
      color: THEME.colors.text,
      fontWeight: '500'
  },
  statsRow: {
      flexDirection: 'row',
      marginBottom: THEME.spacing.lg
  },
  miniCard: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: 20
  },
  miniLabel: {
      fontSize: 12,
      color: '#555',
      marginBottom: 4,
      textTransform: 'uppercase'
  },
  miniValue: {
      fontSize: 24,
      fontWeight: 'bold'
  },
  subHeader: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
    color: THEME.colors.text
  },
  breakdownRow: {
      marginTop: 8
  },
  breakdownText: {
      fontSize: 16,
      color: THEME.colors.text,
      marginBottom: 8
  },
  historyCard: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: THEME.colors.border,
      borderRadius: 0,
      paddingHorizontal: 0
  },
  date: {
    fontSize: 16,
    color: THEME.colors.text,
  },
  valueBadget: {
      backgroundColor: THEME.colors.background,
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 12
  },
  valueText: {
    fontSize: 14,
    fontWeight: '600',
    color: THEME.colors.text,
  },
  emptyText: {
      color: THEME.colors.textLight,
      fontStyle: 'italic',
      marginTop: 8
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
    borderRadius: THEME.borderRadius.lg,
    width: '100%',
    ...THEME.shadows.strong
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: THEME.colors.text
  },
  label: {
      fontSize: 14,
      color: THEME.colors.textLight,
      marginBottom: 8
  },
  input: {
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: THEME.borderRadius.md,
    padding: 12,
    fontSize: 16,
    marginBottom: 24,
    color: THEME.colors.text
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12
  }
});
