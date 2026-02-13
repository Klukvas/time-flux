import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useMoodOverview, useTranslation, useTheme } from '@lifespan/hooks';
import type { WeekdayInsights } from '@lifespan/api';
import { Loading } from '@/components/ui/loading';
import { colors, fontSize, spacing, borderRadius } from '@/lib/theme';
import { LineChart, Grid } from 'react-native-svg-charts';

const WEEKDAY_KEYS = [
  'insights.weekday_monday',
  'insights.weekday_tuesday',
  'insights.weekday_wednesday',
  'insights.weekday_thursday',
  'insights.weekday_friday',
  'insights.weekday_saturday',
  'insights.weekday_sunday',
] as const;

function MobileInsightCard({
  icon,
  title,
  description,
  detail,
  variant = 'default',
  bgCard,
  textColor,
  textSecondary,
  textTertiary,
  borderColor,
}: {
  icon: string;
  title: string;
  description: string;
  detail?: string;
  variant?: 'default' | 'warning';
  bgCard: string;
  textColor: string;
  textSecondary: string;
  textTertiary: string;
  borderColor: string;
}) {
  return (
    <View
      style={[
        styles.insightCard,
        {
          backgroundColor: variant === 'warning' ? '#FEF3C7' : bgCard,
          borderColor: variant === 'warning' ? '#F59E0B40' : borderColor,
        },
      ]}
    >
      <View style={styles.insightCardInner}>
        <Text style={styles.insightIcon}>{icon}</Text>
        <View style={styles.insightCardContent}>
          <Text style={[styles.insightTitle, { color: textColor }]}>
            {title}
          </Text>
          <Text style={[styles.insightDesc, { color: textSecondary }]}>
            {description}
          </Text>
          {detail && (
            <Text style={[styles.insightDetail, { color: textTertiary }]}>
              {detail}
            </Text>
          )}
        </View>
      </View>
    </View>
  );
}

function WeekdayInsightsSection({
  insights,
  bgCard,
  textColor,
  textSecondary,
  textTertiary,
  borderColor,
}: {
  insights: WeekdayInsights;
  bgCard: string;
  textColor: string;
  textSecondary: string;
  textTertiary: string;
  borderColor: string;
}) {
  const { t } = useTranslation();

  const dayName = (weekday: number) =>
    t(WEEKDAY_KEYS[weekday] ?? WEEKDAY_KEYS[0]);

  const hasAnyInsight =
    insights.bestMoodDay ||
    insights.worstMoodDay ||
    insights.mostActiveDay ||
    insights.leastActiveDay ||
    insights.mostUnstableDay ||
    insights.recoveryIndex ||
    insights.burnoutPattern?.detected;

  if (!hasAnyInsight) return null;

  const cardProps = { bgCard, textColor, textSecondary, textTertiary, borderColor };

  return (
    <View style={[styles.card, { backgroundColor: bgCard }]}>
      <Text style={[styles.label, { color: textSecondary }]}>
        {t('insights.weekday_patterns')}
      </Text>

      {insights.burnoutPattern?.detected && (
        <MobileInsightCard
          icon="🔥"
          title={t('insights.burnout_detected')}
          description={t('insights.burnout_description')}
          variant="warning"
          {...cardProps}
        />
      )}

      {insights.bestMoodDay && (
        <MobileInsightCard
          icon="😊"
          title={t('insights.best_mood_day')}
          description={t('insights.best_mood_day_description', {
            day: dayName(insights.bestMoodDay.weekday),
          })}
          detail={`${t('insights.score_label', { score: insights.bestMoodDay.averageScore.toFixed(1) })} · ${t('insights.sample_size', { count: insights.bestMoodDay.sampleSize })}`}
          {...cardProps}
        />
      )}

      {insights.worstMoodDay && (
        <MobileInsightCard
          icon="😔"
          title={t('insights.worst_mood_day')}
          description={t('insights.worst_mood_day_description', {
            day: dayName(insights.worstMoodDay.weekday),
          })}
          detail={`${t('insights.score_label', { score: insights.worstMoodDay.averageScore.toFixed(1) })} · ${t('insights.sample_size', { count: insights.worstMoodDay.sampleSize })}`}
          {...cardProps}
        />
      )}

      {insights.mostActiveDay && (
        <MobileInsightCard
          icon="⚡"
          title={t('insights.most_active_day')}
          description={t('insights.most_active_day_description', {
            day: dayName(insights.mostActiveDay.weekday),
          })}
          detail={t('insights.sample_size', {
            count: insights.mostActiveDay.sampleSize,
          })}
          {...cardProps}
        />
      )}

      {insights.leastActiveDay && (
        <MobileInsightCard
          icon="😴"
          title={t('insights.least_active_day')}
          description={t('insights.least_active_day_description', {
            day: dayName(insights.leastActiveDay.weekday),
          })}
          detail={t('insights.sample_size', {
            count: insights.leastActiveDay.sampleSize,
          })}
          {...cardProps}
        />
      )}

      {insights.mostUnstableDay && (
        <MobileInsightCard
          icon="🎢"
          title={t('insights.most_unstable_day')}
          description={t('insights.most_unstable_day_description', {
            day: dayName(insights.mostUnstableDay.weekday),
          })}
          detail={t('insights.sample_size', {
            count: insights.mostUnstableDay.sampleSize,
          })}
          {...cardProps}
        />
      )}

      {insights.recoveryIndex && (
        <MobileInsightCard
          icon="💪"
          title={t('insights.recovery_day')}
          description={t('insights.recovery_day_description', {
            day: dayName(insights.recoveryIndex.weekday),
          })}
          detail={t('insights.recovery_rate', {
            rate: Math.round(insights.recoveryIndex.recoveryRate * 100),
          })}
          {...cardProps}
        />
      )}
    </View>
  );
}

