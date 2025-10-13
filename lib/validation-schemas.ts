import { z } from 'zod';
import { parse, isValid, isBefore, isAfter } from "date-fns";

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

    password: z.string().min(6, 'Password must be at least 6 characters.'),
    confirmPassword: z.string().min(6, 'Confirm Password must be at least 6 characters.'),
}).refine(data => data.password === data.confirmPassword, {
    message: 'Password must match',
    path: ['confirmPassword'],
})

export const loginFormSchema = z.object({
    email: z.email('Invalid email'),
    password: z.string().min(6, "Password must be at least 6 characters.")
})