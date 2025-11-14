import {
  Prisma,
  TaskStatus,
  TaskPriority,
  WbsNodeType,
  ProjectStatus,
  MembershipRole,
  ProjectRole,
  OrganizationPlan,
  MilestoneStatus,
  NotificationChannel,
  CommentTargetType,
  DependencyType,
  RiskSeverity,
  RiskProbability
} from "@prisma/client";
import { prisma } from "./index";

async function main() {
  console.log("Seeding base data...");

  const adminUser = await prisma.user.upsert({
    where: { email: "gestor@gp.local" },
    update: { fullName: "Gestor(a) Demo" },
    create: {
      id: "user-gestor",
      email: "gestor@gp.local",
      fullName: "Gestor(a) Demo",
      passwordHash: "demo-hash",
      locale: "pt-BR",
      timezone: "America/Sao_Paulo"
    }
  });

  const organization = await prisma.organization.upsert({
    where: { id: "demo-org" },
    update: {},
    create: {
      id: "demo-org",
      name: "Organizacao Demo",
      slug: "demo",
      domain: "demo.local",
      plan: OrganizationPlan.TEAM,
      timezone: "America/Sao_Paulo"
    }
  });

  await prisma.organizationMembership.upsert({
    where: { id: "membership-demo" },
    update: {},
    create: {
      id: "membership-demo",
      organizationId: organization.id,
      userId: adminUser.id,
      role: MembershipRole.OWNER
    }
  });

  const project = await prisma.project.upsert({
    where: { id: "demo-project" },
    update: {},
    create: {
      id: "demo-project",
      organizationId: organization.id,
      managerId: adminUser.id,
      name: "Implantacao do Sistema",
      code: "GP-001",
      clientName: "Cliente Exemplo",
      description: "Projeto de referencia com WBS completa.",
      status: ProjectStatus.IN_PROGRESS,
      startDate: new Date("2025-01-10T10:00:00.000Z"),
      endDate: new Date("2025-04-30T10:00:00.000Z"),
      budgetPlanned: new Prisma.Decimal(150000),
      boardColumns: {
        create: [
          { id: "col-backlog", label: "Backlog", order: 1, status: TaskStatus.BACKLOG },
          { id: "col-todo", label: "A Fazer", order: 2, status: TaskStatus.TODO, wipLimit: 10 },
          { id: "col-doing", label: "Em andamento", order: 3, status: TaskStatus.IN_PROGRESS, wipLimit: 6 },
          { id: "col-review", label: "Revisao", order: 4, status: TaskStatus.REVIEW, wipLimit: 4 },
          { id: "col-done", label: "Concluido", order: 5, status: TaskStatus.DONE }
        ]
      },
      milestones: {
        create: [
          {
            id: "ms-kickoff",
            name: "Kickoff",
            description: "Apresentacao inicial do projeto",
            dueDate: new Date("2025-01-15T10:00:00.000Z")
          },
          {
            id: "ms-go-live",
            name: "Go Live",
            description: "Publicacao oficial",
            dueDate: new Date("2025-04-15T10:00:00.000Z"),
            status: MilestoneStatus.IN_PROGRESS
          }
        ]
      },
      fieldDefinitions: {
        create: [
          {
            id: "field-risk",
            name: "Nivel de risco",
            type: "select",
            required: false,
            options: { values: ["baixo", "medio", "alto"] }
          }
        ]
      }
    }
  });

  await prisma.projectMember.upsert({
    where: { id: "pm-gestor" },
    update: {},
    create: {
      id: "pm-gestor",
      projectId: project.id,
      userId: adminUser.id,
      role: ProjectRole.MANAGER,
      capacityWeekly: 35
    }
  });

  const phase = await prisma.wbsNode.upsert({
    where: { id: "wbs-phase-planejamento" },
    update: {},
    create: {
      id: "wbs-phase-planejamento",
      projectId: project.id,
      type: WbsNodeType.PHASE,
      level: 0,
      order: 1,
      title: "Planejamento",
      status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.HIGH,
      startDate: new Date("2025-01-10T10:00:00.000Z"),
      endDate: new Date("2025-02-10T10:00:00.000Z")
    }
  });

  const deliverable = await prisma.wbsNode.upsert({
    where: { id: "wbs-deliverable-documentacao" },
    update: {},
    create: {
      id: "wbs-deliverable-documentacao",
      projectId: project.id,
      parentId: phase.id,
      type: WbsNodeType.DELIVERABLE,
      level: 1,
      order: 1,
      title: "Documentacao de Projeto",
      status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.MEDIUM,
      startDate: new Date("2025-01-12T10:00:00.000Z"),
      endDate: new Date("2025-02-05T10:00:00.000Z")
    }
  });

  const task = await prisma.wbsNode.upsert({
    where: { id: "wbs-task-escopo" },
    update: {},
    create: {
      id: "wbs-task-escopo",
      projectId: project.id,
      parentId: deliverable.id,
      type: WbsNodeType.TASK,
      level: 2,
      order: 1,
      title: "Definir escopo detalhado",
      description: "Reunir requisitos, alinhar expectativas e aprovar documento.",
      status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.CRITICAL,
      ownerId: adminUser.id,
      boardColumnId: "col-doing",
      estimateHours: new Prisma.Decimal(24),
      startDate: new Date("2025-01-13T10:00:00.000Z"),
      endDate: new Date("2025-01-20T10:00:00.000Z")
    }
  });

  await prisma.taskDetail.upsert({
    where: { wbsNodeId: task.id },
    update: {},
    create: {
      wbsNodeId: task.id,
      taskType: "analysis",
      storyPoints: 8,
      checklist: [
        { id: "req", label: "Requisitos validados", done: false },
        { id: "approval", label: "Aprovacao cliente", done: false }
      ],
      customFields: { risk: "medio" }
    }
  });

  const subtask = await prisma.wbsNode.upsert({
    where: { id: "wbs-subtask-atas" },
    update: {},
    create: {
      id: "wbs-subtask-atas",
      projectId: project.id,
      parentId: task.id,
      type: WbsNodeType.SUBTASK,
      level: 3,
      order: 1,
      title: "Redigir atas das reunioes",
      status: TaskStatus.TODO,
      priority: TaskPriority.MEDIUM,
      boardColumnId: "col-todo",
      estimateHours: new Prisma.Decimal(8)
    }
  });

  await prisma.dependency.upsert({
    where: { predecessorId_successorId: { predecessorId: task.id, successorId: subtask.id } },
    update: {},
    create: {
      predecessorId: task.id,
      successorId: subtask.id,
      type: DependencyType.FS,
      lagDays: 1
    }
  });

  const tag = await prisma.tag.upsert({
    where: { id: "tag-planejamento" },
    update: {},
    create: {
      id: "tag-planejamento",
      organizationId: organization.id,
      name: "Planejamento",
      color: "#2F80ED"
    }
  });

  await prisma.tagAssignment.upsert({
    where: { id: "tag-assign-task" },
    update: {},
    create: {
      id: "tag-assign-task",
      tagId: tag.id,
      wbsNodeId: task.id
    }
  });

  await prisma.comment.upsert({
    where: { id: "comment-demo" },
    update: {},
    create: {
      id: "comment-demo",
      projectId: project.id,
      targetType: CommentTargetType.WBS_NODE,
      wbsNodeId: task.id,
      authorId: adminUser.id,
      body: "Favor validar o escopo ate sexta-feira.",
      mentions: ["user-gestor"]
    }
  });

  await prisma.risk.upsert({
    where: { id: "risk-escopo" },
    update: {},
    create: {
      id: "risk-escopo",
      projectId: project.id,
      title: "Mudancas de escopo nao controladas",
      severity: RiskSeverity.HIGH,
      probability: RiskProbability.MEDIUM,
      mitigation: "Processo de aprovacao formal",
      ownerId: adminUser.id,
      dueDate: new Date("2025-02-01T10:00:00.000Z")
    }
  });

  await prisma.cost.upsert({
    where: { id: "cost-workshop" },
    update: {},
    create: {
      id: "cost-workshop",
      projectId: project.id,
      category: "Workshops",
      plannedValue: new Prisma.Decimal(5000),
      actualValue: new Prisma.Decimal(4200),
      occurredAt: new Date("2025-01-18T10:00:00.000Z"),
      notes: "Locacao de sala e coffee break"
    }
  });

  await prisma.timeEntry.upsert({
    where: { id: "timeentry-gestor" },
    update: {},
    create: {
      id: "timeentry-gestor",
      projectId: project.id,
      wbsNodeId: task.id,
      userId: adminUser.id,
      entryDate: new Date("2025-01-16T10:00:00.000Z"),
      hours: new Prisma.Decimal(3.5),
      description: "Reuniao de alinhamento com cliente"
    }
  });

  await prisma.notification.upsert({
    where: { id: "notification-demo" },
    update: {},
    create: {
      id: "notification-demo",
      userId: adminUser.id,
      projectId: project.id,
      channel: NotificationChannel.EMAIL,
      template: "task-assigned",
      payload: { taskId: task.id, title: "Definir escopo detalhado" },
      read: false
    }
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
