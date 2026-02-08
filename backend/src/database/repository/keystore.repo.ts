import { prisma } from "..";

export async function create(
  userId: number,
  primaryKey: string,
  secondaryKey: string,
) {
  return prisma.keystore.create({
    data: {
      clientId: userId,
      primaryKey,
      secondaryKey,
    },
  });
}

export async function find(
  userId: number,
  primaryKey: string,
  secondaryKey?: string,
) {
  return prisma.keystore.findFirst({
    where: {
      clientId: userId,
      primaryKey,
      ...(secondaryKey && { secondaryKey }),
      status: true,
    },
  });
}

export async function findByRefreshKey(
  userId: number,
  refreshKey: string,
) {
  return prisma.keystore.findFirst({
    where: {
      user: {
        id: userId,
      },
      secondaryKey: refreshKey,
    },
  });
}


export async function remove(id: number) {
  return prisma.keystore.delete({ where: { id } });
}
