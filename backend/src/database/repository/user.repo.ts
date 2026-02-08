import { prisma } from "..";
import { AuthSchema } from "../../routes/auth/schema";
import { AuthUserWithPassword } from "../../types/user";
import { createWorkspace } from "./workspace.repo";


export async function findByEmail(email: string): Promise<AuthUserWithPassword | null> {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) return null;

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    password: user.password,
  };
}

export async function existsByEmail(email: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });
  return !!user;
}


export async function findById(id: number) {
  return prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
    },
  });
}

export async function createUser(data: AuthSchema['SignUpSchema']) {
  return prisma.$transaction(async (tx) => {
    const user = await tx.user.create({ data });
    await createWorkspace(tx, user.id, `${data.name}'s workspace`);
    return user;
  })
}

