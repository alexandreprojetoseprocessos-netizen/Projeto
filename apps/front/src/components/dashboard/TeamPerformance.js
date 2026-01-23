import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export const TeamPerformance = ({ members }) => {
    const topMember = members[0]?.name ?? "Equipe";
    return (_jsxs("article", { className: "dashboard-card dashboard-hover", children: [_jsxs("div", { className: "dashboard-card-header", children: [_jsxs("div", { children: [_jsx("h3", { className: "dashboard-card-title", children: "Desempenho da Equipe" }), _jsx("p", { className: "dashboard-muted", children: "Resumo semanal das entregas" })] }), _jsxs("span", { className: "dashboard-badge", children: ["Top: ", topMember] })] }), _jsx("div", { className: "dashboard-team-list", children: members.map((member) => {
                    const initials = member.name
                        .split(" ")
                        .filter(Boolean)
                        .slice(0, 2)
                        .map((part) => part[0]?.toUpperCase())
                        .join("");
                    return (_jsxs("div", { className: "dashboard-team-item", children: [_jsx("div", { className: "dashboard-team-avatar", children: initials || "?" }), _jsxs("div", { className: "dashboard-team-info", children: [_jsx("div", { className: "dashboard-team-name", children: member.name }), _jsxs("div", { className: "dashboard-team-meta", children: [member.done, "/", member.total, " tarefas"] })] }), _jsxs("div", { className: "dashboard-team-progress", children: [_jsx("div", { className: "dashboard-progress-track", children: _jsx("div", { className: "dashboard-progress-fill", style: { width: `${member.percent}%` } }) }), _jsxs("span", { className: "dashboard-team-percent", children: [member.percent, "%"] })] })] }, member.id));
                }) })] }));
};
