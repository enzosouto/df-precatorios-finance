import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string({ required_error: 'Usuário é obrigatório.' }).min(1, 'Usuário é obrigatório.'),
  password: z.string({ required_error: 'Senha é obrigatória.' }).min(1, 'Senha é obrigatória.'),
});

export const changePasswordSchema = z.object({
  currentPassword: z
    .string({ required_error: 'Senha atual é obrigatória.' })
    .min(1, 'Senha atual é obrigatória.'),
  newPassword: z
    .string({ required_error: 'Nova senha é obrigatória.' })
    .min(8, 'A nova senha deve ter pelo menos 8 caracteres.'),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
