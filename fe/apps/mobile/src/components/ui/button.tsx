import { ActivityIndicator, Pressable, StyleSheet, Text, type ViewStyle } from 'react-native';
import { colors, borderRadius, spacing, fontSize } from '@/lib/theme';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';

interface ButtonProps {
  title: string;
  variant?: Variant;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}

const variantStyles: Record<Variant, { bg: string; text: string }> = {
  primary: { bg: colors.brand[600], text: colors.white },
  secondary: { bg: colors.gray[100], text: colors.gray[900] },
  danger: { bg: colors.red[600], text: colors.white },
  ghost: { bg: 'transparent', text: colors.gray[700] },
};

export function Button({ title, variant = 'primary', onPress, loading, disabled, style }: ButtonProps) {
  const vs = variantStyles[variant];
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: vs.bg, opacity: pressed || disabled ? 0.6 : 1 },
        style,
      ]}
    >
      {loading && <ActivityIndicator size="small" color={vs.text} style={{ marginRight: spacing.sm }} />}
      <Text style={[styles.text, { color: vs.text }]}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
  },
  text: {
    fontSize: fontSize.md,
    fontWeight: '600',
  },
});
