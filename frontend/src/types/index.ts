export type UserRole = 'author' | 'admin';

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  author_id?: string;
}

export interface AuthorProfile {
  id: string;
  author_id: string;
  name: string;
  email: string;
  phone?: string;
  city?: string;
  joined_date?: string;
}

export interface Book {
  id: string;
  book_id: string;
  author_id: string;
  title: string;
  isbn: string;
  genre: string;
  publication_date: string | null;
  status: string;
  mrp: number | null;
  author_royalty_per_copy: number | null;
  total_copies_sold: number;
  total_royalty_earned: number;
  royalty_paid: number;
  royalty_pending: number;
  last_royalty_payout_date: string | null;
  print_partner: string | null;
  available_on: string[];
}

export interface RoyaltySummary {
  total_earned: number;
  total_paid: number;
  total_pending: number;
  threshold: number;
  split_policy: string;
  payout_window: string;
  books: Book[];
}

export interface TicketMessage {
  id: string;
  ticket_id: string;
  sender_id: string;
  sender_name: string;
  sender_role: UserRole;
  content: string;
  message_type: string;
  is_published: boolean;
  created_at: string;
}

export interface InternalNote {
  id: string;
  ticket_id: string;
  admin_id: string;
  admin_name: string;
  content: string;
  created_at: string;
}

export interface AuditEvent {
  id: string;
  ticket_id: string;
  actor_id: string;
  actor_name: string;
  action: string;
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
  created_at: string;
}

export interface TicketAuthor {
  id: string;
  ticket_number: string;
  author_id: string;
  author_name: string;
  book_id: string | null;
  book_title: string;
  subject: string;
  description: string;
  attachment_filename: string | null;
  category: string;
  priority: string;
  status: string;
  created_at: string;
  updated_at: string;
  messages: TicketMessage[];
}

export interface TicketAdmin {
  id: string;
  ticket_number: string;
  author_id: string;
  author_name: string;
  author_email: string;
  book_id: string | null;
  book_title: string;
  subject: string;
  description: string;
  attachment_filename: string | null;
  category: string;
  priority: string;
  status: string;
  assigned_admin_id: string | null;
  assigned_admin_name: string | null;
  classification_source: string;
  priority_source: string;
  ai_reasoning?: string;
  created_at: string;
  updated_at: string;
  messages: TicketMessage[];
  internal_notes: InternalNote[];
  audit_events: AuditEvent[];
}

export interface AuthorRecentTicket {
  id: string;
  ticket_number: string;
  subject: string;
  category: string;
  priority: string;
  status: string;
  created_at: string;
}

export interface AuthorDashboardStats {
  author: AuthorProfile;
  total_books: number;
  published_books: number;
  in_production_books: number;
  total_copies_sold: number;
  total_royalty_earned: number;
  royalty_paid: number;
  royalty_pending: number;
  recent_tickets: AuthorRecentTicket[];
}

export interface AdminDashboardStats {
  total_tickets: number;
  open_tickets: number;
  in_progress_tickets: number;
  resolved_closed_tickets: number;
  critical_high_tickets: number;
  unassigned_tickets: number;
  avg_response_time_hours: number;
  category_breakdown: Record<string, number>;
  status_breakdown: Record<string, number>;
  priority_breakdown: Record<string, number>;
}

export interface AIDraftResponse {
  draft_reply: string;
  grounding_facts: string[];
  policy_references: string[];
  confidence: number;
  model_used: string;
}
