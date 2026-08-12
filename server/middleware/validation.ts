import { Request, Response, NextFunction } from "express";

export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

export function validateBody(schema: Record<string, (value: any) => string | null>) {
  return (req: Request, res: Response, next: NextFunction) => {
    const errors: ValidationError[] = [];
    
    for (const [field, validator] of Object.entries(schema)) {
      const value = req.body[field];
      const error = validator(value);
      
      if (error) {
        errors.push({ field, message: error, value });
      }
    }
    
    if (errors.length > 0) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Request body validation failed",
          errors,
          retryable: false
        }
      });
    }
    
    next();
  };
}

export function validateQuery(schema: Record<string, (value: any) => string | null>) {
  return (req: Request, res: Response, next: NextFunction) => {
    const errors: ValidationError[] = [];
    
    for (const [field, validator] of Object.entries(schema)) {
      const value = req.query[field];
      const error = validator(value);
      
      if (error) {
        errors.push({ field, message: error, value });
      }
    }
    
    if (errors.length > 0) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Request query validation failed",
          errors,
          retryable: false
        }
      });
    }
    
    next();
  };
}

// Common validators
export const validators = {
  required: (value: any) => {
    if (value === undefined || value === null || value === '') {
      return 'Field is required';
    }
    return null;
  },
  
  string: (value: any) => {
    if (value !== undefined && value !== null && typeof value !== 'string') {
      return 'Field must be a string';
    }
    return null;
  },
  
  number: (value: any) => {
    if (value !== undefined && value !== null && typeof value !== 'number') {
      return 'Field must be a number';
    }
    return null;
  },
  
  boolean: (value: any) => {
    if (value !== undefined && value !== null && typeof value !== 'boolean') {
      return 'Field must be a boolean';
    }
    return null;
  },
  
  email: (value: any) => {
    if (value !== undefined && value !== null && typeof value === 'string') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        return 'Field must be a valid email address';
      }
    }
    return null;
  },
  
  edrpou: (value: any) => {
    if (value !== undefined && value !== null && typeof value === 'string') {
      const edrpouRegex = /^\d{8}$/;
      if (!edrpouRegex.test(value)) {
        return 'Field must be a valid EDRPOU (8 digits)';
      }
    }
    return null;
  },
  
  ipn: (value: any) => {
    if (value !== undefined && value !== null && typeof value === 'string') {
      const ipnRegex = /^\d{10}$/;
      if (!ipnRegex.test(value)) {
        return 'Field must be a valid IPN (10 digits)';
      }
    }
    return null;
  },
  
  minLength: (min: number) => (value: any) => {
    if (value !== undefined && value !== null && typeof value === 'string') {
      if (value.length < min) {
        return `Field must be at least ${min} characters`;
      }
    }
    return null;
  },
  
  maxLength: (max: number) => (value: any) => {
    if (value !== undefined && value !== null && typeof value === 'string') {
      if (value.length > max) {
        return `Field must not exceed ${max} characters`;
      }
    }
    return null;
  },
  
  min: (min: number) => (value: any) => {
    if (value !== undefined && value !== null && typeof value === 'number') {
      if (value < min) {
        return `Field must be at least ${min}`;
      }
    }
    return null;
  },
  
  max: (max: number) => (value: any) => {
    if (value !== undefined && value !== null && typeof value === 'number') {
      if (value > max) {
        return `Field must not exceed ${max}`;
      }
    }
    return null;
  },
  
  enum: (values: any[]) => (value: any) => {
    if (value !== undefined && value !== null && !values.includes(value)) {
      return `Field must be one of: ${values.join(', ')}`;
    }
    return null;
  },
  
  pattern: (regex: RegExp) => (value: any) => {
    if (value !== undefined && value !== null && typeof value === 'string') {
      if (!regex.test(value)) {
        return 'Field format is invalid';
      }
    }
    return null;
  }
};
