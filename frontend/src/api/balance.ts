import api from './client';
import type { UserBalance, SimplifiedDebt } from '../types';

interface BalanceHistoryEntry {
  date: string;
  description: string;
  amount: number;
  type: 'expense_paid' | 'expense_owed' | 'payment_made' | 'payment_received';
  running_balance: number;
}

// Helper to get field with snake_case or camelCase fallback
function getField(data: Record<string, unknown>, snakeCase: string, camelCase: string): unknown {
  return data[snakeCase] ?? data[camelCase];
}

// Map API response to UserBalance with nested user object
function mapUserBalance(data: Record<string, unknown>): UserBalance {
  const userId = getField(data, 'user_id', 'userId') as string;
  const totalPaid = getField(data, 'total_paid', 'totalPaid') as number;
  const totalOwed = getField(data, 'total_owed', 'totalOwed') as number;
  const netBalance = getField(data, 'net_balance', 'netBalance') as number;
  const userNom = getField(data, 'user_nom', 'userNom') as string | undefined;
  const userPrenom = getField(data, 'user_prenom', 'userPrenom') as string | undefined;

  return {
    user_id: userId,
    total_paid: totalPaid,
    total_owed: totalOwed,
    net_balance: netBalance,
    user: userNom ? {
      id: userId,
      nom: userNom,
      prenom: userPrenom || '',
      email: '',
    } : undefined,
  };
}

// Map API response to SimplifiedDebt with nested user objects
function mapSimplifiedDebt(data: Record<string, unknown>): SimplifiedDebt {
  const fromUserId = getField(data, 'from_user_id', 'fromUserId') as string;
  const toUserId = getField(data, 'to_user_id', 'toUserId') as string;
  const fromUserNom = getField(data, 'from_user_nom', 'fromUserNom') as string | undefined;
  const fromUserPrenom = getField(data, 'from_user_prenom', 'fromUserPrenom') as string | undefined;
  const toUserNom = getField(data, 'to_user_nom', 'toUserNom') as string | undefined;
  const toUserPrenom = getField(data, 'to_user_prenom', 'toUserPrenom') as string | undefined;

  return {
    from_user_id: fromUserId,
    to_user_id: toUserId,
    amount: data.amount as number,
    from_user: fromUserNom ? {
      id: fromUserId,
      nom: fromUserNom,
      prenom: fromUserPrenom || '',
      email: '',
    } : undefined,
    to_user: toUserNom ? {
      id: toUserId,
      nom: toUserNom,
      prenom: toUserPrenom || '',
      email: '',
    } : undefined,
  };
}

export const balanceApi = {
  async getBalances(colocationId: string): Promise<UserBalance[]> {
    const response = await api.get<{ balances: Record<string, unknown>[] }>(
      `/colocations/${colocationId}/balances`
    );
    return (response.data.balances || []).map(mapUserBalance);
  },

  async getSimplifiedDebts(colocationId: string): Promise<SimplifiedDebt[]> {
    const response = await api.get<{ debts: Record<string, unknown>[] }>(
      `/colocations/${colocationId}/balances/simplified`
    );
    return (response.data.debts || []).map(mapSimplifiedDebt);
  },

  async getHistory(colocationId: string, userId?: string): Promise<BalanceHistoryEntry[]> {
    const response = await api.get<{ history: BalanceHistoryEntry[] }>(
      `/colocations/${colocationId}/balances/history`,
      { params: userId ? { user_id: userId } : undefined }
    );
    return response.data.history || [];
  },
};
