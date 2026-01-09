import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { getHabits, getEntriesForHabit } from '../utilities/storage';
import { Ionicons } from '@expo/vector-icons';
import { THEME } from '../utilities/theme';
import { Header } from '../components/Header';
import { Card } from '../components/Card';

export default function OverallReportScreen({ navigation }: any) {
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
    <View style={styles.screen}>
         <Header 
            title="Summary Report" 
            showBack 
            onBack={() => navigation.goBack()}
         />
        <ScrollView 
            contentContainerStyle={styles.container}
            refreshControl={<RefreshControl refreshing={loading} onRefresh={loadData} tintColor={THEME.colors.primary} />}
        >
        
        <Card style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Global Success Rate</Text>
            <Text style={styles.summaryValue}>{stats.globalRate}%</Text>
        </Card>

        <View style={styles.row}>
            <Card style={[styles.miniCard, { backgroundColor: '#e8f5e9', borderWidth: 0 }]}>
                <Ionicons name="trophy" size={24} color="#2e7d32" />
                <Text style={styles.miniLabel}>Best Habit</Text>
                <Text style={styles.miniValue} numberOfLines={1}>{stats.bestHabit}</Text>
            </Card>
            <Card style={[styles.miniCard, { backgroundColor: '#ffebee', borderWidth: 0, marginLeft: 16 }]}>
                <Ionicons name="alert-circle" size={24} color="#c62828" />
                <Text style={styles.miniLabel}>Needs Focus</Text>
                <Text style={styles.miniValue} numberOfLines={1}>{stats.worstHabit}</Text>
            </Card>
        </View>

        <Text style={styles.subHeader}>Habit Performance</Text>
        {stats.habitStats.map((item, index) => (
            <Card key={index} style={styles.habitRow} variant="flat">
                <View style={styles.habitInfo}>
                    <Text style={styles.habitName}>{item.name}</Text>
                    <Text style={[styles.habitRate, { color: item.rate >= 50 ? THEME.colors.success : THEME.colors.error }]}>{item.rate}%</Text>
                </View>
                <View style={styles.progressBarBg}>
                    <View style={[styles.progressBarFill, { width: `${item.rate}%`, backgroundColor: item.rate >= 50 ? THEME.colors.success : THEME.colors.error }]} />
                </View>
            </Card>
        ))}

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
    paddingBottom: 40,
  },
  summaryCard: {
      padding: 32,
      alignItems: 'center',
      marginBottom: THEME.spacing.lg,
      backgroundColor: THEME.colors.surface
  },
  summaryLabel: {
      fontSize: 14,
      color: THEME.colors.textLight,
      textTransform: 'uppercase',
      letterSpacing: 1,
      marginBottom: 8
  },
  summaryValue: {
      fontSize: 56,
      fontWeight: 'bold',
      color: THEME.colors.primary
  },
  row: {
      flexDirection: 'row',
      marginBottom: THEME.spacing.xl
  },
  miniCard: {
      flex: 1,
      padding: 16,
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
      color: THEME.colors.text,
      textAlign: 'center'
  },
  subHeader: {
      fontSize: 20,
      fontWeight: 'bold',
      marginBottom: 16,
      color: THEME.colors.text
  },
  habitRow: {
      marginBottom: 0,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: '#f0f0f0',
      borderRadius: 0,
      marginHorizontal: 0,
      paddingHorizontal: 0
  },
  habitInfo: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 8
  },
  habitName: {
      fontSize: 16,
      fontWeight: '500',
      color: THEME.colors.text
  },
  habitRate: {
      fontSize: 14,
      fontWeight: 'bold'
  },
  progressBarBg: {
      height: 8,
      backgroundColor: THEME.colors.background,
      borderRadius: 4,
      overflow: 'hidden'
  },
  progressBarFill: {
      height: '100%',
      borderRadius: 4
  }
});
