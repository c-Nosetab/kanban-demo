import { Injectable } from '@angular/core';
import { ToastService } from './toast.service';
import { LoggerService } from './logger.service';

@Injectable({ providedIn: 'root' })
export class ErrorHandlerService {
  constructor(
    private toastService: ToastService,
    private logger: LoggerService
  ) {}

  handleError(error: any, context?: string): void {
    const message = this.getErrorMessage(error);
    this.logger.error(`${context || 'Unknown'} Error:`, error);
    
    this.toastService.addToast({
      text: message,
      type: 'error',
      delayAdd: false
    });
  }

  private getErrorMessage(error: any): string {
    if (error.error?.message) return error.error.message;
    if (error.message) return error.message;
    if (typeof error === 'string') return error;
    return 'An unexpected error occurred';
  }
}