// User types
export interface User {
  id: string;
  email: string;
  nom: string;
  prenom: string;
  telephone?: string;
  avatar_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserInfo {
  id: string;
  email: string;
  nom: string;
  prenom: string;
  telephone?: string;
  avatar_url?: string;
}

// Auth types
export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  user: UserInfo;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  nom: string;
  prenom: string;
  telephone?: string;
}

// Colocation types
export interface Colocation {
  id: string;
  name: string;
  description?: string;
  address?: string;
  invite_code: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ColocationMember {
  id: string;
  user_id: string;
  userId?: string; // camelCase alias from API
  colocation_id: string;
  role: 'admin' | 'member';
  joined_at: string;
  nom?: string;
  prenom?: string;
  email?: string;
  avatar_url?: string;
  user?: User;
}

export interface ColocationWithMembers extends Colocation {
  members: ColocationMember[];
}

// Category types
export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  colocation_id?: string;
  is_global: boolean;
}

export interface CategoryStat {
  category: Category;
  total_amount: number;
  expense_count: number;
  percentage: number;
}

// Expense types
export type SplitType = 'equal' | 'percentage' | 'custom' | 'payer_only';

export interface ExpenseSplit {
  id: string;
  expense_id: string;
  user_id: string;
  amount: number;
  percentage?: number;
  is_settled: boolean;
  user?: UserInfo;
}

export interface Expense {
  id: string;
  colocation_id: string;
  paid_by: string;
  category_id: string;
  title: string;
  description?: string;
  amount: number;
  split_type: SplitType;
  expense_date: string;
  recurring_id?: string;
  created_at: string;
  payer?: UserInfo;
  category?: Category;
  splits: ExpenseSplit[];
}

// Balance types
export interface UserBalance {
  user_id: string;
  user?: UserInfo;
  total_paid: number;
  total_owed: number;
  net_balance: number;
}

export interface SimplifiedDebt {
  from_user_id: string;
  from_user?: UserInfo;
  to_user_id: string;
  to_user?: UserInfo;
  amount: number;
}

// Event types
export type EventStatus = 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
export type RSVPStatus = 'going' | 'maybe' | 'not_going' | '';

export interface Event {
  id: string;
  colocation_id: string;
  created_by: string;
  created_by_nom: string;
  created_by_prenom: string;
  title: string;
  description?: string;
  event_date: string;
  location?: string;
  budget?: number;
  fund_id?: string;
  status: EventStatus;
  created_at: string;
  user_rsvp: RSVPStatus;
  going_count: number;
  maybe_count: number;
  not_going_count: number;
}

export interface EventParticipant {
  user_id: string;
  user_nom: string;
  user_prenom: string;
  avatar_url?: string;
  rsvp_status: RSVPStatus;
  responded_at: string;
}

export interface CreateEventRequest {
  title: string;
  description?: string;
  event_date: string; // Format: YYYY-MM-DD HH:MM
  location?: string;
  budget?: number;
  fund_id?: string;
}

export interface UpdateEventRequest {
  title?: string;
  description?: string;
  event_date?: string;
  location?: string;
  budget?: number;
  fund_id?: string;
  status?: EventStatus;
}

// Event Discovery types
export type DiscoverEventType =
  | 'CONCERT'
  | 'EXPOSITION'
  | 'FESTIVAL'
  | 'SPORT'
  | 'THEATRE'
  | 'GASTRONOMIE'
  | 'MARCHE'
  | 'CINEMA'
  | 'CONFERENCE'
  | 'SOIREE';

export interface DiscoveredEvent {
  title: string;
  description: string;
  date: string;
  location: string;
  price?: number;
  url?: string;
  source: string;
}

export interface DiscoverEventsResponse {
  events: DiscoveredEvent[];
  search_summary: string;
}

// API Response types
export interface ApiError {
  code: number;
  message: string;
  details?: string[];
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}
