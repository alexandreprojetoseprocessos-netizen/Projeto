import React, { useCallback, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { AlertTriangle, CheckCircle2, ClipboardList, Clock3 } from "lucide-react";

import type { DashboardOutletContext } from "../components/DashboardLayout";
import { AppPageHero, AppStateCard } from "../components/AppPageHero";
import {
  KanbanBoard,
  KANBAN_STATUS_ORDER,
  STATUS_MAP,
  type KanbanColumn,
  type KanbanTask,
  type TaskStatus
} from "../components/KanbanBoard";
import KanbanTaskModal from "../components/KanbanTaskModal";
import { normalizeStatus } from "../utils/status";
import "./KanbanPage.css";

const KanbanPage: React.FC = () => {
  const {
    wbsNodes,
    members,
    projects,
    selectedProjectId,
    wbsError,
    onUpdateWbsNode,
    onReloadWbs,
    onCreateWbsItem,
    selectedNodeId,
    onSelectNode,
    comments,
    commentsError,
    onSubmitComment,
    commentBody,
    onCommentBodyChange,
    timeEntryDate,
    timeEntryHours,
    timeEntryDescription,
    timeEntryError,
    onTimeEntryDateChange,
    onTimeEntryHoursChange,
    onTimeEntryDescriptionChange,
    onLogTime
  } = useOutletContext<DashboardOutletContext>();

  const [filterText, setFilterText] = useState("");
  const [filterOwner, setFilterOwner] = useState<string>("ALL");
  const [filterPriority, setFilterPriority] = useState<string>("ALL");
  const [filterDue, setFilterDue] = useState<string>("ALL");
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const flattenNodes = (nodes: any[]): any[] => {
    const result: any[] = [];
    nodes.forEach((node) => {
      result.push(node);
      if (node.children?.length) result.push(...flattenNodes(node.children));
    });
    return result;
  };

  const allNodes = useMemo(() => flattenNodes(wbsNodes ?? []), [wbsNodes]);
  const projectNameMap = useMemo(
    () => new Map((projects ?? []).map((project: any) => [project.id, project.name])),
    [projects]
  );

  const filtered = useMemo(() => {
    const query = filterText.trim().toLowerCase();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const soonLimit = new Date(today);
    soonLimit.setDate(soonLimit.getDate() + 7);

    return allNodes.filter((node) => {
      if (node.deletedAt) return false;

      if (filterOwner !== "ALL") {
        const ownerId = node.ownerId ?? node.responsible?.membershipId ?? node.responsibleMembershipId;
        if (String(ownerId ?? "") !== filterOwner) return false;
      }

      if (filterPriority !== "ALL") {
        const priority = (node.priority ?? "").toString().toUpperCase();
        if (priority !== filterPriority) return false;
      }

      if (filterDue !== "ALL") {
        const rawDate = node.endDate ?? node.dueDate ?? node.endAt ?? node.end ?? null;
        const parsedDate = rawDate ? new Date(rawDate) : null;
        const validDate = parsedDate && !Number.isNaN(parsedDate.getTime()) ? parsedDate : null;
        if (!validDate) return false;
        const dateOnly = new Date(validDate);
        dateOnly.setHours(0, 0, 0, 0);
        if (filterDue === "OVERDUE" && dateOnly >= today) return false;
        if (filterDue === "UPCOMING" && (dateOnly < today || dateOnly > soonLimit)) return false;
      }

      if (!query) return true;

      const code = String(node.wbsCode ?? node.code ?? node.displayId ?? "").toLowerCase();
      const title = String(node.title ?? "").toLowerCase();

      return code.includes(query) || title.includes(query);
    });
  }, [allNodes, filterDue, filterOwner, filterPriority, filterText]);

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
            id: String(assigneeSource.id ?? assigneeSource.userId ?? assigneeSource.membershipId ?? ""),
            name: assigneeSource.name ?? assigneeSource.email ?? "Responsavel",
            avatar: assigneeSource.avatar
          }
        : undefined;
      grouped[status].push({
        id: node.id,
        title: `${node.title ?? "Tarefa"}`.trim(),
        code: node.wbsCode ?? node.code ?? "",
        status,
        projectName:
          node.projectName ??
          (node.projectId ? projectNameMap.get(node.projectId) : null) ??
          (selectedProjectId && selectedProjectId !== "all" ? projectNameMap.get(selectedProjectId) : null) ??
          undefined,
        dueDate: node.endDate ?? node.dueDate ?? node.endAt ?? node.end ?? undefined,
        startDate: node.startDate ?? node.startAt ?? node.start ?? undefined,
        endDate: node.endDate ?? node.dueDate ?? node.endAt ?? node.end ?? undefined,
        assignee,
        tags: node.wbsCode ? [node.wbsCode] : undefined,
        description: node.description ?? undefined,
        priority: node.priority ?? undefined
      });
    });

    return KANBAN_STATUS_ORDER.map((status) => ({
      id: status,
      title: STATUS_MAP[status],
      tasks: grouped[status],
      wipLimit: undefined
    }));
  }, [filtered, mapToTaskStatus, projectNameMap, selectedProjectId]);

  const totalTasks = filtered.length;
  const sourceTasksCount = allNodes.filter((node) => !node.deletedAt).length;
  const inProgressCount = kanbanColumns.find((column) => column.id === "IN_PROGRESS")?.tasks.length ?? 0;
  const delayedCount = kanbanColumns.find((column) => column.id === "DELAYED")?.tasks.length ?? 0;
  const doneCount = kanbanColumns.find((column) => column.id === "DONE")?.tasks.length ?? 0;
  const selectedProjectLabel =
    selectedProjectId && selectedProjectId !== "all"
      ? projectNameMap.get(selectedProjectId) ?? "Projeto atual"
      : "Todos os projetos visiveis";

  const handleDragEnd = async (result: any) => {
    const { destination, source, draggableId } = result;
    if (!destination || destination.droppableId === source.droppableId) return;

    const newStatus = destination.droppableId as TaskStatus;

    try {
      await onUpdateWbsNode?.(draggableId, { status: newStatus });
      onReloadWbs?.();
    } catch (error) {
      console.error("Falha ao mover tarefa", error);
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

  const selectedTask = allNodes.find((node) => node.id === selectedTaskId);

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
      <AppPageHero
        className="kanbanPageHero"
        kicker="Execucao visual"
        title="Kanban"
        subtitle={`Quadro operacional por status para ${selectedProjectLabel.toLowerCase()}.`}
        stats={[
          {
            label: "Tarefas visiveis",
            value: totalTasks,
            helper:
              sourceTasksCount !== totalTasks
                ? `${sourceTasksCount} tarefas antes dos filtros`
                : "Tudo o que esta visivel no quadro",
            icon: <ClipboardList size={18} />,
            tone: "default"
          },
          {
            label: "Em andamento",
            value: inProgressCount,
            helper: "Itens em execucao agora",
            icon: <Clock3 size={18} />,
            tone: "warning"
          },
          {
            label: "Em atraso",
            value: delayedCount,
            helper: "Demandas que precisam de acao",
            icon: <AlertTriangle size={18} />,
            tone: "danger"
          },
          {
            label: "Finalizadas",
            value: doneCount,
            helper: "Tarefas concluidas no quadro",
            icon: <CheckCircle2 size={18} />,
            tone: "success"
          }
        ]}
      />

      {wbsError ? <p className="error-text">{wbsError}</p> : null}

      <section className="app-toolbar-card kanbanFiltersCard">
        <div className="app-toolbar-card__header">
          <div>
            <strong>Filtros do quadro</strong>
            <p>Refine a visualizacao por tarefa, responsavel, prioridade e prazo.</p>
          </div>
        </div>
        <div className="kanbanFilters">
          <input
            className="gp-input"
            placeholder="Buscar tarefa"
            value={filterText}
            onChange={(event) => setFilterText(event.target.value)}
          />

          <select className="gp-input" value={filterOwner} onChange={(event) => setFilterOwner(event.target.value)}>
            <option value="ALL">Responsavel</option>
            {members?.map((member) => (
              <option key={member.id} value={member.id}>
                {member.name ?? member.email ?? "Membro"}
              </option>
            ))}
          </select>

          <select
            className="gp-input"
            value={filterPriority}
            onChange={(event) => setFilterPriority(event.target.value)}
          >
            <option value="ALL">Prioridade</option>
            <option value="CRITICAL">Urgente</option>
            <option value="HIGH">Alta</option>
            <option value="MEDIUM">Media</option>
            <option value="LOW">Baixa</option>
          </select>

          <select className="gp-input" value={filterDue} onChange={(event) => setFilterDue(event.target.value)}>
            <option value="ALL">Datas</option>
            <option value="UPCOMING">A vencer</option>
            <option value="OVERDUE">Vencidas</option>
          </select>
        </div>
      </section>

      {totalTasks === 0 ? (
        <AppStateCard
          className="kanbanStateCard"
          tone={sourceTasksCount === 0 ? "default" : "warning"}
          title={sourceTasksCount === 0 ? "Quadro pronto para receber tarefas" : "Nenhuma tarefa encontrada"}
          description={
            sourceTasksCount === 0
              ? "Crie a primeira tarefa em qualquer coluna para iniciar a operacao do quadro."
              : "Os filtros atuais removeram todas as tarefas da visualizacao. Ajuste os filtros para voltar a ver o quadro."
          }
        />
      ) : null}

      <KanbanBoard
        columns={kanbanColumns}
        onDragEnd={handleDragEnd}
        onCreate={handleCreate}
        onTaskClick={(task) => {
          setSelectedTaskId(task.id);
          onSelectNode?.(task.id);
        }}
        newTaskTitle=""
        onTaskTitleChange={() => {}}
        newTaskColumn=""
        onTaskColumnChange={() => {}}
      />

      {selectedTask ? (
        <KanbanTaskModal
          task={selectedTask}
          members={members}
          onSave={handleSaveTask}
          onClose={() => {
            setSelectedTaskId(null);
            onSelectNode?.(null);
          }}
          selectedNodeId={selectedNodeId}
          comments={comments}
          commentsError={commentsError}
          onSubmitComment={onSubmitComment}
          commentBody={commentBody}
          onCommentBodyChange={onCommentBodyChange}
          timeEntryDate={timeEntryDate}
          timeEntryHours={timeEntryHours}
          timeEntryDescription={timeEntryDescription}
          timeEntryError={timeEntryError}
          onTimeEntryDateChange={onTimeEntryDateChange}
          onTimeEntryHoursChange={onTimeEntryHoursChange}
          onTimeEntryDescriptionChange={onTimeEntryDescriptionChange}
          onLogTime={onLogTime}
        />
      ) : null}
    </section>
  );
};

export default KanbanPage;
