import z from 'zod';

export const SigninSchema = z.object({
  email: z.email({ message: 'Invalid email' }),
  password: z.string().min(1, { message: 'Password is required' }),
});

export const SignupSchema = z.object({
  name: z.string().min(2, 'Name is too short'),
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const AuthHeaderSchema = z.object({
  authorization: z
    .string()
    .startsWith('Bearer ')
    .min(10, 'Invalid Authorization header'),
});

export type AuthSchema = {
  SignUpSchema: z.infer<typeof SignupSchema>;
}