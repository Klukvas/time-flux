import { Redirect } from 'expo-router';
import { useAuthStore } from '@/stores/auth-store';
import { Loading } from '@/components/ui/loading';

export default function Index() {
  const token = useAuthStore((s) => s.token);
  const ready = useAuthStore((s) => s.ready);

  if (!ready) return <Loading />;
  if (token) return <Redirect href="/(tabs)/timeline" />;
  return <Redirect href="/(auth)/login" />;
}
