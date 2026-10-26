import { z } from 'zod';

export const passwordSchema = z
  .string()
  .min(10, 'كلمة المرور يجب أن تكون 10 أحرف على الأقل')
  .max(128)
  .regex(/[A-Za-z]/, 'كلمة المرور يجب أن تحتوي حرفاً')
  .regex(/\d/, 'كلمة المرور يجب أن تحتوي رقماً');
