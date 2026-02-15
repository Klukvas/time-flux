import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Dimensions,
  FlatList,
  Image,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { extractApiError } from '@lifespan/api';
import { getPeriodsForDate, getUserMessage } from '@lifespan/domain';
import {
  useDayMedia,
  useDays,
  useDayStates,
  useEventGroups,
  useMemoriesContext,
  useTranslation,
  useUpdateDayLocation,
  useUpsertDay,
  useWeekTimeline,
} from '@lifespan/hooks';
import { buildWeekGrid } from '@lifespan/domain';
import {
  addDays,
  formatDate,
  formatDayShort,
  hexToRgba,
  isBeyondTomorrow,
  isImageType,
  isToday,
  isVideoType,
  todayISO,
} from '@lifespan/utils';
import { MAX_COMMENT_LENGTH } from '@lifespan/constants';
import { Loading } from '@/components/ui/loading';
import { colors, fontSize, spacing, borderRadius } from '@/lib/theme';

const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function DayScreen() {
  const { date } = useLocalSearchParams<{ date: string }>();
  const router = useRouter();
  const { t } = useTranslation();

  if (!date || !ISO_DATE_REGEX.test(date)) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ headerShown: true, title: 'Invalid Date' }} />
        <View style={styles.empty}>
          <Text style={styles.emptyText}>Invalid date format</Text>
        </View>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: formatDate(date, 'MMMM d, yyyy'),
          headerBackTitle: 'Timeline',
        }}
      />
      <DayContent date={date} />
    </>
  );
}

