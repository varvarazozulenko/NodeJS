import { Router, type Response } from "express";
import path from "node:path";
import multer from "multer";

import { products, type Product } from "../data.js";
import {
  createProductSchema,
  updateProductSchema,
  patchProductSchema,
  getProductsQuerySchema,
} from "../schema.js";
import validate, { type ValidatedRequest } from "../middleware/validate.js";
import { formatSuccess, formatError } from "../lib/format-result.js";

const storage = multer.diskStorage({
  destination: path.join(process.cwd(), "assets", "media"),
  filename: (_, file, callback) => {
    const ext = path.extname(file.originalname);
    const name = `${Date.now()}-${Math.round(Math.random() * 1e5)}${ext}`;
    callback(null, name);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // Ограничение 2 МБ
  fileFilter: (_, file, callback) => {
    const allowedTypes = ["image/jpeg", "image/png"];
    if (allowedTypes.includes(file.mimetype)) {
      callback(null, true);
    } else {
      callback(new Error("Разрешены только файлы формата JPEG и PNG"));
    }
  },
});

export const productsRouter = Router();

let nextId = 3;

productsRouter.get(
  "/",
  validate(getProductsQuerySchema, "query"),
  (req: ValidatedRequest<any, any>, res: Response) => {
    const { category, minPrice, maxPrice, page, limit } = req.queryParsed;

    let filtered = [...products];

    if (category) {
      filtered = filtered.filter((p) => p.category === category);
    }
    if (minPrice !== undefined) {
      filtered = filtered.filter((p) => p.price >= minPrice);
    }
    if (maxPrice !== undefined) {
      filtered = filtered.filter((p) => p.price <= maxPrice);
    }

    const total = filtered.length;
    const startIndex = (page - 1) * limit;
    const paginatedProducts = filtered.slice(startIndex, startIndex + limit);

    const meta = {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };

    formatSuccess(res, paginatedProducts, 200, meta);
  },
);

productsRouter.get("/:id", (req, res) => {
  const id = Number(req.params.id);
  const product = products.find((p) => p.id === id);

  if (!product) {
    formatError(res, "Товар не найден", 404);
    return;
  }

  formatSuccess(res, product, 200);
});

productsRouter.post(
  "/",
  validate(createProductSchema, "body"),
  (req: ValidatedRequest<any, any>, res: Response) => {
    const body = req.bodyParsed;

    const newProduct: Product = {
      id: nextId++,
      name: body.name,
      price: body.price,
      category: body.category,
      stock: body.stock ?? 0,
      description: body.description,
      createdAt: new Date().toISOString(),
    };

    products.push(newProduct);
    formatSuccess(res, newProduct, 201);
  },
);

productsRouter.put(
  "/:id",
  validate(updateProductSchema, "body"),
  (req: ValidatedRequest<any, any>, res: Response) => {
    const id = Number(req.params.id);
    const index = products.findIndex((p) => p.id === id);

    if (index === -1) {
      formatError(res, "Товар не найден", 404);
      return;
    }

    const body = req.bodyParsed;
    const updatedProduct: Product = {
      id,
      name: body.name,
      price: body.price,
      category: body.category,
      stock: body.stock ?? 0,
      description: body.description,
      imageUrl: products[index].imageUrl,
      createdAt: products[index].createdAt,
    };

    products[index] = updatedProduct;
    formatSuccess(res, updatedProduct, 200);
  },
);

productsRouter.patch(
  "/:id",
  validate(patchProductSchema, "body"),
  (req: ValidatedRequest<any, any>, res: Response) => {
    const id = Number(req.params.id);
    const product = products.find((p) => p.id === id);

    if (!product) {
      formatError(res, "Товар не найден", 404);
      return;
    }

    Object.assign(product, req.bodyParsed);
    formatSuccess(res, product, 200);
  },
);

productsRouter.delete("/:id", (req, res) => {
  const id = Number(req.params.id);
  const index = products.findIndex((p) => p.id === id);

  if (index === -1) {
    formatError(res, "Товар не найден", 404);
    return;
  }

  const deleted = products.splice(index, 1)[0];
  formatSuccess(
    res,
    { message: "Товар успешно удален", product: deleted },
    200,
  );
});

productsRouter.post("/:id/image", upload.single("image"), (req, res) => {
  const id = Number(req.params.id);
  const product = products.find((p) => p.id === id);

  if (!product) {
    formatError(res, "Товар не найден", 404);
    return;
  }

  if (!req.file) {
    formatError(res, "Файл не передан (ожидается поле 'image')", 400);
    return;
  }

  product.imageUrl = `/media/${req.file.filename}`;

  formatSuccess(res, { imageUrl: product.imageUrl, product }, 200);
});
