import React from 'react';
import { View, Text } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Colors, FontSize } from '../../constants/theme';

interface HealthScoreRingProps {
  score: number;
  label: string;
  size?: number;
}

export function HealthScoreRing({ score, label, size = 120 }: HealthScoreRingProps) {
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;

  const color =
    score >= 85 ? Colors.success :
    score >= 70 ? Colors.accent :
    score >= 50 ? Colors.warning :
    Colors.danger;

  return (
    <View style={{ alignItems: 'center' }}>
      <View style={{ width: size, height: size }}>
        <Svg width={size} height={size}>
          {/* Background track */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={Colors.border}
            strokeWidth={strokeWidth}
            fill="none"
          />
          {/* Progress arc */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={`${progress} ${circumference}`}
            strokeLinecap="round"
            rotation="-90"
            origin={`${size / 2}, ${size / 2}`}
          />
        </Svg>
        {/* Score text overlay */}
        <View
          style={{
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ color: color, fontSize: FontSize['2xl'], fontWeight: '800' }}>
            {score}
          </Text>
          <Text style={{ color: Colors.muted, fontSize: FontSize.xs, marginTop: -2 }}>
            /100
          </Text>
        </View>
      </View>
      <Text style={{ color: color, fontSize: FontSize.sm, fontWeight: '700', marginTop: 4 }}>
        {label}
      </Text>
    </View>
  );
}
