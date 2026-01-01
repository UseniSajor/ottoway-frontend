import { Request, Response, NextFunction } from 'express';

export interface ValidationRule {
  field: string;
  required?: boolean;
  type?: 'string' | 'number' | 'email' | 'url' | 'enum';
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  enumValues?: string[];
  custom?: (value: any) => boolean | string;
}

export const validate = (rules: ValidationRule[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const errors: string[] = [];
    const body = req.body;

    for (const rule of rules) {
      const value = body[rule.field];

      // Check required
      if (rule.required && (value === undefined || value === null || value === '')) {
        errors.push(`${rule.field} is required`);
        continue;
      }

      // Skip validation if field is optional and not provided
      if (!rule.required && (value === undefined || value === null || value === '')) {
        continue;
      }

      // Type validation
      if (rule.type) {
        switch (rule.type) {
          case 'string':
            if (typeof value !== 'string') {
              errors.push(`${rule.field} must be a string`);
              continue;
            }
            if (rule.minLength && value.length < rule.minLength) {
              errors.push(`${rule.field} must be at least ${rule.minLength} characters`);
            }
            if (rule.maxLength && value.length > rule.maxLength) {
              errors.push(`${rule.field} must be at most ${rule.maxLength} characters`);
            }
            break;

          case 'number':
            if (typeof value !== 'number' && isNaN(Number(value))) {
              errors.push(`${rule.field} must be a number`);
              continue;
            }
            const numValue = Number(value);
            if (rule.min !== undefined && numValue < rule.min) {
              errors.push(`${rule.field} must be at least ${rule.min}`);
            }
            if (rule.max !== undefined && numValue > rule.max) {
              errors.push(`${rule.field} must be at most ${rule.max}`);
            }
            break;

          case 'email':
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) {
              errors.push(`${rule.field} must be a valid email address`);
            }
            break;

          case 'url':
            try {
              new URL(value);
            } catch {
              errors.push(`${rule.field} must be a valid URL`);
            }
            break;

          case 'enum':
            if (rule.enumValues && !rule.enumValues.includes(value)) {
              errors.push(`${rule.field} must be one of: ${rule.enumValues.join(', ')}`);
            }
            break;
        }
      }

      // Custom validation
      if (rule.custom) {
        const result = rule.custom(value);
        if (result !== true) {
          errors.push(result || `${rule.field} is invalid`);
        }
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({
        message: 'Validation failed',
        errors,
      });
    }

    next();
  };
};



