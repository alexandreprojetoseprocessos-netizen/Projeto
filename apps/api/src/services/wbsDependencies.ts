import { Prisma } from "@prisma/client";
import { prisma } from "@gestao/database";

const MS_IN_DAY = 1000 * 60 * 60 * 24;
const WORKDAY_HOURS = 8;

const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());
const addDays = (date: Date, amount: number) => {
  const result = new Date(date);
  result.setDate(result.getDate() + amount);
  return result;
};

type GraphNode = {
  id: string;
  startDate: Date | null;
  endDate: Date | null;
  estimateHours: Prisma.Decimal | null;
  predecessors: string[];
  successors: string[];
};

const computeDurationDays = (node: GraphNode): number | null => {
  if (node.startDate && node.endDate) {
    const diff = Math.round((node.endDate.getTime() - node.startDate.getTime()) / MS_IN_DAY) + 1;
    if (diff > 0) return diff;
  }
  if (node.estimateHours) {
    const hours = Number(node.estimateHours);
    if (!Number.isNaN(hours) && hours > 0) {
      return Math.max(1, Math.round(hours / WORKDAY_HOURS));
    }
  }
  return null;
};

const hasPath = (startId: string, targetId: string, successorMap: Map<string, string[]>): boolean => {
  if (startId === targetId) return true;
  const visited = new Set<string>();
  const stack: string[] = [startId];

  while (stack.length) {
    const current = stack.pop() as string;
    if (current === targetId) return true;
    if (visited.has(current)) continue;
    visited.add(current);
    const next = successorMap.get(current) ?? [];
    next.forEach((child) => {
      if (!visited.has(child)) {
        stack.push(child);
      }
    });
  }

  return false;
};

export class DependencyValidationError extends Error {}

export const setNodeDependencies = async (projectId: string, nodeId: string, predecessors: string[]) => {
  const desired = [...new Set(predecessors.filter((id): id is string => Boolean(id)))];

  if (desired.some((id) => id === nodeId)) {
    throw new DependencyValidationError("Uma tarefa não pode depender dela mesma.");
  }

  const nodes = await prisma.wbsNode.findMany({
    where: { projectId, id: { in: [nodeId, ...desired] } },
    select: { id: true }
  });

  const existingIds = new Set(nodes.map((node) => node.id));
  if (!existingIds.has(nodeId)) {
    throw new DependencyValidationError("Tarefa não encontrada para adicionar dependências.");
  }

  const invalidIds = desired.filter((id) => !existingIds.has(id));
  if (invalidIds.length) {
    throw new DependencyValidationError("Algumas tarefas predecessoras não existem neste projeto.");
  }

  const edges = await prisma.dependency.findMany({
    where: { successor: { projectId } },
    select: { predecessorId: true, successorId: true }
  });

  const successorMap = new Map<string, string[]>();
  edges.forEach((edge) => {
    const list = successorMap.get(edge.predecessorId) ?? [];
    list.push(edge.successorId);
    successorMap.set(edge.predecessorId, list);
  });

  for (const predecessorId of desired) {
    if (hasPath(nodeId, predecessorId, successorMap)) {
      throw new DependencyValidationError("Dependência criaria um ciclo entre tarefas.");
    }
  }

  const current = await prisma.dependency.findMany({
    where: { successorId: nodeId },
    select: { predecessorId: true }
  });
  const currentIds = new Set(current.map((dep) => dep.predecessorId));
  const desiredSet = new Set(desired);

  const toCreate = desired.filter((id) => !currentIds.has(id));
  const toDelete = current.filter((dep) => !desiredSet.has(dep.predecessorId)).map((dep) => dep.predecessorId);

  if (!toCreate.length && !toDelete.length) {
    return false;
  }

  const operations = [];
  if (toDelete.length) {
    operations.push(
      prisma.dependency.deleteMany({
        where: { successorId: nodeId, predecessorId: { in: toDelete } }
      })
    );
  }
  if (toCreate.length) {
    operations.push(
      prisma.dependency.createMany({
        data: toCreate.map((predecessorId) => ({
          predecessorId,
          successorId: nodeId
        })),
        skipDuplicates: true
      })
    );
  }

  await prisma.$transaction(operations);

  return true;
};

