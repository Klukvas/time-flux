import { Redirect, Tabs } from 'expo-router';
import { useAuthStore } from '@/stores/auth-store';
import { Loading } from '@/components/ui/loading';
import { useTheme, useTranslation } from '@lifespan/hooks';
import { Text } from 'react-native';

function TabIcon({ name, focused }: { name: string; focused: boolean }) {
  const { tokens } = useTheme();
  return (
    <Text style={{ fontSize: 10, color: focused ? tokens.colors.accent : tokens.colors.textTertiary }}>
      {name}
    </Text>
  );
}

export default function TabsLayout() {
  const token = useAuthStore((s) => s.token);
  const ready = useAuthStore((s) => s.ready);
  const { tokens } = useTheme();
  const { t } = useTranslation();

  if (!ready) return <Loading />;
  if (!token) return <Redirect href="/(auth)/login" />;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: tokens.colors.accent,
        tabBarInactiveTintColor: tokens.colors.textTertiary,
        tabBarStyle: { backgroundColor: tokens.colors.bgCard },
        headerStyle: { backgroundColor: tokens.colors.bgCard },
        headerTintColor: tokens.colors.text,
        headerShadowVisible: false,
      }}
    >
      <Tabs.Screen
        name="insights"
        options={{
          title: t('nav.insights'),
          tabBarIcon: ({ focused }) => <TabIcon name="I" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="timeline"
        options={{
          title: t('nav.timeline'),
          tabBarIcon: ({ focused }) => <TabIcon name="T" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="chapters"
        options={{
          title: t('nav.chapters'),
          tabBarIcon: ({ focused }) => <TabIcon name="Ch" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="categories"
        options={{
          title: t('nav.categories'),
          tabBarIcon: ({ focused }) => <TabIcon name="C" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="day-states"
        options={{
          title: t('nav.day_states'),
          tabBarIcon: ({ focused }) => <TabIcon name="M" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t('nav.settings'),
          tabBarIcon: ({ focused }) => <TabIcon name="S" focused={focused} />,
        }}
      />
    </Tabs>
  );
}
