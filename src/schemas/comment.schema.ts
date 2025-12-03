import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type CommentDocument = Comment & Document;

@Schema({ timestamps: true })
export class Comment {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Note', required: true })
  noteId: string;

  @Prop({ required: true })
  content: string;

  @Prop({ required: true })
  authorId: string;

  @Prop({ required: true })
  authorName: string;
}

export const CommentSchema = SchemaFactory.createForClass(Comment);

