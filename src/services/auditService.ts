import axios from 'axios';

export type AuditLog = {
  _id: string;
  action: string;
  actor?: string;
  actorUsuario?: string;
  actorNombre?: string;
  actorEsAdmin?: boolean;
  targetModel?: string;
  targetId?: string;
  description?: string;
  metadata?: Record<string, any> | null;
  ip?: string;
  createdAt: string;
};

export async function getAuditLogs(params: {
  rol?: 'admin' | 'mesero';
  accion?: string;
  desde?: string;
  hasta?: string;
  limit?: number;
  token?: string;
}): Promise<AuditLog[]> {
  const { token, ...query } = params;
  const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
  const { data } = await axios.get<AuditLog[]>('/api/auditoria', { params: query, headers });
  return data;
}