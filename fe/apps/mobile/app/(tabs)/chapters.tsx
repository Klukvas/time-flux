import { useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import type { EventGroup } from '@lifespan/api';
import { extractApiError } from '@lifespan/api';
import { getUserMessage, validateTitle, validateDescription } from '@lifespan/domain';
import {
  useCategories,
  useCreateEventGroup,
  useDeleteEventGroup,
  useEventGroups,
  useUpdateEventGroup,
} from '@lifespan/hooks';
import { formatDateRange, hexToRgba } from '@lifespan/utils';
import { MAX_TITLE_LENGTH, MAX_DESCRIPTION_LENGTH } from '@lifespan/constants';
import { Loading } from '@/components/ui/loading';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { colors, fontSize, spacing, borderRadius } from '@/lib/theme';

export default function ChaptersScreen() {
  const router = useRouter();
  const { data: groups, isLoading } = useEventGroups();
  const { data: categories } = useCategories();
  const createGroup = useCreateEventGroup();
  const updateGroup = useUpdateEventGroup();
  const deleteGroup = useDeleteEventGroup();

  const [modalVisible, setModalVisible] = useState(false);
  const [editingGroup, setEditingGroup] = useState<EventGroup | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [description, setDescription] = useState('');

  const sorted = groups
    ? [...groups].sort((a, b) => {
        const aActive = a.periods.some((p) => p.endDate === null);
        const bActive = b.periods.some((p) => p.endDate === null);
        if (aActive !== bActive) return aActive ? -1 : 1;
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      })
    : [];

  const openCreate = () => {
    setEditingGroup(null);
    setTitle('');
    setCategoryId(categories?.[0]?.id ?? '');
    setDescription('');
    setModalVisible(true);
  };

  const openEdit = (group: EventGroup) => {
    setEditingGroup(group);
    setTitle(group.title);
    setCategoryId(group.category.id);
    setDescription(group.description ?? '');
    setModalVisible(true);
  };

  const handleSave = () => {
    const titleResult = validateTitle(title);
    if (!titleResult.valid) { Alert.alert('Error', titleResult.error!); return; }
    if (!categoryId) { Alert.alert('Error', 'Select a category.'); return; }
    const descResult = validateDescription(description);
    if (!descResult.valid) { Alert.alert('Error', descResult.error!); return; }

    const onSuccess = () => {
      setModalVisible(false);
    };
    const onError = (err: Error) => Alert.alert('Error', getUserMessage(extractApiError(err)));

    if (editingGroup) {
      updateGroup.mutate(
        { id: editingGroup.id, data: { title, categoryId, description: description || undefined } },
        { onSuccess, onError },
      );
    } else {
      createGroup.mutate(
        { title, categoryId, description: description || undefined },
        { onSuccess, onError },
      );
    }
  };

  const handleDelete = (group: EventGroup) => {
    Alert.alert('Delete Chapter', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () =>
          deleteGroup.mutate(group.id, {
            onError: (err) => Alert.alert('Error', getUserMessage(extractApiError(err))),
          }),
      },
    ]);
  };

  if (isLoading) return <Loading />;

  return (
    <View style={styles.flex}>
      <FlatList
        data={sorted}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <Button title="+ New Chapter" onPress={openCreate} style={{ marginBottom: spacing.lg }} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No chapters yet</Text>
          </View>
        }
        renderItem={({ item: group }) => {
          const hasActive = group.periods.some((p) => p.endDate === null);
          const latestPeriod = group.periods.length > 0
            ? group.periods.reduce((a, b) =>
                new Date(b.startDate) > new Date(a.startDate) ? b : a,
              )
            : null;

          return (
            <Pressable
              style={[styles.card, { borderLeftColor: group.category.color }]}
              onPress={() => router.push(`/chapter/${group.id}`)}
              onLongPress={() => handleDelete(group)}
            >
              <View style={styles.cardTop}>
                <Text style={styles.cardTitle} numberOfLines={1}>{group.title}</Text>
                <View style={[styles.badge, { backgroundColor: hexToRgba(group.category.color, 0.15) }]}>
                  <Text style={[styles.badgeText, { color: group.category.color }]}>
                    {group.category.name}
                  </Text>
                </View>
                {hasActive && (
                  <View style={styles.activeRow}>
                    <View style={styles.activeDot} />
                    <Text style={styles.activeText}>Active</Text>
                  </View>
                )}
              </View>
              {group.description && <Text style={styles.description} numberOfLines={2}>{group.description}</Text>}
              <View style={styles.meta}>
                <Text style={styles.metaText}>{group.periods.length} {group.periods.length === 1 ? 'period' : 'periods'}</Text>
                {latestPeriod && (
                  <Text style={styles.metaText}>{formatDateRange(latestPeriod.startDate, latestPeriod.endDate)}</Text>
                )}
              </View>
            </Pressable>
          );
        }}
      />

      {/* Create/Edit Modal */}
      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
        <ScrollView contentContainerStyle={styles.modal}>
          <Text style={styles.modalTitle}>
            {editingGroup ? 'Edit Chapter' : 'New Chapter'}
          </Text>

          <Input
            label="Title"
            value={title}
            onChangeText={setTitle}
            placeholder="e.g., Trip to Italy"
            maxLength={MAX_TITLE_LENGTH}
          />

          <Text style={styles.label}>Category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: spacing.lg }}>
            <View style={styles.catRow}>
              {categories?.map((cat) => (
                <Pressable
                  key={cat.id}
                  onPress={() => setCategoryId(cat.id)}
                  style={[
                    styles.catChip,
                    categoryId === cat.id && { backgroundColor: hexToRgba(cat.color, 0.2), borderColor: cat.color },
                  ]}
                >
                  <View style={[styles.catDot, { backgroundColor: cat.color }]} />
                  <Text style={styles.catChipText}>{cat.name}</Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>

          <Text style={styles.label}>Description (optional)</Text>
          <TextInput
            style={styles.textarea}
            value={description}
            onChangeText={setDescription}
            placeholder="What is this chapter about?"
            multiline
            maxLength={MAX_DESCRIPTION_LENGTH}
            placeholderTextColor={colors.gray[400]}
          />
          <Text style={styles.counter}>{description.length}/{MAX_DESCRIPTION_LENGTH}</Text>

          <View style={styles.modalActions}>
            <Button
              title="Cancel"
              variant="secondary"
              onPress={() => setModalVisible(false)}
              style={{ flex: 1 }}
            />
            <Button
              title={editingGroup ? 'Update' : 'Create'}
              onPress={handleSave}
              loading={createGroup.isPending || updateGroup.isPending}
              style={{ flex: 1 }}
            />
          </View>
        </ScrollView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  list: { padding: spacing.lg },
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    borderLeftWidth: 4,
    padding: spacing.md,
    marginBottom: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' },
  cardTitle: { fontSize: fontSize.sm, fontWeight: '600', color: colors.gray[900], flexShrink: 1 },
  badge: { borderRadius: borderRadius.full, paddingHorizontal: spacing.sm, paddingVertical: 2 },
  badgeText: { fontSize: fontSize.xs, fontWeight: '600' },
  activeRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  activeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.green[500] },
  activeText: { fontSize: fontSize.xs, fontWeight: '500', color: colors.green[600] },
  description: { fontSize: fontSize.sm, color: colors.gray[700], marginTop: spacing.xs },
  meta: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.xs },
  metaText: { fontSize: fontSize.xs, color: colors.gray[500] },
  empty: { alignItems: 'center', paddingVertical: 80 },
  emptyText: { fontSize: fontSize.md, color: colors.gray[500] },
  modal: { padding: spacing.xl, paddingTop: 60 },
  modalTitle: { fontSize: fontSize.xl, fontWeight: '600', color: colors.gray[900], marginBottom: spacing.xl },
  label: { fontSize: fontSize.sm, fontWeight: '500', color: colors.gray[700], marginBottom: spacing.xs },
  catRow: { flexDirection: 'row', gap: spacing.sm },
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.gray[300],
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  catDot: { width: 10, height: 10, borderRadius: 5 },
  catChipText: { fontSize: fontSize.sm, color: colors.gray[700] },
  textarea: {
    borderWidth: 1,
    borderColor: colors.gray[300],
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    fontSize: fontSize.md,
    color: colors.gray[900],
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: spacing.xs,
  },
  counter: { fontSize: fontSize.xs, color: colors.gray[400], textAlign: 'right', marginBottom: spacing.lg },
  modalActions: { flexDirection: 'row', gap: spacing.md },
});
