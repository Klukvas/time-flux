import { useEffect, useState } from 'react';
import { Alert, Modal, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { Category } from '@lifespan/api';
import { extractApiError } from '@lifespan/api';
import { getUserMessage, validateColor, validateName } from '@lifespan/domain';
import { useCreateCategory, useTranslation, useUpdateCategory } from '@lifespan/hooks';
import { BASE_COLORS, contrastTextColor } from '@lifespan/utils';
import { Button } from '@/components/ui/button';
import { ColorPicker } from '@/components/ui/color-picker';
import { Input } from '@/components/ui/input';
import { useTheme } from '@lifespan/hooks';
import { borderRadius, fontSize, spacing } from '@/lib/theme';

const DEFAULT_COLOR: string = BASE_COLORS[0].hex;

interface CategoryFormModalProps {
  visible: boolean;
  onClose: () => void;
  category?: Category | null;
  initialName?: string;
  initialColor?: string;
}

export function CategoryFormModal({
  visible,
  onClose,
  category,
  initialName,
  initialColor,
}: CategoryFormModalProps) {
  const { t } = useTranslation();
  const { tokens } = useTheme();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();

  const [name, setName] = useState('');
  const [color, setColor] = useState(DEFAULT_COLOR);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isEditing = !!category;

  useEffect(() => {
    if (category) {
      setName(category.name);
      setColor(category.color);
    } else {
      setName(initialName ?? '');
      setColor(initialColor ?? DEFAULT_COLOR);
    }
    setErrors({});
  }, [category, visible, initialName, initialColor]);

  const handleSubmit = () => {
    const newErrors: Record<string, string> = {};
    const nameResult = validateName(name);
    if (!nameResult.valid) newErrors.name = nameResult.error!;
    const colorResult = validateColor(color);
    if (!colorResult.valid) newErrors.color = colorResult.error!;
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const onSuccess = () => onClose();
    const onError = (err: Error) => Alert.alert('Error', getUserMessage(extractApiError(err)));

    if (isEditing) {
      updateCategory.mutate({ id: category.id, data: { name, color } }, { onSuccess, onError });
    } else {
      createCategory.mutate({ name, color }, { onSuccess, onError });
    }
  };

  const isPending = createCategory.isPending || updateCategory.isPending;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <ScrollView
        contentContainerStyle={[styles.modal, { backgroundColor: tokens.colors.bg }]}
        style={{ backgroundColor: tokens.colors.bg }}
      >
        <Text style={[styles.modalTitle, { color: tokens.colors.text }]}>
          {isEditing ? t('categories.edit') : t('categories.create')}
        </Text>

        {/* Live preview */}
        <View style={[styles.preview, { backgroundColor: tokens.colors.bgSecondary, borderColor: tokens.colors.border }]}>
          <View style={[styles.previewBadge, { backgroundColor: color }]}>
            <Text style={{ fontSize: fontSize.sm, fontWeight: '700', color: contrastTextColor(color) }}>
              {name ? name[0].toUpperCase() : '?'}
            </Text>
          </View>
          <Text style={[styles.previewName, { color: tokens.colors.text }]} numberOfLines={1}>
            {name || t('categories.preview_placeholder')}
          </Text>
        </View>

        <Input
          label={t('categories.form.name')}
          value={name}
          onChangeText={setName}
          error={errors.name}
          placeholder={t('categories.form.name_placeholder')}
        />

        <Text style={[styles.label, { color: tokens.colors.textSecondary }]}>
          {t('categories.form.color')}
        </Text>
        <ColorPicker value={color} onChange={setColor} />
        {errors.color && <Text style={styles.errorText}>{errors.color}</Text>}

        <View style={styles.actions}>
          <Button
            title={t('common.cancel')}
            variant="secondary"
            onPress={onClose}
            style={{ flex: 1 }}
          />
          <Button
            title={isEditing ? t('common.update') : t('common.create')}
            onPress={handleSubmit}
            loading={isPending}
            style={{ flex: 1 }}
          />
        </View>
      </ScrollView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modal: { padding: spacing.xl, paddingTop: 60 },
  modalTitle: { fontSize: fontSize.xl, fontWeight: '600', marginBottom: spacing.xl },
  preview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginBottom: spacing.lg,
  },
  previewBadge: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewName: { fontSize: fontSize.sm, fontWeight: '500', flex: 1 },
  label: { fontSize: fontSize.sm, fontWeight: '500', marginBottom: spacing.sm, marginTop: spacing.lg },
  errorText: { fontSize: fontSize.xs, color: '#ef4444', marginTop: spacing.xs },
  actions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.xl },
});
