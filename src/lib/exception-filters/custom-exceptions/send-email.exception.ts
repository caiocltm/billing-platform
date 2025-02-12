import { ProcessBillingException } from './process-billing.exception';

export class SendEmailException extends ProcessBillingException {
  constructor() {
    super();
  }
}