export default function InsightsScreen() {
  const { t } = useTranslation();
  const { tokens } = useTheme();
  const { data, isLoading, error } = useMoodOverview();

  if (isLoading) return <Loading />;

  if (error || !data) {
    return (
      <View style={styles.center}>
        <Text style={[styles.emptyText, { color: tokens.colors.textSecondary }]}>
          {t('common.error')}
        </Text>
      </View>
    );
  }

  if (data.totalDaysWithMood === 0) {
    return (
      <View style={styles.center}>
        <Text style={[styles.emptyText, { color: tokens.colors.textSecondary }]}>
          {t('insights.no_data')}
        </Text>
      </View>
    );
  }

  const trendData = data.trendLast30Days.map((p) => p.score);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: tokens.colors.bg }]}
      contentContainerStyle={styles.content}
    >
      {/* Average Mood */}
      <View style={[styles.card, { backgroundColor: tokens.colors.bgCard }]}>
        <Text style={[styles.label, { color: tokens.colors.textSecondary }]}>
          {t('insights.average_mood')}
        </Text>
        <View style={styles.scoreRow}>
          <Text style={[styles.scoreNumber, { color: tokens.colors.text }]}>
            {data.averageMoodScore.toFixed(1)}
          </Text>
          <Text style={[styles.scoreOutOf, { color: tokens.colors.textTertiary }]}>
            {t('insights.out_of')}
          </Text>
        </View>
        <Text style={[styles.hint, { color: tokens.colors.textTertiary }]}>
          {t('insights.average_mood_description')}
        </Text>
      </View>

      {/* Mood Distribution */}
      {data.moodDistribution.length > 0 && (
        <View style={[styles.card, { backgroundColor: tokens.colors.bgCard }]}>
          <Text style={[styles.label, { color: tokens.colors.textSecondary }]}>
            {t('insights.mood_distribution')}
          </Text>
          {data.moodDistribution.map((item) => (
            <View key={item.moodId} style={styles.distRow}>
              <View style={[styles.dot, { backgroundColor: item.color }]} />
              <Text
                style={[styles.distName, { color: tokens.colors.text }]}
                numberOfLines={1}
              >
                {item.moodName}
              </Text>
              <View style={[styles.barBg, { backgroundColor: tokens.colors.bgSecondary }]}>
                <View
                  style={[
                    styles.barFill,
                    { width: `${item.percentage}%`, backgroundColor: item.color },
                  ]}
                />
              </View>
              <Text style={[styles.distPct, { color: tokens.colors.textTertiary }]}>
                {item.percentage}%
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Best / Worst Category */}
      {(data.bestCategory || data.worstCategory) && (
        <View style={styles.catRow}>
          {data.bestCategory && (
            <View style={[styles.catCard, { backgroundColor: tokens.colors.bgCard }]}>
              <Text style={[styles.catLabel, { color: colors.green[600] }]}>
                {t('insights.best_category')}
              </Text>
              <Text style={[styles.catName, { color: tokens.colors.text }]}>
                {data.bestCategory.name}
              </Text>
              <Text style={[styles.catScore, { color: tokens.colors.textTertiary }]}>
                {data.bestCategory.averageMoodScore.toFixed(1)} {t('insights.out_of')}
              </Text>
            </View>
          )}
          {data.worstCategory && (
            <View style={[styles.catCard, { backgroundColor: tokens.colors.bgCard }]}>
              <Text style={[styles.catLabel, { color: colors.red[500] }]}>
                {t('insights.worst_category')}
              </Text>
              <Text style={[styles.catName, { color: tokens.colors.text }]}>
                {data.worstCategory.name}
              </Text>
              <Text style={[styles.catScore, { color: tokens.colors.textTertiary }]}>
                {data.worstCategory.averageMoodScore.toFixed(1)} {t('insights.out_of')}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* 30-Day Trend */}
      {trendData.length > 1 && (
        <View style={[styles.card, { backgroundColor: tokens.colors.bgCard }]}>
          <Text style={[styles.label, { color: tokens.colors.textSecondary }]}>
            {t('insights.trend_last_30_days')}
          </Text>
          <LineChart
            style={styles.chart}
            data={trendData}
            svg={{ stroke: tokens.colors.accent, strokeWidth: 2 }}
            contentInset={{ top: 10, bottom: 10 }}
            yMin={0}
            yMax={10}
          >
            <Grid svg={{ stroke: tokens.colors.border, strokeOpacity: 0.3 }} />
          </LineChart>
        </View>
      )}

      {/* Weekday Insights */}
      {data.weekdayInsights && (
        <WeekdayInsightsSection
          insights={data.weekdayInsights}
          bgCard={tokens.colors.bgCard}
          textColor={tokens.colors.text}
          textSecondary={tokens.colors.textSecondary}
          textTertiary={tokens.colors.textTertiary}
          borderColor={tokens.colors.border}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.lg, paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
  emptyText: { fontSize: fontSize.sm, textAlign: 'center' },

  card: {
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },

  label: { fontSize: fontSize.sm, fontWeight: '500', marginBottom: spacing.sm },
  scoreRow: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.sm },
  scoreNumber: { fontSize: 36, fontWeight: '700' },
  scoreOutOf: { fontSize: fontSize.sm },
  hint: { fontSize: fontSize.xs, marginTop: spacing.xs },

  distRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  dot: { width: 10, height: 10, borderRadius: 5 },
  distName: { width: 70, fontSize: fontSize.xs },
  barBg: {
    flex: 1,
    height: 8,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  barFill: { height: '100%', borderRadius: borderRadius.full },
  distPct: { width: 40, textAlign: 'right', fontSize: fontSize.xs },

  catRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.md },
  catCard: {
    flex: 1,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  catLabel: { fontSize: fontSize.xs, fontWeight: '600' },
  catName: { fontSize: fontSize.md, fontWeight: '600', marginTop: spacing.xs },
  catScore: { fontSize: fontSize.xs, marginTop: spacing.xs },

  chart: { height: 180, marginTop: spacing.sm },

  insightCard: {
    borderRadius: borderRadius.md,
    borderWidth: 1,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  insightCardInner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  insightIcon: { fontSize: 20 },
  insightCardContent: { flex: 1 },
  insightTitle: { fontSize: fontSize.sm, fontWeight: '500' },
  insightDesc: { fontSize: fontSize.sm, marginTop: 2 },
  insightDetail: { fontSize: fontSize.xs, marginTop: spacing.xs },
});
