import {
  IsDate,
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsString,
  IsUUID,
} from 'class-validator';

export class BillingSerializedDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber()
  @IsNotEmpty()
  governmentId: number;

  @IsString()
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsNumber()
  @IsNotEmpty()
  debtAmount: number;

  @IsDate()
  @IsNotEmpty()
  debtDueDate: Date;

  @IsString()
  @IsUUID()
  @IsNotEmpty()
  debtId: string;
}
