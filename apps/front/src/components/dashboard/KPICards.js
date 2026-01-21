import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export const KPICards = ({ items }) => (_jsx("div", { className: "dashboard-kpi-grid", children: items.map((item) => {
        const Icon = item.icon;
        return (_jsxs("article", { className: `dashboard-card dashboard-kpi-card dashboard-hover tone-${item.tone}`, children: [_jsxs("div", { className: "dashboard-kpi-header", children: [_jsx("span", { className: "dashboard-label", children: item.label }), _jsx("span", { className: "dashboard-kpi-icon", children: _jsx(Icon, { className: "dashboard-kpi-icon-svg" }) })] }), _jsx("div", { className: "dashboard-kpi-value", children: item.value }), _jsxs("div", { className: "dashboard-kpi-meta", children: [_jsx("span", { className: "dashboard-muted", children: item.subLabel }), _jsx("span", { className: "dashboard-kpi-delta", children: item.delta })] })] }, item.label));
    }) }));
