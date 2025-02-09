import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, SchemaTypes } from 'mongoose';

export type BillingDocument = HydratedDocument<Billing>;

@Schema({ autoCreate: true, autoIndex: true, timestamps: true })
export class Billing {
  @Prop({ required: true, type: SchemaTypes.String })
  name: string;

  @Prop({ required: true, type: SchemaTypes.Number })
  governmentId: number;

  @Prop({ required: true, type: SchemaTypes.String })
  email: string;

  @Prop({ required: true, type: SchemaTypes.Number })
  debtAmount: number;

  @Prop({ required: true, type: SchemaTypes.Date })
  debtDueDate: Date;

  @Prop({ required: true, type: SchemaTypes.String, index: true, unique: true })
  debtId: string;

  @Prop({ required: false, type: SchemaTypes.Date })
  emailSentAt: Date;

  @Prop({ required: false, type: SchemaTypes.Date })
  generatedBankSlipAt: Date;
}

export const BillingSchema = SchemaFactory.createForClass(Billing);
