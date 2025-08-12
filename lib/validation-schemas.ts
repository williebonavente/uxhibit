import { z } from 'zod';

export const registerFormSchema = z.object({
    username: z.string().min(3, 'User name is required'),
    full_name: z.string().min(5, "User must have a full name"),
    age: z.string().min(1, 'Age is required'),
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
