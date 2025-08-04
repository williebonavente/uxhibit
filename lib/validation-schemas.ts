import { z } from 'zod';

export const registerFormSchema = z.object({
    username: z.string().min(3, 'User name must be at least 3 characters'),
    full_name: z.string().min(1, 'Name is required'),
   age: z
  .union([
    z.coerce.number().int().min(0, 'Age is required'),
    z.literal('') // allow empty string for initial state
  ])
  .refine(val => val !== '', { message: 'Age is required' }),
    gender: z.string().min(1, 'Gender is required'),
    email: z.string().email('Invalid email'),
    avatar_url: z.string().optional(),
    password: z.string().min(6, 'Password must be at least 6 characters.'),
    confirmPassword: z.string().min(6, 'Confirm Password must be at least 6 characters.'),
    website_url: z.string().optional(),
}).refine(data => data.password === data.confirmPassword, {
    message: 'Password must match',
    path: ['confirmPassword'],
})
export const loginFormSchema = z.object({
    email: z.email('Invalid email'),
    password:z.string().min(6, "Password must be at least 6 characters.")
})
