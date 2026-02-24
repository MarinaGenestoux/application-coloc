import api from './client';
import type {
  Event,
  EventStatus,
  RSVPStatus,
  CreateEventRequest,
  UpdateEventRequest,
  EventParticipant,
  DiscoverEventType,
  DiscoverEventsResponse,
} from '../types';

interface ListEventsParams {
  colocationId: string;
  status?: EventStatus;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
}

interface ListEventsResponse {
  events: Event[];
  total_count: number;
  page: number;
  page_size: number;
}

interface GetParticipantsResponse {
  participants: EventParticipant[];
  going_count: number;
  maybe_count: number;
  not_going_count: number;
}

export const eventApi = {
  async create(colocationId: string, data: CreateEventRequest): Promise<Event> {
    const response = await api.post<Event>(`/colocations/${colocationId}/events`, data);
    return response.data;
  },

  async getById(colocationId: string, eventId: string): Promise<Event> {
    const response = await api.get<Event>(`/colocations/${colocationId}/events/${eventId}`);
    return response.data;
  },

  async list(params: ListEventsParams): Promise<ListEventsResponse> {
    const { colocationId, ...queryParams } = params;
    const response = await api.get<ListEventsResponse>(`/colocations/${colocationId}/events`, {
      params: queryParams,
    });
    return response.data;
  },

  async update(
    colocationId: string,
    eventId: string,
    data: UpdateEventRequest
  ): Promise<Event> {
    const response = await api.put<Event>(`/colocations/${colocationId}/events/${eventId}`, data);
    return response.data;
  },

  async delete(colocationId: string, eventId: string): Promise<void> {
    await api.delete(`/colocations/${colocationId}/events/${eventId}`);
  },

  async rsvp(colocationId: string, eventId: string, status: RSVPStatus): Promise<void> {
    await api.post(`/colocations/${colocationId}/events/${eventId}/rsvp`, { status });
  },

  async getParticipants(
    colocationId: string,
    eventId: string
  ): Promise<GetParticipantsResponse> {
    const response = await api.get<GetParticipantsResponse>(
      `/colocations/${colocationId}/events/${eventId}/participants`
    );
    return response.data;
  },

  async discover(city: string, eventType: DiscoverEventType): Promise<DiscoverEventsResponse> {
    const response = await api.post<DiscoverEventsResponse>('/events/discover', {
      city,
      event_type: `DISCOVER_EVENT_TYPE_${eventType}`,
    });
    return response.data;
  },
};
