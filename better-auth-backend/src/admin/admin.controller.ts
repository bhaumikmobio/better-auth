import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import {
  ADMIN_MESSAGES,
  ADMIN_PASSWORD_MIN_LENGTH,
  ADMIN_USER_LIST_QUERY,
} from '../common/constants/admin.constants';
import { Roles } from '../common/decorators/roles.decorator';
import { AuthGuard } from '../common/guards/auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { successResponse } from '../common/response/api-response.util';
import { APP_ROLES, type AppRole } from '../common/types/auth-user.type';
import {
  STATUS_CODE_CREATED,
  STATUS_CODE_SUCCESS,
} from '../common/utils/http-status.util';
import type { CreateAdminUserDto } from './dto/create-admin-user.dto';
import type { UpdateAdminUserDto } from './dto/update-admin-user.dto';
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
      throw new BadRequestException(
        ADMIN_MESSAGES.VALIDATION.FIELD_MUST_BE_INTEGER(fieldName),
      );
    }

    const min = options?.min ?? Number.MIN_SAFE_INTEGER;
    const max = options?.max ?? Number.MAX_SAFE_INTEGER;
    if (parsedValue < min || parsedValue > max) {
      throw new BadRequestException(
        ADMIN_MESSAGES.VALIDATION.FIELD_MUST_BE_BETWEEN(fieldName, min, max),
      );
    }

    return parsedValue;
  }

  private requireTrimmedNonEmpty(value: unknown, emptyMessage: string): string {
    if (typeof value !== 'string' || !value.trim()) {
      throw new BadRequestException(emptyMessage);
    }
    return value.trim();
  }

  private parseCreatePassword(value: unknown): string {
    if (typeof value !== 'string' || !value) {
      throw new BadRequestException(
        ADMIN_MESSAGES.VALIDATION.PASSWORD_REQUIRED,
      );
    }
    if (value.length < ADMIN_PASSWORD_MIN_LENGTH) {
      throw new BadRequestException(
        ADMIN_MESSAGES.VALIDATION.PASSWORD_MIN_LENGTH(
          ADMIN_PASSWORD_MIN_LENGTH,
        ),
      );
    }
    return value;
  }

  private parseAppRole(role: unknown): AppRole {
    if (typeof role !== 'string' || !APP_ROLES.includes(role as AppRole)) {
      throw new BadRequestException(ADMIN_MESSAGES.VALIDATION.INVALID_ROLE);
    }
    return role as AppRole;
  }

  @Get('dashboard')
  @HttpCode(STATUS_CODE_SUCCESS)
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('admin')
  getDashboard(@Req() request: Request) {
    return {
      success: true as const,
      message: ADMIN_MESSAGES.DASHBOARD_DATA,
      user: request.user,
    };
  }

  @Get('profile')
  @HttpCode(STATUS_CODE_SUCCESS)
  @UseGuards(AuthGuard, RolesGuard)
  getProfile(@Req() request: Request) {
    return {
      success: true as const,
      message: ADMIN_MESSAGES.PROFILE,
      user: request.user,
    };
  }

  @Get('users')
  @HttpCode(STATUS_CODE_SUCCESS)
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('admin')
  async getUsers(
    @Query('limit') limitQuery: string | undefined,
    @Query('offset') offsetQuery: string | undefined,
    @Req() request: Request,
  ) {
    const limit = this.parseQueryNumber(
      limitQuery,
      'limit',
      ADMIN_USER_LIST_QUERY.DEFAULT_LIMIT,
      {
        min: ADMIN_USER_LIST_QUERY.MIN_LIMIT,
        max: ADMIN_USER_LIST_QUERY.MAX_LIMIT,
      },
    );
    const offset = this.parseQueryNumber(
      offsetQuery,
      'offset',
      ADMIN_USER_LIST_QUERY.DEFAULT_OFFSET,
      {
        min: ADMIN_USER_LIST_QUERY.MIN_OFFSET,
      },
    );

    const result = await this.adminService.listUsers(request.headers, {
      limit,
      offset,
    });

    return successResponse(ADMIN_MESSAGES.USERS_FETCHED, result);
  }

  @Post('users')
  @HttpCode(STATUS_CODE_CREATED)
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('admin')
  async createUser(@Body() body: CreateAdminUserDto, @Req() request: Request) {
    const name = this.requireTrimmedNonEmpty(
      body.name,
      ADMIN_MESSAGES.VALIDATION.NAME_NON_EMPTY,
    );
    const email = this.requireTrimmedNonEmpty(
      body.email,
      ADMIN_MESSAGES.VALIDATION.EMAIL_NON_EMPTY,
    );
    const password = this.parseCreatePassword(body.password);
    const role = this.parseAppRole(body.role);

    const user = await this.adminService.createUser(
      {
        name,
        email,
        password,
        role,
      },
      request.headers,
    );

    return successResponse(ADMIN_MESSAGES.USER_CREATED, user);
  }

  @Patch('users/:userId')
  @HttpCode(STATUS_CODE_SUCCESS)
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('admin')
  async updateUser(
    @Param('userId') userId: string,
    @Body() body: UpdateAdminUserDto,
    @Req() request: Request,
  ) {
    const payload: UpdateAdminUserDto = {};
    if (body.name !== undefined) {
      payload.name = this.requireTrimmedNonEmpty(
        body.name,
        ADMIN_MESSAGES.VALIDATION.NAME_NON_EMPTY,
      );
    }
    if (body.email !== undefined) {
      payload.email = this.requireTrimmedNonEmpty(
        body.email,
        ADMIN_MESSAGES.VALIDATION.EMAIL_NON_EMPTY,
      );
    }
    if (body.role !== undefined) {
      payload.role = this.parseAppRole(body.role);
    }

    if (Object.keys(payload).length === 0) {
      throw new BadRequestException(
        ADMIN_MESSAGES.VALIDATION.AT_LEAST_ONE_FIELD,
      );
    }

    const result = await this.adminService.updateUser(
      userId,
      payload,
      request.headers,
    );

    return successResponse(ADMIN_MESSAGES.USER_UPDATED, result);
  }

  @Delete('users/:userId')
  @HttpCode(STATUS_CODE_SUCCESS)
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('admin')
  async removeUser(@Param('userId') userId: string, @Req() request: Request) {
    const adminUser = request.user as { id?: string } | undefined;
    if (!adminUser?.id) {
      throw new BadRequestException(
        ADMIN_MESSAGES.VALIDATION.UNABLE_TO_RESOLVE_CURRENT_USER,
      );
    }

    const result = await this.adminService.removeUser(
      userId,
      adminUser.id,
      request.headers,
    );

    return successResponse(ADMIN_MESSAGES.USER_DELETED, result);
  }
}
