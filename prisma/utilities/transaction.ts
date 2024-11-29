import { PrismaClient } from '@prisma/client';
import { ITXClientDenyList } from '@prisma/client/runtime/library';

import prisma from 'db/prisma';

import { MaybePromise } from 'types/common';

export type PrismaTransaction = Omit<PrismaClient, ITXClientDenyList>;

export async function runInTransaction<R>(
  tx: PrismaTransaction | undefined,
  cb: (tx: PrismaTransaction) => MaybePromise<R>,
): Promise<R> {
  if (tx) {
    return cb(tx);
  }

  return prisma.$transaction(async (tx) => cb(tx));
}
