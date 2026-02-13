import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import type { Language } from '@lifespan/i18n';
import { LANGUAGE_NAMES, SUPPORTED_LANGUAGES } from '@lifespan/i18n';
import type { ThemePreference } from '@lifespan/theme';
import { useTheme, useTranslation } from '@lifespan/hooks';
import { useAuthStore } from '@/stores/auth-store';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { borderRadius, fontSize, spacing } from '@/lib/theme';

export default function SettingsScreen() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const { t, language, setLanguage } = useTranslation();
  const { theme, setTheme, tokens } = useTheme();

  const themeOptions: { value: ThemePreference; label: string }[] = [
    { value: 'light', label: t('settings.theme_light') },
    { value: 'dark', label: t('settings.theme_dark') },
    { value: 'system', label: t('settings.theme_system') },
  ];

  const languageOptions: { value: Language; label: string }[] = SUPPORTED_LANGUAGES.map((lang) => ({
    value: lang,
    label: LANGUAGE_NAMES[lang],
  }));

  const handleLogout = () => {
    Alert.alert(t('auth.logout'), t('auth.logout') + '?', [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('auth.logout'),
        style: 'destructive',
        onPress: () => {
          logout();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={[styles.container, { backgroundColor: tokens.colors.bg }]}>
      {/* Appearance Section */}
      <View style={[styles.card, { backgroundColor: tokens.colors.bgCard }]}>
        <Text style={[styles.sectionTitle, { color: tokens.colors.text }]}>{t('settings.appearance')}</Text>

        {/* Theme */}
        <View style={styles.settingRow}>
          <Text style={[styles.settingLabel, { color: tokens.colors.textSecondary }]}>{t('settings.theme')}</Text>
          <Text style={[styles.settingDesc, { color: tokens.colors.textTertiary }]}>{t('settings.theme_description')}</Text>
          <SegmentedControl value={theme} onChange={setTheme} options={themeOptions} />
        </View>

        {/* Language */}
        <View style={[styles.settingRow, { marginTop: spacing.lg }]}>
          <Text style={[styles.settingLabel, { color: tokens.colors.textSecondary }]}>{t('settings.language')}</Text>
          <Text style={[styles.settingDesc, { color: tokens.colors.textTertiary }]}>{t('settings.language_description')}</Text>
          <SegmentedControl value={language} onChange={setLanguage} options={languageOptions} />
        </View>
      </View>

      {/* Account Section */}
      <View style={[styles.card, { backgroundColor: tokens.colors.bgCard }]}>
        <Text style={[styles.sectionTitle, { color: tokens.colors.text }]}>{t('settings.account')}</Text>
        <View style={styles.row}>
          <Text style={[styles.label, { color: tokens.colors.textSecondary }]}>{t('auth.email.label')}</Text>
          <Text style={[styles.value, { color: tokens.colors.text }]}>{user?.email}</Text>
        </View>
        <View style={styles.row}>
          <Text style={[styles.label, { color: tokens.colors.textSecondary }]}>Timezone</Text>
          <Text style={[styles.value, { color: tokens.colors.text }]}>{user?.timezone}</Text>
        </View>
      </View>

      <Pressable onPress={handleLogout} style={[styles.logoutBtn, { borderColor: tokens.colors.danger }]}>
        <Text style={[styles.logoutText, { color: tokens.colors.danger }]}>{t('auth.logout')}</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg, paddingBottom: spacing.xxl },
  card: {
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: spacing.lg,
  },
  sectionTitle: { fontSize: fontSize.lg, fontWeight: '600', marginBottom: spacing.lg },
  settingRow: { marginBottom: spacing.xs },
  settingLabel: { fontSize: fontSize.sm, fontWeight: '500', marginBottom: 2 },
  settingDesc: { fontSize: fontSize.xs, marginBottom: spacing.sm },
  row: { marginBottom: spacing.md },
  label: { fontSize: fontSize.sm, fontWeight: '500' },
  value: { fontSize: fontSize.md, marginTop: 2 },
  logoutBtn: {
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
  },
  logoutText: { fontSize: fontSize.md, fontWeight: '600' },
});
