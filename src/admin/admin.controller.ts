import {
  Controller,
  Get,
  Patch,
  Body,
  UseGuards,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { UpdateEmailDto } from './dto/update-email.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { AdminGuard } from '../guards/admin.guard';
import { CurrentUser } from '../decorators/current-user.decorator';
import type { JwtPayload } from '../auth/strategies/jwt.strategy';

@Controller('admin')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('profile')
  async getProfile(@CurrentUser() user: JwtPayload) {
    return this.adminService.getProfile(user.sub);
  }

  @Patch('email')
  async updateEmail(
    @CurrentUser() user: JwtPayload,
    @Body() updateEmailDto: UpdateEmailDto,
  ) {
    return this.adminService.updateEmail(user.sub, updateEmailDto);
  }

  @Patch('password')
  async updatePassword(
    @CurrentUser() user: JwtPayload,
    @Body() updatePasswordDto: UpdatePasswordDto,
  ) {
    return this.adminService.updatePassword(user.sub, updatePasswordDto);
  }
}

