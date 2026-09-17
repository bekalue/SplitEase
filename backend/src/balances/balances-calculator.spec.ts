import {
  calculateBalancesAndSettlements,
  simplifyDebts,
  MemberBalance,
  BalanceMember,
  BalanceExpense,
} from './balances-calculator';

describe('Balances & Debt Simplification Logic', () => {
  const alice: BalanceMember = { userId: 'u-alice', name: 'Alice' };
  const bob: BalanceMember = { userId: 'u-bob', name: 'Bob' };
  const charlie: BalanceMember = { userId: 'u-charlie', name: 'Charlie' };

  it('calculates equal 2-person split correctly', () => {
    // Alice pays $50 for dinner, split equally ($25 each) with Bob
    const expenses: BalanceExpense[] = [
      {
        paidById: 'u-alice',
        amount: 50,
        splits: [
          { userId: 'u-alice', amountOwed: 25 },
          { userId: 'u-bob', amountOwed: 25 },
        ],
      },
    ];

    const result = calculateBalancesAndSettlements([alice, bob], expenses);

    const aliceBal = result.balances.find((b) => b.userId === 'u-alice');
    const bobBal = result.balances.find((b) => b.userId === 'u-bob');

    expect(aliceBal?.netBalance).toBe(25);
    expect(bobBal?.netBalance).toBe(-25);

    expect(result.settlements).toHaveLength(1);
    expect(result.settlements[0]).toEqual({
      fromUserId: 'u-bob',
      fromName: 'Bob',
      toUserId: 'u-alice',
      toName: 'Alice',
      amount: 25,
    });
  });

  it('minimizes cyclic 3-person debts (A owes B, B owes C => A pays C)', () => {
    // Balances: Alice: -30, Bob: 0, Charlie: +30
    const balances: MemberBalance[] = [
      { userId: 'u-alice', name: 'Alice', netBalance: -30 },
      { userId: 'u-bob', name: 'Bob', netBalance: 0 },
      { userId: 'u-charlie', name: 'Charlie', netBalance: 30 },
    ];

    const settlements = simplifyDebts(balances);

    // Bob has 0 net balance, so Alice should pay Charlie directly in 1 transaction instead of 2
    expect(settlements).toHaveLength(1);
    expect(settlements[0]).toEqual({
      fromUserId: 'u-alice',
      fromName: 'Alice',
      toUserId: 'u-charlie',
      toName: 'Charlie',
      amount: 30,
    });
  });

  it('handles multi-person uneven splits with precision', () => {
    // Charlie pays $90 for groceries. Splits: Alice owes $45, Bob owes $30, Charlie owes $15
    const expenses: BalanceExpense[] = [
      {
        paidById: 'u-charlie',
        amount: 90,
        splits: [
          { userId: 'u-alice', amountOwed: 45 },
          { userId: 'u-bob', amountOwed: 30 },
          { userId: 'u-charlie', amountOwed: 15 },
        ],
      },
    ];

    const result = calculateBalancesAndSettlements([alice, bob, charlie], expenses);

    expect(result.balances.find((b) => b.userId === 'u-alice')?.netBalance).toBe(-45);
    expect(result.balances.find((b) => b.userId === 'u-bob')?.netBalance).toBe(-30);
    expect(result.balances.find((b) => b.userId === 'u-charlie')?.netBalance).toBe(75);

    // Charlie is owed 75 in total: Alice pays 45, Bob pays 30
    expect(result.settlements).toHaveLength(2);
    expect(result.settlements).toEqual(
      expect.arrayContaining([
        {
          fromUserId: 'u-alice',
          fromName: 'Alice',
          toUserId: 'u-charlie',
          toName: 'Charlie',
          amount: 45,
        },
        {
          fromUserId: 'u-bob',
          fromName: 'Bob',
          toUserId: 'u-charlie',
          toName: 'Charlie',
          amount: 30,
        },
      ]),
    );
  });

  it('correctly cancels debt when a settlement payment is recorded', () => {
    // 1. Alice pays $100 split with Bob ($50 each) -> Bob owes Alice $50
    // 2. Bob makes a settlement payment of $50 to Alice
    const expenses: BalanceExpense[] = [
      {
        paidById: 'u-alice',
        amount: 100,
        splits: [
          { userId: 'u-alice', amountOwed: 50 },
          { userId: 'u-bob', amountOwed: 50 },
        ],
      },
      {
        paidById: 'u-bob',
        amount: 50,
        splits: [{ userId: 'u-alice', amountOwed: 50 }],
      },
    ];

    const result = calculateBalancesAndSettlements([alice, bob], expenses);

    expect(result.balances.find((b) => b.userId === 'u-alice')?.netBalance).toBe(0);
    expect(result.balances.find((b) => b.userId === 'u-bob')?.netBalance).toBe(0);
    expect(result.settlements).toHaveLength(0);
  });
});
