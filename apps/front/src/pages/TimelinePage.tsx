import { useOutletContext } from "react-router-dom";
import { CalendarRange, CheckCircle2, Flag, Layers } from "lucide-react";
import type { DashboardOutletContext } from "../components/DashboardLayout";
import { AppPageHero, AppStateCard } from "../components/AppPageHero";
import { GanttTimeline } from "../components/DashboardLayout";

const TimelinePage = () => {
  const { ganttTasks, ganttMilestones, ganttError } = useOutletContext<DashboardOutletContext>();
  const tasksCount = ganttTasks?.length ?? 0;
  const milestonesCount = ganttMilestones?.length ?? 0;
  const completedTasksCount =
    ganttTasks?.filter((task: any) => String(task?.status ?? "").toLowerCase().includes("done") || task?.progress === 100).length ?? 0;

  if (ganttError) {
    return <div className="page-error">{ganttError}</div>;
  }

  return (
    <section className="timeline-page page-card">
      <AppPageHero
        className="timelinePageHero"
        kicker="Planejamento"
        title="Cronograma"
        subtitle="Acompanhe a linha do tempo do projeto com tarefas, marcos e progresso consolidado."
        stats={[
          {
            label: "Tarefas",
            value: tasksCount,
            helper: "Itens posicionados na linha do tempo",
            icon: <Layers size={18} />,
            tone: "default"
          },
          {
            label: "Marcos",
            value: milestonesCount,
            helper: "Entregas e pontos de controle",
            icon: <Flag size={18} />,
            tone: "info"
          },
          {
            label: "Concluidas",
            value: completedTasksCount,
            helper: "Tarefas com progresso fechado",
            icon: <CheckCircle2 size={18} />,
            tone: "success"
          },
          {
            label: "Cobertura",
            value: tasksCount || milestonesCount ? "Ativa" : "Vazia",
            helper: tasksCount || milestonesCount ? "Cronograma carregado" : "Aguardando planejamento",
            icon: <CalendarRange size={18} />,
            tone: tasksCount || milestonesCount ? "warning" : "danger"
          }
        ]}
      />

      {tasksCount || milestonesCount ? (
        <GanttTimeline tasks={ganttTasks} milestones={ganttMilestones} />
      ) : (
        <AppStateCard
          tone="warning"
          title="Cronograma ainda nao estruturado"
          description="Cadastre datas e marcos na EAP para gerar a visao temporal completa desta pagina."
        />
      )}
    </section>
  );
};

export default TimelinePage;
