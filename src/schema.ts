import * as z from "zod";

export const categoriesEnum = z.enum([
  "electronics",
  "clothing",
  "food",
  "other",
]);

export const createProductSchema = z.strictObject({
  name: z.string({ error: "Поле 'name' обязательно" }).min(2).max(100),
  price: z
    .number({ error: "Поле 'price' обязательно" })
    .positive("Цена должна быть больше 0"),
  category: categoriesEnum,
  stock: z.number().int().min(0).default(0),
  description: z.string().max(500).optional(),
});

export const updateProductSchema = createProductSchema;

export const patchProductSchema = createProductSchema.partial();

export const getProductsQuerySchema = z.strictObject({
  category: categoriesEnum.optional(),
  minPrice: z.coerce.number().positive().optional(),
  maxPrice: z.coerce.number().positive().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).default(10),
});
