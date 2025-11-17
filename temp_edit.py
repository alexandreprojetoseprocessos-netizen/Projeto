# -*- coding: utf-8 -*-
from pathlib import Path
path = Path('apps/front/src/App.tsx')
text = path.read_text(encoding='utf-8')
start = text.index('const LoginView = (')
app_index = text.index('export const App = () => {')
login_block = '''const LoginView = ({
  onSubmit,
  onSignUp,
  error
}: {
  onSubmit: (payload: { email: string; password: string }) => Promise<void>;
  onSignUp: (payload: { email: string; password: string }) => Promise<void>;
  error: string | null;
}) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      if (isRegistering) {
        await onSignUp({ email, password });
      } else {
        await onSubmit({ email, password });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="auth-layout">
      <div className="auth-card">
        <h1>G&P - Gestao de Projetos</h1>
        <p>Use as credenciais do Supabase ou cadastre-se rapidamente.</p>
        {error && <div className="alert">{error}</div>}
        <form onSubmit={handleSubmit}>
          <label>
            Email
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          </label>
          <label>
            Senha
            <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required />
          </label>
          <button type="submit" className="primary-button" disabled={submitting}>
            {submitting ? "Processando..." : isRegistering ? "Cadastrar" : "Entrar"}
          </button>
          <button type="button" className="toggle-button" onClick={() => setIsRegistering((prev) => !prev)}>
            {isRegistering ? "Ja tenho conta" : "Criar nova conta"}
          </button>
        </form>
      </div>
    </main>
  );
};

const KanbanBoard = ({
  columns,
  onDragEnd
}: {
  columns: BoardColumn[];
  onDragEnd: (result: DropResult) => void;
}) => {
  if (!columns.length) return <p>Quadro vazio.</p>;

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div style={{ display: "flex", gap: "1rem", overflowX: "auto" }}>
        {columns.map((column) => (
          <Droppable droppableId={column.id} key={column.id}>
            {(provided) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                style={{
                  minWidth: "220px",
                  background: "#f7f7f8",
                  borderRadius: "8px",
                  padding: "0.75rem"
                }}
              >
                <div style={{ marginBottom: "0.5rem" }}>
                  <strong>{column.label}</strong>{" "}
                  {column.wipLimit ? (
                    <small>
                      ({column.tasks.length}/{column.wipLimit})
                    </small>
                  ) : null}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {column.tasks.length === 0 && <span style={{ color: "#777" }}>Sem tarefas</span>}
                  {column.tasks.map((task, index) => (
                    <Draggable draggableId={task.id} index={index} key={task.id}>
                      {(dragProvided, snapshot) => (
                        <article
                          ref={dragProvided.innerRef}
                          {...dragProvided.draggableProps}
                          {...dragProvided.dragHandleProps}
                          style={{
                            background: snapshot.isDragging ? "#e0d7ff" : "#fff",
                            borderRadius: "6px",
                            padding: "0.5rem",
                            boxShadow: "0 1px 2px rgba(0,0,0,0.08)",
                            ...dragProvided.draggableProps.style
                          }}
                        >
                          <strong>{task.title}</strong>
                          <div style={{ fontSize: "0.85rem" }}>
                            <span>Status: {task.status}</span>
                            {task.priority && (
                              <>
                                {" "}
                                · <span>Prioridade: {task.priority}</span>
                              </>
                            )}
                          </div>
                        </article>
                      )}
                    </Draggable>
                  ))}
                </div>
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        ))}
      </div>
    </DragDropContext>
  );
};

const WbsTreeView = ({
  nodes,
  onMove
}: {
  nodes: WbsTreeNode[];
  onMove: (nodeId: string, parentId: string | null, order: number) => void;
}) => {
  if (!nodes.length) return <p>Nenhum item cadastrado.</p>;

  const treeNodes: NodeModel<WbsTreeNode>[] = flattenNodes(nodes).map((node) => ({
    id: node.id,
    parent: node.parentId ?? 0,
    text: node.title,
    droppable: true,
    data: node
  }));

  return (
    <Tree
      tree={treeNodes}
      rootId={0}
      onDrop={(_, options) => {
        const nodeId = options.dragSource?.id as string | undefined;
        if (!nodeId) return;
        const parentId =
          options.dropTarget?.id && options.dropTarget.id !== 0 ? (options.dropTarget.id as string) : null;
        onMove(nodeId, parentId, options.destinationIndex ?? 0);
      }}
      render={(node) => (
        <div style={{ padding: "0.25rem 0" }}>
          <strong>{node.data?.title}</strong> — {node.data?.type} ({node.data?.status})
        </div>
      )}
    />
  );
};

const GanttTimeline = ({
  tasks,
  milestones
}: {
  tasks: GanttTask[];
  milestones: GanttMilestone[];
}) => {
  if (!tasks.length) return <p>Nenhuma tarefa com datas definidas.</p>;
  const allDates = [
    ...tasks.flatMap((task) => [task.startDate, task.endDate]),
    ...milestones.map((milestone) => milestone.dueDate)
  ]
    .filter(Boolean)
    .map((value) => new Date(value as string));

  const minDate = allDates.reduce((acc, date) => (acc.getTime() > date.getTime() ? date : acc), allDates[0]);
  const maxDate = allDates.reduce((acc, date) => (acc.getTime() < date.getTime() ? date : acc), allDates[0]);
  const totalDays = Math.max(1, (maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24));

  const offsetPercent = (value?: string | null) => {
    if (!value) return 0;
    const diff = new Date(value).getTime() - minDate.getTime();
    return Math.max(0, (diff / (1000 * 60 * 60 * 24)) / totalDays) * 100;
  };

  const widthPercent = (start?: string | null, end?: string | null) => {
    if (!start || !end) return 5;
    const diff = new Date(end).getTime() - new Date(start).getTime();
    return Math.max(5, (diff / (1000 * 60 * 60 * 24)) / totalDays * 100);
  };

  return (
    <div style={{ border: "1px solid #e1e1e6", borderRadius: "8px", padding: "1rem" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        {tasks.map((task) => (
          <div key={task.id}>
            <div style={{ fontSize: "0.9rem" }}>
              <strong>{task.title}</strong> — {task.status}
            </div>
            <div style={{ position: "relative", height: "18px", background: "#f0f0f5", borderRadius: "4px" }}>
              <span
                style={{
                  position: "absolute",
                  left: `${offsetPercent(task.startDate)}%`,
                  width: `${widthPercent(task.startDate, task.endDate)}%`,
                  background: "#7c3aed",
                  height: "100%",
                  borderRadius: "4px"
                }}
              />
            </div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: "1rem", fontSize: "0.9rem" }}>
        <strong>Marcos:</strong>{" "}
        {milestones.length
          ? milestones.map((milestone) => `${milestone.name} (${formatDate(milestone.dueDate)})`).join(", ")
          : "Nenhum marco"}
      </div>
    </div>
  );
};

const CommentsPanel = ({ comments, error }: { comments: Comment[]; error: string | null }) => {
  if (error) return <div className="alert">{error}</div>;
  if (!comments.length) return <p className="empty-state">Nenhum comentario para o item selecionado.</p>;
  return (
    <ul className="comments-list">
      {comments.map((comment) => (
        <li key={comment.id}>
          <p>{comment.body}</p>
          <small>
            {comment.author.name} • {formatDate(comment.createdAt)}
          </small>
        </li>
      ))}
    </ul>
  );
};

'''
text = text[:start] + login_block + text[app_index:]
path.write_text(text, encoding='utf-8')
