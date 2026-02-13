import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Link, router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { extractApiError } from '@lifespan/api';
import type { AuthUser } from '@lifespan/api';
import { getUserMessage, validateEmail, validatePassword } from '@lifespan/domain';
import { useLogin } from '@lifespan/hooks';
import { useAuthStore } from '@/stores/auth-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { colors, fontSize, spacing, borderRadius } from '@/lib/theme';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

export default function LoginScreen() {
  const setAuth = useAuthStore((s) => s.setAuth);
  const login = useLogin();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const handleLogin = () => {
    const emailResult = validateEmail(email);
    const passwordResult = validatePassword(password);
    if (!emailResult.valid || !passwordResult.valid) {
      setErrors({ email: emailResult.error, password: passwordResult.error });
      return;
    }
    setErrors({});
    login.mutate(
      { email, password },
      {
        onSuccess: (data) => {
          setAuth(data.access_token, data.refresh_token, data.user);
          router.replace('/(tabs)/timeline');
        },
        onError: (err) => {
          Alert.alert('Error', getUserMessage(extractApiError(err)));
        },
      },
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.flex}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.title}>LifeSpan</Text>
          <Text style={styles.subtitle}>Your visual life timeline</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Sign In</Text>
          <Input
            label="Email"
            value={email}
            onChangeText={setEmail}
            error={errors.email}
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />
          <Input
            label="Password"
            value={password}
            onChangeText={setPassword}
            error={errors.password}
            placeholder="Enter your password"
            secureTextEntry
          />
          <Button title="Sign In" onPress={handleLogin} loading={login.isPending} />
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>
          <Pressable
            onPress={() => WebBrowser.openBrowserAsync(`${API_BASE_URL}/api/v1/auth/google`)}
            style={({ pressed }) => [styles.googleButton, { opacity: pressed ? 0.7 : 1 }]}
          >
            <Text style={styles.googleButtonText}>Continue with Google</Text>
          </Pressable>
          <View style={styles.linkRow}>
            <Text style={styles.linkText}>Don't have an account? </Text>
            <Link href="/(auth)/register" style={styles.link}>
              Sign Up
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.xl,
  },
  header: { alignItems: 'center', marginBottom: spacing.xxl },
  title: { fontSize: fontSize.xxxl, fontWeight: 'bold', color: colors.brand[600] },
  subtitle: { fontSize: fontSize.sm, color: colors.gray[500], marginTop: spacing.xs },
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTitle: {
    fontSize: fontSize.xl,
    fontWeight: '600',
    color: colors.gray[900],
    marginBottom: spacing.xl,
  },
  linkRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.lg,
  },
  linkText: { fontSize: fontSize.sm, color: colors.gray[500] },
  link: { fontSize: fontSize.sm, fontWeight: '600', color: colors.brand[600] },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.gray[200],
  },
  dividerText: {
    marginHorizontal: spacing.sm,
    fontSize: fontSize.xs,
    color: colors.gray[400],
    textTransform: 'uppercase',
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.gray[200],
    backgroundColor: colors.white,
  },
  googleButtonText: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.gray[700],
  },
});
