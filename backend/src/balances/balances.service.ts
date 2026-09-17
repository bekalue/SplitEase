import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  calculateBalancesAndSettlements,
  MemberBalance,
  Settlement,
  BalancesResult,
} from './balances-calculator';

export { MemberBalance, Settlement, BalancesResult };

@Injectable()
export class BalancesService {
  constructor(private prisma: PrismaService) {}

  async getGroupBalances(groupId: string): Promise<BalancesResult> {
    const [expenses, members] = await Promise.all([
      this.prisma.expense.findMany({
        where: { groupId },
        include: { splits: true },
      }),
      this.prisma.groupMember.findMany({
        where: { groupId },
        include: { user: true },
      }),
    ]);

    const formattedMembers = members.map((m) => ({
      userId: m.userId,
      name: m.user.name,
    }));

    const formattedExpenses = expenses.map((e) => ({
      paidById: e.paidById,
      amount: Number(e.amount),
      splits: e.splits.map((s) => ({
        userId: s.userId,
        amountOwed: Number(s.amountOwed),
      })),
    }));

    return calculateBalancesAndSettlements(formattedMembers, formattedExpenses);
  }
}

