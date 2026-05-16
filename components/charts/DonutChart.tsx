import React from 'react';
import { View, Text } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import { Colors, FontSize } from '../../constants/theme';

export interface DonutSlice {
  value: number;
  color: string;
  label: string;
}

interface Props {
  slices: DonutSlice[];
  size?: number;
  centerLabel?: string;
  centerSub?: string;
}

export function DonutChart({ slices, size = 160, centerLabel, centerSub }: Props) {
  const strokeWidth = 22;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const total = slices.reduce((s, sl) => s + sl.value, 0);
  if (total === 0) {
    return (
      <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: Colors.muted, fontSize: FontSize.xs }}>No data</Text>
      </View>
    );
  }

  let offset = 0;
  const rendered = slices.map((sl) => {
    const pct = sl.value / total;
    const dash = pct * circumference;
    const gap = circumference - dash;
    const rotation = (offset / total) * 360 - 90;
    offset += sl.value;
    return { ...sl, dash, gap, rotation };
  });

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        {/* Background track */}
        <Circle
          cx={size / 2} cy={size / 2} r={radius}
          stroke={Colors.border} strokeWidth={strokeWidth} fill="none"
        />
        {/* Slices */}
        <G>
          {rendered.map((sl, i) => (
            <Circle
              key={i}
              cx={size / 2} cy={size / 2} r={radius}
              stroke={sl.color}
              strokeWidth={strokeWidth}
              fill="none"
              strokeDasharray={`${sl.dash} ${sl.gap}`}
              strokeLinecap="butt"
              rotation={sl.rotation}
              origin={`${size / 2}, ${size / 2}`}
            />
          ))}
        </G>
      </Svg>

      {/* Center text */}
      {(centerLabel || centerSub) && (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' }}>
          {centerLabel && (
            <Text style={{ color: Colors.white, fontSize: FontSize.lg, fontWeight: '800' }}>
              {centerLabel}
            </Text>
          )}
          {centerSub && (
            <Text style={{ color: Colors.muted, fontSize: FontSize.xs, marginTop: -2 }}>
              {centerSub}
            </Text>
          )}
        </View>
      )}
    </View>
  );
}
