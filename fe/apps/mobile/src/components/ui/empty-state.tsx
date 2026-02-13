import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@lifespan/hooks';
import { fontSize, spacing } from '@/lib/theme';

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  const { tokens } = useTheme();

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: tokens.colors.text }]}>{title}</Text>
      {description && (
        <Text style={[styles.description, { color: tokens.colors.textSecondary }]}>
          {description}
        </Text>
      )}
      {action && <View style={styles.action}>{action}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 80,
  },
  title: {
    fontSize: fontSize.md,
    fontWeight: '600',
  },
  description: {
    fontSize: fontSize.sm,
    marginTop: spacing.xs,
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
  },
  action: {
    marginTop: spacing.lg,
  },
});
