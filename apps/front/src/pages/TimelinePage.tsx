import { useOutletContext } from "react-router-dom";
import type { DashboardOutletContext } from "../components/DashboardLayout";
import { GanttTimeline } from "../components/DashboardLayout";

const TimelinePage = () => {
  const { ganttTasks, ganttMilestones, ganttError } = useOutletContext<DashboardOutletContext>();

  if (ganttError) {
    return <div className="page-error">{ganttError}</div>;
  }

  return (
    <section className="timeline-page page-card">
      <header className="page-header">
        <h1>Cronograma</h1>
      </header>

      <GanttTimeline tasks={ganttTasks} milestones={ganttMilestones} />
    </section>
  );
};

export default TimelinePage;
