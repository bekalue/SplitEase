export interface BalanceMember {
  userId: string;
  name: string;
}

export interface BalanceSplit {
  userId: string;
  amountOwed: number | string;
}

export interface BalanceExpense {
  paidById: string;
  amount: number | string;
  splits: BalanceSplit[];
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

/**
 * Pure function to calculate net balances and debt-minimizing settlement transactions.
 */
export function calculateBalancesAndSettlements(
  members: BalanceMember[],
  expenses: BalanceExpense[],
): BalancesResult {
  const net = new Map<string, { name: string; amount: number }>();
  for (const m of members) {
    net.set(m.userId, { name: m.name, amount: 0 });
  }

  for (const expense of expenses) {
    const paidAmount = Number(expense.amount);
    const payer = net.get(expense.paidById);
    if (payer) {
      payer.amount += paidAmount;
    }

    for (const split of expense.splits) {
      const splitAmount = Number(split.amountOwed);
      const debtor = net.get(split.userId);
      if (debtor) {
        debtor.amount -= splitAmount;
      }
    }
  }

  const balances: MemberBalance[] = Array.from(net.entries()).map(([userId, v]) => ({
    userId,
    name: v.name,
    netBalance: Math.round(v.amount * 100) / 100,
  }));

  const settlements = simplifyDebts(balances);

  return { balances, settlements };
}

/**
 * Greedily resolves debts to minimize total transactions across group members.
 */
export function simplifyDebts(balances: MemberBalance[]): Settlement[] {
  const creditors = balances
    .filter((b) => b.netBalance > 0.005)
    .map((b) => ({ ...b }))
    .sort((a, b) => b.netBalance - a.netBalance);

  const debtors = balances
    .filter((b) => b.netBalance < -0.005)
    .map((b) => ({ ...b }))
    .sort((a, b) => a.netBalance - b.netBalance);

  const settlements: Settlement[] = [];
  let i = 0;
  let j = 0;

  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];
    const amount = Math.min(-debtor.netBalance, creditor.netBalance);

    if (amount > 0.005) {
      settlements.push({
        fromUserId: debtor.userId,
        fromName: debtor.name,
        toUserId: creditor.userId,
        toName: creditor.name,
        amount: Math.round(amount * 100) / 100,
      });
    }

    debtor.netBalance += amount;
    creditor.netBalance -= amount;

    if (Math.abs(debtor.netBalance) < 0.005) i++;
    if (Math.abs(creditor.netBalance) < 0.005) j++;
  }

  return settlements;
}
