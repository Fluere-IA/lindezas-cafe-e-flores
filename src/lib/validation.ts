/**
 * Centralized validation schemas using Zod for secure input validation.
 */
import { z } from 'zod';

// Product validation schema
export const productSchema = z.object({
  name: z.string()
    .min(1, 'Nome é obrigatório')
    .max(200, 'Nome deve ter no máximo 200 caracteres')
    .trim(),
  price: z.number()
    .positive('Preço deve ser positivo')
    .max(999999.99, 'Preço muito alto'),
  stock: z.number()
    .int('Estoque deve ser um número inteiro')
    .nonnegative('Estoque não pode ser negativo')
    .max(999999, 'Estoque muito alto'),
  description: z.string()
    .max(1000, 'Descrição deve ter no máximo 1000 caracteres')
    .nullable()
    .optional(),
  category_id: z.string()
    .uuid('ID de categoria inválido')
    .nullable()
    .optional(),
  is_active: z.boolean().default(true),
});

// Category validation schema
export const categorySchema = z.object({
  name: z.string()
    .min(1, 'Nome é obrigatório')
    .max(100, 'Nome deve ter no máximo 100 caracteres')
    .trim(),
  type: z.string()
    .min(1, 'Tipo é obrigatório')
    .max(50, 'Tipo deve ter no máximo 50 caracteres'),
});

// Order validation schema
export const orderSchema = z.object({
  table_number: z.number()
    .int('Número da mesa deve ser inteiro')
    .min(1, 'Mesa deve ser pelo menos 1')
    .max(999, 'Número da mesa muito alto')
    .nullable()
    .optional(),
  mode: z.enum(['mesa', 'balcao'], {
    errorMap: () => ({ message: 'Modo de pedido inválido' }),
  }),
  notes: z.string().max(500, 'Notas muito longas').nullable().optional(),
});

// Order item validation schema
export const orderItemSchema = z.object({
  product_id: z.string().uuid('ID de produto inválido'),
  quantity: z.number()
    .int('Quantidade deve ser inteira')
    .positive('Quantidade deve ser positiva')
    .max(100, 'Quantidade muito alta'),
  unit_price: z.number()
    .positive('Preço unitário deve ser positivo')
    .max(999999.99, 'Preço muito alto'),
});

// Table number validation (for simple inputs)
export const tableNumberSchema = z.number()
  .int('Número da mesa deve ser inteiro')
  .min(1, 'Mesa deve ser pelo menos 1')
  .max(99, 'Número da mesa deve ser no máximo 99');

// Payment validation schema
export const paymentSchema = z.object({
  amount: z.number()
    .positive('Valor deve ser positivo')
    .max(999999.99, 'Valor muito alto'),
  payment_method: z.enum(['dinheiro', 'cartao', 'pix'], {
    errorMap: () => ({ message: 'Método de pagamento inválido' }),
  }),
  table_number: z.number()
    .int('Número da mesa deve ser inteiro')
    .min(1, 'Mesa deve ser pelo menos 1')
    .max(999, 'Número da mesa muito alto'),
});

// Helper function to validate and get first error message
export const validateWithSchema = <T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: string } => {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error.errors[0]?.message || 'Dados inválidos' };
};
