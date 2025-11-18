import { prisma } from "@gestao/database";

type LightweightNode = {
  id: string;
  parentId: string | null;
  order: number;
  createdAt: Date;
};

export const recomputeProjectWbsCodes = async (projectId: string) => {
  const nodes = await prisma.wbsNode.findMany({
    where: { projectId },
    select: {
      id: true,
      parentId: true,
      order: true,
      createdAt: true
    }
  });

  if (!nodes.length) return [];

  const childrenMap = new Map<string | null, LightweightNode[]>();
  for (const node of nodes) {
    const key = node.parentId ?? null;
    const group = childrenMap.get(key) ?? [];
    group.push(node);
    childrenMap.set(key, group);
  }

  childrenMap.forEach((items) => {
    items.sort((a, b) => a.order - b.order || a.createdAt.getTime() - b.createdAt.getTime());
  });

  const updates: Array<{ id: string; code: string; level: number }> = [];
  const assign = (parentId: string | null, prefix: string | null) => {
    const children = childrenMap.get(parentId) ?? [];
    children.forEach((child, index) => {
      const code = prefix ? `${prefix}.${index + 1}` : `${index + 1}`;
      const level = prefix ? prefix.split(".").length : 0;
      updates.push({ id: child.id, code, level });
      assign(child.id, code);
    });
  };

  assign(null, null);

  await prisma.$transaction(
    updates.map((item) =>
      prisma.wbsNode.update({
        where: { id: item.id },
        data: { wbsCode: item.code, level: item.level }
      })
    )
  );

  return updates;
};