export const enforceDependencyDates = async (projectId: string, startingNodeIds: string[]) => {
  const uniqueStart = [...new Set(startingNodeIds.filter((id): id is string => Boolean(id)))];
  if (!uniqueStart.length) return;

  const nodes = await prisma.wbsNode.findMany({
    where: { projectId },
    select: {
      id: true,
      startDate: true,
      endDate: true,
      estimateHours: true,
      dependenciesAsSuccessor: {
        select: { predecessorId: true }
      },
      dependenciesAsPredecessor: {
        select: { successorId: true }
      }
    }
  });

  if (!nodes.length) return;

  const nodeMap = new Map<string, GraphNode>();
  nodes.forEach((node) => {
    nodeMap.set(node.id, {
      id: node.id,
      startDate: node.startDate,
      endDate: node.endDate,
      estimateHours: node.estimateHours,
      predecessors: node.dependenciesAsSuccessor.map((dep) => dep.predecessorId),
      successors: node.dependenciesAsPredecessor.map((dep) => dep.successorId)
    });
  });

  const queue: string[] = [];
  const enqueued = new Set<string>();
  const enqueue = (id: string) => {
    if (!id || enqueued.has(id)) return;
    enqueued.add(id);
    queue.push(id);
  };
  uniqueStart.forEach(enqueue);
  const initialNodes = new Set(uniqueStart);

  const updates: Array<{ id: string; startDate: Date | null; endDate: Date | null }> = [];

  while (queue.length) {
    const nodeId = queue.shift() as string;
    enqueued.delete(nodeId);
    const propagateRegardless = initialNodes.has(nodeId);
    initialNodes.delete(nodeId);
    const node = nodeMap.get(nodeId);
    if (!node) continue;
    if (!node.predecessors.length) {
      if (propagateRegardless) {
        (node.successors ?? []).forEach(enqueue);
      }
      continue;
    }

    let maxEnd: Date | null = null;
    for (const predecessorId of node.predecessors) {
      const predecessor = nodeMap.get(predecessorId);
      if (predecessor?.endDate) {
        if (!maxEnd || predecessor.endDate > maxEnd) {
          maxEnd = predecessor.endDate;
        }
      }
    }

    if (!maxEnd) continue;

    const requiredStart = startOfDay(addDays(maxEnd, 1));
    const currentStart = node.startDate ? new Date(node.startDate) : null;
    const duration = computeDurationDays(node);

    const nextStart = requiredStart;
    const startChanged = !currentStart || currentStart.getTime() !== requiredStart.getTime();
    let nextEnd = node.endDate ? new Date(node.endDate) : null;
    let endChanged = false;

    if (duration && duration > 0) {
      const newEnd = addDays(requiredStart, Math.max(duration - 1, 0));
      if (!nextEnd || nextEnd.getTime() !== newEnd.getTime()) {
        nextEnd = newEnd;
        endChanged = true;
      }
    } else if (!nextEnd || nextEnd < requiredStart) {
      nextEnd = requiredStart;
      endChanged = true;
    }

    if (!startChanged && nextEnd && nextEnd < nextStart) {
      nextEnd = nextStart;
      endChanged = true;
    }

    if (startChanged || endChanged) {
      updates.push({ id: node.id, startDate: nextStart ?? null, endDate: nextEnd ?? null });
      node.startDate = nextStart ?? null;
      node.endDate = nextEnd ?? null;
    }

    if ((startChanged || endChanged || propagateRegardless) && node.successors?.length) {
      node.successors.forEach(enqueue);
    }
  }

  if (!updates.length) return;

  await prisma.$transaction(
    updates.map((item) =>
      prisma.wbsNode.update({
        where: { id: item.id },
        data: {
          startDate: item.startDate,
          endDate: item.endDate
        }
      })
    )
  );
};
