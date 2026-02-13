import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  buildWeekGrid,
  groupTimelineByMonth,
  isActivePeriod,
  sortPeriods,
} from '@lifespan/domain';
import {
  useOnboarding,
  useTimeline,
  useWeekTimeline,
} from '@lifespan/hooks';
import {
  formatDate,
  formatDateRange,
  formatDayNumber,
  formatDayShort,
  hexToRgba,
  isToday,
  todayISO,
} from '@lifespan/utils';
import { Loading } from '@/components/ui/loading';
import { OnboardingOverlay } from '@/components/onboarding/onboarding-overlay';
import { OnThisDaySection } from '@/components/timeline/on-this-day';
import { colors, fontSize, spacing, borderRadius } from '@/lib/theme';
import { useViewStore } from '@/stores/view-store';
import type { TimelineMode } from '@/stores/view-store';

const MODE_OPTIONS: { value: TimelineMode; label: string }[] = [
  { value: 'horizontal', label: 'All Time' },
  { value: 'week', label: 'Week' },
];

export default function TimelineScreen() {
  const router = useRouter();
  const timelineMode = useViewStore((s) => s.timelineMode);
  const setTimelineMode = useViewStore((s) => s.setTimelineMode);
  const hydrate = useViewStore((s) => s.hydrate);
  const onboarding = useOnboarding();

  const [currentDate, setCurrentDate] = useState(todayISO());

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const navigateToDayPage = useCallback(
    (date: string) => {
      router.push(`/timeline/day/${date}`);
    },
    [router],
  );

  // Onboarding "Try it" — navigate to day page for today
  const handleOnboardingTryIt = useCallback(() => {
    setCurrentDate(todayISO());
    onboarding.next(); // advance to 'first-memory'
  }, [onboarding]);

  // When the onboarding "day" step advances to first-memory, navigate to day page
  useEffect(() => {
    if (onboarding.step === 'first-memory') {
      navigateToDayPage(todayISO());
      onboarding.complete();
    }
  }, [onboarding.step]);

  const navigateWeek = (offset: number) => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + offset * 7);
    setCurrentDate(d.toISOString().slice(0, 10));
  };

  const showNavigation = timelineMode === 'week';

  const handleMemoryPress = (date: string) => {
    navigateToDayPage(date);
  };

  return (
    <View style={styles.container}>
      {/* On This Day — memory resurfacing */}
      <OnThisDaySection onMemoryPress={handleMemoryPress} />

      {/* Mode Switcher */}
      <View style={styles.segmented}>
        {MODE_OPTIONS.map((opt) => (
          <Pressable
            key={opt.value}
            onPress={() => setTimelineMode(opt.value)}
            style={[
              styles.segmentedBtn,
              timelineMode === opt.value && styles.segmentedBtnActive,
            ]}
          >
            <Text
              style={[
                styles.segmentedText,
                timelineMode === opt.value && styles.segmentedTextActive,
              ]}
            >
              {opt.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Navigation for Week */}
      {showNavigation && (
        <View style={styles.nav}>
          <Pressable onPress={() => navigateWeek(-1)} style={styles.navBtn}>
            <Text style={styles.navBtnText}>Prev</Text>
          </Pressable>
          <Pressable onPress={() => setCurrentDate(todayISO())} style={styles.navBtn}>
            <Text style={styles.navBtnText}>Today</Text>
          </Pressable>
          <Pressable onPress={() => navigateWeek(1)} style={styles.navBtn}>
            <Text style={styles.navBtnText}>Next</Text>
          </Pressable>
        </View>
      )}

      {/* Mode content */}
      {timelineMode === 'horizontal' && <HorizontalMode />}
      {timelineMode === 'week' && <WeekMode currentDate={currentDate} onDayPress={navigateToDayPage} />}

      {/* Onboarding overlay */}
      {onboarding.shouldShow && onboarding.step !== 'first-memory' && (
        <OnboardingOverlay
          step={onboarding.step}
          onNext={onboarding.next}
          onSkip={onboarding.skip}
          onTryIt={handleOnboardingTryIt}
        />
      )}
    </View>
  );
}

// ─── Horizontal Mode (month-grouped overview) ─────────────

function HorizontalMode() {
  const { data, isLoading } = useTimeline();
  const months = useMemo(() => (data ? groupTimelineByMonth(data) : []), [data]);

  if (isLoading) return <Loading />;

  return (
    <FlatList
      data={months}
      keyExtractor={(item) => item.key}
      contentContainerStyle={styles.list}
      ListEmptyComponent={
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No timeline data yet.</Text>
          <Text style={styles.emptySubtext}>Create chapters to see your timeline.</Text>
        </View>
      }
      renderItem={({ item: month }) => (
        <View style={styles.monthBlock}>
          <View style={styles.monthHeader}>
            <View style={styles.monthBadge}>
              <Text style={styles.monthBadgeText}>{month.label.split(' ')[0].slice(0, 3)}</Text>
            </View>
            <Text style={styles.monthLabel}>{month.label}</Text>
          </View>

          {month.days.length > 0 && (
            <View style={styles.dotsRow}>
              {month.days.map((day) => (
                <View
                  key={day.date}
                  style={[
                    styles.dot,
                    { backgroundColor: day.dayState?.color ?? colors.gray[200] },
                  ]}
                />
              ))}
            </View>
          )}

          {sortPeriods(month.periods).map((period) => (
            <View
              key={period.id}
              style={[
                styles.eventCard,
                styles.eventCardHorizontal,
                {
                  borderLeftColor: period.category.color,
                  backgroundColor: hexToRgba(period.category.color, 0.04),
                },
              ]}
            >
              <View style={styles.eventTop}>
                <View style={[styles.badge, { backgroundColor: hexToRgba(period.category.color, 0.15) }]}>
                  <Text style={[styles.badgeText, { color: period.category.color }]}>
                    {period.eventGroup.title}
                  </Text>
                </View>
                {isActivePeriod(period) && (
                  <View style={styles.activeRow}>
                    <View style={styles.activeDot} />
                    <Text style={styles.activeText}>Active</Text>
                  </View>
                )}
              </View>
              {period.comment && <Text style={styles.comment}>{period.comment}</Text>}
              <Text style={styles.dateRange}>
                {formatDateRange(period.startDate, period.endDate)}
              </Text>
            </View>
          ))}
        </View>
      )}
    />
  );
}

// ─── Week Mode ─────────────────────────────────────────────

function WeekMode({ currentDate, onDayPress }: { currentDate: string; onDayPress: (date: string) => void }) {
  const { data: weekData, isLoading } = useWeekTimeline({ date: currentDate });

  const weekDays = useMemo(() => (weekData ? buildWeekGrid(weekData) : []), [weekData]);

  if (isLoading) return <Loading />;

  return (
    <ScrollView contentContainerStyle={styles.list}>
      {weekData && (
        <Text style={styles.range}>
          {formatDate(weekData.weekStart)} — {formatDate(weekData.weekEnd)}
        </Text>
      )}

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.weekGrid}>
          {weekDays.map((day) => (
            <Pressable
              key={day.date}
              onPress={() => onDayPress(day.date)}
              style={[
                styles.dayCard,
                isToday(day.date) && styles.dayToday,
              ]}
            >
              <Text style={styles.dayCardLabel}>{formatDayShort(day.date)}</Text>
              <Text style={styles.dayCardNumber}>{formatDayNumber(day.date)}</Text>
              <View
                style={[
                  styles.moodCircle,
                  {
                    backgroundColor: day.dayState?.color ?? colors.gray[100],
                    borderColor: day.dayState?.color ?? colors.gray[300],
                  },
                ]}
              />
              <Text style={styles.moodName}>{day.dayState?.name ?? 'No mood'}</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </ScrollView>
  );
}

// ─── Styles ────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },

  // Segmented control
  segmented: {
    flexDirection: 'row',
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.gray[100],
    padding: 2,
  },
  segmentedBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  segmentedBtnActive: {
    backgroundColor: colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  segmentedText: { fontSize: fontSize.sm, fontWeight: '500', color: colors.gray[500] },
  segmentedTextActive: { color: colors.gray[900] },

  // Navigation
  nav: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  navBtn: {
    borderWidth: 1,
    borderColor: colors.gray[300],
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  navBtnText: { fontSize: fontSize.sm, color: colors.gray[700] },

  // Shared
  list: { padding: spacing.lg },
  range: { fontSize: fontSize.sm, color: colors.gray[500], marginBottom: spacing.md },
  empty: { alignItems: 'center', paddingVertical: 80 },
  emptyText: { fontSize: fontSize.md, fontWeight: '600', color: colors.gray[900] },
  emptySubtext: { fontSize: fontSize.sm, color: colors.gray[500], marginTop: spacing.xs },
  // Horizontal mode — month blocks
  monthBlock: { marginBottom: spacing.xl },
  monthHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  monthBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.brand[50],
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthBadgeText: { fontSize: fontSize.xs, fontWeight: '700', color: colors.brand[700] },
  monthLabel: { fontSize: fontSize.lg, fontWeight: '600', color: colors.gray[900], marginLeft: spacing.md },
  dotsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 3,
    marginLeft: 56,
    marginBottom: spacing.md,
  },
  dot: { width: 14, height: 14, borderRadius: 7 },

  // Event cards
  eventCard: {
    borderLeftWidth: 4,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  eventCardHorizontal: {
    marginLeft: 56,
  },
  eventTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  badge: { borderRadius: borderRadius.full, paddingHorizontal: spacing.sm, paddingVertical: 2 },
  badgeText: { fontSize: fontSize.xs, fontWeight: '600' },
  activeRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  activeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.green[500] },
  activeText: { fontSize: fontSize.xs, fontWeight: '500', color: colors.green[600] },
  comment: { fontSize: fontSize.sm, color: colors.gray[700], marginTop: spacing.xs },
  dateRange: { fontSize: fontSize.xs, color: colors.gray[500], marginTop: spacing.xs },

  // Week mode — grid
  weekGrid: { flexDirection: 'row', gap: spacing.sm },
  dayCard: {
    width: 90,
    borderWidth: 1,
    borderColor: colors.gray[200],
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    alignItems: 'center',
    backgroundColor: colors.white,
  },
  dayToday: { borderColor: colors.brand[500], borderWidth: 2 },
  dayCardLabel: { fontSize: fontSize.xs, fontWeight: '500', color: colors.gray[500] },
  dayCardNumber: { fontSize: fontSize.xxl, fontWeight: '700', color: colors.gray[900], marginVertical: spacing.xs },
  moodCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    marginBottom: spacing.xs,
  },
  moodName: { fontSize: fontSize.xs, color: colors.gray[500] },

});
