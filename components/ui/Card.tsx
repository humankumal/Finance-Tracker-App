import React from 'react';
import { View, ViewStyle } from 'react-native';
import { Colors, Radius, Spacing } from '../../constants/theme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  padding?: number;
}

export function Card({ children, style, padding = Spacing.md }: CardProps) {
  return (
    <View
      style={[
        {
          backgroundColor: Colors.card,
          borderRadius: Radius.lg,
          padding,
          borderWidth: 1,
          borderColor: Colors.border,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
