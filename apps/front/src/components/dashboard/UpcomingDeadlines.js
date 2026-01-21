import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export const UpcomingDeadlines = ({ items }) => (_jsxs("article", { className: "dashboard-card dashboard-hover", children: [_jsxs("div", { className: "dashboard-card-header", children: [_jsxs("div", { children: [_jsx("h3", { className: "dashboard-card-title", children: "Proximos Prazos" }), _jsx("p", { className: "dashboard-muted", children: "Tarefas com vencimento proximo" })] }), _jsx("span", { className: "dashboard-link", children: "Ver todos" })] }), _jsx("div", { className: "dashboard-deadlines", children: items.map((item) => {
                const priorityTone = item.isLate
                    ? "danger"
                    : item.priority.toLowerCase() === "alta"
                        ? "warning"
                        : item.priority.toLowerCase() === "media"
                            ? "info"
                            : "neutral";
                return (_jsxs("div", { className: `dashboard-deadline-item ${item.isLate ? "is-late" : ""}`, children: [_jsxs("div", { className: "dashboard-deadline-main", children: [_jsx("div", { className: "dashboard-deadline-title", children: item.title }), _jsx("div", { className: "dashboard-deadline-date", children: item.date })] }), _jsxs("div", { className: "dashboard-deadline-tags", children: [item.isLate && _jsx("span", { className: "dashboard-pill dashboard-pill--danger", children: "Atrasado" }), _jsx("span", { className: `dashboard-pill dashboard-pill--${priorityTone}`, children: item.priority })] })] }, item.id));
            }) })] }));
