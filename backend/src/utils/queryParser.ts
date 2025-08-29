export class QueryParser {
  static parseStringArray(param: unknown): string[] {
    if (!param) return [];
    if (typeof param === 'string') {
      return param.split(',').map(item => item.trim()).filter(Boolean);
    }

    if (Array.isArray(param)) {
      return param.map(String).filter(Boolean);
    }

    return [];
  }

  static parseStringInt(param: unknown): number {
    if (typeof param === 'string') {
      const num = parseInt(param, 10);
      return isNaN(num) ? -1 : num;
    }

    return -1;
  }

  static parseNumber(param: unknown): number {
    if (typeof param === 'number') {
      return param;
    }
    return NaN;
  }

  static parseEnum<T extends string>(
    param: unknown,
    validValues: T[],
    defaultValue: T
  ): T {
    if (typeof param === 'string' && validValues.includes(param as T)) {
      return param as T;
    }

    return defaultValue;
  }

  static parseDate(param: unknown): string | null {
    if (typeof param === 'string') {
      const date = new Date(param);
      return isNaN(date.getTime()) ? null : date.toISOString();
    }

    return null;
  }

  static sanitizeString(param: unknown, maxLength: number = 100): string {
    if (typeof param !== 'string') return '';
    return param.slice(0, maxLength).trim();
  }
}