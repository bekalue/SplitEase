const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export interface User {
  id: string;
  email: string;
  name: string;
}

export interface GroupMember {
  id: string;
  userId: string;
  groupId: string;
  user?: User;
}

export interface ExpenseSplit {
  id: string;
  expenseId: string;
  userId: string;
  amountOwed: number;
  user?: User;
}

export interface Expense {
  id: string;
  groupId: string;
  description: string;
  amount: number;
  paidById: string;
  paidBy?: User;
  splits: ExpenseSplit[];
  createdAt: string;
}

export interface MemberBalance {
  userId: string;
  name: string;
  netBalance: number;
}

export interface Settlement {
  fromUserId: string;
  fromName: string;
  toUserId: string;
  toName: string;
  amount: number;
}

export interface BalancesResult {
  balances: MemberBalance[];
  settlements: Settlement[];
}

export interface Group {
  id: string;
  name: string;
  createdAt: string;
  members: GroupMember[];
  expenses?: Expense[];
}

class ApiService {
  private getAccessToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('splitease_access_token');
  }

  private getRefreshToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('splitease_refresh_token');
  }

  public setTokens(accessToken: string, refreshToken: string) {
    if (typeof window === 'undefined') return;
    localStorage.setItem('splitease_access_token', accessToken);
    localStorage.setItem('splitease_refresh_token', refreshToken);
  }

  public clearTokens() {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('splitease_access_token');
    localStorage.removeItem('splitease_refresh_token');
    localStorage.removeItem('splitease_user');
  }

  public setStoredUser(user: User) {
    if (typeof window === 'undefined') return;
    localStorage.setItem('splitease_user', JSON.stringify(user));
  }

  public getStoredUser(): User | null {
    if (typeof window === 'undefined') return null;
    const raw = localStorage.getItem('splitease_user');
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getAccessToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    let res = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    // Attempt token refresh if 401
    if (res.status === 401 && !endpoint.startsWith('/auth/')) {
      const refreshToken = this.getRefreshToken();
      if (refreshToken) {
        try {
          const refreshRes = await fetch(`${API_BASE_URL}/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken }),
          });

          if (refreshRes.ok) {
            const data = await refreshRes.json();
            this.setTokens(data.accessToken, data.refreshToken);
            headers['Authorization'] = `Bearer ${data.accessToken}`;
            res = await fetch(`${API_BASE_URL}${endpoint}`, {
              ...options,
              headers,
            });
          } else {
            this.clearTokens();
          }
        } catch {
          this.clearTokens();
        }
      }
    }

    if (!res.ok) {
      let message = 'An error occurred';
      try {
        const errorData = await res.json();
        message = Array.isArray(errorData.message)
          ? errorData.message.join(', ')
          : errorData.message || message;
      } catch {
        // fallback
      }
      throw new Error(message);
    }

    return res.json();
  }

  // --- Auth ---

  async register(data: { email: string; password: string; name: string }) {
    const res = await this.request<{ user: User; accessToken: string; refreshToken: string }>(
      '/auth/register',
      { method: 'POST', body: JSON.stringify(data) },
    );
    this.setTokens(res.accessToken, res.refreshToken);
    this.setStoredUser(res.user);
    return res;
  }

  async login(data: { email: string; password: string }) {
    const res = await this.request<{ user: User; accessToken: string; refreshToken: string }>(
      '/auth/login',
      { method: 'POST', body: JSON.stringify(data) },
    );
    this.setTokens(res.accessToken, res.refreshToken);
    this.setStoredUser(res.user);
    return res;
  }

  // --- Groups ---

  async getGroups(): Promise<Group[]> {
    return this.request<Group[]>('/groups');
  }

  async getGroup(id: string): Promise<Group> {
    return this.request<Group>(`/groups/${id}`);
  }

  async createGroup(name: string): Promise<Group> {
    return this.request<Group>('/groups', {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
  }

  async addMember(groupId: string, email: string): Promise<void> {
    return this.request<void>(`/groups/${groupId}/members`, {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  // --- Expenses ---

  async getExpenses(groupId: string): Promise<Expense[]> {
    return this.request<Expense[]>(`/groups/${groupId}/expenses`);
  }

  async createExpense(
    groupId: string,
    data: {
      description: string;
      amount: number;
      paidById: string;
      splitAmongUserIds?: string[];
      splits?: { userId: string; amountOwed: number }[];
    },
  ): Promise<Expense> {
    return this.request<Expense>(`/groups/${groupId}/expenses`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // --- Balances & Settlements ---

  async getBalances(groupId: string): Promise<BalancesResult> {
    return this.request<BalancesResult>(`/groups/${groupId}/balances`);
  }

  async settleDebt(
    groupId: string,
    data: { toUserId: string; amount: number; description?: string },
  ): Promise<Expense> {
    return this.request<Expense>(`/groups/${groupId}/settle`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
}

export const api = new ApiService();
