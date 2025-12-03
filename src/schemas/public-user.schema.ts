import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type PublicUserDocument = PublicUser & Document;

export class ProjectPermission {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Project', required: true })
  projectId: string;

  @Prop({ default: false })
  canRead: boolean;

  @Prop({ default: false })
  canWrite: boolean;
}

@Schema({ timestamps: true })
export class PublicUser {
  @Prop({ required: true, unique: true })
  username: string;

  @Prop({ required: true })
  email: string;

  @Prop({ type: [ProjectPermission], default: [] })
  projectPermissions: ProjectPermission[];
}

export const PublicUserSchema = SchemaFactory.createForClass(PublicUser);

