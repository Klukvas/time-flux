import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useTheme } from '@lifespan/hooks';
import { BASE_COLORS, contrastTextColor, generateShades } from '@lifespan/utils';
import { borderRadius, fontSize, spacing } from '@/lib/theme';

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
}

export function ColorPicker({ value, onChange }: ColorPickerProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const { tokens } = useTheme();

  const handleBasePress = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  const borderSelected = tokens.colors.text;
  const borderExpanded = tokens.colors.textSecondary;
  const shadeBg = tokens.colors.bgSecondary;
  const shadeLabel = tokens.colors.textSecondary;

  return (
    <View style={{ gap: spacing.sm }}>
      {/* Base color row */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
        {BASE_COLORS.map((base, index) => {
          const shades = generateShades(base.hex);
          const isSelected =
            value.toUpperCase() === base.hex.toUpperCase() ||
            shades.some((s) => s.toUpperCase() === value.toUpperCase());
          const isExpanded = expandedIndex === index;

          return (
            <Pressable
              key={base.hex}
              onPress={() => handleBasePress(index)}
              style={[
                {
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  borderWidth: 2,
                  borderColor: 'transparent',
                  backgroundColor: base.hex,
                  alignItems: 'center',
                  justifyContent: 'center',
                },
                isSelected && { borderColor: borderSelected, transform: [{ scale: 1.15 }] },
                isExpanded && !isSelected && { borderColor: borderExpanded, transform: [{ scale: 1.15 }] },
              ]}
            >
              {isSelected && !isExpanded && (
                <Text style={{ fontSize: fontSize.sm, fontWeight: '700', color: contrastTextColor(base.hex) }}>
                  ✓
                </Text>
              )}
              {isExpanded && (
                <Text style={{ fontSize: fontSize.xs, fontWeight: '700', color: contrastTextColor(base.hex) }}>
                  ▾
                </Text>
              )}
            </Pressable>
          );
        })}
      </View>

      {/* Shade row */}
      {expandedIndex !== null && (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.sm,
            backgroundColor: shadeBg,
            borderRadius: borderRadius.lg,
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.sm,
          }}
        >
          <Text style={{ fontSize: fontSize.xs, fontWeight: '500', color: shadeLabel, marginRight: spacing.xs }}>
            {BASE_COLORS[expandedIndex].label}
          </Text>
          <View style={{ flexDirection: 'row', gap: spacing.xs + 2 }}>
            {generateShades(BASE_COLORS[expandedIndex].hex).map((shade) => {
              const selected = value.toUpperCase() === shade.toUpperCase();
              return (
                <Pressable
                  key={shade}
                  onPress={() => onChange(shade)}
                  style={[
                    {
                      width: 30,
                      height: 30,
                      borderRadius: 15,
                      borderWidth: 2,
                      borderColor: 'transparent',
                      backgroundColor: shade,
                      alignItems: 'center',
                      justifyContent: 'center',
                    },
                    selected && { borderColor: borderSelected, transform: [{ scale: 1.15 }] },
                  ]}
                >
                  {selected && (
                    <Text style={{ fontSize: fontSize.xs, fontWeight: '700', color: contrastTextColor(shade) }}>
                      ✓
                    </Text>
                  )}
                </Pressable>
              );
            })}
          </View>
        </View>
      )}
    </View>
  );
}
