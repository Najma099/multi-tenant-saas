import z from 'zod';
export const CreateWorkspaceSchema = z.object({
    name: z.string()
        .min(3)
        .max(100)
})