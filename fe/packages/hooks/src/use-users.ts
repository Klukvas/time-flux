import { useMutation } from '@tanstack/react-query';
import type { UpdateProfileRequest } from '@timeflux/api';
import { useApi } from './api-context';

export function useUpdateProfile() {
  const api = useApi();
  return useMutation({
    mutationFn: (data: UpdateProfileRequest) => api.users.updateProfile(data),
  });
}
