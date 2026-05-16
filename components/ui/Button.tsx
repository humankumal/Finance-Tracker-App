import React from 'react';
import {
  Pressable,
  Text,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Colors, FontSize, Radius, Spacing } from '../../constants/theme';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
}

const variantStyles: Record<Variant, { bg: string; text: string; border?: string }> = {
  primary: { bg: Colors.accent, text: Colors.white },
  secondary: { bg: Colors.surface, text: Colors.white, border: Colors.border },
  danger: { bg: Colors.danger, text: Colors.white },
  ghost: { bg: 'transparent', text: Colors.accent },
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  style,
  textStyle,
  fullWidth = false,
}: ButtonProps) {
  const vs = variantStyles[variant];

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        {
          backgroundColor: vs.bg,
          borderRadius: Radius.md,
          paddingVertical: Spacing.sm + 2,
          paddingHorizontal: Spacing.lg,
          alignItems: 'center' as const,
          justifyContent: 'center' as const,
          flexDirection: 'row' as const,
          borderWidth: vs.border ? 1 : 0,
          borderColor: vs.border,
          opacity: pressed || disabled ? 0.7 : 1,
          width: fullWidth ? '100%' : undefined,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={vs.text} size="small" />
      ) : (
        <Text
          style={[
            { color: vs.text, fontSize: FontSize.base, fontWeight: '600' },
            textStyle,
          ]}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
}
