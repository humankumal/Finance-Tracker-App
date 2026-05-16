import React from 'react';
import { View, Text, ViewStyle } from 'react-native';
import { Colors, FontSize, Radius, Spacing } from '../../constants/theme';

interface BadgeProps {
  label: string;
  color?: string;
  textColor?: string;
  style?: ViewStyle;
}

export function Badge({
  label,
  color = Colors.accent,
  textColor = Colors.white,
  style,
}: BadgeProps) {
  return (
    <View
      style={[
        {
          backgroundColor: color + '33',
          borderRadius: Radius.full,
          paddingHorizontal: Spacing.sm,
          paddingVertical: 3,
          alignSelf: 'flex-start',
          borderWidth: 1,
          borderColor: color + '66',
        },
        style,
      ]}
    >
      <Text style={{ color: textColor, fontSize: FontSize.xs, fontWeight: '600' }}>
        {label}
      </Text>
    </View>
  );
}
