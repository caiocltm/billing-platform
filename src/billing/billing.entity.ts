import { Expose, Transform } from 'class-transformer';
import { BillingSerializedDto } from 'src/lib/dtos/billing-serialized.dto';

export class BillingEntity {
  @Expose()
  name: string;

  @Expose()
  governmentId: number;

  @Expose()
  email: string;

  @Expose()
  debtAmount: number;

  @Expose()
  @Transform(({ value }) => new Date(value as string), { toClassOnly: true })
  debtDueDate: Date;

  @Expose()
  debtId: string;

  constructor(data: BillingSerializedDto) {
    Object.assign(this, data);
  }
}
