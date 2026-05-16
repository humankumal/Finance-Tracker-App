import React from 'react';
import { View, Text, Dimensions } from 'react-native';
import Svg, { Polyline, Circle, Line, Text as SvgText, Rect } from 'react-native-svg';
import type { TrendPoint } from '../../types';
import { Colors, FontSize, Spacing } from '../../constants/theme';

const { width: SCREEN_W } = Dimensions.get('window');
const CHART_H = 140;
const PAD = { top: 12, right: 16, bottom: 28, left: 48 };

function toPoints(
  data: { x: number; y: number }[],
  minY: number,
  maxY: number,
  chartW: number,
): string {
  if (data.length < 2) return '';
  const rangeY = maxY - minY || 1;
  const innerW = chartW - PAD.left - PAD.right;
  const innerH = CHART_H - PAD.top - PAD.bottom;
  return data
    .map(({ x, y }) => {
      const px = PAD.left + (x / (data.length - 1)) * innerW;
      const py = PAD.top + innerH - ((y - minY) / rangeY) * innerH;
      return `${px},${py}`;
    })
    .join(' ');
}

interface Props {
  points: TrendPoint[];
}

export function SpendingTrendChart({ points }: Props) {
  const chartW = SCREEN_W - Spacing.md * 2 - 2; // card padding + border
  if (points.length < 2) {
    return (
      <View style={{ height: CHART_H, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: Colors.muted, fontSize: FontSize.sm }}>Need at least 2 months of data.</Text>
      </View>
    );
  }

  const amounts = points.map((p) => p.amount);
  const emaVals = points.map((p) => p.ema ?? p.amount);
  const allVals = [...amounts, ...emaVals];
  const minY = Math.min(...allVals) * 0.9;
  const maxY = Math.max(...allVals) * 1.1;

  const indexed = points.map((p, i) => ({ x: i, y: p.amount }));
  const emaIndexed = points.map((p, i) => ({ x: i, y: p.ema ?? p.amount }));

  const innerH = CHART_H - PAD.top - PAD.bottom;
  const innerW = chartW - PAD.left - PAD.right;
  const rangeY = maxY - minY || 1;

  function yPx(v: number) {
    return PAD.top + innerH - ((v - minY) / rangeY) * innerH;
  }
  function xPx(i: number) {
    return PAD.left + (i / (points.length - 1)) * innerW;
  }

  // Y-axis gridlines (3 levels)
  const gridLevels = [minY, (minY + maxY) / 2, maxY].map((v) => ({
    y: yPx(v),
    label: `$${Math.round(v)}`,
  }));

  return (
    <Svg width={chartW} height={CHART_H}>
      {/* Grid lines */}
      {gridLevels.map(({ y, label }) => (
        <React.Fragment key={label}>
          <Line x1={PAD.left} y1={y} x2={chartW - PAD.right} y2={y} stroke={Colors.border} strokeWidth={1} strokeDasharray="4,4" />
          <SvgText x={PAD.left - 4} y={y + 4} fill={Colors.muted} fontSize={9} textAnchor="end">{label}</SvgText>
        </React.Fragment>
      ))}

      {/* EMA line */}
      <Polyline
        points={toPoints(emaIndexed, minY, maxY, chartW)}
        fill="none"
        stroke={Colors.warning}
        strokeWidth={2}
        strokeDasharray="6,3"
      />

      {/* Spending bars (as thin rects for visual clarity) */}
      {points.map((p, i) => {
        const barW = Math.max(innerW / points.length - 6, 4);
        const barH = Math.max(((p.amount - minY) / rangeY) * innerH, 2);
        const bx = xPx(i) - barW / 2;
        const by = yPx(p.amount);
        return (
          <Rect
            key={p.date}
            x={bx}
            y={by}
            width={barW}
            height={barH}
            rx={3}
            fill={Colors.accent}
            opacity={0.75}
          />
        );
      })}

      {/* Data dots on spending line */}
      {points.map((p, i) => (
        <Circle key={`dot-${p.date}`} cx={xPx(i)} cy={yPx(p.amount)} r={3} fill={Colors.accent} />
      ))}

      {/* X-axis labels */}
      {points.map((p, i) => (
        <SvgText
          key={`lbl-${p.date}`}
          x={xPx(i)}
          y={CHART_H - 4}
          fill={Colors.muted}
          fontSize={9}
          textAnchor="middle"
        >
          {p.date.slice(5)}
        </SvgText>
      ))}
    </Svg>
  );
}
