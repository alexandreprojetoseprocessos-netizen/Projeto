import React, { useCallback, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";

import type { DashboardOutletContext } from "../components/DashboardLayout";
import {
  KanbanBoard,
  KANBAN_STATUS_ORDER,
  STATUS_MAP,
  type KanbanColumn,
  type KanbanTask,
  type TaskStatus,
} from "../components/KanbanBoard";
import KanbanTaskModal from "../components/KanbanTaskModal";
import { normalizeStatus } from "../utils/status";
import "./KanbanPage.css";

const KanbanPage: React.FC = () => {
  const {
    wbsNodes,
    members,
    wbsError,
    onUpdateWbsNode,
    onReloadWbs,
    onCreateWbsItem,
  } = useOutletContext<DashboardOutletContext>();

  const [filterText, setFilterText] = useState("");
  const [filterOwner, setFilterOwner] = useState<string>("ALL");
  const [filterPriority] = useState<string>("ALL");
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const flattenNodes = (nodes: any[]): any[] => {
    const result: any[] = [];
    nodes.forEach((n) => {
      result.push(n);
      if (n.children?.length) result.push(...flattenNodes(n.children));
    });
    return result;
  };

  const allNodes = useMemo(() => flattenNodes(wbsNodes ?? []), [wbsNodes]);

  const filtered = useMemo(() => {
    const q = filterText.trim().toLowerCase();

    return allNodes.filter((node) => {
      if (node.deletedAt) return false;

      if (filterOwner !== "ALL") {
        const ownerId =
          node.ownerId ??
          node.responsible?.membershipId ??
          node.responsibleMembershipId;
        if (String(ownerId ?? "") !== filterOwner) return false;
      }

      if (filterPriority !== "ALL") {
        const pri = (node.priority ?? "").toString().toUpperCase();
        if (pri !== filterPriority) return false;
      }

      if (!q) return true;

      const code = String(node.wbsCode ?? node.code ?? node.displayId ?? "").toLowerCase();
      const title = String(node.title ?? "").toLowerCase();

      return code.includes(q) || title.includes(q);
    });
  }, [allNodes, filterOwner, filterPriority, filterText]);

  const mapToTaskStatus = useCallback((raw?: string | null): TaskStatus => {
    const normalized = normalizeStatus(raw);
    switch (normalized) {
      case "Não iniciado":
        return "BACKLOG";
      case "Em andamento":
        return "IN_PROGRESS";
      case "Em atraso":
        return "DELAYED";
      case "Em risco":
        return "RISK";
      case "Homologação":
        return "REVIEW";
      case "Finalizado":
        return "DONE";
      default:
        return "BACKLOG";
    }
  }, []);

  const kanbanColumns: KanbanColumn[] = useMemo(() => {
    const grouped: Record<TaskStatus, KanbanTask[]> = KANBAN_STATUS_ORDER.reduce(
      (acc, status) => ({ ...acc, [status]: [] }),
      {} as Record<TaskStatus, KanbanTask[]>
    );

    filtered.forEach((node) => {
      const status = mapToTaskStatus(node.status);
      const assigneeSource = node.owner ?? node.responsible ?? null;
      const assignee = assigneeSource
        ? {
            id: String(
              assigneeSource.id ??
                assigneeSource.userId ??
                assigneeSource.membershipId ??
                ""
            ),
            name: assigneeSource.name ?? assigneeSource.email ?? "Responsavel",
            avatar: assigneeSource.avatar,
          }
        : undefined;
      grouped[status].push({
        id: node.id,
        title: `${node.wbsCode ?? node.code ?? ""} ${node.title ?? "Tarefa"}`.trim(),
        code: node.wbsCode ?? node.code ?? "",
        status,
        dueDate: node.endDate ?? node.dueDate ?? node.endAt ?? node.end ?? undefined,
        startDate: node.startDate ?? node.startAt ?? node.start ?? undefined,
        endDate: node.endDate ?? node.dueDate ?? node.endAt ?? node.end ?? undefined,
        assignee,
        tags: node.wbsCode ? [node.wbsCode] : undefined,
        description: node.description ?? undefined,
        priority: node.priority ?? undefined,
      });
    });

    return KANBAN_STATUS_ORDER.map((status) => ({
      id: status,
      title: STATUS_MAP[status],
      tasks: grouped[status],
      wipLimit: undefined,
    }));
  }, [filtered, mapToTaskStatus]);

  const handleDragEnd = async (result: any) => {
    const { destination, source, draggableId } = result;
    if (!destination || destination.droppableId === source.droppableId) return;

    const newStatus = destination.droppableId as TaskStatus;

    try {
      await onUpdateWbsNode?.(draggableId, { status: newStatus });
      onReloadWbs?.();
    } catch (err) {
      console.error("Falha ao mover tarefa", err);
    }
  };

  const handleCreate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const title = (formData.get("title") as string) ?? "Nova tarefa";
    const status = (formData.get("status") as TaskStatus) ?? "BACKLOG";

    try {
      await onCreateWbsItem?.(null, { title, status });
      onReloadWbs?.();
      return true;
    } catch (error) {
      console.error("Erro ao criar tarefa", error);
      return false;
    }
  };

  const selectedTask = allNodes.find((n) => n.id === selectedTaskId);

  const handleSaveTask = async (updates: Record<string, any>) => {
    if (!selectedTask) return false;
    try {
      await onUpdateWbsNode?.(selectedTask.id, updates);
      onReloadWbs?.();
      return true;
    } catch (error) {
      console.error("Erro ao salvar tarefa", error);
      return false;
    }
  };

  return (
    <section className="kanbanPage">
      <header className="page-header">
        <div>
          <p className="eyebrow">EAP</p>
          <h1>Kanban</h1>
          <p className="subtext">Visualização por status</p>
          {wbsError && <p className="error-text">{wbsError}</p>}
        </div>

        <div className="kanbanFilters">
          <input
            className="gp-input"
            placeholder="Buscar tarefa"
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
          />

          <select
            className="gp-input"
            value={filterOwner}
            onChange={(e) => setFilterOwner(e.target.value)}
          >
            <option value="ALL">Responsável</option>
            {members?.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name ?? m.email ?? "Membro"}
              </option>
            ))}
          </select>

          <select className="gp-input" value={filterPriority} onChange={() => {}}>
            <option value="ALL">Prioridade</option>
          </select>
        </div>
      </header>

      <KanbanBoard
        columns={kanbanColumns}
        onDragEnd={handleDragEnd}
        onCreate={handleCreate}
        onTaskClick={(task) => setSelectedTaskId(task.id)}
        newTaskTitle=""
        onTaskTitleChange={() => {}}
        newTaskColumn=""
        onTaskColumnChange={() => {}}
      />

      {selectedTask && (
        <KanbanTaskModal
          task={selectedTask}
          members={members}
          onSave={handleSaveTask}
          onClose={() => setSelectedTaskId(null)}
        />
      )}
    </section>
  );
};

export default KanbanPage;
