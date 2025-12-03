import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ActivityLog, ActivityLogDocument } from '../schemas/activity-log.schema';

interface LogActivityParams {
  projectId: string;
  userId: string;
  userRole: 'admin' | 'public';
  userName: string;
  action: string;
  entityType: 'project' | 'group' | 'note' | 'comment';
  entityId: string;
  entityName: string;
  details?: Record<string, any>;
}

@Injectable()
export class ActivityLogService {
  constructor(
    @InjectModel(ActivityLog.name)
    private activityLogModel: Model<ActivityLogDocument>,
  ) {}

  async logActivity(params: LogActivityParams) {
    try {
      await this.activityLogModel.create(params);
    } catch (error) {
      // Log error but don't fail the operation
      console.error('Failed to log activity:', error);
    }
  }

  async getProjectActivity(projectId: string, limit: number = 100) {
    return this.activityLogModel
      .find({ projectId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
  }
}

