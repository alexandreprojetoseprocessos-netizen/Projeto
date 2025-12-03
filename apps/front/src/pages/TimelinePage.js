import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useOutletContext } from "react-router-dom";
import { GanttTimeline } from "../components/DashboardLayout";
const TimelinePage = () => {
    const { ganttTasks, ganttMilestones, ganttError } = useOutletContext();
    if (ganttError) {
        return _jsx("div", { className: "page-error", children: ganttError });
    }
    return (_jsxs("section", { className: "timeline-page page-card", children: [_jsx("header", { className: "page-header", children: _jsx("h1", { children: "Cronograma" }) }), _jsx(GanttTimeline, { tasks: ganttTasks, milestones: ganttMilestones })] }));
};
export default TimelinePage;