function DayContent({ date }: { date: string }) {
  const router = useRouter();
  const { t } = useTranslation();
  const { data: weekData, isLoading } = useWeekTimeline({ date });
  const { data: dayStates } = useDayStates();
  const { data: allGroups } = useEventGroups();
  const { data: memoriesData } = useMemoriesContext('day', date);
  const { data: existingMedia } = useDayMedia(date);
  const { data: daysData } = useDays({ from: date, to: date });
  const upsertDay = useUpsertDay();
  const updateLocation = useUpdateDayLocation();

  const dayRecord = daysData?.[0] ?? null;

  const [comment, setComment] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showChapterSearch, setShowChapterSearch] = useState(false);
  const [chapterQuery, setChapterQuery] = useState('');
  const [mediaViewerIndex, setMediaViewerIndex] = useState<number | null>(null);

  const dayData = useMemo(() => {
    if (!weekData) return null;
    const grid = buildWeekGrid(weekData);
    return grid.find((d) => d.date === date) ?? null;
  }, [weekData, date]);

  const overlappingPeriods = useMemo(() => {
    if (!allGroups) return [];
    const allPeriods = allGroups.flatMap((g) =>
      g.periods.map((p) => ({
        ...p,
        eventGroup: { id: g.id, title: g.title },
        category: g.category,
      })),
    );
    return getPeriodsForDate(allPeriods, date);
  }, [allGroups, date]);

  const activePeriodIds = useMemo(
    () => new Set(overlappingPeriods.map((p) => p.id)),
    [overlappingPeriods],
  );

  const mediaItems = useMemo(() => existingMedia ?? [], [existingMedia]);

  useEffect(() => {
    setComment('');
  }, [date]);

  const handleSetMood = (dayStateId: string | null) => {
    upsertDay.mutate(
      { date, data: { dayStateId } },
      {
        onError: (err) => Alert.alert('Error', getUserMessage(extractApiError(err))),
      },
    );
  };

  const navigateDay = (offset: number) => {
    const newDate = addDays(date, offset);
    router.replace(`/timeline/day/${newDate}`);
  };

  const handleDateChange = (_: unknown, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      const iso = selectedDate.toISOString().slice(0, 10);
      router.replace(`/timeline/day/${iso}`);
    }
  };

  const handleOpenLocationPicker = () => {
    const params: Record<string, string> = { date };
    if (dayRecord?.latitude != null) params.lat = String(dayRecord.latitude);
    if (dayRecord?.longitude != null) params.lng = String(dayRecord.longitude);
    if (dayRecord?.locationName) params.name = dayRecord.locationName;
    router.push({ pathname: '/timeline/day/location-picker', params });
  };

  const handleRemoveLocation = () => {
    updateLocation.mutate(
      { date, data: { locationName: null, latitude: null, longitude: null } },
      {
        onSuccess: () => Alert.alert('', t('day_form.location_removed')),
        onError: (err) => Alert.alert('Error', getUserMessage(extractApiError(err))),
      },
    );
  };

  // Chapter selector filtering
  const allChapters = allGroups ?? [];
  const filteredChapters = allChapters.filter((g) =>
    g.title.toLowerCase().includes(chapterQuery.toLowerCase()),
  );
  const activeGroupIds = new Set(
    allChapters
      .filter((g) => g.periods.some((p) => activePeriodIds.has(p.id)))
      .map((g) => g.id),
  );

  if (isLoading) return <Loading />;

  const today = isToday(date);
  const futureDisabled = isBeyondTomorrow(date);
  const memories = memoriesData?.memories ?? [];

  return (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      {/* Navigation arrows */}
      <View style={styles.nav}>
        <Pressable onPress={() => navigateDay(-1)} style={styles.navBtn}>
          <Text style={styles.navBtnText}>Prev</Text>
        </Pressable>
        <Pressable
          onPress={() => router.replace(`/timeline/day/${todayISO()}`)}
          style={styles.navBtn}
        >
          <Text style={styles.navBtnText}>Today</Text>
        </Pressable>
        <Pressable onPress={() => navigateDay(1)} style={styles.navBtn}>
          <Text style={styles.navBtnText}>Next</Text>
        </Pressable>
      </View>

      {/* Date header — pressable to open calendar picker */}
      <Pressable style={styles.header} onPress={() => setShowDatePicker(true)}>
        <Text style={styles.dayLabel}>{formatDayShort(date)}</Text>
        <View style={styles.dateRow}>
          <Text style={styles.dateTitle}>{formatDate(date, 'cccc, MMMM d, yyyy')}</Text>
          <View style={styles.calendarIcon}>
            <Text style={styles.calendarIconText}>📅</Text>
          </View>
        </View>
        {today && (
          <View style={styles.todayBadge}>
            <View style={styles.todayDot} />
            <Text style={styles.todayText}>{t('week.today')}</Text>
          </View>
        )}
        {futureDisabled && (
          <View style={styles.futureBadge}>
            <Text style={styles.futureText}>Future date — read only</Text>
          </View>
        )}
      </Pressable>

      {/* Date Picker Modal */}
      {showDatePicker && (
        <DateTimePicker
          value={new Date(date + 'T00:00:00')}
          mode="date"
          display={Platform.OS === 'ios' ? 'inline' : 'default'}
          maximumDate={new Date()}
          onChange={handleDateChange}
        />
      )}

      {/* Memories */}
      {memories.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('memories.on_this_day')}</Text>
          {memories.map((memory) => {
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
                key={memory.date}
                onPress={() => router.push(`/timeline/day/${memory.date}`)}
                style={styles.memoryCard}
              >
                <Text style={styles.memoryLabel}>{label}</Text>
                <View style={styles.memoryContent}>
                  <View
                    style={[
                      styles.memoryDot,
                      { backgroundColor: memory.mood?.color ?? colors.gray[200] },
                    ]}
                  />
                  <View>
                    {memory.mood && (
                      <Text style={styles.memoryMood}>{memory.mood.name}</Text>
                    )}
                    {memory.mediaCount > 0 && (
                      <Text style={styles.memoryMediaCount}>
                        {memory.mediaCount}{' '}
                        {memory.mediaCount === 1 ? t('memories.photo') : t('memories.photos')}
                      </Text>
                    )}
                  </View>
                </View>
              </Pressable>
            );
          })}
        </View>
      )}

      {/* Large mood circle */}
      <View style={styles.largeMoodContainer}>
        <View
          style={[
            styles.largeMoodCircle,
            today && styles.largeMoodToday,
            dayData?.dayState?.color
              ? { backgroundColor: dayData.dayState.color, borderColor: dayData.dayState.color }
              : { borderColor: colors.gray[300] },
          ]}
        />
      </View>

      <Text style={styles.moodLabel}>
        {dayData?.dayState?.name ?? 'No mood set'}
      </Text>

      {/* Media Carousel */}
      {mediaItems.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('day_form.photos_videos')}</Text>
          <FlatList
            horizontal
            data={mediaItems}
            keyExtractor={(item) => item.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.mediaCarousel}
            renderItem={({ item, index }) => (
              <Pressable
                onPress={() => setMediaViewerIndex(index)}
                style={styles.mediaThumbnail}
              >
                {isImageType(item.contentType) && item.url ? (
                  <Image source={{ uri: item.url }} style={styles.mediaThumbnailImage} />
                ) : (
                  <View style={styles.mediaVideoPlaceholder}>
                    <Text style={styles.mediaPlayIcon}>▶</Text>
                  </View>
                )}
                {isVideoType(item.contentType) && (
                  <View style={styles.videoOverlay}>
                    <Text style={styles.videoPlayText}>▶</Text>
                  </View>
                )}
              </Pressable>
            )}
          />
        </View>
      )}

      {/* Media Fullscreen Viewer */}
      {mediaViewerIndex !== null && (
        <MediaViewerModal
          items={mediaItems}
          initialIndex={mediaViewerIndex}
          onClose={() => setMediaViewerIndex(null)}
        />
      )}

      {/* Location */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('day_form.location')}</Text>
        {dayRecord?.locationName ? (
          <View style={styles.locationCard}>
            <Text style={styles.locationPin}>📍</Text>
            <Text style={styles.locationName} numberOfLines={1}>{dayRecord.locationName}</Text>
            <View style={styles.locationActions}>
              {dayRecord.latitude != null && dayRecord.longitude != null && (
                <Pressable
                  onPress={() =>
                    Linking.openURL(
                      `https://www.google.com/maps?q=${dayRecord.latitude},${dayRecord.longitude}`,
                    )
                  }
                >
                  <Text style={styles.locationActionLink}>{t('day_form.view_on_map')}</Text>
                </Pressable>
              )}
              {!futureDisabled && (
                <>
                  <Pressable onPress={handleOpenLocationPicker}>
                    <Text style={styles.locationActionText}>{t('day_form.change_location')}</Text>
                  </Pressable>
                  <Pressable onPress={handleRemoveLocation} disabled={updateLocation.isPending}>
                    <Text style={styles.locationActionDanger}>{t('day_form.remove_location')}</Text>
                  </Pressable>
                </>
              )}
            </View>
          </View>
        ) : (
          <View style={styles.locationEmpty}>
            <Text style={styles.locationEmptyText}>{t('day_form.no_location')}</Text>
            {!futureDisabled && (
              <Pressable onPress={handleOpenLocationPicker}>
                <Text style={styles.locationAddText}>+ {t('day_form.add_location')}</Text>
              </Pressable>
            )}
          </View>
        )}
      </View>

      {/* Mood picker */}
      {!futureDisabled && (
        <View style={styles.pickerCard}>
          <Text style={styles.pickerTitle}>{t('day_form.mood')}</Text>
          <View style={styles.moodOptions}>
            {dayStates?.map((ds) => (
              <Pressable
                key={ds.id}
                onPress={() => handleSetMood(ds.id)}
                disabled={upsertDay.isPending}
                style={styles.moodOption}
              >
                <View style={[styles.moodDot, { backgroundColor: ds.color }]} />
                <Text style={styles.moodOptionText}>{ds.name}</Text>
              </Pressable>
            ))}
            <Pressable
              onPress={() => handleSetMood(null)}
              disabled={upsertDay.isPending}
              style={[styles.moodOption, styles.clearOption]}
            >
              <Text style={styles.clearText}>{t('common.clear')}</Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* Comment */}
      {!futureDisabled && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('day_form.comment')}</Text>
          <TextInput
            value={comment}
            onChangeText={setComment}
            maxLength={MAX_COMMENT_LENGTH}
            multiline
            numberOfLines={3}
            placeholder={t('day_form.comment_placeholder')}
            placeholderTextColor={colors.gray[400]}
            style={styles.commentInput}
          />
          <Text style={styles.charCount}>
            {comment.length}/{MAX_COMMENT_LENGTH}
          </Text>
        </View>
      )}

      {/* Chapters / Periods */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('chapters.title')}</Text>
        {overlappingPeriods.length > 0 ? (
          overlappingPeriods.map((period) => (
            <View
              key={period.id}
              style={[
                styles.periodCard,
                {
                  borderLeftColor: period.category.color,
                  backgroundColor: hexToRgba(period.category.color, 0.04),
                },
              ]}
            >
              <View style={styles.periodTop}>
                <View
                  style={[
                    styles.badge,
                    { backgroundColor: hexToRgba(period.category.color, 0.15) },
                  ]}
                >
                  <Text style={[styles.badgeText, { color: period.category.color }]}>
                    {period.eventGroup.title}
                  </Text>
                </View>
                {period.endDate === null && (
                  <View style={styles.activeRow}>
                    <View style={styles.activeDot} />
                    <Text style={styles.activeText}>{t('periods.active')}</Text>
                  </View>
                )}
              </View>
              {period.comment && (
                <Text style={styles.periodComment}>{period.comment}</Text>
              )}
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>{t('chapters.empty.description')}</Text>
        )}

        {/* Searchable chapter selector */}
        {!futureDisabled && (
          <View style={styles.chapterSelectorContainer}>
            <Pressable
              onPress={() => { setShowChapterSearch(true); setChapterQuery(''); }}
              style={styles.addChapterBtn}
            >
              <Text style={styles.addChapterText}>+ {t('day_form.add_chapter')}</Text>
            </Pressable>
          </View>
        )}
      </View>

      {/* Chapter Search Modal */}
      <Modal
        visible={showChapterSearch}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowChapterSearch(false)}
      >
        <View style={styles.chapterSearchModal}>
          <View style={styles.chapterSearchHeader}>
            <Text style={styles.chapterSearchTitle}>{t('day_form.add_chapter')}</Text>
            <Pressable onPress={() => setShowChapterSearch(false)}>
              <Text style={styles.chapterSearchClose}>{t('common.close')}</Text>
            </Pressable>
          </View>
          <TextInput
            value={chapterQuery}
            onChangeText={setChapterQuery}
            placeholder={t('day_form.search_chapters')}
            placeholderTextColor={colors.gray[400]}
            style={styles.chapterSearchInput}
            autoFocus
          />
          <FlatList
            data={filteredChapters}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => {
              const isActive = activeGroupIds.has(item.id);
              return (
                <Pressable
                  onPress={() => {
                    setShowChapterSearch(false);
                    router.push(`/chapter/${item.id}`);
                  }}
                  style={styles.chapterSearchItem}
                >
                  <View
                    style={[styles.chapterDot, { backgroundColor: item.category.color }]}
                  />
                  <Text
                    style={[styles.chapterItemText, isActive && styles.chapterItemActive]}
                    numberOfLines={1}
                  >
                    {item.title}
                  </Text>
                  {isActive && (
                    <View
                      style={[
                        styles.chapterActiveBadge,
                        { backgroundColor: hexToRgba(item.category.color, 0.15) },
                      ]}
                    >
                      <Text style={[styles.chapterActiveBadgeText, { color: item.category.color }]}>
                        {t('periods.active')}
                      </Text>
                    </View>
                  )}
                </Pressable>
              );
            }}
            ListEmptyComponent={
              <Text style={styles.chapterSearchEmpty}>{t('day_form.no_chapters_found')}</Text>
            }
          />
        </View>
      </Modal>
    </ScrollView>
  );
}

