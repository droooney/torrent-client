import { Prisma } from '@prisma/client';

import prisma from 'db/prisma';

type PrismaTable = Prisma.TypeMap['meta']['modelProps'];

export interface PaginationOptions<Table extends PrismaTable> {
  table: Table;
  findOptions: Omit<Prisma.TypeMap['model'][Capitalize<Table>]['operations']['findMany']['args'], 'skip' | 'take'>;
  pagination: {
    skip: number;
    take: number;
  };
}

export interface PaginationInfo<Table extends PrismaTable> {
  items: Prisma.TypeMap['model'][Capitalize<Table>]['payload']['scalars'][];
  allCount: number;
}

export async function getPaginationInfo<Table extends PrismaTable>(
  options: PaginationOptions<Table>,
): Promise<PaginationInfo<Table>> {
  const {
    table,
    findOptions,
    pagination: { skip, take },
  } = options;

  const [items, allCount] = await prisma.$transaction([
    // @ts-ignore
    prisma[table].findMany({
      ...findOptions,
      skip,
      take,
    }),
    // @ts-ignore
    prisma[table].count(findOptions),
  ]);

  return {
    items,
    allCount,
  };
}
