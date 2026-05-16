import React from 'react';
import { View, ViewStyle } from 'react-native';
import { Colors, Radius } from '../../constants/theme';

interface ProgressBarProps {
  value: number;
  max: number;
  color?: string;
  height?: number;
  style?: ViewStyle;
}

export function ProgressBar({
  value,
  max,
  color = Colors.accent,
  height = 6,
  style,
}: ProgressBarProps) {
  const pct = max === 0 ? 0 : Math.min(value / max, 1);
  const fillColor = pct >= 1 ? Colors.danger : pct >= 0.8 ? Colors.warning : color;

  return (
    <View
      style={[
        {
          height,
          backgroundColor: Colors.border,
          borderRadius: Radius.full,
          overflow: 'hidden',
        },
        style,
      ]}
    >
      <View
        style={{
          height: '100%',
          width: `${pct * 100}%`,
          backgroundColor: fillColor,
          borderRadius: Radius.full,
        }}
      />
    </View>
  );
}
