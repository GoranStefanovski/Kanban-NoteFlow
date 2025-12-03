import { Controller, Get, Param, UseGuards, Query } from '@nestjs/common';
import { ActivityLogService } from './activity-log.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { AdminGuard } from '../guards/admin.guard';

@Controller('activity-log')
@UseGuards(JwtAuthGuard, AdminGuard) // Only admins can view activity logs
export class ActivityLogController {
  constructor(private readonly activityLogService: ActivityLogService) {}

  @Get('project/:projectId')
  async getProjectActivity(
    @Param('projectId') projectId: string,
    @Query('limit') limit?: string,
  ) {
    const limitNum = limit ? parseInt(limit, 10) : 100;
    return this.activityLogService.getProjectActivity(projectId, limitNum);
  }
}

