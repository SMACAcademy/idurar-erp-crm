import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Invoice extends Document {
    @Prop({ required: true })
    total: number;

    @Prop({ required: true })
    status: string;
}

export const InvoiceSchema = SchemaFactory.createForClass(Invoice);
