import { IsNumber, IsOptional, IsPositive, IsString, IsUUID } from 'class-validator';

export class SettleDebtDto {
  @IsUUID()
  toUserId: string;

  @IsNumber()
  @IsPositive()
  amount: number;

  @IsOptional()
  @IsString()
  description?: string;
}
