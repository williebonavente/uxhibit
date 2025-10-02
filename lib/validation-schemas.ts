import { z } from 'zod';

export const registerFormSchema = z.object({
    username: z.string().min(3, 'User name is required'),
    first_name: z.string().min(2, "First name is required"),
    middle_name: z.string().optional(),
    last_name: z.string().min(2, "Last name is required"),
    birthday: z.string().min(1, 'Birthday is required'),
    email: z.email('Invalid email'),
    gender: z.string().min(3, "Gender Must have a value"),
    // website_url: z.string(),
    
    password: z.string().min(6, 'Password must be at least 6 characters.'),
    confirmPassword: z.string().min(6, 'Confirm Password must be at least 6 characters.'),
}).refine(data => data.password === data.confirmPassword, {
    message: 'Password must match',
    path: ['confirmPassword'],
})

export const loginFormSchema = z.object({
    email: z.email('Invalid email'),
    password:z.string().min(6, "Password must be at least 6 characters.")
})