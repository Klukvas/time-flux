import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { DayState } from '@lifespan/api';
import { extractApiError } from '@lifespan/api';
import { getUserMessage } from '@lifespan/domain';
import { useCreateDayStateFromRecommendation, useDayStates, useDeleteDayState, useRecommendations, useTranslation, useTheme } from '@lifespan/hooks';
import { contrastTextColor } from '@lifespan/utils';
import { Loading } from '@/components/ui/loading';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { DayStateFormModal } from '@/components/day-states/day-state-form-modal';
import { borderRadius, fontSize, spacing } from '@/lib/theme';

export default function DayStatesScreen() {
  const { t } = useTranslation();
  const { tokens } = useTheme();
  const { data: dayStates, isLoading } = useDayStates();
  const { data: recommendations } = useRecommendations();
  const deleteDayState = useDeleteDayState();
  const createFromRecommendation = useCreateDayStateFromRecommendation();

  const [formVisible, setFormVisible] = useState(false);
  const [editingDayState, setEditingDayState] = useState<DayState | null>(null);

  // Recommendations state
  const [dismissedKeys, setDismissedKeys] = useState<Set<string>>(new Set());
  const [suggestionsDismissed, setSuggestionsDismissed] = useState(false);
  const [creatingKey, setCreatingKey] = useState<string | null>(null);
  const [addingAll, setAddingAll] = useState(false);

  const openCreate = () => {
    setEditingDayState(null);
    setFormVisible(true);
  };

  const openEdit = (dayState: DayState) => {
    setEditingDayState(dayState);
    setFormVisible(true);
  };

  const handleDelete = (dayState: DayState) => {
    Alert.alert(t('day_states.delete'), t('day_states.confirm_delete_message', { name: dayState.name }), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: () =>
          deleteDayState.mutate(dayState.id, {
            onError: (err) => Alert.alert('Error', getUserMessage(extractApiError(err))),
          }),
      },
    ]);
  };

  const handleAcceptRecommendation = async (key: string) => {
    setCreatingKey(key);
    try {
      const name = t(`day_states.recommendations.${key}`);
      await createFromRecommendation.mutateAsync({ key, name });
      setDismissedKeys((prev) => new Set(prev).add(key));
    } catch (err) {
      Alert.alert('Error', getUserMessage(extractApiError(err as Error)));
    } finally {
      setCreatingKey(null);
    }
  };

  const handleDismissRecommendation = (key: string) => {
    setDismissedKeys((prev) => new Set(prev).add(key));
  };

  const handleAddAll = async () => {
    setAddingAll(true);
    try {
      const remaining = (recommendations?.moods ?? []).filter((s) => !dismissedKeys.has(s.key));
      for (const rec of remaining) {
        const name = t(`day_states.recommendations.${rec.key}`);
        await createFromRecommendation.mutateAsync({ key: rec.key, name });
      }
      setSuggestionsDismissed(true);
    } catch (err) {
      Alert.alert('Error', getUserMessage(extractApiError(err as Error)));
    } finally {
      setAddingAll(false);
    }
  };

  const visibleRecommendations = (recommendations?.moods ?? []).filter((s) => !dismissedKeys.has(s.key));
  const showRecommendations = !suggestionsDismissed && visibleRecommendations.length > 0;

  if (isLoading) return <Loading />;

  return (
    <View style={styles.flex}>
      <FlatList
        data={dayStates ?? []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View>
            <Button title={`+ ${t('day_states.create')}`} onPress={openCreate} style={{ marginBottom: spacing.lg }} />

            {/* Recommendations panel */}
            {showRecommendations && !dayStates?.length && (
              <View style={{ marginBottom: spacing.lg }}>
                <EmptyState
                  title={t('day_states.empty.title')}
                  description={t('day_states.empty.description')}
                />

                <View style={[styles.suggestionsCard, { backgroundColor: tokens.colors.bgCard, borderColor: tokens.colors.border }]}>
                  <Text style={[styles.suggestionsTitle, { color: tokens.colors.text }]}>
                    {t('day_states.recommendations.title')}
                  </Text>
                  <Text style={[styles.suggestionsDesc, { color: tokens.colors.textSecondary }]}>
                    {t('day_states.recommendations.description')}
                  </Text>

                  <View style={styles.suggestionsWrap}>
                    {visibleRecommendations.map((s) => {
                      const name = t(`day_states.recommendations.${s.key}`);
                      const isCreating = creatingKey === s.key;
                      return (
                        <View key={s.key} style={styles.suggestionRow}>
                          <Pressable
                            onPress={() => handleAcceptRecommendation(s.key)}
                            disabled={addingAll || isCreating}
                            style={({ pressed }) => [
                              styles.suggestionChip,
                              { borderColor: tokens.colors.border, opacity: pressed || addingAll || isCreating ? 0.6 : 1 },
                            ]}
                          >
                            <View style={[styles.suggestionDot, { backgroundColor: s.color }]} />
                            <Text style={[styles.suggestionText, { color: tokens.colors.text }]}>{name}</Text>
                            {isCreating && <ActivityIndicator size="small" style={{ marginLeft: 4 }} />}
                          </Pressable>
                          <Pressable
                            onPress={() => handleDismissRecommendation(s.key)}
                            style={styles.dismissBtn}
                          >
                            <Text style={{ color: tokens.colors.textTertiary, fontSize: fontSize.sm }}>✕</Text>
                          </Pressable>
                        </View>
                      );
                    })}
                  </View>

                  <View style={styles.suggestionsActions}>
                    <Button
                      title={t('day_states.recommendations.add_all')}
                      variant="secondary"
                      onPress={handleAddAll}
                      loading={addingAll}
                    />
                    <Pressable onPress={() => setSuggestionsDismissed(true)}>
                      <Text style={{ color: tokens.colors.textTertiary, fontSize: fontSize.xs }}>
                        {t('day_states.recommendations.dismiss')}
                      </Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            )}

            {/* Empty state without recommendations */}
            {!dayStates?.length && !showRecommendations && (
              <EmptyState
                title={t('day_states.empty.title')}
                description={t('day_states.empty.description')}
                action={
                  <Button title={`+ ${t('day_states.create')}`} onPress={openCreate} />
                }
              />
            )}
          </View>
        }
        renderItem={({ item: ds }) => (
          <Pressable
            style={[styles.card, { backgroundColor: tokens.colors.bgCard }]}
            onPress={() => openEdit(ds)}
            onLongPress={() => handleDelete(ds)}
          >
            <View style={[styles.cardBadge, { backgroundColor: ds.color }]}>
              <Text style={{ fontSize: fontSize.sm, fontWeight: '700', color: contrastTextColor(ds.color) }}>
                {ds.name[0]}
              </Text>
            </View>
            <View style={styles.cardInfo}>
              <Text style={[styles.cardName, { color: tokens.colors.text }]} numberOfLines={1}>{ds.name}</Text>
              <Text style={[styles.cardLabel, { color: tokens.colors.textSecondary }]}>
                {ds.isSystem ? t('categories.system_label') : t('categories.custom_label')}
              </Text>
            </View>
          </Pressable>
        )}
      />

      <DayStateFormModal
        visible={formVisible}
        onClose={() => { setFormVisible(false); setEditingDayState(null); }}
        dayState={editingDayState}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  list: { padding: spacing.lg },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  cardBadge: {
    width: 40,
    height: 40,
    borderRadius: 20, // circular for moods
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardInfo: { flex: 1 },
  cardName: { fontSize: fontSize.md, fontWeight: '500' },
  cardLabel: { fontSize: fontSize.xs, marginTop: 2 },
  suggestionsCard: {
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    padding: spacing.lg,
    marginTop: spacing.lg,
  },
  suggestionsTitle: { fontSize: fontSize.sm, fontWeight: '600', marginBottom: spacing.xs },
  suggestionsDesc: { fontSize: fontSize.xs, marginBottom: spacing.lg },
  suggestionsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  suggestionRow: { flexDirection: 'row', alignItems: 'center' },
  suggestionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    paddingRight: spacing.xl,
  },
  suggestionDot: { width: 14, height: 14, borderRadius: 7 },
  suggestionText: { fontSize: fontSize.sm },
  dismissBtn: {
    marginLeft: -spacing.lg,
    padding: spacing.xs,
  },
  suggestionsActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    marginTop: spacing.lg,
  },
});
