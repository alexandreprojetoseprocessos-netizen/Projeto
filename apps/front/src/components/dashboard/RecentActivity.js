import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { CheckCircle2, MessageCircle, PencilLine } from "lucide-react";
const activityIcons = [CheckCircle2, PencilLine, MessageCircle];
export const RecentActivity = ({ items }) => (_jsxs("article", { className: "dashboard-card dashboard-hover", children: [_jsxs("div", { className: "dashboard-card-header", children: [_jsxs("div", { children: [_jsx("h3", { className: "dashboard-card-title", children: "Atividade Recente" }), _jsx("p", { className: "dashboard-muted", children: "Atualizacoes e entregas recentes" })] }), _jsx("span", { className: "dashboard-link", children: "Ver tudo" })] }), _jsx("div", { className: "dashboard-activity-list", children: items.map((item, index) => {
                const Icon = activityIcons[index % activityIcons.length];
                const author = item.description.split(" ")[0] || "?";
                return (_jsxs("div", { className: "dashboard-activity-item", children: [_jsx("div", { className: "dashboard-activity-avatar", children: author[0]?.toUpperCase() || "?" }), _jsxs("div", { className: "dashboard-activity-body", children: [_jsx("div", { className: "dashboard-activity-text", children: item.description }), _jsx("div", { className: "dashboard-activity-time", children: item.timeAgo })] }), _jsx("div", { className: "dashboard-activity-icon", children: _jsx(Icon, { className: "dashboard-activity-type" }) })] }, item.id));
            }) })] }));
