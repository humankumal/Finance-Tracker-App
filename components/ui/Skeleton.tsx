import React, { useEffect, useRef } from 'react';
import { Animated, ViewStyle } from 'react-native';
import { Colors } from '../../constants/theme';

interface Props {
  width?: number | `${number}%`;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function Skeleton({ width = '100%', height = 16, borderRadius = 8, style }: Props) {
  const anim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 0.9, duration: 700, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0.3, duration: 700, useNativeDriver: true }),
      ]),
    ).start();
  }, [anim]);

  return (
    <Animated.View
      style={[
        { width, height, borderRadius, backgroundColor: Colors.border, opacity: anim },
        style,
      ]}
    />
  );
}

interface SkeletonCardProps {
  rows?: number;
  style?: ViewStyle;
}

export function SkeletonCard({ rows = 3, style }: SkeletonCardProps) {
  return (
    <Animated.View
      style={[
        {
          backgroundColor: Colors.card,
          borderRadius: 14,
          borderWidth: 1,
          borderColor: Colors.border,
          padding: 16,
          gap: 12,
        },
        style,
      ]}
    >
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} width={i === 0 ? '60%' : '100%'} height={i === 0 ? 14 : 12} />
      ))}
    </Animated.View>
  );
}
