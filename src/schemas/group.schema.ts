import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type GroupDocument = Group & Document;

@Schema({ timestamps: true })
export class Group {
  @Prop({ required: true })
  name: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Project', required: true })
  projectId: string;

  @Prop({ default: 0 })
  order: number;

  @Prop({ default: '#6B7280' })
  color: string;
}

export const GroupSchema = SchemaFactory.createForClass(Group);

