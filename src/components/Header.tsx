import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Platform, StatusBar } from 'react-native';
import { THEME } from '../utilities/theme';
import { Ionicons } from '@expo/vector-icons';

interface HeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  rightAction?: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({ 
    title, 
    subtitle, 
    showBack, 
    onBack, 
    rightAction 
}) => {
  return (
    <View style={styles.container}>
      <SafeAreaView style={{ backgroundColor: THEME.colors.background }}>
        <View style={styles.content}>
            <View style={styles.leftContainer}>
                {showBack && (
                    <TouchableOpacity onPress={onBack} style={styles.backButton}>
                        <Ionicons name="chevron-back" size={28} color={THEME.colors.text} />
                    </TouchableOpacity>
                )}
                <View>
                    <Text style={styles.title}>{title}</Text>
                    {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
                </View>
            </View>
            {rightAction && <View style={styles.rightContainer}>{rightAction}</View>}
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: THEME.colors.background,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  content: {
      paddingHorizontal: THEME.spacing.md,
      paddingVertical: THEME.spacing.md,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between'
  },
  leftContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
  },
  rightContainer: {
      marginLeft: THEME.spacing.md
  },
  backButton: {
      marginRight: THEME.spacing.sm,
      padding: 4 // hit slop
  },
  title: {
      fontSize: THEME.fonts.size.title,
      fontWeight: 'bold',
      color: THEME.colors.text,
  },
  subtitle: {
      fontSize: THEME.fonts.size.caption,
      color: THEME.colors.textLight,
      marginTop: 2
  }
});
