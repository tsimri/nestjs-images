export interface ValidationResult<T = unknown> {
  isValid: boolean;

  error?: string;

  data?: T;
}

