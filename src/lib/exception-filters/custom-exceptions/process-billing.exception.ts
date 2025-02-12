import { ConsoleLogger } from '@nestjs/common';

export class ProcessBillingException extends Error {
  private readonly logger = new ConsoleLogger();
  protected context: string = '';
  protected instance: string;

  constructor() {
    super();
  }

  errorAt(context: string): this {
    this.context += ` => at ${context}`;

    return this;
  }

  dueTo(error: unknown): this {
    this.instance =
      error instanceof Error ? error.constructor.name : 'UnknownError';

    this.message = error instanceof Error ? error.message : '';

    if (!this.message) {
      this.message = typeof error === 'string' ? error : 'Unknown causes';
    }

    this.logger.error({
      context: this.context,
      error: {
        detail: this.message,
        instance: this.instance,
      },
    });

    return this;
  }
}
