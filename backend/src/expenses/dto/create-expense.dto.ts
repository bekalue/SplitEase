import { Type } from 'class-transformer';
import { IsString, IsNumber, IsPositive, IsArray, ValidateNested, IsOptional, ArrayMinSize } from 'class-validator';

class SplitEntryDto {
  @IsString()
  userId: string;

  @IsNumber()
  @IsPositive()
  amountOwed: number;
}

export class CreateExpenseDto {
  @IsString()
  description: string;

  @IsNumber()
  @IsPositive()
  amount: number;

  @IsString()
  paidById: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SplitEntryDto)
  splits?: SplitEntryDto[];

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  splitAmongUserIds?: string[];
}
