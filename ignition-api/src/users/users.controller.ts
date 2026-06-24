import {
  Controller,
  Get,
  Patch,
  Put,
  Post,
  Param,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';

import { UsersService } from './users.service';
import { RegisterDto } from './dto/register.dto';
import { RegisterResponseDto } from './dto/register-response.dto';
import { ConfirmEmailDto } from './dto/confirm-email.dto';
import { LoginDto, LoginResponseDto } from './dto/login.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateKYCStatusDto } from './dto/update-kyc-status.dto';
import { UserProfileDto, PublicUserProfileDto } from './dto/user-profile.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AdminGuard } from './guards/admin.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * POST /users/register
   * Register with email + password + walletAddress.
   */
  @Post('register')
  async register(
    @Body() dto: RegisterDto,
  ): Promise<RegisterResponseDto> {
    return this.usersService.register(dto.email, dto.walletAddress, dto.password);
  }

  /**
   * POST /users/confirm-email
   * Confirm email using confirmation token.
   */
  @Post('confirm-email')
  async confirmEmail(@Body() dto: ConfirmEmailDto) {
    return this.usersService.confirmEmail(dto.token);
  }

  /**
   * POST /users/login
   * Authenticate with email + password, returns access and refresh tokens.
   */
  @Post('login')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  async login(@Body() dto: LoginDto): Promise<LoginResponseDto> {
    return this.usersService.login(dto.email, dto.password);
  }

  /**
   * GET /users/me
   * Retrieve authenticated user's full profile
   */
  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMyProfile(@Request() req: any): Promise<UserProfileDto> {
    return this.usersService.getMyProfile(req.user.walletAddress);
  }

  /**
   * PATCH /users/me
   * Update authenticated user's profile
   */
  @UseGuards(JwtAuthGuard)
  @Patch('me')
  async updateMyProfile(
    @Request() req: any,
    @Body() updateDto: UpdateUserDto,
  ): Promise<UserProfileDto> {
    return this.usersService.updateMyProfile(req.user.walletAddress, updateDto);
  }

  /**
   * GET /users/profile
   */
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@Request() req: any): Promise<UserProfileDto> {
    return this.usersService.getMyProfile(req.user.walletAddress);
  }

  /**
   * PUT /users/profile
   */
  @UseGuards(JwtAuthGuard)
  @Put('profile')
  async putProfile(
    @Request() req: any,
    @Body() updateDto: UpdateUserDto,
  ): Promise<UserProfileDto> {
    return this.usersService.updateMyProfile(req.user.walletAddress, updateDto);
  }

  /**
   * GET /users/:walletAddress
   */
  @Get(':walletAddress')
  async getPublicProfile(
    @Param('walletAddress') walletAddress: string,
  ): Promise<PublicUserProfileDto> {
    return this.usersService.getPublicProfile(walletAddress);
  }
}

@Controller('admin/users')
export class AdminUsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * PATCH /admin/users/:id/kyc
   */
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Patch(':id/kyc')
  async updateKYCStatus(
    @Param('id') userId: string,
    @Body() updateDto: UpdateKYCStatusDto,
    @Request() req: any,
  ): Promise<{ success: boolean; message: string }> {
    return this.usersService.updateKYCStatus(
      userId,
      updateDto.status as 'VERIFIED' | 'REJECTED' | 'PENDING',
      req.user.walletAddress,
    );
  }

  /**
   * PATCH /admin/users/:id/role
   * Update user's role (admin only)
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Patch(':id/role')
  async updateUserRole(
    @Param('id') userId: string,
    @Body() updateDto: UpdateUserRoleDto,
    @Request() req: any,
  ): Promise<{ success: boolean; message: string }> {
    const adminId = req.user.sub || req.user.userId || req.user.walletAddress;
    return this.usersService.updateUserRole(
      userId,
      updateDto.role,
      adminId,
    );
  }
}

