import { Module } from '@nestjs/common';
import { GroupsController } from './groups.controller';
import { GroupsService } from './groups.service';
import { BalancesService } from '../balances/balances.service';

@Module({
  controllers: [GroupsController],
  providers: [GroupsService, BalancesService],
  exports: [GroupsService, BalancesService],
})
export class GroupsModule {}
