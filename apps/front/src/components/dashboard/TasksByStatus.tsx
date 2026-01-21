import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";

type StatusDatum = {
  name: string;
  value: number;
  color: string;
};

type TasksByStatusProps = {
  data: StatusDatum[];
  total: number;
};

export const TasksByStatus = ({ data, total }: TasksByStatusProps) => {
  const chartTotal = total > 0 ? total : data.reduce((sum, item) => sum + item.value, 0);
  const displayTotal = total;

  return (
    <article className="dashboard-card dashboard-hover">
      <div className="dashboard-card-header">
        <div>
          <h3 className="dashboard-card-title">Tarefas por Status</h3>
          <p className="dashboard-muted">Distribuicao das tarefas</p>
        </div>
      </div>
      <div className="dashboard-status-body">
        <div className="dashboard-status-chart">
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={data} dataKey="value" innerRadius={70} outerRadius={95} paddingAngle={2} stroke="none">
                {data.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="dashboard-chart-center">
            <div className="dashboard-chart-total">{displayTotal}</div>
            <div className="dashboard-muted">Total</div>
          </div>
        </div>
        <div className="dashboard-status-legend">
          {data.map((entry) => {
            const percent = chartTotal > 0 ? Math.round((entry.value / chartTotal) * 100) : 0;
            return (
              <div key={entry.name} className="dashboard-legend-row">
                <span className="dashboard-legend-dot" style={{ background: entry.color }} />
                <span className="dashboard-legend-label">{entry.name}</span>
                <span className="dashboard-legend-value">{percent}%</span>
              </div>
            );
          })}
        </div>
      </div>
    </article>
  );
};
