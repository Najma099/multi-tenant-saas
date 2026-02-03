import { getPrismaClient } from "../index";
import { AuthUserWithPassword } from "../../types/user";

export async function findByEmail(email: string): Promise<AuthUserWithPassword | null> {
  const prisma = getPrismaClient(); 
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
  const prisma = getPrismaClient();
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });
  return !!user;
}


export async function findById(id: number) {
  const prisma = getPrismaClient();
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



