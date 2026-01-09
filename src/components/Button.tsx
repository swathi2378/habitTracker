import React from 'react';
import { 
    TouchableOpacity, 
    Text, 
    StyleSheet, 
    ActivityIndicator, 
    ViewStyle, 
    TextStyle,
    StyleProp
} from 'react-native';
import { THEME } from '../utilities/theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'text' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  style,
  textStyle,
  icon
}) => {
  
  const getBackgroundColor = () => {
      if (disabled) return THEME.colors.border;
      switch (variant) {
          case 'primary': return THEME.colors.primary;
          case 'secondary': return THEME.colors.secondary;
          case 'danger': return THEME.colors.error;
          case 'outline': return 'transparent';
          case 'text': return 'transparent';
          default: return THEME.colors.primary;
      }
  };

  const getTextColor = () => {
      if (disabled) return THEME.colors.textLight;
      switch (variant) {
          case 'primary': return '#FFF';
          case 'secondary': return '#FFF';
          case 'danger': return '#FFF';
          case 'outline': return THEME.colors.primary;
          case 'text': return THEME.colors.primary;
          default: return '#FFF';
      }
  };

  const getHeight = () => {
      switch (size) {
          case 'sm': return 32;
          case 'lg': return 56;
          default: return 48;
      }
  };

  const getFontSize = () => {
       switch (size) {
          case 'sm': return 14;
          case 'lg': return 18;
          default: return 16;
       }
  };

  const containerStyle = {
      backgroundColor: getBackgroundColor(),
      height: getHeight(),
      borderRadius: THEME.borderRadius.md,
      borderWidth: variant === 'outline' ? 1 : 0,
      borderColor: variant === 'outline' ? THEME.colors.primary : 'transparent',
      opacity: disabled && variant !== 'outline' ? 0.6 : 1,
      paddingHorizontal: THEME.spacing.md
  };

  return (
    <TouchableOpacity
      style={[styles.container, containerStyle, style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={getTextColor()} />
      ) : (
        <>
            {icon && <>{icon}</>} 
            <Text 
                style={[
                    styles.text, 
                    { color: getTextColor(), fontSize: getFontSize(), marginLeft: icon ? 8 : 0 },
                    textStyle
                ]}
            >
                {title}
            </Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    ...THEME.shadows.light,
    elevation: 0 // Override shadow for flat aesthetic on button unless desired otherwise
  },
  text: {
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});
