export type UserRole = 'manager' | 'fixer' | 'renter' | 'employee' | 'tenant';

export type Session = {
  token: string;
  role: UserRole;
  expiresAt: string;
};

export type User = {
  id: string;
  role: UserRole;
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

const request = async <T>(path: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(`/api${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || 'Request failed');
  }

  return response.json() as Promise<T>;
};

export const api = {
  health: () => request<{ status: string; service: string; time: string }>('/health'),
  login: (payload: { role: UserRole; phone: string; code: string }) =>
    request<{ message: string; user: User; session: Session }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
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
