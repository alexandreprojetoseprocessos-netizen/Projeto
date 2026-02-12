import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo, useState } from "react";
export const UpcomingDeadlines = ({ items, monthItems }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const resolvedMonthItems = monthItems ?? [];
    const monthLabel = useMemo(() => new Date().toLocaleDateString("pt-BR", {
        month: "long",
        year: "numeric"
    }), []);
    const renderItem = (item) => {
        const priorityTone = item.isLate
            ? "danger"
            : item.priority.toLowerCase() === "alta"
                ? "warning"
                : item.priority.toLowerCase() === "media"
                    ? "info"
                    : "neutral";
        const statusText = item.statusLabel?.toLowerCase() ?? "";
        const statusTone = item.isLate || statusText.includes("atras") || statusText.includes("risco")
            ? "danger"
            : statusText.includes("andamento") || statusText.includes("progresso")
                ? "info"
                : statusText.includes("revis") || statusText.includes("homolog")
                    ? "warning"
                    : "neutral";
        return (_jsxs("div", { className: `dashboard-deadline-item ${item.isLate ? "is-late" : ""}`, children: [_jsxs("div", { className: "dashboard-deadline-main", children: [_jsx("div", { className: "dashboard-deadline-title", children: item.title }), item.projectName && _jsx("div", { className: "dashboard-deadline-project dashboard-muted", children: item.projectName }), _jsx("div", { className: "dashboard-deadline-date", children: item.date })] }), _jsxs("div", { className: "dashboard-deadline-tags", children: [item.isLate && _jsx("span", { className: "dashboard-pill dashboard-pill--danger", children: "Atrasado" }), item.statusLabel && _jsx("span", { className: `dashboard-pill dashboard-pill--${statusTone}`, children: item.statusLabel }), _jsx("span", { className: `dashboard-pill dashboard-pill--${priorityTone}`, children: item.priority })] })] }, item.id));
    };
    return (_jsxs("article", { className: "dashboard-card dashboard-hover", children: [_jsxs("div", { className: "dashboard-card-header", children: [_jsxs("div", { children: [_jsx("h3", { className: "dashboard-card-title", children: "Proximos Prazos" }), _jsx("p", { className: "dashboard-muted", children: "Tarefas com vencimento proximo" })] }), _jsx("button", { type: "button", className: "dashboard-link-button", onClick: () => setIsModalOpen(true), children: "Ver todos" })] }), _jsx("div", { className: "dashboard-deadlines", children: items.map(renderItem) }), isModalOpen && (_jsx("div", { className: "gp-modal-backdrop", onClick: () => setIsModalOpen(false), children: _jsxs("div", { className: "gp-modal", role: "dialog", "aria-modal": "true", onClick: (event) => event.stopPropagation(), children: [_jsxs("div", { className: "gp-modal-header", children: [_jsx("h2", { children: "Proximos Prazos" }), _jsx("button", { type: "button", className: "gp-modal-close", onClick: () => setIsModalOpen(false), children: "x" })] }), _jsxs("p", { className: "gp-modal-subtitle", children: ["Tarefas com vencimento em ", monthLabel] }), _jsx("div", { className: "gp-modal-body", children: resolvedMonthItems.length ? (_jsx("div", { className: "dashboard-deadlines", children: resolvedMonthItems.map(renderItem) })) : (_jsx("p", { className: "dashboard-muted", children: "Sem tarefas neste mes." })) })] }) }))] }));
};
