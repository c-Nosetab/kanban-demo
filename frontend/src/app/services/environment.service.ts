import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class EnvironmentService {
  
  get isProduction(): boolean {
    return environment.production;
  }
  
  get apiUrl(): string {
    return environment.apiUrl;
  }
  
  get logLevel(): string {
    return environment.logLevel || 'info';
  }
  
  get environmentInfo() {
    return {
      production: environment.production,
      apiUrl: environment.apiUrl,
      logLevel: environment.logLevel || 'info'
    };
  }
  
  logEnvironmentInfo(): void {
    console.log('🔧 Environment Configuration:', this.environmentInfo);
  }
}