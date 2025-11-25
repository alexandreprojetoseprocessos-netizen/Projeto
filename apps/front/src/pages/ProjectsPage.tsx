import { useState, type FormEvent } from "react";
import { useOutletContext } from "react-router-dom";
import { ProjectPortfolio } from "../components/ProjectPortfolio";
import type { DashboardOutletContext } from "../components/DashboardLayout";

type FirstProjectPayload = {
  name: string;
  description?: string;
  startDate?: string;
  endDate?: string;
};

const FirstProjectOnboarding = ({
  onCreateProject
}: {
  onCreateProject: (payload: FirstProjectPayload) => Promise<void> | void;
}) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!name.trim()) return;
    setError(null);
    setIsSubmitting(true);
    try {
      await onCreateProject({
        name: name.trim(),
        description: description.trim() || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined
      });
      setName("");
      setDescription("");
      setStartDate("");
      setEndDate("");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Não foi possível criar o projeto.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="workspace-empty-card workspace-project-onboarding">
      <h2>Passo 2 de 3: Crie seu primeiro projeto</h2>
      <p>
        Agora que sua organização está criada, vamos configurar o primeiro projeto. Você poderá adicionar tarefas,
        equipe, cronograma e relatórios depois.
      </p>

      {error && <p className="error-text">{error}</p>}

      <form className="workspace-form" onSubmit={handleSubmit}>
        <label className="input-group">
          <span>Nome do projeto</span>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Ex.: Implantação do sistema na Clínica X"
            required
          />
        </label>

        <label className="input-group">
          <span>Descrição (opcional)</span>
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Resumo do objetivo do projeto..."
            rows={3}
          />
        </label>

        <div className="workspace-form-row">
          <label className="input-group">
            <span>Data de início (opcional)</span>
            <input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
          </label>
          <label className="input-group">
            <span>Data de término (opcional)</span>
            <input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} />
          </label>
        </div>

        <button className="primary-button" type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Criando..." : "Criar projeto e continuar"}
        </button>
      </form>
    </div>
  );
};

export const ProjectsPage = () => {
  const {
    portfolio,
    portfolioError,
    portfolioLoading,
    onExportPortfolio,
    selectedProjectId,
    onProjectChange,
    onCreateProject
  } = useOutletContext<DashboardOutletContext>();

  const handleCreateFirstProject = async (payload: FirstProjectPayload) => {
    await onCreateProject({
      name: payload.name,
      clientName: payload.description ?? "Cliente",
      budget: 0,
      repositoryUrl: "",
      startDate: payload.startDate,
      endDate: payload.endDate,
      description: payload.description,
      teamMembers: []
    });
  };

  const hasProjects = Boolean(portfolio && portfolio.length > 0);

  return (
    <section className="projects-page">
      <header className="page-header">
        <p className="eyebrow">Portfólio</p>
        <h1>Projetos</h1>
      </header>

      {portfolioLoading ? (
        <p className="muted">Carregando projetos...</p>
      ) : !hasProjects ? (
        <FirstProjectOnboarding onCreateProject={handleCreateFirstProject} />
      ) : (
        <ProjectPortfolio
          projects={portfolio}
          error={portfolioError}
          isLoading={portfolioLoading}
          onExport={onExportPortfolio}
          selectedProjectId={selectedProjectId}
          onSelectProject={onProjectChange}
        />
      )}
    </section>
  );
};
