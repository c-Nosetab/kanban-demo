import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface SetToastObject {
  text: string;
  type: 'success' | 'error' | 'warn' | 'info';
  icon?: boolean | 'check' | 'error' | 'warning' | 'info';
  outline?: boolean;
  dark?: boolean;
  style?: 'default' | 'dense' | 'tall';
  delayAdd?: boolean;

  // dev use only
  _?: {
    displayText?: string;
    id?: string;
  }
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  toastIconTypes: {
    success: 'check',
    error: 'error',
    warn: 'warning',
    info: 'info',
  } = {
    success: 'check',
    error: 'error',
    warn: 'warning',
    info: 'info',
  }

  private _toast = new BehaviorSubject<SetToastObject | undefined>(undefined);
  public readonly newToast = this._toast.asObservable();

  addToast = (toast: SetToastObject) => {
    if (toast.type === undefined) toast.type = 'success';
    if (toast.icon === undefined) toast.icon = true;
    if (toast.outline === undefined) toast.outline = false;
    if (toast.dark === undefined) toast.dark = false;
    if (toast.style === undefined) toast.style = 'default';
    this.setIcon(toast);

    setTimeout(() => {
      this._toast.next(toast)
    }, toast.delayAdd ? 50 : 0);
  }

  setIcon = (toast: SetToastObject) => {
    if (!toast.icon) return;

    if (typeof toast.icon === 'boolean' && this.toastIconTypes?.[toast.type] !== undefined) {
      toast.icon = this.toastIconTypes[toast.type];
    }
  }
}
