import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type WeeklyDatum = {
  name: string;
  created: number;
  completed: number;
};

type WeeklyProgressProps = {
  data: WeeklyDatum[];
  efficiencyLabel: string;
  period: "weekly" | "monthly" | "quarterly";
  onPeriodChange: (period: "weekly" | "monthly" | "quarterly") => void;
};

const PERIOD_LABELS = {
  weekly: "Semanal",
  monthly: "Mensal",
  quarterly: "Trimestral"
} as const;

export const WeeklyProgress = ({ data, efficiencyLabel, period, onPeriodChange }: WeeklyProgressProps) => (
  <article className="dashboard-card dashboard-hover">
    <div className="dashboard-card-header">
      <div>
        <h3 className="dashboard-card-title">Progresso {PERIOD_LABELS[period]}</h3>
        <p className="dashboard-muted">Tarefas criadas vs concluidas</p>
      </div>
      <div className="dashboard-progress-controls">
        <div className="dashboard-toggle">
          {(Object.keys(PERIOD_LABELS) as Array<keyof typeof PERIOD_LABELS>).map((key) => (
            <button
              key={key}
              type="button"
              className={`dashboard-toggle-button ${period === key ? "is-active" : ""}`}
              onClick={() => onPeriodChange(key)}
            >
              {PERIOD_LABELS[key]}
            </button>
          ))}
        </div>
        <span className="dashboard-badge">{efficiencyLabel}</span>
      </div>
    </div>
    <div className="dashboard-chart">
      <ResponsiveContainer width="100%" height={260}>
        <AreaChart data={data} margin={{ left: 0, right: 8 }}>
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
          <XAxis
            dataKey="name"
            axisLine={false}
            tickLine={false}
            interval={0}
            tickMargin={8}
            padding={{ left: 8, right: 8 }}
          />
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
