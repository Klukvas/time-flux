import { useMutation } from '@tanstack/react-query';
import type { LoginRequest, RegisterRequest } from '@lifespan/api';
import { useApi } from './api-context';

export function useLogin() {
  const api = useApi();
  return useMutation({
    mutationFn: (data: LoginRequest) => api.auth.login(data),
  });
}

export function useRegister() {
  const api = useApi();
  return useMutation({
    mutationFn: (data: RegisterRequest) => api.auth.register(data),
  });
}
