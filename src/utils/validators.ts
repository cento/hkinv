interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

/**
 * Validates teacher settings data.
 */
export function validateSettings(data: Record<string, any>): ValidationResult {
  const errors: ValidationError[] = [];

  if (!data.teacher_name || !data.teacher_name.trim()) {
    errors.push({ field: 'teacher_name', message: 'validation.required' });
  }
  if (!data.teacher_address || !data.teacher_address.trim()) {
    errors.push({ field: 'teacher_address', message: 'validation.required' });
  }
  if (data.teacher_email && data.teacher_email.trim()) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.teacher_email)) {
      errors.push({ field: 'teacher_email', message: 'validation.email' });
    }
  }
  if (data.teacher_phone && data.teacher_phone.trim()) {
    const phoneClean = data.teacher_phone.replace(/[\s\-()]/g, '');
    if (phoneClean.length < 6 || phoneClean.length > 15) {
      errors.push({ field: 'teacher_phone', message: 'validation.phone' });
    }
  }
  if (data.br_number && data.br_number.trim()) {
    const brClean = data.br_number.trim();
    if (brClean.length < 5 || brClean.length > 25) {
      errors.push({ field: 'br_number', message: 'validation.br' });
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Format an error for user-friendly display.
 */
export function formatError(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === 'string') return err;
  try { return JSON.stringify(err); } catch { return String(err); }
}
export function validateCustomer(data: Record<string, any>): ValidationResult {
  const errors: ValidationError[] = [];

  if (!data.name || !data.name.trim()) {
    errors.push({ field: 'name', message: 'validation.required' });
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validates a single invoice item.
 */
export function validateInvoiceItem(data: {
  description?: string;
  hours?: number;
  rate?: number;
}): ValidationResult {
  const errors: ValidationError[] = [];

  if (!data.description || !data.description.trim()) {
    errors.push({ field: 'description', message: 'validation.required' });
  }
  if (!data.hours || data.hours <= 0) {
    errors.push({ field: 'hours', message: 'validation.positive' });
  }
  if (data.rate === undefined || data.rate < 0) {
    errors.push({ field: 'rate', message: 'validation.positive' });
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validates invoice data.
 */
export function validateInvoice(data: Record<string, any>): ValidationResult {
  const errors: ValidationError[] = [];

  if (!data.customer_id) {
    errors.push({ field: 'customer_id', message: 'validation.required' });
  }
  if (!data.issue_date) {
    errors.push({ field: 'issue_date', message: 'validation.required' });
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validates service type data.
 */
export function validateServiceType(data: Record<string, any>): ValidationResult {
  const errors: ValidationError[] = [];

  if (!data.name || !data.name.trim()) {
    errors.push({ field: 'name', message: 'validation.required' });
  }
  if (data.default_rate === undefined || data.default_rate < 0) {
    errors.push({ field: 'default_rate', message: 'validation.positive' });
  }
  if (!data.default_hours || data.default_hours <= 0) {
    errors.push({ field: 'default_hours', message: 'validation.positive' });
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validates a single invoice item.
 */
