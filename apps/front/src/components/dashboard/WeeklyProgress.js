import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
const PERIOD_LABELS = {
    weekly: "Semanal",
    monthly: "Mensal",
    quarterly: "Trimestral"
};
export const WeeklyProgress = ({ data, efficiencyLabel, period, onPeriodChange }) => (_jsxs("article", { className: "dashboard-card dashboard-hover", children: [_jsxs("div", { className: "dashboard-card-header", children: [_jsxs("div", { children: [_jsxs("h3", { className: "dashboard-card-title", children: ["Progresso ", PERIOD_LABELS[period]] }), _jsx("p", { className: "dashboard-muted", children: "Tarefas criadas vs concluidas" })] }), _jsxs("div", { className: "dashboard-progress-controls", children: [_jsx("div", { className: "dashboard-toggle", children: Object.keys(PERIOD_LABELS).map((key) => (_jsx("button", { type: "button", className: `dashboard-toggle-button ${period === key ? "is-active" : ""}`, onClick: () => onPeriodChange(key), children: PERIOD_LABELS[key] }, key))) }), _jsx("span", { className: "dashboard-badge", children: efficiencyLabel })] })] }), _jsx("div", { className: "dashboard-chart", children: _jsx(ResponsiveContainer, { width: "100%", height: 260, children: _jsxs(AreaChart, { data: data, margin: { left: 0, right: 8 }, children: [_jsxs("defs", { children: [_jsxs("linearGradient", { id: "completedGradient", x1: "0", y1: "0", x2: "0", y2: "1", children: [_jsx("stop", { offset: "5%", stopColor: "#3b82f6", stopOpacity: 0.45 }), _jsx("stop", { offset: "95%", stopColor: "#3b82f6", stopOpacity: 0 })] }), _jsxs("linearGradient", { id: "createdGradient", x1: "0", y1: "0", x2: "0", y2: "1", children: [_jsx("stop", { offset: "5%", stopColor: "#94a3b8", stopOpacity: 0.35 }), _jsx("stop", { offset: "95%", stopColor: "#94a3b8", stopOpacity: 0 })] })] }), _jsx(XAxis, { dataKey: "name", axisLine: false, tickLine: false, interval: 0, tickMargin: 8, padding: { left: 8, right: 8 } }), _jsx(YAxis, { axisLine: false, tickLine: false, width: 24 }), _jsx(Tooltip, { contentStyle: {
                                background: "#fff",
                                borderRadius: 12,
                                borderColor: "rgba(15, 23, 42, 0.08)",
                                boxShadow: "0 10px 24px rgba(15, 23, 42, 0.08)",
                                fontSize: 12
                            } }), _jsx(Area, { type: "monotone", dataKey: "completed", stroke: "#3b82f6", strokeWidth: 2, fill: "url(#completedGradient)" }), _jsx(Area, { type: "monotone", dataKey: "created", stroke: "#94a3b8", strokeWidth: 2, fill: "url(#createdGradient)" })] }) }) })] }));
