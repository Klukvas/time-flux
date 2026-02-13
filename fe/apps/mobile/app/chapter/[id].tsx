import { useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import type { EventPeriod } from '@lifespan/api';
import { extractApiError } from '@lifespan/api';
import { getUserMessage } from '@lifespan/domain';
import {
  useEventGroupDetails,
  useDeletePeriod,
  useTranslation,
  useTheme,
} from '@lifespan/hooks';
import { formatDateRange, hexToRgba } from '@lifespan/utils';
import { Loading } from '@/components/ui/loading';
import { Button } from '@/components/ui/button';
import { colors, fontSize, spacing, borderRadius } from '@/lib/theme';

export default function ChapterDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const { tokens } = useTheme();
  const { data: details, isLoading, error } = useEventGroupDetails(id);
  const deletePeriod = useDeletePeriod();

  const [insightsOpen, setInsightsOpen] = useState(true);

  const handleDeletePeriod = (period: EventPeriod) => {
    Alert.alert(t('periods.delete'), t('periods.confirm_delete_message'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: () =>
          deletePeriod.mutate(period.id, {
            onError: (err) =>
              Alert.alert(t('common.error'), getUserMessage(extractApiError(err))),
          }),
      },
    ]);
  };

  if (isLoading) return <Loading />;

  if (error || !details) {
    return (
      <View style={styles.center}>
        <Text style={{ color: tokens.colors.textSecondary }}>
          {t('chapters.details.not_found')}
        </Text>
      </View>
    );
  }

  const sortedPeriods = [...details.periods].sort(
    (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime(),
  );

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: details.title,
          headerStyle: { backgroundColor: tokens.colors.bgCard },
          headerTintColor: tokens.colors.text,
          headerShadowVisible: false,
        }}
      />
      <ScrollView
        style={[styles.container, { backgroundColor: tokens.colors.bg }]}
        contentContainerStyle={styles.content}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: tokens.colors.text }]}>
            {details.title}
          </Text>
          <View
            style={[
              styles.badge,
              { backgroundColor: hexToRgba(details.category.color, 0.15) },
            ]}
          >
            <Text style={[styles.badgeText, { color: details.category.color }]}>
              {details.category.name}
            </Text>
          </View>
        </View>
        {details.description && (
          <Text style={[styles.description, { color: tokens.colors.textSecondary }]}>
            {details.description}
          </Text>
        )}

        {/* Stats row */}
        {details.totalDays > 0 && (
          <View style={[styles.statsRow, { backgroundColor: tokens.colors.bgCard }]}>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: tokens.colors.text }]}>
                {details.totalDays}
              </Text>
              <Text style={[styles.statLabel, { color: tokens.colors.textTertiary }]}>
                {t('chapters.details.total_days')}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: tokens.colors.text }]}>
                {details.periods.length}
              </Text>
              <Text style={[styles.statLabel, { color: tokens.colors.textTertiary }]}>
                {t('chapters.details.periods')}
              </Text>
            </View>
          </View>
        )}

        {/* Mood Stats */}
        {details.moodStats && details.moodStats.length > 0 && (
          <View style={[styles.section, { backgroundColor: tokens.colors.bgCard }]}>
            <Text style={[styles.sectionTitle, { color: tokens.colors.textSecondary }]}>
              {t('chapters.details.mood_stats')}
            </Text>
            {details.moodStats.map((stat) => (
              <View key={stat.dayStateName} style={styles.moodRow}>
                <View style={[styles.moodDot, { backgroundColor: stat.dayStateColor }]} />
                <Text
                  style={[styles.moodName, { color: tokens.colors.text }]}
                  numberOfLines={1}
                >
                  {stat.dayStateName}
                </Text>
                <View style={[styles.moodBar, { backgroundColor: tokens.colors.bgSecondary }]}>
                  <View
                    style={[
                      styles.moodBarFill,
                      { width: `${stat.percentage}%`, backgroundColor: stat.dayStateColor },
                    ]}
                  />
                </View>
                <Text style={[styles.moodPct, { color: tokens.colors.textTertiary }]}>
                  {stat.count} ({stat.percentage}%)
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Chapter Insights (collapsible) */}
        {details.analytics && (
          <View style={[styles.section, { backgroundColor: tokens.colors.bgCard }]}>
            <Pressable
              onPress={() => setInsightsOpen(!insightsOpen)}
              style={styles.sectionHeader}
            >
              <Text style={[styles.sectionTitle, { color: tokens.colors.textSecondary }]}>
                {t('insights.chapter_insights')}
              </Text>
              <Text style={{ color: tokens.colors.textTertiary }}>
                {insightsOpen ? '−' : '+'}
              </Text>
            </Pressable>

            {insightsOpen && (
              <View>
                {/* Stats grid */}
                <View style={styles.insightsGrid}>
                  <View style={[styles.insightCard, { backgroundColor: tokens.colors.bg }]}>
                    <Text style={[styles.insightValue, { color: tokens.colors.text }]}>
                      {details.analytics.totalDays}
                    </Text>
                    <Text style={[styles.insightLabel, { color: tokens.colors.textTertiary }]}>
                      {t('insights.total_days')}
                    </Text>
                  </View>
                  <View style={[styles.insightCard, { backgroundColor: tokens.colors.bg }]}>
                    <Text style={[styles.insightValue, { color: tokens.colors.text }]}>
                      {details.analytics.totalPeriods}
                    </Text>
                    <Text style={[styles.insightLabel, { color: tokens.colors.textTertiary }]}>
                      {t('insights.total_periods')}
                    </Text>
                  </View>
                  <View style={[styles.insightCard, { backgroundColor: tokens.colors.bg }]}>
                    <Text style={[styles.insightValue, { color: tokens.colors.text }]}>
                      {details.analytics.totalMedia}
                    </Text>
                    <Text style={[styles.insightLabel, { color: tokens.colors.textTertiary }]}>
                      {t('insights.total_media')}
                    </Text>
                  </View>
                  <View style={[styles.insightCard, { backgroundColor: tokens.colors.bg }]}>
                    <Text style={[styles.insightValue, { color: tokens.colors.text }]}>
                      {details.analytics.averageMoodScore !== null
                        ? details.analytics.averageMoodScore.toFixed(1)
                        : '—'}
                    </Text>
                    <Text style={[styles.insightLabel, { color: tokens.colors.textTertiary }]}>
                      {t('insights.average_mood_score')}
                    </Text>
                  </View>
                </View>

                {/* Activity density */}
                {details.analytics.density.length > 0 && (
                  <View style={{ marginTop: spacing.md }}>
                    <Text style={[styles.densityTitle, { color: tokens.colors.textTertiary }]}>
                      {t('insights.activity_density')}
                    </Text>
                    {details.analytics.density.map((d, i) => {
                      const startMs = new Date(d.start).getTime();
                      const endMs = new Date(d.end).getTime();
                      const totalDaysInRange = Math.max(
                        1,
                        Math.ceil((endMs - startMs) / (1000 * 60 * 60 * 24)) + 1,
                      );
                      const pct = Math.round((d.activeDays / totalDaysInRange) * 100);

                      return (
                        <View
                          key={i}
                          style={[styles.densityCard, { backgroundColor: tokens.colors.bg }]}
                        >
                          <View style={styles.densityMeta}>
                            <Text style={[styles.densityRange, { color: tokens.colors.textSecondary }]}>
                              {d.start} — {d.end}
                            </Text>
                            <Text style={[styles.densityCount, { color: tokens.colors.textTertiary }]}>
                              {t('insights.active_days', { count: d.activeDays })} ({pct}%)
                            </Text>
                          </View>
                          <View
                            style={[styles.densityBar, { backgroundColor: tokens.colors.bgSecondary }]}
                          >
                            <View
                              style={[
                                styles.densityBarFill,
                                { width: `${pct}%`, backgroundColor: tokens.colors.accent },
                              ]}
                            />
                          </View>
                        </View>
                      );
                    })}
                  </View>
                )}
              </View>
            )}
          </View>
        )}

        {/* Periods */}
        <View style={[styles.section, { backgroundColor: tokens.colors.bgCard }]}>
          <Text style={[styles.sectionTitle, { color: tokens.colors.textSecondary }]}>
            {t('chapters.details.periods')}
          </Text>
          {sortedPeriods.length === 0 ? (
            <Text style={{ color: tokens.colors.textTertiary, fontSize: fontSize.sm }}>
              {t('chapters.details.no_data')}
            </Text>
          ) : (
            sortedPeriods.map((period) => {
              const isActive = period.endDate === null;
              return (
                <Pressable
                  key={period.id}
                  onLongPress={() => handleDeletePeriod(period)}
                  style={[styles.periodCard, { backgroundColor: tokens.colors.bg }]}
                >
                  <View style={styles.periodTop}>
                    <Text style={[styles.periodDate, { color: tokens.colors.text }]}>
                      {formatDateRange(period.startDate, period.endDate)}
                    </Text>
                    {isActive && (
                      <View style={styles.activeRow}>
                        <View style={styles.activeDot} />
                        <Text style={styles.activeText}>{t('periods.active')}</Text>
                      </View>
                    )}
                  </View>
                  {period.comment && (
                    <Text
                      style={[styles.periodComment, { color: tokens.colors.textSecondary }]}
                      numberOfLines={2}
                    >
                      {period.comment}
                    </Text>
                  )}
                </Pressable>
              );
            })
          )}
        </View>

        {/* Media gallery */}
        {details.media && details.media.length > 0 && (
          <View style={[styles.section, { backgroundColor: tokens.colors.bgCard }]}>
            <Text style={[styles.sectionTitle, { color: tokens.colors.textSecondary }]}>
              {t('chapters.details.media_gallery')}
            </Text>
            <Text style={{ color: tokens.colors.textTertiary, fontSize: fontSize.xs }}>
              {details.media.length} items
            </Text>
          </View>
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.lg, paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' },
  title: { fontSize: fontSize.xl, fontWeight: '700' },
  badge: { borderRadius: borderRadius.full, paddingHorizontal: spacing.sm, paddingVertical: 2 },
  badgeText: { fontSize: fontSize.xs, fontWeight: '600' },
  description: { fontSize: fontSize.sm, marginTop: spacing.xs, marginBottom: spacing.md },

  statsRow: {
    flexDirection: 'row',
    gap: spacing.xl,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  statItem: {},
  statNumber: { fontSize: fontSize.xxl, fontWeight: '700' },
  statLabel: { fontSize: fontSize.xs },

  section: {
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: { fontSize: fontSize.sm, fontWeight: '500', marginBottom: spacing.sm },

  moodRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  moodDot: { width: 10, height: 10, borderRadius: 5 },
  moodName: { width: 70, fontSize: fontSize.xs },
  moodBar: { flex: 1, height: 6, borderRadius: borderRadius.full, overflow: 'hidden' },
  moodBarFill: { height: '100%', borderRadius: borderRadius.full },
  moodPct: { width: 60, textAlign: 'right', fontSize: fontSize.xs },

  insightsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  insightCard: {
    width: '47%',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
  },
  insightValue: { fontSize: fontSize.lg, fontWeight: '700' },
  insightLabel: { fontSize: fontSize.xs, marginTop: 2 },

  densityTitle: { fontSize: fontSize.xs, fontWeight: '500', marginBottom: spacing.sm },
  densityCard: { borderRadius: borderRadius.md, padding: spacing.md, marginBottom: spacing.sm },
  densityMeta: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.xs },
  densityRange: { fontSize: fontSize.xs },
  densityCount: { fontSize: fontSize.xs },
  densityBar: { height: 5, borderRadius: borderRadius.full, overflow: 'hidden' },
  densityBarFill: { height: '100%', borderRadius: borderRadius.full },

  periodCard: {
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  periodTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  periodDate: { fontSize: fontSize.sm, fontWeight: '500' },
  activeRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  activeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.green[500] },
  activeText: { fontSize: fontSize.xs, fontWeight: '500', color: colors.green[600] },
  periodComment: { fontSize: fontSize.xs, marginTop: spacing.xs },
});
