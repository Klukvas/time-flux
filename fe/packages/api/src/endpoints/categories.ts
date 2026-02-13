import type { AxiosInstance } from 'axios';
import type { Category, CreateCategoryRequest, CreateFromRecommendationRequest, UpdateCategoryRequest } from '../types';

export function createCategoriesApi(client: AxiosInstance) {
  return {
    list: () =>
      client.get<Category[]>('/api/v1/categories').then((r) => r.data),

    create: (data: CreateCategoryRequest) =>
      client.post<Category>('/api/v1/categories', data).then((r) => r.data),

    createFromRecommendation: (data: CreateFromRecommendationRequest) =>
      client.post<Category>('/api/v1/categories/from-recommendation', data).then((r) => r.data),

    update: (id: string, data: UpdateCategoryRequest) =>
      client.patch<Category>(`/api/v1/categories/${id}`, data).then((r) => r.data),

    delete: (id: string) =>
      client.delete(`/api/v1/categories/${id}`).then(() => void 0),
  };
}
