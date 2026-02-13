import type { AxiosInstance } from 'axios';
import type {
  CloseEventPeriodRequest,
  CreateEventGroupRequest,
  CreateEventPeriodRequest,
  EventGroup,
  EventGroupDetails,
  EventGroupQueryParams,
  UpdateEventGroupRequest,
  UpdateEventPeriodRequest,
} from '../types';

export function createEventGroupsApi(client: AxiosInstance) {
  return {
    list: (params?: EventGroupQueryParams) =>
      client.get<EventGroup[]>('/api/v1/event-groups', { params }).then((r) => r.data),

    get: (id: string) =>
      client.get<EventGroup>(`/api/v1/event-groups/${id}`).then((r) => r.data),

    create: (data: CreateEventGroupRequest) =>
      client.post<EventGroup>('/api/v1/event-groups', data).then((r) => r.data),

    update: (id: string, data: UpdateEventGroupRequest) =>
      client.patch<EventGroup>(`/api/v1/event-groups/${id}`, data).then((r) => r.data),

    delete: (id: string) =>
      client.delete(`/api/v1/event-groups/${id}`).then(() => void 0),

    getDetails: (id: string) =>
      client.get<EventGroupDetails>(`/api/v1/event-groups/${id}/details`).then((r) => r.data),

    createPeriod: (groupId: string, data: CreateEventPeriodRequest) =>
      client.post<EventGroup>(`/api/v1/event-groups/${groupId}/periods`, data).then((r) => r.data),

    updatePeriod: (periodId: string, data: UpdateEventPeriodRequest) =>
      client.patch<EventGroup>(`/api/v1/periods/${periodId}`, data).then((r) => r.data),

    closePeriod: (periodId: string, data: CloseEventPeriodRequest) =>
      client.post<EventGroup>(`/api/v1/periods/${periodId}/close`, data).then((r) => r.data),

    deletePeriod: (periodId: string) =>
      client.delete(`/api/v1/periods/${periodId}`).then(() => void 0),
  };
}
