import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ProjectDocument = Project & Document;

@Schema({ timestamps: true })
export class Project {
  @Prop({ required: true })
  name: string;

  @Prop({ default: '' })
  description: string;

  @Prop({ default: 'admin' })
  createdBy: string;

  @Prop({ default: '#6366f1' })
  color: string;
}

export const ProjectSchema = SchemaFactory.createForClass(Project);

