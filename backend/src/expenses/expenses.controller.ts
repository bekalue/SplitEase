import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { GroupsService } from '../groups/groups.service';
import { ExpensesService } from './expenses.service';
import { CreateExpenseDto } from './dto/create-expense.dto';

@UseGuards(JwtAuthGuard)
@Controller('groups/:groupId/expenses')
export class ExpensesController {
  constructor(
    private expensesService: ExpensesService,
    private groupsService: GroupsService,
  ) {}

  @Post()
  async create(@CurrentUser() user: { userId: string }, @Param('groupId') groupId: string, @Body() dto: CreateExpenseDto) {
    await this.groupsService.assertMembership(groupId, user.userId);
    return this.expensesService.create(groupId, dto);
  }

  @Get()
  async findAll(@CurrentUser() user: { userId: string }, @Param('groupId') groupId: string) {
    await this.groupsService.assertMembership(groupId, user.userId);
    return this.expensesService.findAllForGroup(groupId);
  }
}
