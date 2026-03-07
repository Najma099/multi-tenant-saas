import { prisma } from "..";
import { BlockType, Prisma } from '@prisma/client';
import { validateBlockContent } from '../../middleware/blocks.validate';
import { getDefaultBlockContent } from '../../types/blocks.defaults';

export async function getBlockByPageId(pageId: number) {
    return prisma.block.findMany({
        where:{
            pageId
        },
        orderBy:{
            position: 'asc'
        }
    });
}

export async function createBlock(pageId: number, type:BlockType, content: unknown, position?: number) {
    const finalContent = content ?? getDefaultBlockContent(type);
    validateBlockContent(type, finalContent);

    return prisma.$transaction(async(tx) => {
        const lastBlock = await tx.block.findFirst({
            where: {pageId},
            orderBy: {position: 'desc'},
            select: {position: true},
        });

        const newPosition = position ?? (lastBlock?.position ?? 0) + 1;
        
        return tx.block.create({
            data: {
                pageId,
                type,
                content: finalContent,
                position: newPosition,
            },
        });
    })
}

export async function updateBlock(
  blockId: number,
  content: unknown,
  type?: BlockType,
) {
  return prisma.$transaction(async (tx) => {
    const block = await tx.block.findUnique({
      where: { id: blockId },
      select: { type: true },
    });

    if (!block) {
      throw new Error('Block not found');
    }

    const blockType = type || block.type;
    validateBlockContent(blockType, content);

    const updateData: any = {
      content: content as Prisma.InputJsonValue,
    };

    if (type) {
      updateData.type = type;
    }

    const updated = await tx.block.update({
      where: { id: blockId },
      data: updateData,
    });

    return updated;
  });
}

export async function deleteBlock(blockId: number) {
  return prisma.block.delete({
    where: { id: blockId },
  });
}


export async function reorderBlocks(
  pageId: number,
  order: { id: number; position: number }[],
) {
  return prisma.$transaction(
    order.map((item) =>
      prisma.block.update({
        where: {
          id: item.id,
          pageId, 
        },
        data: { position: item.position },
      }),
    ),
  );
}

export async function syncBlockText(blockId: number, text: string) {
  const block = await prisma.block.findUnique({
    where: { id: blockId },
    select: { content: true }
  });

  if (!block) return;

  const merged = { ...(block.content as object), text };

  return prisma.block.update({
    where: { id: blockId },
    data: { content: merged as Prisma.InputJsonValue }
  });
}