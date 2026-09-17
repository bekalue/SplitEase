import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateExpenseDto } from './dto/create-expense.dto';

@Injectable()
export class ExpensesService {
  constructor(private prisma: PrismaService) {}

  async create(groupId: string, dto: CreateExpenseDto) {
    const splits = this.resolveSplits(dto);
    const total = splits.reduce((sum, s) => sum + s.amountOwed, 0);
    if (Math.abs(total - dto.amount) > 0.01) {
      throw new BadRequestException(`Splits (${total.toFixed(2)}) must sum to the expense amount (${dto.amount.toFixed(2)})`);
    }

    return this.prisma.expense.create({
      data: {
        groupId, description: dto.description, amount: dto.amount,
        paidById: dto.paidById, splits: { create: splits },
      },
      include: { splits: true, paidBy: true },
    });
  }

  async findAllForGroup(groupId: string) {
    return this.prisma.expense.findMany({
      where: { groupId },
      include: { splits: { include: { user: true } }, paidBy: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  private resolveSplits(dto: CreateExpenseDto) {
    if (dto.splits && dto.splits.length > 0) {
      return dto.splits.map((s) => ({ userId: s.userId, amountOwed: s.amountOwed }));
    }

    if (dto.splitAmongUserIds && dto.splitAmongUserIds.length > 0) {
      const n = dto.splitAmongUserIds.length;
      const base = Math.floor((dto.amount / n) * 100) / 100;
      const remainder = Math.round((dto.amount - base * n) * 100) / 100;
      return dto.splitAmongUserIds.map((userId, i) => ({
        userId,
        amountOwed: i === n - 1 ? Math.round((base + remainder) * 100) / 100 : base,
      }));
    }

    throw new BadRequestException('Provide either "splits" or "splitAmongUserIds"');
  }
}
