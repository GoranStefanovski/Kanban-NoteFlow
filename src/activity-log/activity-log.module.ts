import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ActivityLogService } from './activity-log.service';
import { ActivityLogController } from './activity-log.controller';
import { ActivityLog, ActivityLogSchema } from '../schemas/activity-log.schema';
import { Group, GroupSchema } from '../schemas/group.schema';
import { AuthModule } from '../auth/auth.module';
import { PermissionsGuard } from '../guards/permissions.guard';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ActivityLog.name, schema: ActivityLogSchema },
      { name: Group.name, schema: GroupSchema },
    ]),
    AuthModule,
  ],
  controllers: [ActivityLogController],
  providers: [ActivityLogService, PermissionsGuard],
  exports: [ActivityLogService],
})
export class ActivityLogModule {}

