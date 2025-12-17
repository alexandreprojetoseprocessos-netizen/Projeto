export const STATUS_ORDER = [
  "Não iniciado",
  "Em andamento",
  "Em atraso",
  "Em risco",
  "Homologação",
  "Finalizado",
] as const;

export type Status = (typeof STATUS_ORDER)[number];

export function normalizeStatus(raw?: string | null): Status {
  const v = (raw ?? "").trim().toLowerCase();

  if (!v) return "Não iniciado";

  if (v.includes("backlog") || v.includes("planej") || v === "todo")
    return "Não iniciado";
  if (v.includes("revis") || v.includes("review") || v.includes("homolog"))
    return "Homologação";
  if (v.includes("final") || v.includes("done") || v.includes("conclu"))
    return "Finalizado";
  if (v.includes("andam") || v.includes("progress") || v.includes("doing"))
    return "Em andamento";
  if (v.includes("atras") || v.includes("delay") || v.includes("late"))
    return "Em atraso";
  if (v.includes("risco") || v.includes("risk")) return "Em risco";

  return "Não iniciado";
}
