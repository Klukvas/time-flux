import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useOnThisDay, useTranslation } from '@lifespan/hooks';
import type { Memory } from '@lifespan/api';
import { colors, spacing, fontSize, borderRadius } from '@/lib/theme';

interface OnThisDaySectionProps {
  onMemoryPress: (date: string) => void;
}

export function OnThisDaySection({ onMemoryPress }: OnThisDaySectionProps) {
  const { data } = useOnThisDay();
  const { t } = useTranslation();

  if (!data || data.memories.length === 0) return null;

  const singleMemory = data.memories.length === 1;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('memories.on_this_day')}</Text>

      {singleMemory ? (
        <MemoryCard
          memory={data.memories[0]}
          onPress={() => onMemoryPress(data.memories[0].date)}
          fullWidth
        />
      ) : (
        <FlatList
          horizontal
          data={data.memories}
          keyExtractor={(item) => item.date}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <MemoryCard
              memory={item}
              onPress={() => onMemoryPress(item.date)}
            />
          )}
        />
      )}
    </View>
  );
}

function MemoryCard({
  memory,
  onPress,
  fullWidth,
}: {
  memory: Memory;
  onPress: () => void;
  fullWidth?: boolean;
}) {
  const { t } = useTranslation();
  const label =
    memory.interval.type === 'months'
      ? memory.interval.value === 1
        ? t('memories.one_month_ago')
        : t('memories.months_ago', { count: memory.interval.value })
      : memory.interval.value === 1
        ? t('memories.one_year_ago')
        : t('memories.years_ago', { count: memory.interval.value });

  return (
    <Pressable
      onPress={onPress}
      style={[styles.card, fullWidth && styles.cardFull]}
    >
      {/* Interval label */}
      <Text style={styles.yearLabel}>{label}</Text>

      <View style={styles.cardBody}>
        {/* Mood circle */}
        <View
          style={[
            styles.moodCircle,
            {
              backgroundColor: memory.mood?.color ?? colors.gray[200],
              borderColor: memory.mood?.color ?? colors.gray[300],
            },
          ]}
        />

        {/* Content */}
        <View style={styles.cardContent}>
          {memory.mood && (
            <Text style={styles.moodName}>{memory.mood.name}</Text>
          )}

          {memory.mediaCount > 0 && (
            <Text style={styles.mediaCount}>
              {memory.mediaCount} {memory.mediaCount === 1 ? t('memories.photo') : t('memories.photos')}
            </Text>
          )}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.gray[900],
    marginBottom: spacing.md,
  },
  listContent: {
    gap: spacing.md,
  },
  card: {
    width: 280,
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.gray[200],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  cardFull: {
    width: '100%' as any,
  },
  yearLabel: {
    fontSize: fontSize.xs,
    fontWeight: '600',
    color: colors.brand[500],
    marginBottom: spacing.md,
  },
  cardBody: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  moodCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
  },
  cardContent: {
    flex: 1,
  },
  moodName: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.gray[900],
  },
  mediaCount: {
    fontSize: fontSize.xs,
    color: colors.gray[500],
    marginTop: 2,
  },
});
