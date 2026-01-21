import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type WeeklyDatum = {
  name: string;
  created: number;
  completed: number;
};

type WeeklyProgressProps = {
  data: WeeklyDatum[];
  efficiencyLabel: string;
};

export const WeeklyProgress = ({ data, efficiencyLabel }: WeeklyProgressProps) => (
  <article className="dashboard-card dashboard-hover">
    <div className="dashboard-card-header">
      <div>
        <h3 className="dashboard-card-title">Progresso Semanal</h3>
        <p className="dashboard-muted">Tarefas criadas vs concluidas</p>
      </div>
      <span className="dashboard-badge">{efficiencyLabel}</span>
    </div>
    <div className="dashboard-chart">
      <ResponsiveContainer width="100%" height={260}>
        <AreaChart data={data} margin={{ left: -16, right: 8 }}>
          <defs>
            <linearGradient id="completedGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.45} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="createdGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.35} />
              <stop offset="95%" stopColor="#94a3b8" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="name" axisLine={false} tickLine={false} />
          <YAxis axisLine={false} tickLine={false} width={24} />
          <Tooltip
            contentStyle={{
              background: "#fff",
              borderRadius: 12,
              borderColor: "rgba(15, 23, 42, 0.08)",
              boxShadow: "0 10px 24px rgba(15, 23, 42, 0.08)",
              fontSize: 12
            }}
          />
          <Area
            type="monotone"
            dataKey="completed"
            stroke="#3b82f6"
            strokeWidth={2}
            fill="url(#completedGradient)"
          />
          <Area type="monotone" dataKey="created" stroke="#94a3b8" strokeWidth={2} fill="url(#createdGradient)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  </article>
);
