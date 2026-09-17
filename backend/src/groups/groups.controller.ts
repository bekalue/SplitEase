import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { GroupsService } from './groups.service';
import { BalancesService } from '../balances/balances.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { AddMemberDto } from './dto/add-member.dto';
import { SettleDebtDto } from './dto/settle-debt.dto';

@UseGuards(JwtAuthGuard)
@Controller('groups')
export class GroupsController {
  constructor(
    private groupsService: GroupsService,
    private balancesService: BalancesService,
  ) {}

  @Post()
  create(@CurrentUser() user: { userId: string }, @Body() dto: CreateGroupDto) {
    return this.groupsService.create(user.userId, dto);
  }

  @Get()
  findAll(@CurrentUser() user: { userId: string }) {
    return this.groupsService.findAllForUser(user.userId);
  }

  @Get(':id')
  findOne(@CurrentUser() user: { userId: string }, @Param('id') groupId: string) {
    return this.groupsService.findOne(groupId, user.userId);
  }

  @Post(':id/members')
  async addMember(@CurrentUser() user: { userId: string }, @Param('id') groupId: string, @Body() dto: AddMemberDto) {
    return this.groupsService.addMember(groupId, user.userId, dto);
  }

  @Get(':id/balances')
  async getBalances(@CurrentUser() user: { userId: string }, @Param('id') groupId: string) {
    await this.groupsService.assertMembership(groupId, user.userId);
    return this.balancesService.getGroupBalances(groupId);
  }

  @Post(':id/settle')
  async settle(
    @CurrentUser() user: { userId: string },
    @Param('id') groupId: string,
    @Body() dto: SettleDebtDto,
  ) {
    return this.groupsService.settleDebt(groupId, user.userId, dto);
  }
}

