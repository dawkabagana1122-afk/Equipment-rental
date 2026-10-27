export type UserRole = 'admin' | 'manager' | 'fixer' | 'renter';

export type Session = {
  token: string;
  role: UserRole;
  expiresAt: string;
};

export type User = {
  id: string;
  role: UserRole;
  email: string;
  phone: string;
  name: string;
  company: string;
};

export type EquipmentItem = {
  id: string;
  name: string;
  model: string;
  status: string;
  meta: string;
  location: string;
  assignee: string;
  tenant: string;
  due: string;
  telemetry: {
    vibration: string;
    temperature: string;
    rpm: string;
  };
  live: boolean;
};

export type AlertItem = {
  id: string;
  title: string;
  equipmentId: string;
  risk: string;
  location: string;
  severity: 'high' | 'warning';
  description: string;
};

export type NotificationItem = {
  id: string;
  title: string;
  meta: string;
  type: 'alert' | 'calendar' | 'success' | 'warning';
  createdAt: string;
};

export type DashboardResponse = {
  summary: {
    totalEquipment: number;
    rentedToday: number;
    alerts: number;
    syncSecondsAgo: string;
    siteName: string;
  };
  equipment: EquipmentItem[];
  alerts: AlertItem[];
  notifications: NotificationItem[];
  supportTeam: { name: string; role: string }[];
};

let sessionToken: string | null = null;

export const setSessionToken = (token: string | null) => {
  sessionToken = token;
};

const request = async <T>(path: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(`/api${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {}),
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.message ?? 'Хүсэлт амжилтгүй боллоо.');
  }

  return response.json() as Promise<T>;
};

type AuthResponse = { message: string; user: User; session: Session };

const saveSession = async (result: Promise<AuthResponse>) => {
  const auth = await result;
  setSessionToken(auth.session.token);
  return auth;
};

export const api = {
  health: () => request<{ status: string; service: string; time: string }>('/health'),
  login: (payload: { email: string; password: string }) =>
    saveSession(request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    })),
  register: (payload: { email: string; name: string; company: string; password: string }) =>
    saveSession(request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    })),
  logout: async () => {
    try {
      await request<{ message: string }>('/auth/logout', { method: 'POST' });
    } finally {
      setSessionToken(null);
    }
  },
  getDashboard: () => request<DashboardResponse>('/dashboard'),
  getEquipment: () => request<EquipmentItem[]>('/equipment'),
  getEquipmentById: (id: string) => request<EquipmentItem>(`/equipment/${id}`),
  getNotifications: () => request<NotificationItem[]>('/notifications'),
  getAlerts: () => request<AlertItem[]>('/alerts'),
  sendSupportRequest: (payload: { message: string; team: string }) =>
    request<{ ok: boolean; message: string; team: string; ticketId: string; updatedAt: string }>('/support', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
};
