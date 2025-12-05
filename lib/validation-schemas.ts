import { z } from 'zod';
import { parse, isValid, isBefore, isAfter } from "date-fns";


const passwordSchema = z
  .string()
  .min(12, "At least 6 characters")
  .refine((v) => /[A-Z]/.test(v), "Include at least one uppercase letter")
  .refine((v) => /[a-z]/.test(v), "Include at least one lowercase letter")
  .refine((v) => /\d/.test(v), "Include at least one number")
  .refine((v) => /[^A-Za-z0-9]/.test(v), "Include at least one symbol")
  .refine((v) => !/\s/.test(v), "No spaces allowed");

export const registerFormSchema = z.object({
    username: z.string().min(3, 'User name is required'),
    first_name: z.string().min(2, "First name is required"),
    middle_name: z.string().optional(),
    last_name: z.string().min(2, "Last name is required"),
    birthday: z.string().refine(val => {
        if (!val) return false;
        const parsed = parse(val, "yyyy-MM-dd", new Date());
        const minDate = new Date(1900, 0, 1);
        const maxDate = new Date();
        maxDate.setHours(0, 0, 0, 0);
        return (
            isValid(parsed) &&
            isAfter(parsed, minDate) &&
            isBefore(parsed, maxDate)
        );
    }, {
        message: "Enter a valid date.",
    }),
    email: z.email('Invalid email'),
    gender: z.string().min(3, "Gender Must have a value"),
    // website_url: z.string(),

    password: passwordSchema,
    confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Password must match',
})

export const loginFormSchema = z.object({
    email: z.email('Invalid email'),
    password: z.string().min(6, "Password must be at least 6 characters.")
})