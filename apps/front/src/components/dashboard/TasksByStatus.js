import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
export const TasksByStatus = ({ data, total }) => {
    const chartTotal = total > 0 ? total : data.reduce((sum, item) => sum + item.value, 0);
    const displayTotal = total;
    return (_jsxs("article", { className: "dashboard-card dashboard-hover", children: [_jsx("div", { className: "dashboard-card-header", children: _jsxs("div", { children: [_jsx("h3", { className: "dashboard-card-title", children: "Tarefas por Status" }), _jsx("p", { className: "dashboard-muted", children: "Distribuicao das tarefas" })] }) }), _jsxs("div", { className: "dashboard-status-body", children: [_jsxs("div", { className: "dashboard-status-chart", children: [_jsx(ResponsiveContainer, { width: "100%", height: 220, children: _jsx(PieChart, { children: _jsx(Pie, { data: data, dataKey: "value", innerRadius: 70, outerRadius: 95, paddingAngle: 2, stroke: "none", children: data.map((entry) => (_jsx(Cell, { fill: entry.color }, entry.name))) }) }) }), _jsxs("div", { className: "dashboard-chart-center", children: [_jsx("div", { className: "dashboard-chart-total", children: displayTotal }), _jsx("div", { className: "dashboard-muted", children: "Total" })] })] }), _jsx("div", { className: "dashboard-status-legend", children: data.map((entry) => {
                        const percent = chartTotal > 0 ? Math.round((entry.value / chartTotal) * 100) : 0;
                        return (_jsxs("div", { className: "dashboard-legend-row", children: [_jsx("span", { className: "dashboard-legend-dot", style: { background: entry.color } }), _jsx("span", { className: "dashboard-legend-label", children: entry.name }), _jsxs("span", { className: "dashboard-legend-value", children: [percent, "%"] })] }, entry.name));
                    }) })] })] }));
};
