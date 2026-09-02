import type { TransactionType } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { badRequest, conflict, notFound } from '../lib/errors';

export interface CategoryDto {
  id: string;
  name: string;
  type: TransactionType;
}

function toDto(category: { id: string; name: string; type: TransactionType }): CategoryDto {
  return { id: category.id, name: category.name, type: category.type };
}

export async function listCategories(userId: string, type?: TransactionType): Promise<CategoryDto[]> {
  const categories = await prisma.category.findMany({
    where: { userId, ...(type ? { type } : {}) },
    orderBy: { name: 'asc' },
  });
  return categories.map(toDto);
}

export async function createCategory(
  userId: string,
  name: string,
  type: TransactionType
): Promise<CategoryDto> {
  const existing = await prisma.category.findUnique({
    where: { userId_name_type: { userId, name, type } },
  });

  if (existing) {
    throw conflict('Já existe uma categoria com este nome para este tipo.');
  }

  const category = await prisma.category.create({
    data: { userId, name, type },
  });

  return toDto(category);
}

export async function updateCategory(userId: string, id: string, name: string): Promise<CategoryDto> {
  const category = await prisma.category.findFirst({ where: { id, userId } });

  if (!category) {
    throw notFound('Categoria não encontrada.');
  }

  const duplicate = await prisma.category.findUnique({
    where: { userId_name_type: { userId, name, type: category.type } },
  });

  if (duplicate && duplicate.id !== id) {
    throw conflict('Já existe uma categoria com este nome para este tipo.');
  }

  const updated = await prisma.category.update({
    where: { id },
    data: { name },
  });

  return toDto(updated);
}

/** Ensures the category belongs to the user and matches the expected type. Throws 400 otherwise. */
export async function assertCategoryCompatible(
  userId: string,
  categoryId: string,
  type: TransactionType
): Promise<void> {
  const category = await prisma.category.findFirst({ where: { id: categoryId, userId } });

  if (!category) {
    throw notFound('Categoria não encontrada.');
  }

  if (category.type !== type) {
    throw badRequest('Categoria não compatível com o tipo de movimentação.');
  }
}
