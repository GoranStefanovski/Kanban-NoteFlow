import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type ActivityLogDocument = ActivityLog & Document;

@Schema({ timestamps: true })
export class ActivityLog {
  @Prop({ type: MongooseSchema.Types.ObjectId, required: true, index: true })
  projectId: string;

  @Prop({ required: true })
  userId: string;

  @Prop({ required: true, enum: ['admin', 'public'] })
  userRole: string;

  @Prop({ required: true })
  userName: string;

  @Prop({ required: true })
  action: string; // 'created', 'updated', 'deleted', 'moved'

  @Prop({ required: true, enum: ['project', 'group', 'note', 'comment'] })
  entityType: string;

  @Prop({ required: true })
  entityId: string;

  @Prop({ required: true })
  entityName: string;

  @Prop({ type: Object, default: {} })
  details: Record<string, any>; // Additional information about the action
}

export const ActivityLogSchema = SchemaFactory.createForClass(ActivityLog);

// Create compound index for efficient querying
ActivityLogSchema.index({ projectId: 1, createdAt: -1 });

