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
import type { Category } from '@lifespan/api';
import { extractApiError } from '@lifespan/api';
import { getUserMessage } from '@lifespan/domain';
import { useCategories, useCreateCategoryFromRecommendation, useDeleteCategory, useRecommendations, useTranslation, useTheme } from '@lifespan/hooks';
import { contrastTextColor } from '@lifespan/utils';
import { Loading } from '@/components/ui/loading';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { CategoryFormModal } from '@/components/categories/category-form-modal';
import { borderRadius, fontSize, spacing } from '@/lib/theme';

export default function CategoriesScreen() {
  const { t } = useTranslation();
  const { tokens } = useTheme();
  const { data: categories, isLoading } = useCategories();
  const { data: recommendations } = useRecommendations();
  const deleteCategory = useDeleteCategory();
  const createFromRecommendation = useCreateCategoryFromRecommendation();

  const [formVisible, setFormVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formInitialName, setFormInitialName] = useState<string | undefined>();
  const [formInitialColor, setFormInitialColor] = useState<string | undefined>();

  // Recommendations state
  const [dismissedKeys, setDismissedKeys] = useState<Set<string>>(new Set());
  const [suggestionsDismissed, setSuggestionsDismissed] = useState(false);
  const [creatingKey, setCreatingKey] = useState<string | null>(null);
  const [addingAll, setAddingAll] = useState(false);

  const openCreate = () => {
    setEditingCategory(null);
    setFormInitialName(undefined);
    setFormInitialColor(undefined);
    setFormVisible(true);
  };

  const openEdit = (category: Category) => {
    setEditingCategory(category);
    setFormInitialName(undefined);
    setFormInitialColor(undefined);
    setFormVisible(true);
  };

  const handleDelete = (category: Category) => {
    Alert.alert(t('categories.delete'), t('categories.confirm_delete_message', { name: category.name }), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: () =>
          deleteCategory.mutate(category.id, {
            onError: (err) => Alert.alert('Error', getUserMessage(extractApiError(err))),
          }),
      },
    ]);
  };

  const handleAcceptRecommendation = async (key: string) => {
    setCreatingKey(key);
    try {
      const name = t(`categories.recommendations.${key}`);
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
      const colors = new Set((categories ?? []).map((c) => c.color.toLowerCase()));
      const remaining = (recommendations?.categories ?? []).filter(
        (s) => !dismissedKeys.has(s.key) && !colors.has(s.color.toLowerCase()),
      );
      for (const rec of remaining) {
        const name = t(`categories.recommendations.${rec.key}`);
        await createFromRecommendation.mutateAsync({ key: rec.key, name });
      }
      setSuggestionsDismissed(true);
    } catch (err) {
      Alert.alert('Error', getUserMessage(extractApiError(err as Error)));
    } finally {
      setAddingAll(false);
    }
  };

  const existingColors = new Set((categories ?? []).map((c) => c.color.toLowerCase()));
  const visibleRecommendations = (recommendations?.categories ?? []).filter(
    (s) => !dismissedKeys.has(s.key) && !existingColors.has(s.color.toLowerCase()),
  );
  const showRecommendations = !suggestionsDismissed && visibleRecommendations.length > 0;

  if (isLoading) return <Loading />;

  return (
    <View style={styles.flex}>
      <FlatList
        data={categories ?? []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View>
            <Button title={`+ ${t('categories.create')}`} onPress={openCreate} style={{ marginBottom: spacing.lg }} />

            {/* Recommendations panel */}
            {showRecommendations && !categories?.length && (
              <View style={{ marginBottom: spacing.lg }}>
                <EmptyState
                  title={t('categories.empty.title')}
                  description={t('categories.empty.description')}
                />

                <View style={[styles.suggestionsCard, { backgroundColor: tokens.colors.bgCard, borderColor: tokens.colors.border }]}>
                  <Text style={[styles.suggestionsTitle, { color: tokens.colors.text }]}>
                    {t('categories.recommendations.title')}
                  </Text>
                  <Text style={[styles.suggestionsDesc, { color: tokens.colors.textSecondary }]}>
                    {t('categories.recommendations.description')}
                  </Text>

                  <View style={styles.suggestionsWrap}>
                    {visibleRecommendations.map((s) => {
                      const name = t(`categories.recommendations.${s.key}`);
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
                      title={t('categories.recommendations.add_all')}
                      variant="secondary"
                      onPress={handleAddAll}
                      loading={addingAll}
                    />
                    <Pressable onPress={() => setSuggestionsDismissed(true)}>
                      <Text style={{ color: tokens.colors.textTertiary, fontSize: fontSize.xs }}>
                        {t('categories.recommendations.dismiss')}
                      </Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            )}

            {/* Empty state without recommendations */}
            {!categories?.length && !showRecommendations && (
              <EmptyState
                title={t('categories.empty.title')}
                description={t('categories.empty.description')}
                action={
                  <Button title={`+ ${t('categories.create')}`} onPress={openCreate} />
                }
              />
            )}
          </View>
        }
        renderItem={({ item: cat }) => (
          <Pressable
            style={[styles.card, { backgroundColor: tokens.colors.bgCard }]}
            onPress={() => openEdit(cat)}
            onLongPress={() => handleDelete(cat)}
          >
            <View style={[styles.cardBadge, { backgroundColor: cat.color }]}>
              <Text style={{ fontSize: fontSize.sm, fontWeight: '700', color: contrastTextColor(cat.color) }}>
                {cat.name[0]}
              </Text>
            </View>
            <View style={styles.cardInfo}>
              <Text style={[styles.cardName, { color: tokens.colors.text }]} numberOfLines={1}>{cat.name}</Text>
              <Text style={[styles.cardLabel, { color: tokens.colors.textSecondary }]}>
                {cat.isSystem ? t('categories.system_label') : t('categories.custom_label')}
              </Text>
            </View>
          </Pressable>
        )}
      />

      <CategoryFormModal
        visible={formVisible}
        onClose={() => { setFormVisible(false); setEditingCategory(null); }}
        category={editingCategory}
        initialName={formInitialName}
        initialColor={formInitialColor}
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
    borderRadius: borderRadius.md,
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
