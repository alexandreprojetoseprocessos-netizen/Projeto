import { useOutletContext } from "react-router-dom";
import type { DashboardOutletContext } from "../components/DashboardLayout";
import { ReportsPanel } from "../components/DashboardLayout";

const ReportsPage = () => {
  const { reportsData, reportsError, reportsLoading } = useOutletContext<DashboardOutletContext>();

  if (reportsError) {
    return <div className="page-error">{reportsError}</div>;
  }

  return (
    <section className="reports-page">
      <header className="page-header">
        <h1>Relatórios</h1>
      </header>

      <ReportsPanel metrics={reportsData} metricsError={reportsError ?? null} metricsLoading={Boolean(reportsLoading)} />
    </section>
  );
};

export default ReportsPage;
