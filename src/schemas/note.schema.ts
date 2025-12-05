import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type NoteDocument = Note & Document;

@Schema({ timestamps: true })
export class Note {
  @Prop({ required: true })
  title: string;

  @Prop({ default: '' })
  content: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Group', required: true })
  groupId: string;

  @Prop({ default: 0 })
  order: number;

  @Prop({ default: 'admin' })
  createdBy: string;

  @Prop({ type: String, required: false })
  assigneeId?: string;

  @Prop({ type: String, required: false })
  assigneeName?: string;

  @Prop({ type: Date, required: false })
  dueDate?: Date;
}

export const NoteSchema = SchemaFactory.createForClass(Note);

