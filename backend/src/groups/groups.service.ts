import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { AddMemberDto } from './dto/add-member.dto';
import { SettleDebtDto } from './dto/settle-debt.dto';

@Injectable()
export class GroupsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateGroupDto) {
    return this.prisma.group.create({
      data: { name: dto.name, members: { create: { userId } } },
      include: { members: { include: { user: true } } },
    });
  }

  async findOne(groupId: string, userId: string) {
    await this.assertMembership(groupId, userId);
    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
      include: {
        members: { include: { user: true } },
        expenses: {
          include: { paidBy: true, splits: { include: { user: true } } },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    if (!group) throw new NotFoundException('Group not found');
    return group;
  }

  async findAllForUser(userId: string) {
    return this.prisma.group.findMany({
      where: { members: { some: { userId } } },
      include: { members: { include: { user: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async assertMembership(groupId: string, userId: string) {
    const membership = await this.prisma.groupMember.findUnique({
      where: { userId_groupId: { userId, groupId } },
    });
    if (!membership) throw new ForbiddenException('You are not a member of this group');
  }

  async addMember(groupId: string, requesterId: string, dto: AddMemberDto) {
    await this.assertMembership(groupId, requesterId);
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user) throw new NotFoundException('No user found with that email');

    return this.prisma.groupMember.upsert({
      where: { userId_groupId: { userId: user.id, groupId } },
      update: {},
      create: { userId: user.id, groupId },
      include: { user: true },
    });
  }

  async settleDebt(groupId: string, payerId: string, dto: SettleDebtDto) {
    await this.assertMembership(groupId, payerId);
    await this.assertMembership(groupId, dto.toUserId);

    const recipient = await this.prisma.user.findUnique({ where: { id: dto.toUserId } });
    const description = dto.description || `Settlement payment to ${recipient?.name || 'member'}`;

    return this.prisma.expense.create({
      data: {
        groupId,
        description,
        amount: dto.amount,
        paidById: payerId,
        splits: {
          create: [{ userId: dto.toUserId, amountOwed: dto.amount }],
        },
      },
      include: { splits: true, paidBy: true },
    });
  }
}

