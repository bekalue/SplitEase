# Run this from inside: C:\Users\bekal\OneDrive\Documents\GitHub\SplitEase\backend
# It creates every missing/empty file with correct content.

# Remove the misplaced empty schema file
Remove-Item -Path "src\prisma\schema.prisma" -ErrorAction SilentlyContinue

# --- Folders ---
New-Item -ItemType Directory -Force -Path "prisma" | Out-Null
New-Item -ItemType Directory -Force -Path "src\prisma" | Out-Null
New-Item -ItemType Directory -Force -Path "src\auth\dto" | Out-Null
New-Item -ItemType Directory -Force -Path "src\groups\dto" | Out-Null
New-Item -ItemType Directory -Force -Path "src\expenses\dto" | Out-Null
New-Item -ItemType Directory -Force -Path "src\balances" | Out-Null

# --- .env (root of backend/, NOT inside prisma/) ---
@"
DATABASE_URL="postgresql://postgres:%23Unbeatable2054@localhost:5432/splitease?schema=public"
JWT_SECRET="change-this-to-a-long-random-string-in-production"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_SECRET="change-this-too-a-different-long-random-string"
JWT_REFRESH_EXPIRES_IN="7d"
PORT=4000
"@ | Out-File -Encoding utf8 -FilePath ".env"

# --- prisma/schema.prisma (project root, not src/) ---
@"
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id            String         @id @default(uuid())
  email         String         @unique
  passwordHash  String
  name          String
  memberships   GroupMember[]
  paidExpenses  Expense[]      @relation("PaidBy")
  splits        ExpenseSplit[]
  createdAt     DateTime       @default(now())
}

model Group {
  id        String        @id @default(uuid())
  name      String
  members   GroupMember[]
  expenses  Expense[]
  createdAt DateTime      @default(now())
}

model GroupMember {
  id      String @id @default(uuid())
  user    User   @relation(fields: [userId], references: [id])
  userId  String
  group   Group  @relation(fields: [groupId], references: [id])
  groupId String

  @@unique([userId, groupId])
}

model Expense {
  id          String         @id @default(uuid())
  group       Group          @relation(fields: [groupId], references: [id])
  groupId     String
  description String
  amount      Decimal        @db.Decimal(10, 2)
  paidBy      User           @relation("PaidBy", fields: [paidById], references: [id])
  paidById    String
  splits      ExpenseSplit[]
  createdAt   DateTime       @default(now())
}

model ExpenseSplit {
  id         String  @id @default(uuid())
  expense    Expense @relation(fields: [expenseId], references: [id], onDelete: Cascade)
  expenseId  String
  user       User    @relation(fields: [userId], references: [id])
  userId     String
  amountOwed Decimal @db.Decimal(10, 2)

  @@unique([expenseId, userId])
}
"@ | Out-File -Encoding utf8 -FilePath "prisma\schema.prisma"

