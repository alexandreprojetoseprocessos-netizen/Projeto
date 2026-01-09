export const STATUS_ORDER = [
  "Não iniciado",
  "Em andamento",
  "Em atraso",
  "Em risco",
  "Homologação",
  "Finalizado"
] as const;

export type Status = (typeof STATUS_ORDER)[number];

export type BackendTaskStatus =
  | "BACKLOG"
  | "TODO"
  | "IN_PROGRESS"
  | "REVIEW"
  | "DELAYED"
  | "RISK"
  | "BLOCKED"
  | "DONE";

export function normalizeStatus(raw?: string | null): Status {
  const v = (raw ?? "").trim().toLowerCase();

  if (!v) return "Não iniciado";

  if (v.includes("backlog") || v.includes("planej") || v == "todo") return "Não iniciado";
  if (v.includes("revis") || v.includes("review") || v.includes("homolog")) return "Homologação";
  if (v.includes("final") || v.includes("done") || v.includes("conclu")) return "Finalizado";
  if (v.includes("andam") || v.includes("progress") || v.includes("doing")) return "Em andamento";
  if (v.includes("atras") || v.includes("delay") || v.includes("late") || v.includes("overdue"))
    return "Em atraso";
  if (v.includes("risco") || v.includes("risk") || v.includes("blocked")) return "Em risco";

  return "Não iniciado";
}

export function toBackendStatus(raw?: string | null): BackendTaskStatus {
  const upper = (raw ?? "").trim().toUpperCase();
  if (["BACKLOG", "TODO", "IN_PROGRESS", "REVIEW", "DELAYED", "RISK", "BLOCKED", "DONE"].includes(upper)) {
    return upper as BackendTaskStatus;
  }

  const v = (raw ?? "").trim().toLowerCase();
  if (!v) return "BACKLOG";
  if (v.includes("backlog") || v.includes("não iniciado") || v.includes("nao iniciado") || v.includes("todo"))
    return "BACKLOG";
  if (v.includes("planej")) return "TODO";
  if (v.includes("andam") || v.includes("progress") || v.includes("doing")) return "IN_PROGRESS";
  if (v.includes("homolog") || v.includes("revis") || v.includes("review")) return "REVIEW";
  if (v.includes("final") || v.includes("done") || v.includes("conclu")) return "DONE";
  if (v.includes("atras") || v.includes("delay") || v.includes("late") || v.includes("overdue")) return "DELAYED";
  if (v.includes("risco") || v.includes("risk")) return "RISK";
  if (v.includes("blocked")) return "BLOCKED";

  return "BACKLOG";
}
