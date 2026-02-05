import api from './client';
import type { Expense, SplitType } from '../types';

interface SplitInput {
  user_id: string;
  amount?: number;
  percentage?: number;
}

interface CreateExpenseRequest {
  colocation_id: string;
  category_id: string;
  title: string;
  description?: string;
  amount: number;
  split_type: SplitType;
  expense_date: string;
  splits?: SplitInput[];
}

interface UpdateExpenseRequest {
  category_id?: string;
  title?: string;
  description?: string;
  amount?: number;
  split_type?: SplitType;
  expense_date?: string;
  splits?: SplitInput[];
}

interface ListExpensesParams {
  colocation_id: string;
  category_id?: string;
  paid_by?: string;
  start_date?: string;
  end_date?: string;
  page?: number;
  per_page?: number;
}

// Helper to get field with snake_case or camelCase fallback
function getField(data: Record<string, unknown>, snakeCase: string, camelCase: string): unknown {
  return data[snakeCase] ?? data[camelCase];
}

// Map API response to Expense type with nested objects
function mapExpense(data: Record<string, unknown>): Expense {
  const paidByNom = getField(data, 'paid_by_nom', 'paidByNom') as string | undefined;
  const paidByPrenom = getField(data, 'paid_by_prenom', 'paidByPrenom') as string | undefined;
  const categoryName = getField(data, 'category_name', 'categoryName') as string | undefined;
  const colocationId = getField(data, 'colocation_id', 'colocationId') as string;
  const paidBy = getField(data, 'paid_by', 'paidBy') as string;
  const categoryId = getField(data, 'category_id', 'categoryId') as string;
  const splitType = getField(data, 'split_type', 'splitType') as SplitType;
  const expenseDate = getField(data, 'expense_date', 'expenseDate') as string;
  const recurringId = getField(data, 'recurring_id', 'recurringId') as string | undefined;
  const createdAt = getField(data, 'created_at', 'createdAt') as string;

  return {
    id: data.id as string,
    colocation_id: colocationId,
    paid_by: paidBy,
    category_id: categoryId,
    title: data.title as string,
    description: data.description as string | undefined,
    amount: data.amount as number,
    split_type: splitType,
    expense_date: expenseDate,
    recurring_id: recurringId,
    created_at: createdAt,
    payer: paidByNom ? {
      id: paidBy,
      nom: paidByNom,
      prenom: paidByPrenom || '',
      email: '',
    } : undefined,
    category: categoryName ? {
      id: categoryId,
      name: categoryName,
      icon: (getField(data, 'category_icon', 'categoryIcon') as string) || '',
      color: (getField(data, 'category_color', 'categoryColor') as string) || '#5682F2',
      is_global: (getField(data, 'category_is_global', 'categoryIsGlobal') as boolean) || false,
    } : undefined,
    splits: Array.isArray(data.splits) ? data.splits.map((s: Record<string, unknown>) => {
      const userNom = getField(s, 'user_nom', 'userNom') as string | undefined;
      const userPrenom = getField(s, 'user_prenom', 'userPrenom') as string | undefined;
      const userId = getField(s, 'user_id', 'userId') as string;
      const expenseId = getField(s, 'expense_id', 'expenseId') as string;
      const isSettled = getField(s, 'is_settled', 'isSettled') as boolean;
      return {
        id: s.id as string,
        expense_id: expenseId,
        user_id: userId,
        amount: s.amount as number,
        percentage: s.percentage as number,
        is_settled: isSettled,
        user: userNom ? {
          id: userId,
          nom: userNom,
          prenom: userPrenom || '',
          email: '',
        } : undefined,
      };
    }) : [],
  };
}

export const expenseApi = {
  async list(params: ListExpensesParams): Promise<{ expenses: Expense[]; total: number }> {
    const { colocation_id, ...queryParams } = params;
    const response = await api.get<{ expenses: Record<string, unknown>[]; total: number }>(
      `/colocations/${colocation_id}/expenses`,
      { params: queryParams }
    );
    const expenses = (response.data.expenses || []).map(mapExpense);
    return { expenses, total: response.data.total || 0 };
  },

  async get(colocationId: string, id: string): Promise<Expense> {
    const response = await api.get<Record<string, unknown>>(`/colocations/${colocationId}/expenses/${id}`);
    return mapExpense(response.data);
  },

  async create(data: CreateExpenseRequest): Promise<Expense> {
    const { colocation_id, ...body } = data;
    const response = await api.post<Record<string, unknown>>(`/colocations/${colocation_id}/expenses`, body);
    return mapExpense(response.data);
  },

  async update(colocationId: string, id: string, data: UpdateExpenseRequest): Promise<Expense> {
    const response = await api.put<Record<string, unknown>>(`/colocations/${colocationId}/expenses/${id}`, data);
    return mapExpense(response.data);
  },

  async delete(colocationId: string, id: string): Promise<void> {
    await api.delete(`/colocations/${colocationId}/expenses/${id}`);
  },
};
