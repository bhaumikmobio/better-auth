import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { Roles } from '../common/decorators/roles.decorator';
import { AuthGuard } from '../common/guards/auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { APP_ROLES } from '../common/types/auth-user.type';
import type { UpdateRoleDto } from './dto/update-role.dto';
import { AdminService } from './admin.service';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  private parseQueryNumber(
    value: string | undefined,
    fieldName: string,
    defaultValue: number,
    options?: { min?: number; max?: number },
  ): number {
    if (value === undefined) {
      return defaultValue;
    }

    const parsedValue = Number(value);
    if (!Number.isInteger(parsedValue)) {
      throw new BadRequestException(`${fieldName} must be an integer.`);
    }

    const min = options?.min ?? Number.MIN_SAFE_INTEGER;
    const max = options?.max ?? Number.MAX_SAFE_INTEGER;
    if (parsedValue < min || parsedValue > max) {
      throw new BadRequestException(
        `${fieldName} must be between ${min} and ${max}.`,
      );
    }

    return parsedValue;
  }

  // Route-level usage example with both guards applied together.
  @Get('dashboard')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('admin')
  getDashboard(@Req() request: Request) {
    return {
      message: 'Admin dashboard data',
      user: request.user,
    };
  }

  @Get('profile')
  @UseGuards(AuthGuard, RolesGuard)
  getProfile(@Req() request: Request) {
    return {
      message: 'Authenticated user profile',
      user: request.user,
    };
  }

  @Get('users')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('admin')
  async getUsers(
    @Query('limit') limitQuery: string | undefined,
    @Query('offset') offsetQuery: string | undefined,
    @Req() request: Request,
  ) {
    const limit = this.parseQueryNumber(limitQuery, 'limit', 50, {
      min: 1,
      max: 200,
    });
    const offset = this.parseQueryNumber(offsetQuery, 'offset', 0, {
      min: 0,
    });

    const result = await this.adminService.listUsers(request.headers, {
      limit,
      offset,
    });

    return {
      message: 'Admin users fetched successfully.',
      data: result,
    };
  }

  @Patch('users/:userId/role')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('admin')
  async updateUserRole(
    @Param('userId') userId: string,
    @Body() body: UpdateRoleDto,
    @Req() request: Request,
  ) {
    const role = body?.role;
    if (!role || !APP_ROLES.includes(role)) {
      throw new BadRequestException(
        `Invalid role. Allowed values: ${APP_ROLES.join(', ')}`,
      );
    }

    const result = await this.adminService.setUserRole(
      userId,
      role,
      request.headers,
    );

    return {
      message: 'User role updated successfully.',
      data: result,
    };
  }
}