# --- src/main.ts ---
@"
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors();
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const port = process.env.PORT || 4000;
  await app.listen(port);
  console.log(``✅ SplitEase API running on port `${port}``);
}

bootstrap();
"@ | Out-File -Encoding utf8 -FilePath "src\main.ts"

# --- src/app.module.ts ---
@"
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { GroupsModule } from './groups/groups.module';
import { ExpensesModule } from './expenses/expenses.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    GroupsModule,
    ExpensesModule,
  ],
})
export class AppModule {}
"@ | Out-File -Encoding utf8 -FilePath "src\app.module.ts"

# --- src/prisma/prisma.service.ts ---
@"
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.`$connect();
  }

  async onModuleDestroy() {
    await this.`$disconnect();
  }
}
"@ | Out-File -Encoding utf8 -FilePath "src\prisma\prisma.service.ts"

# --- src/prisma/prisma.module.ts ---
@"
import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
"@ | Out-File -Encoding utf8 -FilePath "src\prisma\prisma.module.ts"

# --- src/auth/dto/register.dto.ts ---
@"
import { IsEmail, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  password: string;

  @IsString()
  @MinLength(1)
  name: string;
}
"@ | Out-File -Encoding utf8 -FilePath "src\auth\dto\register.dto.ts"

# --- src/auth/dto/login.dto.ts ---
@"
import { IsEmail, IsString } from 'class-validator';

export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;
}
"@ | Out-File -Encoding utf8 -FilePath "src\auth\dto\login.dto.ts"

# --- src/auth/dto/refresh.dto.ts ---
@"
import { IsString } from 'class-validator';

export class RefreshDto {
  @IsString()
  refreshToken: string;
}
"@ | Out-File -Encoding utf8 -FilePath "src\auth\dto\refresh.dto.ts"

# --- src/auth/auth.service.ts ---
@"
import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

const SALT_ROUNDS = 12;

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}

  private async issueTokens(userId: string, email: string) {
    const payload = { sub: userId, email };
    const accessToken = await this.jwt.signAsync(payload, {
      secret: process.env.JWT_SECRET,
      expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    });
    const refreshToken = await this.jwt.signAsync(payload, {
      secret: process.env.JWT_REFRESH_SECRET,
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    });
    return { accessToken, refreshToken };
  }

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('An account with that email already exists');

    const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);
    const user = await this.prisma.user.create({
      data: { email: dto.email, passwordHash, name: dto.name },
    });

    const tokens = await this.issueTokens(user.id, user.email);
    return { user: { id: user.id, email: user.email, name: user.name }, ...tokens };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user) throw new UnauthorizedException('Invalid email or password');

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid email or password');

    const tokens = await this.issueTokens(user.id, user.email);
    return { user: { id: user.id, email: user.email, name: user.name }, ...tokens };
  }

  async refresh(refreshToken: string) {
    try {
      const payload = await this.jwt.verifyAsync(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET,
      });
      const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
      if (!user) throw new UnauthorizedException();
      return this.issueTokens(user.id, user.email);
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }
}
"@ | Out-File -Encoding utf8 -FilePath "src\auth\auth.service.ts"

# --- src/auth/auth.controller.ts ---
@"
import { Body, Controller, Post, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  refresh(@Body() dto: RefreshDto) {
    return this.authService.refresh(dto.refreshToken);
  }
}
"@ | Out-File -Encoding utf8 -FilePath "src\auth\auth.controller.ts"

# --- src/auth/jwt.strategy.ts ---
@"
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET,
    });
  }

  async validate(payload: { sub: string; email: string }) {
    return { userId: payload.sub, email: payload.email };
  }
}
"@ | Out-File -Encoding utf8 -FilePath "src\auth\jwt.strategy.ts"

# --- src/auth/jwt-auth.guard.ts ---
@"
import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
"@ | Out-File -Encoding utf8 -FilePath "src\auth\jwt-auth.guard.ts"

# --- src/auth/current-user.decorator.ts ---
@"
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
"@ | Out-File -Encoding utf8 -FilePath "src\auth\current-user.decorator.ts"

# --- src/auth/auth.module.ts ---
@"
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';

@Module({
  imports: [PassportModule, JwtModule.register({})],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
})
export class AuthModule {}
"@ | Out-File -Encoding utf8 -FilePath "src\auth\auth.module.ts"

# --- src/balances/balances.service.ts ---
@"
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface Balance {
  userId: string;
  name: string;
  netBalance: number;
}

interface Settlement {
  fromUserId: string;
  fromName: string;
  toUserId: string;
  toName: string;
  amount: number;
}

@Injectable()
export class BalancesService {
  constructor(private prisma: PrismaService) {}

  async getGroupBalances(groupId: string): Promise<{ balances: Balance[]; settlements: Settlement[] }> {
    const expenses = await this.prisma.expense.findMany({
      where: { groupId },
      include: { splits: true, paidBy: true },
    });

    const members = await this.prisma.groupMember.findMany({
      where: { groupId },
      include: { user: true },
    });

    const net = new Map<string, { name: string; amount: number }>();
    for (const m of members) net.set(m.userId, { name: m.user.name, amount: 0 });

    for (const expense of expenses) {
      const payer = net.get(expense.paidById);
      if (payer) payer.amount += Number(expense.amount);
      for (const split of expense.splits) {
        const debtor = net.get(split.userId);
        if (debtor) debtor.amount -= Number(split.amountOwed);
      }
    }

    const balances: Balance[] = Array.from(net.entries()).map(([userId, v]) => ({
      userId,
      name: v.name,
      netBalance: Math.round(v.amount * 100) / 100,
    }));

    return { balances, settlements: this.simplifyDebts(balances) };
  }

  private simplifyDebts(balances: Balance[]): Settlement[] {
    const creditors = balances.filter((b) => b.netBalance > 0.005).map((b) => ({ ...b })).sort((a, b) => b.netBalance - a.netBalance);
    const debtors = balances.filter((b) => b.netBalance < -0.005).map((b) => ({ ...b })).sort((a, b) => a.netBalance - b.netBalance);

    const settlements: Settlement[] = [];
    let i = 0, j = 0;

    while (i < debtors.length && j < creditors.length) {
      const debtor = debtors[i];
      const creditor = creditors[j];
      const amount = Math.min(-debtor.netBalance, creditor.netBalance);

      if (amount > 0.005) {
        settlements.push({
          fromUserId: debtor.userId, fromName: debtor.name,
          toUserId: creditor.userId, toName: creditor.name,
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
}
"@ | Out-File -Encoding utf8 -FilePath "src\balances\balances.service.ts"

# --- src/groups/dto/create-group.dto.ts ---
@"
import { IsString, MinLength } from 'class-validator';

export class CreateGroupDto {
  @IsString()
  @MinLength(1)
  name: string;
}
"@ | Out-File -Encoding utf8 -FilePath "src\groups\dto\create-group.dto.ts"

# --- src/groups/dto/add-member.dto.ts ---
@"
import { IsEmail } from 'class-validator';

export class AddMemberDto {
  @IsEmail()
  email: string;
}
"@ | Out-File -Encoding utf8 -FilePath "src\groups\dto\add-member.dto.ts"

# --- src/groups/groups.service.ts ---
@"
import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { AddMemberDto } from './dto/add-member.dto';

@Injectable()
export class GroupsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateGroupDto) {
    return this.prisma.group.create({
      data: { name: dto.name, members: { create: { userId } } },
      include: { members: { include: { user: true } } },
    });
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
}
"@ | Out-File -Encoding utf8 -FilePath "src\groups\groups.service.ts"

# --- src/groups/groups.controller.ts ---
@"
import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { GroupsService } from './groups.service';
import { BalancesService } from '../balances/balances.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { AddMemberDto } from './dto/add-member.dto';

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

  @Post(':id/members')
  async addMember(@CurrentUser() user: { userId: string }, @Param('id') groupId: string, @Body() dto: AddMemberDto) {
    return this.groupsService.addMember(groupId, user.userId, dto);
  }

  @Get(':id/balances')
  async getBalances(@CurrentUser() user: { userId: string }, @Param('id') groupId: string) {
    await this.groupsService.assertMembership(groupId, user.userId);
    return this.balancesService.getGroupBalances(groupId);
  }
}
"@ | Out-File -Encoding utf8 -FilePath "src\groups\groups.controller.ts"

# --- src/groups/groups.module.ts ---
@"
import { Module } from '@nestjs/common';
import { GroupsController } from './groups.controller';
import { GroupsService } from './groups.service';
import { BalancesService } from '../balances/balances.service';

@Module({
  controllers: [GroupsController],
  providers: [GroupsService, BalancesService],
})
export class GroupsModule {}
"@ | Out-File -Encoding utf8 -FilePath "src\groups\groups.module.ts"

# --- src/expenses/dto/create-expense.dto.ts ---
@"
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
"@ | Out-File -Encoding utf8 -FilePath "src\expenses\dto\create-expense.dto.ts"

# --- src/expenses/expenses.service.ts ---
@"
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
      throw new BadRequestException(``Splits (`${total.toFixed(2)}) must sum to the expense amount (`${dto.amount.toFixed(2)})``);
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
"@ | Out-File -Encoding utf8 -FilePath "src\expenses\expenses.service.ts"

# --- src/expenses/expenses.controller.ts ---
@"
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
"@ | Out-File -Encoding utf8 -FilePath "src\expenses\expenses.controller.ts"

# --- src/expenses/expenses.module.ts ---
@"
import { Module } from '@nestjs/common';
import { ExpensesController } from './expenses.controller';
import { ExpensesService } from './expenses.service';
import { GroupsService } from '../groups/groups.service';

@Module({
  controllers: [ExpensesController],
  providers: [ExpensesService, GroupsService],
})
export class ExpensesModule {}
"@ | Out-File -Encoding utf8 -FilePath "src\expenses\expenses.module.ts"

Write-Host ""
Write-Host "Done. Every file has been created/overwritten with correct content." -ForegroundColor Green
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  npx prisma migrate dev --name init"
Write-Host "  npm run start:dev"
