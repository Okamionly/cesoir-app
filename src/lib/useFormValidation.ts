"use client";

import { useState, useCallback } from "react";
import type { ZodSchema, ZodError } from "zod";

export interface FormValidation<T> {
  validate: (data: unknown) => T | null;
  errors: Partial<Record<keyof T, string>>;
  clearErrors: () => void;
  setFieldError: (field: keyof T, message: string) => void;
}

/**
 * Hook that wraps a Zod schema and returns validation utilities.
 * Usage:
 *   const { validate, errors, clearErrors } = useFormValidation(profileSchema);
 *   const data = validate(formValues);
 *   if (data) { /* valid * / }
 */
export function useFormValidation<T>(schema: ZodSchema<T>): FormValidation<T> {
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});

  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  const setFieldError = useCallback((field: keyof T, message: string) => {
    setErrors(prev => ({ ...prev, [field]: message }));
  }, []);

  const validate = useCallback(
    (data: unknown): T | null => {
      const result = schema.safeParse(data);

      if (result.success) {
        setErrors({});
        return result.data;
      }

      const zodError: ZodError = result.error;
      const fieldErrors: Partial<Record<keyof T, string>> = {};

      for (const issue of zodError.issues) {
        const field = issue.path[0] as keyof T | undefined;
        if (field && !fieldErrors[field]) {
          fieldErrors[field] = issue.message;
        }
      }

      setErrors(fieldErrors);
      return null;
    },
    [schema],
  );

  return { validate, errors, clearErrors, setFieldError };
}
