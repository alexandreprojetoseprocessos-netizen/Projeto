import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useOutletContext } from "react-router-dom";
import { ReportsPanel } from "../components/DashboardLayout";
const ReportsPage = () => {
    const { reportsData, reportsError, reportsLoading } = useOutletContext();
    if (reportsError) {
        return _jsx("div", { className: "page-error", children: reportsError });
    }
    return (_jsxs("section", { className: "reports-page", children: [_jsx("header", { className: "page-header", children: _jsx("h1", { children: "Relat\u00F3rios" }) }), _jsx(ReportsPanel, { metrics: reportsData, metricsError: reportsError ?? null, metricsLoading: Boolean(reportsLoading) })] }));
};
export default ReportsPage;