// ─── Media Viewer Modal ──────────────────────────────────

interface MediaViewerModalProps {
  items: Array<{ id: string; url: string; contentType: string }>;
  initialIndex: number;
  onClose: () => void;
}

function MediaViewerModal({ items, initialIndex, onClose }: MediaViewerModalProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  return (
    <Modal visible animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.viewerContainer}>
        {/* Header */}
        <View style={styles.viewerHeader}>
          <Pressable onPress={onClose} style={styles.viewerCloseBtn}>
            <Text style={styles.viewerCloseText}>✕</Text>
          </Pressable>
          <Text style={styles.viewerCounter}>
            {currentIndex + 1} / {items.length}
          </Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Swipeable content */}
        <FlatList
          horizontal
          pagingEnabled
          data={items}
          keyExtractor={(item) => item.id}
          initialScrollIndex={initialIndex}
          getItemLayout={(_, index) => ({
            length: SCREEN_WIDTH,
            offset: SCREEN_WIDTH * index,
            index,
          })}
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(e) => {
            const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
            setCurrentIndex(idx);
          }}
          renderItem={({ item }) => (
            <View style={styles.viewerSlide}>
              {isImageType(item.contentType) ? (
                <Image
                  source={{ uri: item.url }}
                  style={styles.viewerImage}
                  resizeMode="contain"
                />
              ) : (
                <View style={styles.viewerVideoPlaceholder}>
                  <Text style={styles.viewerVideoText}>Video</Text>
                </View>
              )}
            </View>
          )}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: spacing.lg, paddingBottom: 40 },

  // Navigation
  nav: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  navBtn: {
    borderWidth: 1,
    borderColor: colors.gray[300],
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  navBtnText: { fontSize: fontSize.sm, color: colors.gray[700] },

  // Header
  header: { alignItems: 'center', marginBottom: spacing.lg },
  dayLabel: { fontSize: fontSize.sm, color: colors.gray[500] },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  dateTitle: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.gray[900],
    textAlign: 'center',
  },
  calendarIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.brand[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarIconText: { fontSize: 14 },
  todayBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.brand[50],
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    marginTop: spacing.sm,
  },
  todayDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.brand[500] },
  todayText: { fontSize: fontSize.xs, fontWeight: '500', color: colors.brand[700] },
  futureBadge: {
    backgroundColor: '#FEE2E2',
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    marginTop: spacing.sm,
  },
  futureText: { fontSize: fontSize.xs, fontWeight: '500', color: '#DC2626' },

  // Memories
  memoryCard: {
    borderWidth: 1,
    borderColor: colors.gray[200],
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    marginBottom: spacing.sm,
    backgroundColor: colors.white,
  },
  memoryLabel: {
    fontSize: fontSize.xs,
    fontWeight: '600',
    color: colors.brand[500],
    marginBottom: spacing.sm,
  },
  memoryContent: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  memoryDot: { width: 32, height: 32, borderRadius: 16 },
  memoryMood: { fontSize: fontSize.sm, fontWeight: '500', color: colors.gray[900] },
  memoryMediaCount: { fontSize: fontSize.xs, color: colors.gray[500], marginTop: 2 },

  // Large mood
  largeMoodContainer: { alignItems: 'center', marginVertical: spacing.lg },
  largeMoodCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 4,
    borderColor: colors.gray[300],
  },
  largeMoodToday: {
    shadowColor: colors.brand[500],
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
  moodLabel: {
    fontSize: fontSize.sm,
    color: colors.gray[500],
    textAlign: 'center',
    marginBottom: spacing.lg,
  },

  // Media carousel
  mediaCarousel: { gap: spacing.sm },
  mediaThumbnail: {
    width: 100,
    height: 100,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  mediaThumbnailImage: {
    width: '100%',
    height: '100%',
  },
  mediaVideoPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  mediaPlayIcon: { fontSize: 24, color: colors.gray[500] },
  videoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  videoPlayText: {
    fontSize: 20,
    color: '#fff',
  },

  // Picker
  pickerCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  pickerTitle: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.gray[900],
    marginBottom: spacing.md,
  },
  moodOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  moodOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.gray[300],
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  moodDot: { width: 18, height: 18, borderRadius: 9 },
  moodOptionText: { fontSize: fontSize.sm, color: colors.gray[700] },
  clearOption: { borderStyle: 'dashed' as const },
  clearText: { fontSize: fontSize.sm, color: colors.gray[500] },

  // Section
  section: { marginBottom: spacing.lg },
  sectionTitle: {
    fontSize: fontSize.sm,
    fontWeight: '500',
    color: colors.gray[500],
    marginBottom: spacing.sm,
  },

  // Location
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.gray[200],
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    backgroundColor: colors.white,
    flexWrap: 'wrap',
  },
  locationPin: { fontSize: 16 },
  locationName: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.gray[900],
  },
  locationActions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.xs,
    width: '100%',
  },
  locationActionLink: {
    fontSize: fontSize.xs,
    fontWeight: '500',
    color: colors.brand[500],
  },
  locationActionText: {
    fontSize: fontSize.xs,
    fontWeight: '500',
    color: colors.gray[500],
  },
  locationActionDanger: {
    fontSize: fontSize.xs,
    fontWeight: '500',
    color: '#DC2626',
  },
  locationEmpty: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.gray[200],
    borderStyle: 'dashed',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  locationEmptyText: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.gray[400],
  },
  locationAddText: {
    fontSize: fontSize.xs,
    fontWeight: '500',
    color: colors.brand[500],
  },

  // Comment
  commentInput: {
    borderWidth: 1,
    borderColor: colors.gray[300],
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    fontSize: fontSize.sm,
    color: colors.gray[900],
    backgroundColor: colors.white,
    textAlignVertical: 'top',
    minHeight: 80,
  },
  charCount: {
    fontSize: fontSize.xs,
    color: colors.gray[400],
    textAlign: 'right',
    marginTop: spacing.xs,
  },

  // Period cards
  periodCard: {
    borderLeftWidth: 4,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  periodTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  badge: {
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  badgeText: { fontSize: fontSize.xs, fontWeight: '600' },
  activeRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  activeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.green[500] },
  activeText: { fontSize: fontSize.xs, fontWeight: '500', color: colors.green[600] },
  periodComment: { fontSize: fontSize.sm, color: colors.gray[700], marginTop: spacing.xs },

  // Chapter selector
  chapterSelectorContainer: { marginTop: spacing.sm },
  addChapterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
  },
  addChapterText: {
    fontSize: fontSize.sm,
    fontWeight: '500',
    color: colors.brand[500],
  },

  // Chapter search modal
  chapterSearchModal: {
    flex: 1,
    backgroundColor: colors.white,
    paddingTop: spacing.lg,
  },
  chapterSearchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  chapterSearchTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.gray[900],
  },
  chapterSearchClose: {
    fontSize: fontSize.md,
    color: colors.brand[500],
    fontWeight: '500',
  },
  chapterSearchInput: {
    margin: spacing.md,
    borderWidth: 1,
    borderColor: colors.gray[300],
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    fontSize: fontSize.md,
    color: colors.gray[900],
    backgroundColor: colors.gray[50],
  },
  chapterSearchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.gray[100],
  },
  chapterDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  chapterItemText: {
    flex: 1,
    fontSize: fontSize.md,
    color: colors.gray[900],
  },
  chapterItemActive: {
    color: colors.gray[500],
  },
  chapterActiveBadge: {
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  chapterActiveBadgeText: {
    fontSize: fontSize.xs,
    fontWeight: '600',
  },
  chapterSearchEmpty: {
    textAlign: 'center',
    padding: spacing.lg,
    fontSize: fontSize.sm,
    color: colors.gray[400],
  },

  // Empty
  empty: { alignItems: 'center', paddingVertical: 80 },
  emptyText: { fontSize: fontSize.sm, color: colors.gray[400] },

  // Media viewer
  viewerContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  viewerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: 50,
    paddingBottom: spacing.md,
  },
  viewerCloseBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewerCloseText: {
    fontSize: 18,
    color: '#fff',
    fontWeight: '600',
  },
  viewerCounter: {
    fontSize: fontSize.sm,
    color: '#fff',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  viewerSlide: {
    width: SCREEN_WIDTH,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewerImage: {
    width: SCREEN_WIDTH,
    height: '100%',
  },
  viewerVideoPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewerVideoText: {
    fontSize: fontSize.lg,
    color: '#fff',
  },
});
