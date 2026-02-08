import { Prisma } from '@prisma/client';
import { prisma } from '..';

export const createWorkspace = async (
    tx: Prisma.TransactionClient,
    userId: number,
    name: string,
) => {
    const workspace = await tx.workspace.create({
        data: {
            name,
            ownerId: userId,
        },
    });

    await tx.workspaceMember.create({
        data: {
            userId: userId,
            workspaceId: workspace.id,
            role: 'ADMIN',    
        }
    });

    await tx.page.create({
        data: {
            title: 'Welcome!',
            workspaceId: workspace.id,
            createdBy: userId
        }
    });
    return workspace;
};


export async function getOrCreateDefaultWorkspace(userId: number) {
    return prisma.$transaction(async(tx) => {
        const workspace = await tx.workspace.findMany({
            where: {
                ownerId: userId
            }
        });

        if(workspace.length > 0) {
            return workspace;
        };

        const defaultworkspace = await createWorkspace(tx, userId, 'Personal Workspace');
        return [defaultworkspace]
    });
}

export async function create(userId: number, name:string) {
   return await prisma.$transaction(async (tx) => {
       return await createWorkspace(tx, userId, name);
   });
}


export async function getAllWorkspacesForUser(userId: number) {
  return prisma.workspace.findMany({
    where: {
      members: {
        some: { userId },
      },
    },
    include: {
      members: {
        where: { userId },
        select: { role: true },
      },
    },
    orderBy: { id: 'asc' },
  });
}
