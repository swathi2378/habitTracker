import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { getHabits, getEntriesForHabit } from '../utilities/storage';
import { Habit, Entry } from '../utilities/types';
import { Ionicons } from '@expo/vector-icons';

export default function OverallReportScreen() {
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    globalRate: 0,
    totalHabits: 0,
    bestHabit: '',
    worstHabit: '',
    habitStats: [] as { name: string; rate: number }[],
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const habits = await getHabits();
      const habitStats = [];
      let totalEntries = 0;
      let totalSuccess = 0;

      for (const habit of habits) {
        const entries = await getEntriesForHabit(habit.id);
        const count = entries.length;
        let success = 0;
        entries.forEach(e => {
            if (e.value === true || (e.value !== false && e.value != null)) success++;
        });

        const rate = count > 0 ? Math.round((success / count) * 100) : 0;
        habitStats.push({ name: habit.name, rate });

        totalEntries += count;
        totalSuccess += success;
      }

      habitStats.sort((a, b) => b.rate - a.rate);

      setStats({
        globalRate: totalEntries > 0 ? Math.round((totalSuccess / totalEntries) * 100) : 0,
        totalHabits: habits.length,
        bestHabit: habitStats.length > 0 ? habitStats[0].name : '-',
        worstHabit: habitStats.length > 0 ? habitStats[habitStats.length - 1].name : '-',
        habitStats,
      });

    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView 
        contentContainerStyle={styles.container}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={loadData} />}
    >
      <Text style={styles.title}>Overall Report</Text>

      <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Global Success Rate</Text>
          <Text style={styles.summaryValue}>{stats.globalRate}%</Text>
      </View>

      <View style={styles.row}>
          <View style={[styles.miniCard, { backgroundColor: '#e8f5e9' }]}>
              <Ionicons name="trophy" size={24} color="#2e7d32" />
              <Text style={styles.miniLabel}>Best Habit</Text>
              <Text style={styles.miniValue} numberOfLines={1}>{stats.bestHabit}</Text>
          </View>
          <View style={[styles.miniCard, { backgroundColor: '#ffebee' }]}>
              <Ionicons name="alert-circle" size={24} color="#c62828" />
              <Text style={styles.miniLabel}>Needs Focus</Text>
              <Text style={styles.miniValue} numberOfLines={1}>{stats.worstHabit}</Text>
          </View>
      </View>

      <Text style={styles.subHeader}>Habit Performance</Text>
      {stats.habitStats.map((item, index) => (
          <View key={index} style={styles.habitRow}>
              <View style={styles.habitInfo}>
                  <Text style={styles.habitName}>{item.name}</Text>
                  <Text style={styles.habitRate}>{item.rate}%</Text>
              </View>
              <View style={styles.progressBarBg}>
                  <View style={[styles.progressBarFill, { width: `${item.rate}%`, backgroundColor: item.rate >= 50 ? '#34C759' : '#FF3B30' }]} />
              </View>
          </View>
      ))}

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
  },
  summaryCard: {
      backgroundColor: '#f0f4f8',
      padding: 24,
      borderRadius: 16,
      alignItems: 'center',
      marginBottom: 20,
      borderWidth: 1,
      borderColor: '#e1e4e8'
  },
  summaryLabel: {
      fontSize: 16,
      color: '#555',
      textTransform: 'uppercase',
      letterSpacing: 1,
      marginBottom: 8
  },
  summaryValue: {
      fontSize: 48,
      fontWeight: 'bold',
      color: '#007AFF'
  },
  row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 24
  },
  miniCard: {
      flex: 1,
      padding: 16,
      borderRadius: 12,
      marginHorizontal: 4,
      alignItems: 'center',
      justifyContent: 'center'
  },
  miniLabel: {
      fontSize: 12,
      color: '#666',
      marginTop: 8,
      marginBottom: 4
  },
  miniValue: {
      fontSize: 16,
      fontWeight: 'bold',
      color: '#333',
      textAlign: 'center'
  },
  subHeader: {
      fontSize: 20,
      fontWeight: 'bold',
      marginBottom: 16,
      color: '#333'
  },
  habitRow: {
      marginBottom: 16
  },
  habitInfo: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 6
  },
  habitName: {
      fontSize: 16,
      fontWeight: '500',
      color: '#333'
  },
  habitRate: {
      fontSize: 14,
      fontWeight: 'bold',
      color: '#666'
  },
  progressBarBg: {
      height: 8,
      backgroundColor: '#f0f0f0',
      borderRadius: 4,
      overflow: 'hidden'
  },
  progressBarFill: {
      height: '100%',
      borderRadius: 4
  }
});
