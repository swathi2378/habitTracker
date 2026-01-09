import React from 'react';
import { View, StyleSheet, ViewStyle, Pressable, StyleProp } from 'react-native';
import { THEME } from '../utilities/theme';

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  variant?: 'elevated' | 'flat' | 'outlined';
}

export const Card: React.FC<CardProps> = ({ 
    children, 
    style, 
    onPress, 
    variant = 'elevated' 
}) => {
  const containerStyle = [
      styles.card, 
      variant === 'elevated' && styles.elevated,
      variant === 'outlined' && styles.outlined,
      variant === 'flat' && styles.flat,
      style
  ];

  if (onPress) {
      return (
          <Pressable 
            style={({ pressed }) => [
                containerStyle,
                pressed && styles.pressed
            ]}
            onPress={onPress}
          >
              {children}
          </Pressable>
      )
  }

  return (
    <View style={containerStyle}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.borderRadius.md,
    padding: THEME.spacing.md,
  },
  elevated: {
    ...THEME.shadows.light, // Default to light shadow for cleaner look
  },
  flat: {
      backgroundColor: 'transparent',
  },
  outlined: {
      borderWidth: 1,
      borderColor: THEME.colors.border,
      backgroundColor: 'transparent'
  },
  pressed: {
      opacity: 0.9,
      transform: [{ scale: 0.99 }]
  }
});
