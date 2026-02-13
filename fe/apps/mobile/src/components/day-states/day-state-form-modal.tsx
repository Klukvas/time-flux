import { useEffect, useState } from 'react';
import { Alert, Modal, ScrollView, StyleSheet, Text, View } from 'react-native';
import Slider from '@react-native-community/slider';
import type { DayState } from '@lifespan/api';
import { extractApiError } from '@lifespan/api';
import { getUserMessage, validateColor, validateName } from '@lifespan/domain';
import { useCreateDayState, useTranslation, useUpdateDayState, useTheme } from '@lifespan/hooks';
import { BASE_COLORS, contrastTextColor, getMoodEmoji, getMoodLabel } from '@lifespan/utils';
import { Button } from '@/components/ui/button';
import { ColorPicker } from '@/components/ui/color-picker';
import { Input } from '@/components/ui/input';
import { borderRadius, fontSize, spacing } from '@/lib/theme';

const DEFAULT_COLOR: string = BASE_COLORS[0].hex;

interface DayStateFormModalProps {
  visible: boolean;
  onClose: () => void;
  dayState?: DayState | null;
}

export function DayStateFormModal({ visible, onClose, dayState }: DayStateFormModalProps) {
  const { t } = useTranslation();
  const { tokens } = useTheme();
  const createDayState = useCreateDayState();
  const updateDayState = useUpdateDayState();

  const [name, setName] = useState('');
  const [color, setColor] = useState(DEFAULT_COLOR);
  const [score, setScore] = useState(5);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isEditing = !!dayState;

  useEffect(() => {
    if (dayState) {
      setName(dayState.name);
      setColor(dayState.color);
      setScore(dayState.score);
    } else {
      setName('');
      setColor(DEFAULT_COLOR);
      setScore(5);
    }
    setErrors({});
  }, [dayState, visible]);

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
      updateDayState.mutate({ id: dayState.id, data: { name, color, score } }, { onSuccess, onError });
    } else {
      createDayState.mutate({ name, color, score }, { onSuccess, onError });
    }
  };

  const isPending = createDayState.isPending || updateDayState.isPending;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <ScrollView
        contentContainerStyle={[styles.modal, { backgroundColor: tokens.colors.bg }]}
        style={{ backgroundColor: tokens.colors.bg }}
      >
        <Text style={[styles.modalTitle, { color: tokens.colors.text }]}>
          {isEditing ? t('day_states.edit') : t('day_states.create')}
        </Text>

        {/* Live preview — circular badge for moods */}
        <View style={[styles.preview, { backgroundColor: tokens.colors.bgSecondary, borderColor: tokens.colors.border }]}>
          <View style={[styles.previewBadge, { backgroundColor: color }]}>
            <Text style={{ fontSize: fontSize.sm, fontWeight: '700', color: contrastTextColor(color) }}>
              {name ? name[0].toUpperCase() : '?'}
            </Text>
          </View>
          <Text style={[styles.previewName, { color: tokens.colors.text }]} numberOfLines={1}>
            {name || t('day_states.preview_placeholder')}
          </Text>
        </View>

        <Input
          label={t('day_states.form.name')}
          value={name}
          onChangeText={setName}
          error={errors.name}
          placeholder={t('day_states.form.name_placeholder')}
        />

        <Text style={[styles.label, { color: tokens.colors.textSecondary }]}>
          {t('day_states.form.color')}
        </Text>
        <ColorPicker value={color} onChange={setColor} />
        {errors.color && <Text style={styles.errorText}>{errors.color}</Text>}

        {/* Mood Intensity Slider */}
        <Text style={[styles.label, { color: tokens.colors.textSecondary }]}>
          {t('day_states.form.mood_intensity')}
        </Text>
        <View style={styles.sliderContainer}>
          <Text style={styles.emojiThumb}>{getMoodEmoji(score)}</Text>
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={10}
            step={1}
            value={score}
            onValueChange={(val) => setScore(val)}
            minimumTrackTintColor={tokens.colors.accent}
            maximumTrackTintColor={tokens.colors.border}
            thumbTintColor={tokens.colors.accent}
          />
          <View style={styles.sliderLabels}>
            <Text style={[styles.sliderEdgeLabel, { color: tokens.colors.textTertiary }]}>0</Text>
            <Text style={[styles.sliderValueLabel, { color: tokens.colors.textSecondary }]}>
              {score} — {getMoodLabel(score)}
            </Text>
            <Text style={[styles.sliderEdgeLabel, { color: tokens.colors.textTertiary }]}>10</Text>
          </View>
        </View>

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
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewName: { fontSize: fontSize.sm, fontWeight: '500', flex: 1 },
  label: { fontSize: fontSize.sm, fontWeight: '500', marginBottom: spacing.sm, marginTop: spacing.lg },
  errorText: { fontSize: fontSize.xs, color: '#ef4444', marginTop: spacing.xs },
  sliderContainer: {
    alignItems: 'center',
    paddingHorizontal: spacing.xs,
  },
  emojiThumb: {
    fontSize: 32,
    marginBottom: spacing.xs,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginTop: spacing.xs,
  },
  sliderEdgeLabel: {
    fontSize: fontSize.xs,
  },
  sliderValueLabel: {
    fontSize: fontSize.sm,
    fontWeight: '500',
  },
  actions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.xl },
});
