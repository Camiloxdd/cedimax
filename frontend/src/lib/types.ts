export type Appointment = {
  id: number;
  status: string;
  date: string;
  time: string;
  duration_minutes: number;
  price: string;
  notes: string | null;
  created_at: string;
  contact: { id: number; name: string; phone: string; wa_id?: string | null };
  service: { id: number; name: string; duration_minutes: number; price: string };
};

export type Service = {
  id: number;
  name: string;
  description: string | null;
  duration_minutes: number;
  price: string;
  active: boolean;
};

export type Conversation = {
  id: number;
  wa_id: string;
  contact?: string | null;
  status: string;
  updated_at: string;
  last_message?: string | null;
};

export type Stats = {
  citas_hoy: number;
  confirmadas_hoy: number;
  completadas_hoy: number;
  canceladas_hoy: number;
  enlaces_pendientes: number;
  proximas: Appointment[];
};

export type CalItem = {
  id: number;
  time: string;
  service: string;
  contact: string;
  phone: string;
  status: string;
  duration: number;
};

export type HoursRow = {
  id: number;
  day_of_week: number;
  open_time: string;
  close_time: string;
  slot_interval: number;
  active: boolean;
};

export type ExceptionRow = { id: number; date: string; reason: string | null };

export type MessageInfo = { id: number; direction: string; body: string; created_at: string };
export type SessionInfo = {
  token: string;
  status: string;
  service?: string | null;
  date?: string | null;
  time?: string | null;
  expires_at: string;
};
export type ConversationDetail = {
  id: number;
  wa_id: string;
  contact: { name?: string | null; phone?: string | null } | null;
  status: string;
  messages: MessageInfo[];
  sessions: SessionInfo[];
};