import React, { useState } from 'react';
import { View, TextInput, Text, TextInputProps, ViewStyle } from 'react-native';
import { Colors, FontSize, Radius, Spacing } from '../../constants/theme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
}

export function Input({ label, error, containerStyle, style, ...props }: InputProps) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={containerStyle}>
      {label && (
        <Text
          style={{
            color: Colors.muted,
            fontSize: FontSize.sm,
            marginBottom: Spacing.xs,
            fontWeight: '500',
          }}
        >
          {label}
        </Text>
      )}
      <TextInput
        {...props}
        onFocus={(e) => { setFocused(true); props.onFocus?.(e); }}
        onBlur={(e) => { setFocused(false); props.onBlur?.(e); }}
        placeholderTextColor={Colors.muted}
        style={[
          {
            backgroundColor: Colors.surface,
            borderRadius: Radius.md,
            borderWidth: 1,
            borderColor: error ? Colors.danger : focused ? Colors.accent : Colors.border,
            color: Colors.white,
            fontSize: FontSize.base,
            paddingHorizontal: Spacing.md,
            paddingVertical: Spacing.sm + 2,
          },
          style,
        ]}
      />
      {error && (
        <Text style={{ color: Colors.danger, fontSize: FontSize.xs, marginTop: Spacing.xs }}>
          {error}
        </Text>
      )}
    </View>
  );
}
