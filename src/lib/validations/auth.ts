import { z } from 'zod';

export function normalizeBDPhone(phone: string): string {
  // Strip whitespace, hyphens, parentheses
  let cleaned = phone.replace(/[\s\-\(\)]/g, '');
  // If starts with +8801, change to 01
  if (cleaned.startsWith('+8801')) {
    cleaned = cleaned.slice(3);
  } else if (cleaned.startsWith('8801')) {
    cleaned = cleaned.slice(2);
  }
  return cleaned;
}

export const bdPhoneValidator = z
  .string()
  .min(1, 'Phone number is required')
  .transform(val => normalizeBDPhone(val))
  .refine(
    val => /^01[3-9]\d{8}$/.test(val),
    'Phone number must be a valid Bangladeshi number starting with 01 (11 digits, e.g., 01712345678)'
  );

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address')
    .toLowerCase()
    .trim(),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(6, 'Password must be at least 6 characters'),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(1, 'Full name is required')
      .min(2, 'Name must be at least 2 characters')
      .max(100, 'Name cannot exceed 100 characters')
      .regex(/^[a-zA-Z\s\.\-']+$/, 'Name contains invalid characters'),
    email: z
      .string()
      .min(1, 'Email is required')
      .email('Please enter a valid email address')
      .toLowerCase()
      .trim(),
    mobile: bdPhoneValidator,
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Za-z]/, 'Password must contain at least one letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
    accountType: z.enum(['personal', 'business'] as const, {
      message: 'Please select an account type',
    }),
    organizationName: z.string().optional(),
    agreeTerms: z.boolean().refine(v => v === true, {
      message: 'You must agree to the Terms of Service',
    }),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  })
  .refine(data => {
    if (data.accountType === 'business') {
      return !!data.organizationName && data.organizationName.trim().length >= 2;
    }
    return true;
  }, {
    message: 'Organization / Company Name is required for business accounts (min 2 characters)',
    path: ['organizationName'],
  });

export type RegisterFormData = z.infer<typeof registerSchema>;

export const upgradeBusinessSchema = z.object({
  businessName: z.string().trim().min(2, 'Company or Agency name is required'),
  nidNumber: z
    .string()
    .trim()
    .min(10, 'NID number must be at least 10 digits')
    .max(17, 'NID number cannot exceed 17 digits')
    .regex(/^\d+$/, 'NID number must contain only numbers'),
  nidUrl: z.string().min(1, 'National ID document is required'),
  photoUrl: z.string().min(1, 'Official photograph is required'),
});

export type UpgradeBusinessFormData = z.infer<typeof upgradeBusinessSchema>;

export const profileUpdateSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name cannot exceed 100 characters'),
  businessName: z.string().optional(),
  avatarUrl: z.string().optional(),
});

export type ProfileUpdateFormData = z.infer<typeof profileUpdateSchema>;
