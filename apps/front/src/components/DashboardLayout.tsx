import type { DropResult } from "@hello-pangea/dnd";

import { NavLink, Outlet, useLocation, useNavigate, useOutletContext } from "react-router-dom";
import { createPortal } from "react-dom";

import { useAuth } from "../contexts/AuthContext";
import { apiRequest, getApiErrorMessage } from "../config/api";

import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Legend, BarChart, Bar } from "recharts";

import {

  Fragment,

  useEffect,

  useMemo,

  useState,

  useCallback,

  useRef,

  type FormEvent,

  type MouseEvent,

  type CSSProperties,

  type SVGProps,

  type KeyboardEvent as ReactKeyboardEvent,

  type ReactNode,

  type HTMLAttributes

} from "react";
import { LogOut, Search } from "lucide-react";

import { DndContext, closestCenter, type DragEndEvent } from "@dnd-kit/core";
import { normalizeStatus, STATUS_ORDER, type Status } from "../utils/status";
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import clsx from "clsx";
import { DependenciesDropdown, type DependencyOption } from "./DependenciesDropdown";
import { CleanDatePicker } from "./CleanDatePicker";
import type { PortfolioProject } from "./ProjectPortfolio";
import { normalizeModulePermissionsForRole, type ModulePermissionKey } from "./permissions";

import {

  KanbanBoard as CustomKanbanBoard,

  type KanbanColumn

} from "./KanbanBoard";





const formatDate = (value?: string | null) => {



  if (!value) return "N/A";



  return new Date(value).toLocaleDateString("pt-BR");



};







type IconProps = SVGProps<SVGSVGElement>;



type KPIIcon = (props: IconProps) => JSX.Element;







const svgStrokeProps = {



  fill: "none",



  stroke: "currentColor",



  strokeWidth: 1.8,



  strokeLinecap: "round",



  strokeLinejoin: "round"



} as const;








const BudgetIcon: KPIIcon = (props) => (
  <svg viewBox="0 0 24 24" {...svgStrokeProps} {...props}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5v9" />
    <path d="M15 9.5c0-1.1-1.3-2-3-2s-3 .9-3 2 1.3 2 3 2 3 .9 3 2-1.3 2-3 2-3-.9-3-2" />
  </svg>
);

const LayoutColumnsIcon: KPIIcon = (props) => (
  <svg viewBox="0 0 24 24" {...svgStrokeProps} {...props}>
    <rect x="3" y="4" width="7" height="16" rx="2" />
    <rect x="14" y="4" width="7" height="16" rx="2" />
  </svg>
);

const ProjectFolderIcon: KPIIcon = (props) => (
  <svg viewBox="0 0 24 24" {...svgStrokeProps} {...props}>
    <path d="M4 6h6l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Z" />
  </svg>
);

const TreeIcon: KPIIcon = (props) => (
  <svg viewBox="0 0 24 24" {...svgStrokeProps} {...props}>
    <circle cx="6" cy="6" r="2" />
    <circle cx="18" cy="6" r="2" />
    <circle cx="12" cy="18" r="2" />
    <path d="M8 6h8" />
    <path d="M12 8v6" />
  </svg>
);

const CollapseAllIcon: KPIIcon = (props) => (
  <svg viewBox="0 0 24 24" {...svgStrokeProps} {...props}>
    <path d="m7 14 5-5 5 5" />
    <path d="m7 20 5-5 5 5" />
  </svg>
);

const ExpandAllIcon: KPIIcon = (props) => (
  <svg viewBox="0 0 24 24" {...svgStrokeProps} {...props}>
    <path d="m7 4 5 5 5-5" />
    <path d="m7 10 5 5 5-5" />
  </svg>
);

const CalendarSmallIcon: KPIIcon = (props) => (
  <svg viewBox="0 0 24 24" {...svgStrokeProps} {...props}>
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <path d="M16 2v4" />
    <path d="M8 2v4" />
    <path d="M3 10h18" />
  </svg>
);

const ReportIcon: KPIIcon = (props) => (
  <svg viewBox="0 0 24 24" {...svgStrokeProps} {...props}>
    <rect x="4" y="4" width="16" height="16" rx="2" />
    <path d="M8 16v-5" />
    <path d="M12 16v-8" />
    <path d="M16 16v-3" />
  </svg>
);

const PlanIcon: KPIIcon = (props) => (
  <svg viewBox="0 0 24 24" {...svgStrokeProps} {...props}>
    <rect x="3" y="7" width="18" height="12" rx="2" />
    <path d="M3 11h18" />
    <path d="M7 15h4" />
  </svg>
);




















function SortableRow({

  id,

  children,

  dragDisabled,

  className,

  ...rest

}: {

  id: string;

  children: (props: {

    attributes: Record<string, unknown>;

    listeners: Record<string, unknown>;

    isDragging: boolean;

  }) => ReactNode;

  dragDisabled?: boolean;

  className?: string;

} & Omit<HTMLAttributes<HTMLTableRowElement>, "children">) {



  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({

    id,

    disabled: !!dragDisabled

  });



  const style: CSSProperties = {



    transform: CSS.Transform.toString(transform),



    transition



  };



  return (



    <tr

      ref={setNodeRef}

      style={style}

      className={clsx(className, isDragging ? "wbs-row-dragging" : "")}

      {...rest}

    >

      {children({
        attributes: (attributes ?? {}) as unknown as Record<string, unknown>,
        listeners: (listeners ?? {}) as unknown as Record<string, unknown>,
        isDragging
      })}

    </tr>



  );



}














const UsersIcon: KPIIcon = (props) => (



  <svg viewBox="0 0 24 24" {...svgStrokeProps} {...props}>



    <circle cx="9" cy="7" r="4" />



    <path d="M17 11a4 4 0 1 0-3.36-6.17" />



    <path d="M2 21v-1a6 6 0 0 1 6-6h2a6 6 0 0 1 6 6v1" />



    <path d="M17 21v-1.5a4.5 4.5 0 0 0-2-3.74" />



  </svg>



);

















export const FileIcon: KPIIcon = (props) => (

  <svg viewBox="0 0 24 24" {...svgStrokeProps} {...props}>

    <path d="M8 3h5l5 5v11a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" />

    <path d="M13 3v4a1 1 0 0 0 1 1h4" />

  </svg>

);



const CommentIcon: KPIIcon = (props) => (

  <svg viewBox="0 0 24 24" {...svgStrokeProps} {...props}>

    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9H12a8.5 8.5 0 0 1 9 8.5Z" />

  </svg>

);



const InsightIcon: KPIIcon = (props) => (

  <svg viewBox="0 0 24 24" {...svgStrokeProps} {...props}>

    <path d="M12 2v3" />

    <path d="m16.2 7 2.1-2.1" />

    <path d="M22 12h-3" />

    <path d="m16.2 17 2.1 2.1" />

    <path d="M12 19v3" />

    <path d="m7.8 17-2.1 2.1" />

    <path d="M5 12H2" />

    <path d="M7.8 7 5.7 4.9" />

    <circle cx="12" cy="12" r="4" />

  </svg>

);



const BuildingIcon: KPIIcon = (props) => (

  <svg viewBox="0 0 24 24" {...svgStrokeProps} {...props}>

    <rect x="3" y="3" width="18" height="18" rx="2" />

    <path d="M9 3v18" />

    <path d="M15 3v18" />

    <path d="M3 9h6" />

    <path d="M3 15h6" />

    <path d="M15 9h6" />

    <path d="M15 15h6" />

  </svg>

);












const MenuDotsIcon: KPIIcon = (props) => (

  <svg viewBox="0 0 24 24" {...svgStrokeProps} strokeWidth={2.4} {...props}>

    <circle cx="5" cy="12" r="1.5" />

    <circle cx="12" cy="12" r="1.5" />

    <circle cx="19" cy="12" r="1.5" />

  </svg>

);



const sidebarNavigation = [
  { id: "organizacao", label: "Organizações", icon: BuildingIcon, path: "/organizacao" },
  { id: "dashboard", label: "Dashboard", icon: InsightIcon, path: "/dashboard" },
  { id: "projects", label: "Projetos", icon: ProjectFolderIcon, path: "/projects" },
  { id: "edt", label: "EAP", icon: TreeIcon, path: "/EAP" },
  { id: "board", label: "Kanban", icon: LayoutColumnsIcon, path: "/kanban" },
  { id: "cronograma", label: "Cronograma", icon: CalendarSmallIcon, path: "/cronograma" },
  { id: "diagrama", label: "Diagrama", icon: MenuDotsIcon, path: "/diagrama" },
  { id: "atividades", label: "Orçamento", icon: BudgetIcon, path: "/atividades" },
  { id: "documentos", label: "Documentos", icon: FileIcon, path: "/documentos" },
  { id: "relatorios", label: "Relatórios", icon: ReportIcon, path: "/relatorios" },
  { id: "equipe", label: "Equipes", icon: UsersIcon, path: "/equipe" },
  { id: "plano", label: "Meu plano", icon: PlanIcon, path: "/plano" }
];

const sidebarModuleById: Record<string, ModulePermissionKey> = {
  organizacao: "organization",
  dashboard: "dashboard",
  projects: "projects",
  edt: "eap",
  board: "kanban",
  cronograma: "timeline",
  diagrama: "diagram",
  atividades: "budget",
  documentos: "documents",
  relatorios: "reports",
  equipe: "team",
  plano: "plan"
};

const moduleLabelByKey: Record<ModulePermissionKey, string> = {
  organization: "Organizações",
  dashboard: "Dashboard",
  projects: "Projetos",
  eap: "EAP",
  kanban: "Kanban",
  timeline: "Cronograma",
  diagram: "Diagrama",
  budget: "Orçamento",
  documents: "Documentos",
  reports: "Relatórios",
  team: "Equipes",
  plan: "Meu plano"
};

const resolveModuleFromPath = (pathname: string): ModulePermissionKey | null => {
  const path = pathname.toLowerCase();
  if (!path || path === "/") return null;

  if (/^\/projects\/[^/]+\/edt(?:\/|$)/.test(path)) return "eap";
  if (/^\/projects\/[^/]+\/board(?:\/|$)/.test(path)) return "kanban";
  if (/^\/projects\/[^/]+\/cronograma(?:\/|$)/.test(path)) return "timeline";
  if (/^\/projects\/[^/]+\/documentos(?:\/|$)/.test(path)) return "documents";
  if (/^\/projects\/[^/]+\/atividades(?:\/|$)/.test(path)) return "budget";
  if (path === "/projects" || path.startsWith("/projects/")) return "projects";
  if (path === "/organizacao" || path.startsWith("/organizacao/")) return "organization";
  if (path === "/dashboard" || path.startsWith("/dashboard/")) return "dashboard";
  if (path === "/eap" || path.startsWith("/eap/") || path === "/edt" || path.startsWith("/edt/")) return "eap";
  if (path === "/board" || path.startsWith("/board/") || path === "/kanban" || path.startsWith("/kanban/")) return "kanban";
  if (path === "/cronograma" || path.startsWith("/cronograma/")) return "timeline";
  if (path === "/diagrama" || path.startsWith("/diagrama/")) return "diagram";
  if (path === "/atividades" || path.startsWith("/atividades/")) return "budget";
  if (path === "/documentos" || path.startsWith("/documentos/")) return "documents";
  if (path === "/relatorios" || path.startsWith("/relatorios/")) return "reports";
  if (path === "/equipe" || path.startsWith("/equipe/")) return "team";
  if (path === "/plano" || path.startsWith("/plano/") || path === "/checkout" || path.startsWith("/checkout/")) return "plan";

  return null;
};





type EmptyStateCardProps = {

  icon: KPIIcon;

  title: string;

  description: string;

  actionLabel?: string;

  onAction?: () => void;

};



export const EmptyStateCard = ({ icon: Icon, title, description, actionLabel, onAction }: EmptyStateCardProps) => (

  <article className="empty-state-card">

    <div className="empty-state-card__icon">

      <Icon width={32} height={32} />

    </div>

    <div className="empty-state-card__body">

      <h4>{title}</h4>

      <p>{description}</p>

    </div>

    {actionLabel ? (

      <button type="button" className="primary-button empty-state-card__cta" onClick={onAction}>

        {actionLabel}

      </button>

    ) : null}

  </article>

);





export type ProjectStatusValue = "PLANNED" | "IN_PROGRESS" | "ON_HOLD" | "COMPLETED" | "CANCELED";
export type ProjectPriorityValue = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type CreateProjectPayload = {



  name: string;



  clientName: string;



  budget: number;



  repositoryUrl?: string;



  startDate?: string;



  endDate?: string;



  description?: string;



  teamMembers: string[];
  status?: ProjectStatusValue;
  priority?: ProjectPriorityValue;



};







type TemplateTreeNode = {



  id: string;



  title: string;



  children?: TemplateTreeNode[];



};







type TemplateCustomField = {



  id: string;



  label: string;



  type: "text" | "number" | "date" | "select";



  required?: boolean;



};







export type TemplateNodeInput = {



  id?: string;



  title: string;



  children?: TemplateNodeInput[];



};







export type TemplateCustomFieldInput = {



  id?: string;



  label: string;



  type: "text" | "number" | "date" | "select";



  required?: boolean;



};







export type TemplateEditorPayload = {



  name: string;



  type: string;



  clientName?: string;



  repositoryUrl?: string;



  budget?: number;



  columns: string[];



  wbs: TemplateNodeInput[];



  customFields: TemplateCustomFieldInput[];



};







type TemplateSummary = {



  id: string;



  name: string;



  type: string;



  clientName?: string | null;



  repositoryUrl?: string | null;



  budget?: number | null;



  columns?: string[];



  wbs?: TemplateNodeInput[];



  customFields?: TemplateCustomFieldInput[];



  updatedAt?: string | null;



};







type Organization = { id: string; name: string; role: string; plan?: string | null; modulePermissions?: unknown };



type Project = { id: string; name: string };







const createEmptyProjectForm = () => ({



  name: "",



  clientName: "",



  budget: "",



  repositoryUrl: "",



  startDate: "",



  endDate: "",



  description: "",



  teamMembers: ""



});







type DashboardLayoutProps = {



  userEmail: string | null;



  organizations: Organization[];



  selectedOrganizationId: string;



  onOrganizationChange: (organizationId: string) => void;



  currentOrgRole?: string | null;
  currentOrgModulePermissions?: unknown;



  orgError: string | null;



  onSignOut: () => void;



  projects: Project[];



  selectedProjectId: string | null;



  onProjectChange: (projectId: string) => void;



  onSelectProject: (projectId: string) => void;

  projectLimits: {
    planCode: string | null;
    max: number | null;
    used: number;
    remaining: number | null;
  } | null;



  projectsError: string | null;



  filters: { rangeDays: number };



  onRangeChange: (rangeDays: number) => void;



  summary: any | null;



  summaryError: string | null;



  members: any[];



  membersError: string | null;



  attachments: any[];



  attachmentsError: string | null;



  attachmentsLoading: boolean;



  reportMetrics: any | null;



  reportMetricsError: string | null;



  reportMetricsLoading: boolean;

  boardColumns: any[];

  kanbanColumns: KanbanColumn[];

  boardError: string | null;

  onCreateTask: (event: FormEvent<HTMLFormElement>) => Promise<boolean>;



  onReloadBoard?: () => Promise<void>;



  onDragTask: (result: DropResult) => void;



  newTaskTitle: string;



  onTaskTitleChange: (value: string) => void;



  newTaskColumn: string;



  onTaskColumnChange: (value: string) => void;



  newTaskStartDate: string;



  onTaskStartDateChange: (value: string) => void;



  newTaskEndDate: string;



  onTaskEndDateChange: (value: string) => void;



  newTaskAssignee: string;



  onTaskAssigneeChange: (value: string) => void;



  newTaskEstimateHours: string;



  onTaskEstimateHoursChange: (value: string) => void;



  wbsNodes: any[];



  wbsError: string | null;
  serviceCatalog: Array<{
    id: string;
    name: string;
    description?: string | null;
    hoursBase?: number | null;
    hours?: number | null;
  }>;
  serviceCatalogError?: string | null;
  onImportServiceCatalog?: (file: File | null) => Promise<any>;
  onCreateServiceCatalog?: (payload: { name: string; hoursBase: number; description?: string | null }) => Promise<any>;
  onUpdateServiceCatalog?: (
    serviceId: string,
    payload: { name?: string; hoursBase?: number; description?: string | null }
  ) => Promise<any>;
  onDeleteServiceCatalog?: (serviceId: string) => Promise<any>;

  onReloadWbs: () => void;

  onMoveNode: (id: string, parentId: string | null, position: number) => void;



  onUpdateWbsNode: (



    nodeId: string,



    changes: {



      title?: string;



      status?: string;



      priority?: string;



      startDate?: string | null;



      endDate?: string | null;



      estimateHours?: number | null;



      dependencies?: string[];



    }



  ) => void;



  onUpdateWbsResponsible: (nodeId: string, membershipId: string | null) => void;

  onCreateWbsItem?: (parentId: string | null, data?: Record<string, any>) => Promise<void> | void;



  selectedNodeId: string | null;



  onSelectNode: (nodeId: string | null) => void;



  comments: any[];



  commentsError: string | null;



  onSubmitComment: (event: FormEvent<HTMLFormElement>) => void;



  commentBody: string;



  onCommentBodyChange: (value: string) => void;



  timeEntryDate: string;



  timeEntryHours: string;



  timeEntryDescription: string;



  timeEntryError: string | null;



  onTimeEntryDateChange: (value: string) => void;



  onTimeEntryHoursChange: (value: string) => void;



  onTimeEntryDescriptionChange: (value: string) => void;



  onLogTime: (event: FormEvent<HTMLFormElement>) => void;



  ganttTasks: any[];



  ganttMilestones: any[];



  ganttError: string | null;



  portfolio: PortfolioProject[];



  portfolioError: string | null;



  portfolioLoading: boolean;



  onExportPortfolio?: () => void;

  onReloadPortfolio?: () => void;



  onCreateProject: (payload: CreateProjectPayload) => Promise<void>;



  onUpdateProject: (projectId: string, payload: CreateProjectPayload) => Promise<void>;



};











export type DashboardOutletContext = {
  organizations: Organization[];
  selectedOrganizationId: string;
  onOrganizationChange: (organizationId: string) => void;
  currentOrgRole?: string | null;
  currentOrgModulePermissions?: unknown;
  projects: Project[];
  selectedProjectId: string | null;
  onProjectChange: (projectId: string) => void;
  onSelectProject: (projectId: string) => void;
  projectLimits: {
    planCode: string | null;
    max: number | null;
    used: number;
    remaining: number | null;
  } | null;
  selectedProject: PortfolioProject | null;
  projectMeta: PortfolioProject | null;
  projectLoading: boolean;
  projectError: string | null;
  projectWbsNodes?: any[];
  projectWbsError?: string | null;
  projectWbsLoading?: boolean;
  onCreateProjectWbsItem?: (payload: any) => void;
  onUpdateProjectWbsItem?: (nodeId: string, changes: any) => void;
  onDeleteProjectWbsItem?: (nodeId: string) => void;
  onRestoreProjectWbsItem?: (nodeId: string) => void;
  projectDependencyOptions?: any[];
  onUpdateProjectDependency?: (nodeId: string, dependencies: string[] | null) => void;
  onSignOut: () => void;
  handleOpenProjectModal: () => void;
  handleOpenEditProjectModal: () => void;
  handleOpenTaskModal: () => void;
  onCreateProject: (payload: CreateProjectPayload) => Promise<void>;
  onUpdateProject: (projectId: string, payload: CreateProjectPayload) => Promise<void>;
  portfolio: PortfolioProject[];
  portfolioError: string | null;
  portfolioLoading: boolean;
  onExportPortfolio?: () => void;
  onReloadPortfolio?: () => void;
  handleViewProjectDetails: (projectId: string) => void;
  kanbanColumns: KanbanColumn[];
  summary: any | null;
  summaryError: string | null;
  filters: { rangeDays: number };
  onRangeChange: (rangeDays: number) => void;
  myTasks: any[];
  members: any[];
  membersError: string | null;
  attachments: any[];
  attachmentsError: string | null;
  attachmentsLoading: boolean;
  reportMetrics: any | null;
  reportMetricsError: string | null;
  reportMetricsLoading: boolean;
  reportsData?: any | null;
  reportsError?: string | null;
  reportsLoading?: boolean;
  boardColumns: any[];
  boardError: string | null;
  onCreateTask: (event: FormEvent<HTMLFormElement>) => Promise<boolean>;
  onReloadBoard?: () => Promise<void>;
  onDragTask: (result: DropResult) => void;
  newTaskTitle: string;
  onTaskTitleChange: (value: string) => void;
  newTaskColumn: string;
  onTaskColumnChange: (value: string) => void;
  projectBoardColumns?: KanbanColumn[];
  projectBoardError?: string | null;
  onMoveProjectTask?: (result: DropResult) => void;
  onCreateProjectTask?: (event: FormEvent<HTMLFormElement>) => Promise<boolean>;
  onReloadProjectBoard?: () => Promise<void>;
  newProjectTaskTitle?: string;
  onProjectTaskTitleChange?: (value: string) => void;
  newProjectTaskColumn?: string;
  onProjectTaskColumnChange?: (value: string) => void;
  newTaskStartDate: string;
  onTaskStartDateChange: (value: string) => void;
  newTaskEndDate: string;
  onTaskEndDateChange: (value: string) => void;
  newTaskAssignee: string;
  onTaskAssigneeChange: (value: string) => void;
  newTaskEstimateHours: string;
  onTaskEstimateHoursChange: (value: string) => void;
  wbsNodes: any[];
  wbsError: string | null;
  serviceCatalog: Array<{
    id: string;
    name: string;
    description?: string | null;
    hoursBase?: number | null;
    hours?: number | null;
  }>;
  serviceCatalogError?: string | null;
  onImportServiceCatalog?: (file: File | null) => Promise<any>;
  onCreateServiceCatalog?: (payload: { name: string; hoursBase: number; description?: string | null }) => Promise<any>;
  onUpdateServiceCatalog?: (
    serviceId: string,
    payload: { name?: string; hoursBase?: number; description?: string | null }
  ) => Promise<any>;
  onDeleteServiceCatalog?: (serviceId: string) => Promise<any>;
  onReloadWbs: () => void;
  onMoveNode: (id: string, parentId: string | null, position: number) => void;
  onUpdateWbsNode: (
    nodeId: string,
    changes: {
      title?: string;
      status?: string;
      priority?: string;
      startDate?: string | null;
      endDate?: string | null;
      description?: string | null;
      estimateHours?: number | null;
      dependencies?: string[];
      serviceCatalogId?: string | null;
      serviceMultiplier?: number | null;
      serviceHours?: number | null;
    }
  ) => void;
  onUpdateWbsResponsible: (nodeId: string, membershipId: string | null) => void;
  wbsLoading?: boolean;
  onCreateWbsItem?: (parentId: string | null, data?: Record<string, any>) => void;
  onDeleteWbsItem?: (nodeId: string) => void;
  onRestoreWbsItem?: (nodeId: string) => void;
  onUpdateDependency?: (nodeId: string, dependencies: string[]) => void;
  dependencyOptions?: any[];
  projectTimelineData?: any;
  projectTimelineLoading?: boolean;
  projectTimelineError?: string | null;
  onUpdateProjectTimelineItem?: (id: string, changes: any) => void;
  onChangeProjectTimelineDate?: (id: string, startDate: Date | string, endDate: Date | string) => void;
  projectActivities?: any[];
  projectActivitiesLoading?: boolean;
  projectActivitiesError?: string | null;
  projectDocuments?: any[];
  projectDocumentsLoading?: boolean;
  projectDocumentsError?: string | null;
  onUploadProjectDocument?: (file: File | null) => void;
  onDeleteProjectDocument?: (id: string) => void;
  onDownloadProjectDocument?: (id: string) => void;
  selectedNodeId: string | null;
  onSelectNode: (nodeId: string | null) => void;
  comments: any[];
  commentsError: string | null;
  onSubmitComment: (event: FormEvent<HTMLFormElement>) => void;
  commentBody: string;
  onCommentBodyChange: (value: string) => void;
  timeEntryDate: string;
  timeEntryHours: string;
  timeEntryDescription: string;
  timeEntryError: string | null;
  onTimeEntryDateChange: (value: string) => void;
  onTimeEntryHoursChange: (value: string) => void;
  onTimeEntryDescriptionChange: (value: string) => void;
  onLogTime: (event: FormEvent<HTMLFormElement>) => void;
  ganttTasks: any[];
  ganttMilestones: any[];
  ganttError: string | null;
  projectToast: string | null;
  orgError: string | null;
  projectsError: string | null;
};












const FolderIcon = () => (



  <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">



    <path



      d="M3 7.5a2.5 2.5 0 012.5-2.5H10l2.3 2.3c.3.3.7.5 1.1.5h7.1A1.5 1.5 0 0122 8.8v8.2A3 3 0 0119 20H5a3 3 0 01-3-3Z"



      fill="currentColor"



      opacity="0.15"



    />



    <path



      d="M4.5 6H10a2 2 0 011.4.6l1.2 1.3c.4.4.9.6 1.4.6h5.7A1.5 1.5 0 0120 10v7a3.5 3.5 0 01-3.5 3.5h-11A3.5 3.5 0 012 17V9.5A3.5 3.5 0 015.5 6Z"



      fill="none"



      stroke="currentColor"



      strokeWidth="1.5"



      strokeLinejoin="round"



    />



  </svg>



);







const TaskIcon = () => (



  <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">



    <rect x="4" y="6" width="16" height="12" rx="2" ry="2" fill="none" stroke="currentColor" strokeWidth="1.5" />



    <path d="M8 10h8M8 14h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />



  </svg>



);














const DetailsIcon = () => (



  <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">



    <path



      d="M5 4h14a1 1 0 011 1v14a1 1 0 01-1 1H5a1 1 0 01-1-1V5a1 1 0 011-1zm7 4v6m0-6V8m0 0h.01M7 12h4m-4 4h10"



      fill="none"



      stroke="currentColor"



      strokeWidth="1.5"



      strokeLinecap="round"



      strokeLinejoin="round"



    />



  </svg>



);



const ChatIcon = () => (



  <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">



    <path



      d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5A8.5 8.5 0 0 1 21 11.5Z"



      fill="none"



      stroke="currentColor"



      strokeWidth="1.6"



    />



  </svg>



);







type StatusTone = "success" | "info" | "neutral" | "danger" | "warning";

const STATUS_TONE: Record<Status, StatusTone> = {
  "Não iniciado": "neutral",
  "Em andamento": "info",
  "Em atraso": "danger",
  "Em risco": "warning",
  "Homologação": "info",
  "Finalizado": "success",
};

const STATUS_CLASS: Record<string, string> = {
  "Não iniciado": "bg-slate-200 text-slate-700 border-slate-300 font-semibold",
  "Em andamento": "bg-blue-500 text-white border-blue-500 font-semibold",
  "Em atraso": "bg-red-500 text-white border-red-500 font-semibold",
  "Em risco": "bg-amber-400 text-white border-amber-400 font-semibold",
  "Homologação": "bg-indigo-500 text-white border-indigo-500 font-semibold",
  "Finalizado": "bg-emerald-500 text-white border-emerald-500 font-semibold",
  default: "bg-slate-200 text-slate-700 border-slate-300 font-semibold",
};

const WORKDAY_HOURS = 8;



const MS_IN_DAY = 1000 * 60 * 60 * 24;

 


const formatDateInputValue = (value?: string | null) => {



  if (!value) return "";



  const date = new Date(value);



  if (Number.isNaN(date.getTime())) return "";



  const offset = date.getTimezoneOffset();



  const local = new Date(date.getTime() - offset * 60000);



  return local.toISOString().slice(0, 10);



};

const toLocalDateOnly = (value?: string | null) => {
  const formatted = formatDateInputValue(value);
  if (!formatted) return null;
  const date = new Date(`${formatted}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
};





const isoFromDateInput = (value: string) => {



  if (!value) return null;



  const date = new Date(`${value}T00:00:00`);



  if (Number.isNaN(date.getTime())) return null;



  return date.toISOString();



};







const parseDate = (value?: string | null): Date | null => {
  if (!value) return null;
  if (value.includes("/")) {
    const [d, m, y] = value.split("/");
    if (!d || !m || !y) return null;
    const parsed = new Date(Number(y), Number(m) - 1, Number(d));
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const calcDurationInDays = (start?: string | null, end?: string | null): number => {
  const s = parseDate(start);
  const e = parseDate(end);
  if (!s || !e) return 0;
  const diff = Math.floor((e.getTime() - s.getTime()) / MS_IN_DAY) + 1;
  return diff > 0 ? diff : 0;
};

const computeDurationDays = (start?: string | null, end?: string | null): number | null => {
  const duration = calcDurationInDays(start, end);
  return duration === 0 && (!start || !end) ? null : duration;
};







const getDurationInputValue = (node: any): string => {



  const diff = computeDurationDays(node.startDate, node.endDate);



  if (diff !== null) return String(diff);



  const rawHours =



    typeof node.estimateHours === "number"



      ? node.estimateHours



      : Number(node.estimateHours ?? 0);



  if (Number.isFinite(rawHours) && rawHours > 0) {



    return String(Math.max(1, Math.round(rawHours / WORKDAY_HOURS)));



  }



  return "";



};
const shouldAutoDateFromChildren = (
  row: { level?: number; hasChildren?: boolean; node?: any } | null | undefined
): boolean => {
  return Boolean(row?.hasChildren);
};
const toLocalMidnightIso = (value: Date): string => {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate()).toISOString();
};
const summarizeDatesFromChildren = (children: any[]): { startDate: string | null; endDate: string | null } => {
  let minStart: Date | null = null;
  let maxEnd: Date | null = null;
  const collect = (node: any): { startDate: string | null; endDate: string | null } => {
    const childNodes = Array.isArray(node?.children) ? node.children : [];
    if (childNodes.length > 0) {
      return summarizeDatesFromChildren(childNodes);
    }
    return {
      startDate: node?.startDate ?? null,
      endDate: node?.endDate ?? null
    };
  };
  (Array.isArray(children) ? children : []).forEach((child) => {
    const summary = collect(child);
    const start = parseDate(summary.startDate ?? null);
    const end = parseDate(summary.endDate ?? null);
    const candidateStart = start ?? end;
    const candidateEnd = end ?? start;
    if (candidateStart && (!minStart || candidateStart.getTime() < minStart.getTime())) {
      minStart = candidateStart;
    }
    if (candidateEnd && (!maxEnd || candidateEnd.getTime() > maxEnd.getTime())) {
      maxEnd = candidateEnd;
    }
  });
  if (!minStart && !maxEnd) {
    return { startDate: null, endDate: null };
  }
  const resolvedStart = minStart ?? maxEnd;
  const resolvedEnd = maxEnd ?? minStart;
  return {
    startDate: resolvedStart ? toLocalMidnightIso(resolvedStart) : null,
    endDate: resolvedEnd ? toLocalMidnightIso(resolvedEnd) : null
  };
};







type WbsTreeViewProps = {
  nodes: any[];
  loading?: boolean;
  error?: string | null;
  onCreate?: (parentId: string | null, data?: Record<string, any>) => void;
  onUpdate: (
    nodeId: string,
    changes: {
      title?: string;
      status?: string;
      priority?: string;
      startDate?: string | null;
      endDate?: string | null;
      estimateHours?: number | null;
      dependencies?: string[];
      serviceCatalogId?: string | null;
      serviceMultiplier?: number | null;
      serviceHours?: number | null;
    }
  ) => void;
  onDelete?: (nodeId: string) => void;
  onRestore?: (nodeId: string) => void;
  onMove: (id: string, parentId: string | null, position: number) => void;
  members?: Array<{
    id: string;
    userId: string;
    name: string;
    email?: string;
    role?: string | null;
  }>; 
  onChangeResponsible?: (nodeId: string, membershipId: string | null) => void;
  selectedNodeId: string | null;
  onSelect: (nodeId: string | null) => void;
  dependencyOptions?: Array<{ id: string; label: string; title?: string }>;
  onUpdateDependency?: (nodeId: string, dependencies: string[] | null) => void;
  onOpenDetails?: (node: any) => void;
  serviceCatalog?: Array<{
    id: string;
    name: string;
    description?: string | null;
    hoursBase?: number | null;
    hours?: number | null;
  }>;
  onSelectionChange?: (ids: string[]) => void;
  clearSelectionKey?: number;
  filterText?: string;
  filterStatus?: string;
  filterService?: string;
  filterOwner?: string;
  filterOverdue?: "ALL" | "OVERDUE";
  filterLevel?: string;
  canCreate?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
};

const PRIORITY_OPTIONS = [
  { value: "CRITICAL", label: "Urgente" },
  { value: "HIGH", label: "Alta" },
  { value: "MEDIUM", label: "Média" },
  { value: "LOW", label: "Baixa" }
];

const normalizePriorityValue = (value?: string | null) => {
  const raw = String(value ?? "").trim().toUpperCase();
  if (!raw) return "MEDIUM";
  if (raw === "URGENTE" || raw === "URGENT" || raw === "CRITICAL") return "CRITICAL";
  if (raw === "ALTA" || raw === "HIGH") return "HIGH";
  if (raw === "MEDIA" || raw === "MÉDIA" || raw === "MEDIUM") return "MEDIUM";
  if (raw === "BAIXA" || raw === "LOW") return "LOW";
  return "MEDIUM";
};

const getPriorityTone = (value: string): "urgent" | "high" | "medium" | "low" => {
  if (value === "CRITICAL") return "urgent";
  if (value === "HIGH") return "high";
  if (value === "LOW") return "low";
  return "medium";
};



export const WbsTreeView = ({

  nodes,

  loading,

  error,

  onCreate,

  onUpdate,

  onDelete,

  onRestore,

  onMove,

  members = [],

  onChangeResponsible,

  selectedNodeId,

  onSelect,

  dependencyOptions,

  onUpdateDependency,

  onOpenDetails,

  serviceCatalog = [],

  onSelectionChange,

  clearSelectionKey,

  filterText,
  filterStatus,
  filterService,
  filterOwner,
  filterOverdue,
  filterLevel,
  canCreate = true,
  canEdit = true,
  canDelete = true

}: WbsTreeViewProps) => {



  const {

    selectedOrganizationId: currentOrganizationId,

    selectedProjectId,

    onReloadWbs

  } = useOutletContext<DashboardOutletContext>();
  const { token: authToken, user: currentUser } = useAuth();
  const currentUserName =
    (currentUser as { name?: string; email?: string } | null)?.name ??
    (currentUser as { name?: string; email?: string } | null)?.email ??
    null;
  const currentUserId = (currentUser as { id?: string } | null)?.id ?? null;






  const [treeNodes, setTreeNodes] = useState(nodes);



  useEffect(() => {



    setTreeNodes(nodes);



  }, [nodes]);


  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({});



  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number; width: number } | null>(null);
  const [activeMenuNode, setActiveMenuNode] = useState<any | null>(null);



  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);



  const [editingTitle, setEditingTitle] = useState("");



  const [statusPickerId, setStatusPickerId] = useState<string | null>(null);
  const [priorityPickerId, setPriorityPickerId] = useState<string | null>(null);
  const [statusPickerOpenUpId, setStatusPickerOpenUpId] = useState<string | null>(null);
  const [priorityPickerOpenUpId, setPriorityPickerOpenUpId] = useState<string | null>(null);



  const [editingDependenciesId, setEditingDependenciesId] = useState<string | null>(null);



  const [pendingDependencies, setPendingDependencies] = useState<string[]>([]);



  const dependencyEditorRef = useRef<HTMLDivElement | null>(null);


  const menuRef = useRef<HTMLDivElement | null>(null);
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [isCreatingBottomTask, setIsCreatingBottomTask] = useState(false);
  const selectAllRef = useRef<HTMLInputElement | null>(null);
  const [openChatTaskId, setOpenChatTaskId] = useState<string | null>(null);
  const [chatDraft, setChatDraft] = useState("");
  const [chatMessages, setChatMessages] = useState<WbsComment[]>([]);
  const [chatCounts, setChatCounts] = useState<Record<string, number>>({});
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const lastClearKeyRef = useRef<number | undefined>(undefined);
  const chatEditorRef = useRef<HTMLDivElement | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showTextStyleMenu, setShowTextStyleMenu] = useState(false);
  const [showTextColorPicker, setShowTextColorPicker] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const editingDraftRef = useRef<string>("");
  const [pendingDeleteCommentId, setPendingDeleteCommentId] = useState<string | null>(null);
  const [chatFormatState, setChatFormatState] = useState({
    bold: false,
    italic: false,
    underline: false,
    bullets: false,
    numbered: false
  });
  const clearedParentDependencyIdsRef = useRef<Set<string>>(new Set());







  type WbsComment = {
    id: string;
    wbsNodeId: string;
    authorId?: string | null;
    authorName?: string | null;
    message: string;
    createdAt: string;
  };

  const getInitials = (value?: string | null) => {
    if (!value) return "?";
    const parts = value.trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return "?";
    return parts.slice(0, 2).map((part) => part[0]?.toUpperCase()).join("");
  };

  const escapeChatHtml = (value: string) =>
    value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");

  const formatChatInline = (value: string) => {
    let result = value;
    result = result.replace(/\*([^*]+)\*/g, "<strong>$1</strong>");
    result = result.replace(/_([^_]+)_/g, "<em>$1</em>");
    result = result.replace(/\+([^+]+)\+/g, "<u>$1</u>");
    result = result.replace(/(^|\\s)@([\\w.-]+)/g, '$1<span class="wbs-chat-mention">@$2</span>');
    result = result.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>');
    return result;
  };

  const formatChatMessage = (value: string) => {
    const escaped = escapeChatHtml(value);
    const lines = escaped.split(/\r?\n/);
    let html = "";
    let inUl = false;
    let inOl = false;
    const closeLists = () => {
      if (inUl) {
        html += "</ul>";
        inUl = false;
      }
      if (inOl) {
        html += "</ol>";
        inOl = false;
      }
    };
    lines.forEach((rawLine) => {
      const line = rawLine.trim();
      if (!line) {
        closeLists();
        html += "<p></p>";
        return;
      }
      const checklistMatch = line.match(/^- \\[ \\] (.+)/);
      if (checklistMatch) {
        if (!inUl) {
          closeLists();
          html += '<ul class="wbs-chat-list wbs-chat-list--check">';
          inUl = true;
        }
        html += `<li><span class="wbs-chat-checkbox"></span>${formatChatInline(checklistMatch[1])}</li>`;
        return;
      }
      const bulletMatch = line.match(/^[*•-]\\s+(.+)/);
      if (bulletMatch) {
        if (!inUl) {
          closeLists();
          html += '<ul class="wbs-chat-list">';
          inUl = true;
        }
        html += `<li>${formatChatInline(bulletMatch[1])}</li>`;
        return;
      }
      const numberMatch = line.match(/^\\d+\\.\\s+(.+)/);
      if (numberMatch) {
        if (!inOl) {
          closeLists();
          html += "<ol class=\"wbs-chat-list\">";
          inOl = true;
        }
        html += `<li>${formatChatInline(numberMatch[1])}</li>`;
        return;
      }
      closeLists();
      html += `<p>${formatChatInline(line)}</p>`;
    });
    closeLists();
    return html;
  };

  const sanitizeChatHtml = (html: string) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(`<div>${html}</div>`, "text/html");
    const container = doc.body.firstElementChild as HTMLElement | null;
    if (!container) return "";
    const allowedTags = new Set([
      "B",
      "STRONG",
      "I",
      "EM",
      "U",
      "A",
      "UL",
      "OL",
      "LI",
      "P",
      "BR",
      "SPAN",
      "DIV",
      "FONT"
    ]);
    const walk = (node: Element) => {
      const children = Array.from(node.children);
      children.forEach((child) => {
        if (!allowedTags.has(child.tagName)) {
          child.replaceWith(doc.createTextNode(child.textContent ?? ""));
          return;
        }
        Array.from(child.attributes).forEach((attr) => {
          const name = attr.name.toLowerCase();
          if (child.tagName === "A") {
            if (!["href", "target", "rel"].includes(name)) child.removeAttribute(attr.name);
          } else if (child.tagName === "SPAN") {
            if (name === "class") {
              if (!child.classList.contains("wbs-chat-mention")) child.removeAttribute("class");
            } else if (name === "style") {
              const colorMatch = attr.value.match(/color\s*:\s*([^;]+)/i);
              if (colorMatch) {
                child.setAttribute("style", `color: ${colorMatch[1].trim()}`);
              } else {
                child.removeAttribute("style");
              }
            } else {
              child.removeAttribute(attr.name);
            }
          } else if (child.tagName === "FONT") {
            if (name !== "color") child.removeAttribute(attr.name);
          } else {
            child.removeAttribute(attr.name);
          }
        });
        walk(child);
      });
    };
    walk(container);
    return container.innerHTML;
  };

  const getPlainTextFromHtml = (html: string) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(`<div>${html}</div>`, "text/html");
    return doc.body.textContent?.replace(/\u00a0/g, " ").trim() ?? "";
  };

  const renderChatMessage = (value: string) => {
    const hasHtml = /<\/?[a-z][\s\S]*>/i.test(value);
    if (hasHtml) return sanitizeChatHtml(value);
    return formatChatMessage(value);
  };

  const handleChatTool = (action: string) => {
    const editor = chatEditorRef.current;
    if (!editor) return;
    editor.focus();
    switch (action) {
      case "bold":
        document.execCommand("bold");
        break;
      case "italic":
        document.execCommand("italic");
        break;
      case "underline":
        document.execCommand("underline");
        break;
      case "bullets":
        document.execCommand("insertUnorderedList");
        break;
      case "numbered":
        document.execCommand("insertOrderedList");
        break;
      case "checklist":
        document.execCommand(
          "insertHTML",
          false,
          '<ul class="wbs-chat-list wbs-chat-list--check"><li><span class="wbs-chat-checkbox"></span>&nbsp;</li></ul>'
        );
        break;
      case "link": {
        const url = window.prompt("URL do link") ?? "";
        if (!url) return;
        document.execCommand("createLink", false, url);
        break;
      }
      case "mention":
        document.execCommand("insertText", false, "@");
        break;
      default:
        break;
    }
    setChatDraft(editor.innerHTML);
    updateChatFormatState();
  };

  const applyTextStyle = (style: string) => {
    const editor = chatEditorRef.current;
    if (!editor) return;
    editor.focus();
    document.execCommand("formatBlock", false, style);
    setChatDraft(editor.innerHTML);
    setShowTextStyleMenu(false);
  };

  const handleChatToolMouseDown = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
  };

  const setTextColor = (color: string) => {
    const editor = chatEditorRef.current;
    if (!editor) return;
    editor.focus();
    document.execCommand("foreColor", false, color);
    setChatDraft(editor.innerHTML);
    setShowTextColorPicker(false);
    updateChatFormatState();
  };

  const insertEmoji = (emoji: string) => {
    const editor = chatEditorRef.current;
    if (!editor) return;
    editor.focus();
    document.execCommand("insertText", false, emoji);
    setChatDraft(editor.innerHTML);
    setShowEmojiPicker(false);
  };

  const updateChatFormatState = () => {
    const editor = chatEditorRef.current;
    if (!editor || !editor.contains(document.activeElement)) return;
    setChatFormatState({
      bold: document.queryCommandState("bold"),
      italic: document.queryCommandState("italic"),
      underline: document.queryCommandState("underline"),
      bullets: document.queryCommandState("insertUnorderedList"),
      numbered: document.queryCommandState("insertOrderedList")
    });
  };

  useEffect(() => {
    const handler = () => updateChatFormatState();
    document.addEventListener("selectionchange", handler);
    return () => document.removeEventListener("selectionchange", handler);
  }, []);

  useEffect(() => {
    if (!openChatTaskId) return;
    const editor = chatEditorRef.current;
    if (!editor) return;
    editor.innerHTML = chatDraft || "";
  }, [openChatTaskId]);

  const emojiList = [
    "??","??","??","??","??","??","??","??","??","??","??","??","??","??","??","??","??","??","??","??",
    "??","??","??","??","??","??","??","??","??","??","??","??","??","??","??","??","??","??","??","??",
    "??","??","??","??","??","??","??","??","??","??","??","??","??","??","??","??","??","??","??","??",
    "??","?","??","??","??","??","??","??","??","??","???","??","??","??","??","??","??","??","??","??",
    "??","?","?","??","??","??","??","?","?","??","?","??","??","??","??","??","??","??","??","??",
    "??","??","??","??","???","??","??","??","??","??","??","??","??","??","???","??","??","??","???","??"
  ];

  type Row = {



    node: any;



    displayId: string;



    level: number;



    parentId: string | null;



    hasChildren: boolean;



  };







  const allRows = useMemo(() => {



    const buildRows = (tree: any[], marker: number[] = [], parentId: string | null = null, level = 0): Row[] =>



      tree.flatMap((node, index) => {



        const wbsMarker = [...marker, index + 1];



        const children = Array.isArray(node.children) ? node.children : [];



        const current: Row = {



          node,



          displayId: wbsMarker.join("."),



          level,



          parentId,



          hasChildren: children.length > 0



        };



        return [current, ...buildRows(children, wbsMarker, node.id, level + 1)];



      });







    return buildRows(treeNodes);



  }, [treeNodes]);







  const rowMap = useMemo(() => {



    const map = new Map<string, Row>();



    allRows.forEach((row) => map.set(row.node.id, row));



    return map;



  }, [allRows]);

  const expandableNodeIds = useMemo(
    () => allRows.filter((row) => row.hasChildren).map((row) => row.node.id),
    [allRows]
  );

  const hasExpandableLevels = expandableNodeIds.length > 0;

  const handleCollapseAllLevels = useCallback(() => {
    setExpandedNodes(() => {
      const next: Record<string, boolean> = {};
      expandableNodeIds.forEach((nodeId) => {
        next[nodeId] = false;
      });
      return next;
    });
  }, [expandableNodeIds]);

  const handleExpandAllLevels = useCallback(() => {
    setExpandedNodes(() => {
      const next: Record<string, boolean> = {};
      expandableNodeIds.forEach((nodeId) => {
        next[nodeId] = true;
      });
      return next;
    });
  }, [expandableNodeIds]);






  const autoDateSummaryById = useMemo(() => {
    const map = new Map<string, { startDate: string | null; endDate: string | null }>();
    allRows.forEach((row) => {
      if (!shouldAutoDateFromChildren(row)) return;
      map.set(
        String(row.node.id),
        summarizeDatesFromChildren(Array.isArray(row.node.children) ? row.node.children : [])
      );
    });
    return map;
  }, [allRows]);
  useEffect(() => {
    if (!canEdit) return;
    allRows.forEach((row) => {
      const rowId = String(row.node.id);
      const hasDependencies = Array.isArray(row.node.dependencies) && row.node.dependencies.length > 0;
      if (!shouldAutoDateFromChildren(row) || !hasDependencies) {
        clearedParentDependencyIdsRef.current.delete(rowId);
        return;
      }
      if (clearedParentDependencyIdsRef.current.has(rowId)) return;
      clearedParentDependencyIdsRef.current.add(rowId);
      onUpdate(rowId, { dependencies: [] });
    });
  }, [allRows, canEdit, onUpdate]);
  const updateSiblingsInTree = useCallback(

    (list: any[], parentId: string | null, updatedSiblings: any[]): any[] => {



      if (parentId === null) {



        return updatedSiblings.map((child) => ({

          ...child,

          children: Array.isArray(child.children) ? child.children : child.children

        }));

      }



      return list.map((node) => {



        if (node.id === parentId) {



          return {

            ...node,

            children: updatedSiblings

          };

        }



        if (Array.isArray(node.children) && node.children.length) {



          return {

            ...node,

            children: updateSiblingsInTree(node.children, parentId, updatedSiblings)

          };

        }



        return node;

      });

    },

    []

  );




  const cancelTitleEdit = () => {



    setEditingNodeId(null);



    setEditingTitle("");



  };



  const closeDependencyEditor = () => {



    dependencyEditorRef.current = null;



    setEditingDependenciesId(null);



    setPendingDependencies([]);



  };







  const handleBeginTitleEdit = (event: MouseEvent<HTMLDivElement>, node: any) => {



    event.stopPropagation();
    if (!canEdit) return;



    setStatusPickerId(null);
    setPriorityPickerId(null);



    setEditingNodeId(node.id);



    setEditingTitle(node.title ?? "");



  };







  const commitTitleEdit = () => {



    if (!canEdit) return;
    if (!editingNodeId) return;



    const trimmed = editingTitle.trim();



    const previous = rowMap.get(editingNodeId)?.node.title ?? "";



    cancelTitleEdit();



    if (!trimmed || trimmed === previous) {



      return;



    }



    onUpdate(editingNodeId, { title: trimmed });



  };







  const handleTitleKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>) => {



    if (event.key === "Enter") {



      event.preventDefault();



      commitTitleEdit();



    } else if (event.key === "Escape") {



      event.preventDefault();



      cancelTitleEdit();



    }



  };







  const shouldOpenChoiceMenuUp = (trigger: HTMLElement | null) => {
    if (!trigger) return false;

    const scrollContainer = trigger.closest(".edt-scroll-wrapper");
    const triggerRect = trigger.getBoundingClientRect();
    const estimatedMenuHeight = 248;

    if (scrollContainer instanceof HTMLElement) {
      const containerRect = scrollContainer.getBoundingClientRect();
      const spaceBelow = containerRect.bottom - triggerRect.bottom;
      const spaceAbove = triggerRect.top - containerRect.top;
      return spaceBelow < estimatedMenuHeight && spaceAbove > spaceBelow;
    }

    const viewportSpaceBelow = window.innerHeight - triggerRect.bottom;
    const viewportSpaceAbove = triggerRect.top;
    return viewportSpaceBelow < estimatedMenuHeight && viewportSpaceAbove > viewportSpaceBelow;
  };

  const handleStatusToggle = (event: MouseEvent<HTMLButtonElement>, nodeId: string) => {



    event.stopPropagation();
    if (!canEdit) return;



    cancelTitleEdit();
    closeDependencyEditor();
    setOpenMenuId(null);
    setPriorityPickerId(null);
    setPriorityPickerOpenUpId(null);
    const openUp = shouldOpenChoiceMenuUp(event.currentTarget);
    setStatusPickerId((current) => {
      const nextId = current === nodeId ? null : nodeId;
      setStatusPickerOpenUpId(nextId && openUp ? nextId : null);
      return nextId;
    });



  };







  const handleStatusChange = (event: { stopPropagation: () => void }, nodeId: string, statusValue: string) => {



    event.stopPropagation();
    if (!canEdit) return;



    setStatusPickerId(null);
    setPriorityPickerId(null);
    setStatusPickerOpenUpId(null);
    setPriorityPickerOpenUpId(null);



    const normalized = normalizeStatus(statusValue);



    const current = normalizeStatus(rowMap.get(nodeId)?.node.status);



    if (current === normalized) return;



    onUpdate(nodeId, { status: normalized });



  };

  const handlePriorityToggle = (event: MouseEvent<HTMLButtonElement>, nodeId: string) => {
    event.stopPropagation();
    if (!canEdit) return;
    cancelTitleEdit();
    closeDependencyEditor();
    setOpenMenuId(null);
    setStatusPickerId(null);
    setStatusPickerOpenUpId(null);
    const openUp = shouldOpenChoiceMenuUp(event.currentTarget);
    setPriorityPickerId((current) => {
      const nextId = current === nodeId ? null : nodeId;
      setPriorityPickerOpenUpId(nextId && openUp ? nextId : null);
      return nextId;
    });
  };

  const handlePriorityChange = (event: { stopPropagation: () => void }, nodeId: string, priorityValue: string) => {
    event.stopPropagation();
    if (!canEdit) return;
    setStatusPickerId(null);
    setPriorityPickerId(null);
    setStatusPickerOpenUpId(null);
    setPriorityPickerOpenUpId(null);
    const current = normalizePriorityValue(
      rowMap.get(nodeId)?.node.priority ?? rowMap.get(nodeId)?.node.prioridade ?? rowMap.get(nodeId)?.node.task_priority
    );
    if (current === priorityValue) return;
    onUpdate(nodeId, { priority: priorityValue });
  };







  const handleDateFieldChange = (nodeId: string, field: "startDate" | "endDate", inputValue: string) => {



    if (!canEdit) return;
    cancelTitleEdit();



    setStatusPickerId(null);
    setPriorityPickerId(null);



    const row = rowMap.get(nodeId);



    if (!row) return;
    if (shouldAutoDateFromChildren(row)) return;



    const isoValue = isoFromDateInput(inputValue);



    const nextStart = field === "startDate" ? isoValue : row.node.startDate ?? null;



    const nextEnd = field === "endDate" ? isoValue : row.node.endDate ?? null;



    const updates: Record<string, string | number | null> = {};



    if (field === "startDate") updates.startDate = isoValue;



    if (field === "endDate") updates.endDate = isoValue;



    const duration = calcDurationInDays(nextStart, nextEnd);
    updates.durationInDays = duration;
    if (duration > 0) {
      updates.estimateHours = duration * WORKDAY_HOURS;
    }



    onUpdate(nodeId, updates);



  };







  const handleDurationInputChange = (nodeId: string, value: string) => {



    if (!canEdit) return;
    cancelTitleEdit();



    setStatusPickerId(null);
    setPriorityPickerId(null);



    if (!value) return;



    const parsed = Number(value);



    if (!Number.isFinite(parsed) || parsed <= 0) return;



    const DurationDays = Math.max(1, Math.round(parsed));



    const row = rowMap.get(nodeId);



    if (!row) return;
    if (shouldAutoDateFromChildren(row)) return;



    const updates: Record<string, string | number> = {



      estimateHours: DurationDays * WORKDAY_HOURS



    };



    if (row.node.startDate) {



      const startDate = new Date(row.node.startDate);



      if (!Number.isNaN(startDate.getTime())) {



        const newEnd = new Date(startDate.getTime());



        newEnd.setDate(startDate.getDate() + (DurationDays - 1));



        updates.endDate = newEnd.toISOString();



      }



    }



    onUpdate(nodeId, updates);



  };







  const statusPopoverStyle: CSSProperties = {



    position: "absolute",



    top: "calc(100% + 4px)",



    left: 0,



    background: "#fff",



    borderRadius: "0.65rem",



    border: "1px solid rgba(15, 23, 42, 0.08)",



    boxShadow: "0 8px 24px rgba(15, 23, 42, 0.15)",



    padding: "0.35rem",



    display: "flex",



    flexDirection: "column",



    minWidth: "180px",



    gap: "0.25rem",



    zIndex: 20



  };



  const progressMap = useMemo(() => {



    const cache = new Map<string, number>();



    const compute = (node: any): number => {



      if (cache.has(node.id)) return cache.get(node.id)!;



      let value = 0;



      if (typeof node.progress === "number" && Number.isFinite(node.progress)) {



        value = Math.max(0, Math.min(100, Math.round(node.progress)));



      } else if (Array.isArray(node.children) && node.children.length) {



        const total = node.children.reduce((sum: number, child: any) => sum + compute(child), 0);



        value = node.children.length ? Math.round(total / node.children.length) : 0;



      }



      cache.set(node.id, value);



      return value;



    };



    treeNodes.forEach((node) => compute(node));



    return cache;



  }, [treeNodes]);







  useEffect(() => {



    if (!editingDependenciesId) return;







    const handleDocumentMouseDown = (event: globalThis.MouseEvent) => {



      if (!dependencyEditorRef.current) return;



      if (!dependencyEditorRef.current.contains(event.target as Node)) {



        closeDependencyEditor();



      }



    };







    const handleKeyDown = (event: KeyboardEvent) => {



      if (event.key === "Escape") {



        closeDependencyEditor();



      }



    };







    document.addEventListener("mousedown", handleDocumentMouseDown);



    document.addEventListener("keydown", handleKeyDown);







    return () => {



      document.removeEventListener("mousedown", handleDocumentMouseDown);



      document.removeEventListener("keydown", handleKeyDown);



    };



  }, [editingDependenciesId]);

  useEffect(() => {
    if (!statusPickerId && !priorityPickerId) return;

    const handleDocumentMouseDown = (event: globalThis.MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest(".wbs-inline-picker")) return;
      setStatusPickerId(null);
      setPriorityPickerId(null);
      setStatusPickerOpenUpId(null);
      setPriorityPickerOpenUpId(null);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setStatusPickerId(null);
        setPriorityPickerId(null);
        setStatusPickerOpenUpId(null);
        setPriorityPickerOpenUpId(null);
      }
    };

    document.addEventListener("mousedown", handleDocumentMouseDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleDocumentMouseDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [statusPickerId, priorityPickerId]);


  useEffect(() => {



    if (!openMenuId) return;





    const handleDocumentMouseDown = (event: globalThis.MouseEvent) => {
      const target = event.target as HTMLElement;
      const clickedTrigger = target.closest(".wbs-actions-trigger");
      if (clickedTrigger) return;

      if (menuRef.current && !menuRef.current.contains(target)) {
        setOpenMenuId(null);
      }
    };



    const handleKeyDown = (event: KeyboardEvent) => {



      if (event.key === "Escape") {



        setOpenMenuId(null);



      }



    };



    document.addEventListener("mousedown", handleDocumentMouseDown);



    document.addEventListener("keydown", handleKeyDown);
    const handleScroll = () => setOpenMenuId(null);
    window.addEventListener("scroll", handleScroll, true);



    return () => {



      document.removeEventListener("mousedown", handleDocumentMouseDown);



      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("scroll", handleScroll, true);



    };



  }, [openMenuId]);

  useEffect(() => {
    if (!openMenuId) {
      setMenuPosition(null);
      setActiveMenuNode(null);
    }
  }, [openMenuId]);







  const visibleRows = useMemo(() => {



    return allRows.filter((row) => {



      if (row.level === 0) return true;



      let parentId = row.parentId;



      while (parentId) {



        const parentRow = rowMap.get(parentId);



        if (!parentRow) break;



        const isExpanded = expandedNodes[parentId] ?? parentRow.level < 1;



        if (!isExpanded) return false;



        parentId = parentRow.parentId;



      }



      return true;



    });



  }, [allRows, rowMap, expandedNodes]);



  const resolveDisplayCode = (node: any, fallback?: string) =>
    node?.code ?? node?.wbsCode ?? node?.idNumber ?? node?.codeValue ?? fallback ?? node?.id;

  const isOverdue = (node: any) => {
    if (!node?.endDate) return false;
    const statusValue = String(node.status ?? "").toUpperCase();
    const isDone =
      statusValue === "DONE" ||
      statusValue === "FINISHED" ||
      statusValue === "COMPLETED" ||
      statusValue === "FINALIZADO";
    if (isDone) return false;

    const end = new Date(node.endDate);
    if (Number.isNaN(end.getTime())) return false;

    const now = new Date();
    now.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);

    return end < now;
  };

  const resolveServiceHours = useCallback(
    (node: any) => {
      if (!node) return null;
      const multiplier = Number(node.serviceMultiplier ?? 1) || 1;
      const selectedService = serviceCatalog.find((service) => service.id === node.serviceCatalogId) ?? null;
      const serviceBaseHours =
        selectedService && selectedService.hoursBase !== undefined
          ? Number(selectedService.hoursBase ?? 0)
          : selectedService && selectedService.hours !== undefined
          ? Number(selectedService.hours ?? 0)
          : null;

      const computed =
        typeof node.serviceHours === "number"
          ? node.serviceHours
          : serviceBaseHours !== null
          ? serviceBaseHours * multiplier
          : null;

      if (computed === null || Number.isNaN(computed)) return null;
      return computed;
    },
    [serviceCatalog]
  );

  const filteredRows = useMemo(() => {
    const q = filterText?.trim().toLowerCase();
    const normalizedFilter = filterStatus && filterStatus !== "ALL" ? normalizeStatus(filterStatus) : null;
    const selectedLevel = filterLevel && filterLevel !== "ALL" ? Number(filterLevel) : null;

    return visibleRows.filter((row) => {
      const node = row.node || {};

      // status filter
      if (normalizedFilter && normalizeStatus(node.status) !== normalizedFilter) return false;

      // service filter
      if (filterService && filterService !== "ALL" && String(node.serviceCatalogId ?? "") !== filterService) {
        return false;
      }

      // owner/responsible filter (using responsibleMembershipId as priority)
      const ownerValue = String(node.responsibleMembershipId ?? node.ownerId ?? "");
      if (filterOwner && filterOwner !== "ALL" && ownerValue !== filterOwner) return false;

      // overdue filter
      if (filterOverdue === "OVERDUE" && !isOverdue(node)) return false;

      // level filter (displayed level starts at 1)
      if (selectedLevel && Number.isFinite(selectedLevel)) {
        const rowLevel = Number.isFinite(row.level) ? row.level + 1 : Number(node.level ?? 0) + 1;
        if (rowLevel !== selectedLevel) return false;
      }

      if (!q) return true;

      const code = String(resolveDisplayCode(node, row.displayId) ?? "").toLowerCase();
      const title = String(node.title ?? node.name ?? "").toLowerCase();
      const status = normalizeStatus(node.status).toLowerCase();
      const owner = String(
        node.owner?.fullName ??
          node.owner?.email ??
          node.responsible?.name ??
          node.responsible?.email ??
          node.responsible?.user?.fullName ??
          node.responsible?.user?.email ??
          ""
      ).toLowerCase();
      const service = String(node.serviceCatalog?.name ?? "").toLowerCase();
      return (
        code.includes(q) ||
        title.includes(q) ||
        status.includes(q) ||
        owner.includes(q) ||
        service.includes(q)
      );
    });
  }, [filterLevel, filterText, filterOverdue, filterOwner, filterService, filterStatus, resolveDisplayCode, visibleRows]);

  const plannedHoursTotal = useMemo(
    () =>
      filteredRows.reduce((sum, row) => {
        const hours = resolveServiceHours(row.node);
        return sum + (typeof hours === "number" ? hours : 0);
      }, 0),
    [filteredRows, resolveServiceHours]
  );

  const plannedHoursLabel = useMemo(() => {
    const rounded = Math.round(plannedHoursTotal * 100) / 100;
    if (!rounded) return "0h";
    return `${Number.isInteger(rounded) ? rounded.toFixed(0) : rounded.toFixed(2)}h`;
  }, [plannedHoursTotal]);

  const visibleIds = useMemo(() => filteredRows.map((row) => row.node.id), [filteredRows]);



  const handleDragEnd = useCallback(

    async (event: DragEndEvent) => {



      const { active, over } = event;



      if (!canEdit) return;
      if (!over || active.id === over.id) return;



      const activeId = String(active.id);

      const overId = String(over.id);



      const activeRow = rowMap.get(activeId);

      const overRow = rowMap.get(overId);



      if (!activeRow || !overRow) return;



      const activeParentId = activeRow.parentId ?? null;



      if (activeParentId !== (overRow.parentId ?? null)) return;



      const parentRow = activeParentId ? rowMap.get(activeParentId) : null;



      const siblings = parentRow ? parentRow.node.children ?? [] : treeNodes;

      const activeIndex = siblings.findIndex((child: any) => child.id === activeId);

      const overIndex = siblings.findIndex((child: any) => child.id === overId);



      if (activeIndex < 0 || overIndex < 0) return;



      // arrayMove pode retornar tipos genericos/unknown dependendo da lib
      const moved = arrayMove(siblings as any[], activeIndex, overIndex) as Array<Record<string, any>>;

      // FORCA o tipo para manter id e demais props
      const reorderedSiblings: Array<Record<string, any>> = moved.map((sibling, index) => ({
        ...sibling,
        sortOrder: index
      }));

      // usa o moved (ou reorderedSiblings) mas com tipo garantido
      const orderedIds = moved.map((item) => String(item.id));



      setTreeNodes((prev) => updateSiblingsInTree(prev, activeParentId, reorderedSiblings));



      if (!authToken || !selectedProjectId || selectedProjectId === "all") return;



      try {

        await apiRequest("/wbs/reorder", {

          method: "PATCH",

          headers: {

            Authorization: `Bearer ${authToken}`,

            "X-Organization-Id": currentOrganizationId

          },

          body: JSON.stringify({

            projectId: selectedProjectId,

            parentId: activeParentId,

            orderedIds

          })

        });
        if (typeof onReloadWbs === "function") {
          await onReloadWbs();
        }

      } catch (error) {

        console.error("Failed to reorder WBS", error);

        setTreeNodes(nodes);

        onReloadWbs?.();

      }

    },

    [authToken, canEdit, currentOrganizationId, nodes, onReloadWbs, rowMap, selectedProjectId, treeNodes, updateSiblingsInTree]

  );



  const handleSelectAllVisible = (checked: boolean) => {

    const ids = filteredRows.map((row) => row.node.id);
    if (checked) {
      const merged = Array.from(new Set([...selectedTaskIds, ...ids]));
      setSelectedTaskIds(merged);
    } else {
      setSelectedTaskIds((prev) => prev.filter((id) => !ids.includes(id)));
    }
  };

  const handleSelectRow = (checked: boolean, nodeId: string) => {

    if (checked) {
      setSelectedTaskIds((prev) => (prev.includes(nodeId) ? prev : [...prev, nodeId]));
    } else {
      setSelectedTaskIds((prev) => prev.filter((id) => id !== nodeId));
    }
  };

  const isAllVisibleSelected = useMemo(() => {

    if (!filteredRows.length) return false;

    return filteredRows.every((row) => selectedTaskIds.includes(row.node.id));

  }, [filteredRows, selectedTaskIds]);

  useEffect(() => {

    if (!selectAllRef.current) return;

    const someSelected = selectedTaskIds.length > 0 && !isAllVisibleSelected;
    selectAllRef.current.indeterminate = someSelected;

  }, [isAllVisibleSelected, selectedTaskIds]);

  useEffect(() => {

    setSelectedTaskIds([]);

  }, [nodes]);

  useEffect(() => {
    if (onSelectionChange) {
      onSelectionChange(selectedTaskIds);
    }
  }, [selectedTaskIds, onSelectionChange]);

  useEffect(() => {
    if (clearSelectionKey !== undefined && clearSelectionKey !== lastClearKeyRef.current) {
      lastClearKeyRef.current = clearSelectionKey;
      setSelectedTaskIds([]);
    }
  }, [clearSelectionKey]);

  useEffect(() => {
    if (!filteredRows.length) return;
    if (!authToken || !currentOrganizationId) return;

    const nodesWithoutCount = filteredRows.filter((row) => chatCounts[row.node.id] == null);
    if (nodesWithoutCount.length === 0) return;

    const controller = new AbortController();

    const loadAllCounts = async () => {
      const newCounts: Record<string, number> = {};

      await Promise.all(
        nodesWithoutCount.map(async (row) => {
          try {
            const comments = await apiRequest<unknown[]>(`/wbs/${row.node.id}/comments`, {
              headers: {
                Authorization: `Bearer ${authToken ?? ""}`,
                "X-Organization-Id": currentOrganizationId
              },
              signal: controller.signal
            });
            newCounts[row.node.id] = Array.isArray(comments) ? comments.length : 0;
          } catch (error) {
            if (controller.signal.aborted) return;
            console.error("Erro ao carregar contador de Comentários", error);
          }
        })
      );

      if (Object.keys(newCounts).length > 0) {
        setChatCounts((prev) => ({ ...prev, ...newCounts }));
      }
    };

    loadAllCounts();

    return () => controller.abort();
  }, [visibleRows, authToken, currentOrganizationId, chatCounts]);



  const openChatRow = openChatTaskId ? rowMap.get(openChatTaskId) ?? null : null;
  const chatStatus = openChatRow ? normalizeStatus(openChatRow.node.status) : null;
  const chatStatusTone = chatStatus ? STATUS_TONE[chatStatus as Status] ?? "neutral" : "neutral";
  const chatPriorityValue = openChatRow
    ? normalizePriorityValue(openChatRow.node.priority ?? openChatRow.node.prioridade ?? openChatRow.node.task_priority)
    : "MEDIUM";
  const chatPriorityLabel =
    PRIORITY_OPTIONS.find((option) => option.value === chatPriorityValue)?.label ?? "Média";
  const chatPriorityTone =
    chatPriorityValue === "CRITICAL"
      ? "urgent"
      : chatPriorityValue === "HIGH"
        ? "high"
        : chatPriorityValue === "LOW"
          ? "low"
          : "medium";

  useEffect(() => {
    if (!openChatTaskId) {
      setChatMessages([]);
      setChatError(null);
      setEditingCommentId(null);
      editingDraftRef.current = "";
      setShowEmojiPicker(false);
      setShowTextStyleMenu(false);
      setShowTextColorPicker(false);
      setPendingDeleteCommentId(null);
      return;
    }

    let active = true;
    setIsChatLoading(true);
    setChatError(null);

    const loadComments = async () => {
      try {
        const data = await apiRequest<WbsComment[]>(`/wbs/${openChatTaskId}/comments`, {
          headers: {
            Authorization: `Bearer ${authToken ?? ""}`,
            "X-Organization-Id": currentOrganizationId
          }
        });
        if (!active) return;
        setChatMessages(data);
        setChatCounts((prev) => ({ ...prev, [openChatTaskId]: data.length }));
        setChatError(null);
      } catch (error) {
        console.error("Erro na API de Comentários (GET)", error);
        if (active) setChatError("Erro ao listar Comentários");
      } finally {
        if (active) setIsChatLoading(false);
      }
    };

    loadComments();

    return () => {
      active = false;
    };
  }, [openChatTaskId]);

  const chatMessagesForModal = openChatTaskId ? chatMessages : [];

  const handleSendChat = async () => {
    const trimmed = getPlainTextFromHtml(chatDraft);
    if (!trimmed || !openChatTaskId) return;
    
    setIsChatLoading(true);
    setChatError(null);
    
    try {
      const sanitizedMessage = sanitizeChatHtml(chatDraft);
      const created = await apiRequest<WbsComment>(`/wbs/${openChatTaskId}/comments`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authToken ?? ""}`,
          "X-Organization-Id": currentOrganizationId
        },
        body: JSON.stringify({ message: sanitizedMessage, authorName: (currentUser as { name?: string } | null)?.name ?? null })
      });
      setChatMessages((prev) => [...prev, created]);
      setChatCounts((prev) => ({ ...prev, [openChatTaskId]: (prev[openChatTaskId] ?? 0) + 1 }));
      setChatDraft("");
      if (chatEditorRef.current) chatEditorRef.current.innerHTML = "";
      setShowEmojiPicker(false);
      setChatError(null);
    } catch (error) {
      console.error("Erro na API de Comentários (POST)", error);
      setChatError("Erro ao enviar comentário");
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleStartEditComment = (message: WbsComment) => {
    editingDraftRef.current = message.message;
    setEditingCommentId(message.id);
  };

  const handleCancelEditComment = () => {
    editingDraftRef.current = "";
    setEditingCommentId(null);
  };

  const handleSaveEditComment = async () => {
    if (!openChatTaskId || !editingCommentId) return;
    const trimmed = getPlainTextFromHtml(editingDraftRef.current);
    if (!trimmed) return;
    setIsChatLoading(true);
    setChatError(null);
    try {
      const updated = await apiRequest<WbsComment>(`/wbs/${openChatTaskId}/comments/${editingCommentId}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${authToken ?? ""}`,
          "X-Organization-Id": currentOrganizationId
        },
        body: JSON.stringify({ message: sanitizeChatHtml(editingDraftRef.current) })
      });
      setChatMessages((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      handleCancelEditComment();
    } catch (error) {
      console.error("Erro na API de Comentários (PATCH)", error);
      setChatError("Erro ao editar comentário");
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!openChatTaskId) return;
    setPendingDeleteCommentId(commentId);
  };

  const confirmDeleteComment = async () => {
    if (!openChatTaskId || !pendingDeleteCommentId) return;
    setIsChatLoading(true);
    setChatError(null);
    try {
      await apiRequest(`/wbs/${openChatTaskId}/comments/${pendingDeleteCommentId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${authToken ?? ""}`,
          "X-Organization-Id": currentOrganizationId
        }
      });
      setChatMessages((prev) => prev.filter((item) => item.id !== pendingDeleteCommentId));
      setChatCounts((prev) => ({ ...prev, [openChatTaskId]: Math.max((prev[openChatTaskId] ?? 1) - 1, 0) }));
      if (editingCommentId === pendingDeleteCommentId) handleCancelEditComment();
      setPendingDeleteCommentId(null);
    } catch (error) {
      console.error("Erro na API de Comentários (DELETE)", error);
      setChatError("Erro ao excluir comentário");
    } finally {
      setIsChatLoading(false);
    }
  };








  const handleLevelAdjust = (event: MouseEvent<HTMLButtonElement>, nodeId: string, direction: "up" | "down") => {



    event.stopPropagation();
    if (!canEdit) return;



    cancelTitleEdit();



    setStatusPickerId(null);
    setPriorityPickerId(null);



    const currentRow = rowMap.get(nodeId);



    if (!currentRow) return;







    if (direction === "up") {



      if (!currentRow.parentId) return;



      const parentRow = rowMap.get(currentRow.parentId);



      if (!parentRow) return;







      const newParentId = parentRow.parentId ?? null;



      const newParentRow = newParentId ? rowMap.get(newParentId) : null;



      const siblings = newParentRow ? newParentRow.node.children ?? [] : treeNodes;



      const parentIndex = siblings.findIndex((child: any) => child.id === parentRow.node.id);



      const position = parentIndex >= 0 ? parentIndex + 1 : siblings.length;



      onMove(nodeId, newParentId, position);



      return;



    }







    const parentRow = currentRow.parentId ? rowMap.get(currentRow.parentId) : null;



    const siblings = parentRow ? parentRow.node.children ?? [] : treeNodes;



    const currentIndex = siblings.findIndex((child: any) => child.id === nodeId);



    if (currentIndex <= 0) return;



    const newParentNode = siblings[currentIndex - 1];



    if (!newParentNode) return;



    const childCount = Array.isArray(newParentNode.children) ? newParentNode.children.length : 0;



    onMove(nodeId, newParentNode.id, childCount);



    setExpandedNodes((prev) => ({ ...prev, [newParentNode.id]: true }));



  };







  const resolveStatus = (status?: string | null) => {
    const label = normalizeStatus(status);
    return { label, tone: STATUS_TONE[label] ?? "neutral" };
  };








  const formatDuracao = (start?: string | null, end?: string | null) => {
    if (!start || !end) return "N/A";
    const diff = Math.max(
      1,
      Math.round((new Date(end).getTime() - new Date(start).getTime()) / (1000 * 60 * 60 * 24))
    );
    return `${diff}d`;
  };







  const selectedRow = selectedNodeId ? rowMap.get(selectedNodeId) ?? null : null;



  const selectedNode = selectedRow?.node ?? null;



  const selectedStatus = resolveStatus(selectedNode?.status);



  const selectedProgress = selectedNode ? progressMap.get(selectedNode.id) ?? 0 : 0;



  const selectedChecklist = Array.isArray(selectedNode?.checklist) ? selectedNode.checklist : [];







  const ensureAncestorsExpanded = useCallback(



    (nodeId: string) => {



      setExpandedNodes((current) => {



        const next = { ...current };



        let parentId = rowMap.get(nodeId)?.parentId ?? null;



        while (parentId) {



          next[parentId] = true;



          parentId = rowMap.get(parentId)?.parentId ?? null;



        }



        return next;



      });



    },



    [rowMap]



  );







  const handleToggle = (event: MouseEvent<HTMLButtonElement>, nodeId: string, level: number) => {



    event.stopPropagation();



    setExpandedNodes((prev) => ({



      ...prev,



      [nodeId]: !(prev[nodeId] ?? level < 1)



    }));



  };







  const handleRowSelect = (nodeId: string) => {



    const isSame = selectedNodeId === nodeId;



    onSelect(isSame ? null : nodeId);



    setOpenMenuId(null);



    setStatusPickerId(null);
    setPriorityPickerId(null);



    cancelTitleEdit();



    closeDependencyEditor();



  };







  const openDependencyEditorForNode = (nodeId: string, dependencies: string[]) => {
    if (!canEdit) return;



    cancelTitleEdit();



    setStatusPickerId(null);
    setPriorityPickerId(null);



    setOpenMenuId(null);



    if (editingDependenciesId === nodeId) {



      closeDependencyEditor();



    } else {



      setEditingDependenciesId(nodeId);



      setPendingDependencies(dependencies);



    }



  };







  const handleDependencyAreaKeyDown = (



    event: ReactKeyboardEvent<HTMLDivElement>,



    nodeId: string,



    dependencies: string[]



  ) => {
    if (!canEdit) return;



    if (event.key === "Enter" || event.key === " ") {



      event.preventDefault();



      openDependencyEditorForNode(nodeId, dependencies);



    } else if (event.key === "Escape") {



      event.preventDefault();



      closeDependencyEditor();



    }



  };







  const handleDependencyToggle = (nodeId: string, dependencyId: string, checked: boolean) => {
    if (!canEdit) return;



    if (editingDependenciesId !== nodeId) return;



    setPendingDependencies((current) => {



      let next = current;



      if (checked && !current.includes(dependencyId)) {



        next = [...current, dependencyId];



      } else if (!checked && current.includes(dependencyId)) {



        next = current.filter((value) => value !== dependencyId);



      }



      if (next !== current) {



        onUpdate(nodeId, { dependencies: next });



      }



      return next;



    });



  };







  const handleMenuToggle = (event: MouseEvent<HTMLButtonElement>, node: any) => {



    event.stopPropagation();
    if (!canEdit && !canCreate && !canDelete) return;



    cancelTitleEdit();



    setStatusPickerId(null);
    setPriorityPickerId(null);



    closeDependencyEditor();



    const target = event.currentTarget as HTMLButtonElement;
    const rect = target.getBoundingClientRect();
    setMenuPosition({
      top: rect.bottom + 4,
      left: rect.left - 120,
      width: 160
    });
    setActiveMenuNode(node);

    setOpenMenuId((current) => {
      const next = current === node.id ? null : node.id;
      if (next === null) {
        setMenuPosition(null);
        setActiveMenuNode(null);
      }
      return next;
    });



  };



  type RowAction = "MOVE_UP" | "MOVE_DOWN" | "ADD_CHILD" | "DUPLICATE" | "TRASH";

  const moveRow = useCallback(
    async (nodeId: string, direction: "UP" | "DOWN") => {
      if (!canEdit) return;
      if (!selectedProjectId || selectedProjectId === "all" || !authToken || !currentOrganizationId) return;
      const row = rowMap.get(nodeId);
      if (!row) return;

      const parentId = row.parentId ?? null;
      const siblings = (parentId ? rowMap.get(parentId)?.node.children : treeNodes) ?? [];
      const activeSiblings = siblings.filter((s: any) => !s.deletedAt);

      const currentIndex = activeSiblings.findIndex((s: any) => s.id === nodeId);
      if (currentIndex < 0) return;

      const targetIndex = direction === "UP" ? currentIndex - 1 : currentIndex + 1;
      if (targetIndex < 0 || targetIndex >= activeSiblings.length) return;

      const reordered = [...activeSiblings];
      const [moved] = reordered.splice(currentIndex, 1);
      reordered.splice(targetIndex, 0, moved);
      const orderedIds = reordered.map((s) => s.id);

      try {
        await apiRequest("/wbs/reorder", {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${authToken}`,
            "X-Organization-Id": currentOrganizationId
          },
          body: JSON.stringify({
            projectId: selectedProjectId,
            parentId,
            orderedIds
          })
        });
        if (typeof onReloadWbs === "function") {
          await onReloadWbs();
        }
      } catch (error) {
        console.error("Failed to reorder", error);
      }
    },
    [authToken, canEdit, currentOrganizationId, onReloadWbs, rowMap, selectedProjectId, treeNodes]
  );

  const handleMenuAction = async (event: MouseEvent<HTMLButtonElement>, action: RowAction, node: any) => {
    event.stopPropagation();

    if (!selectedProjectId || selectedProjectId === "all" || !authToken || !currentOrganizationId) {
      setOpenMenuId(null);
      return;
    }

    const parentId = node.parentId ?? null;
    if ((action === "MOVE_UP" || action === "MOVE_DOWN") && !canEdit) {
      setOpenMenuId(null);
      return;
    }
    if (action === "ADD_CHILD" && (!canCreate || typeof onCreate !== "function")) {
      setOpenMenuId(null);
      return;
    }
    if (action === "DUPLICATE" && !canCreate) {
      setOpenMenuId(null);
      return;
    }
    if (action === "TRASH" && !canDelete) {
      setOpenMenuId(null);
      return;
    }

    try {
      if (action === "MOVE_UP") {
        await moveRow(node.id, "UP");
      } else if (action === "MOVE_DOWN") {
        await moveRow(node.id, "DOWN");
      } else if (action === "ADD_CHILD") {
        await onCreate?.(node.id, {
          title: "Nova subtarefa",
          status: "BACKLOG",
          parentId: node.id
        });
        await onReloadWbs();
      } else if (action === "DUPLICATE") {
        const payload: any = {
          title: `(Copia) ${node.title ?? node.name ?? "Tarefa"}`,
          status: node.status ?? "BACKLOG",
          parentId,
          startDate: node.startDate ?? null,
          endDate: node.endDate ?? null,
          estimateHours: node.estimateHours ?? null,
          ownerId: node.ownerId ?? null,
          responsibleMembershipId: node.responsibleMembershipId ?? null,
          serviceCatalogId: node.serviceCatalogId ?? null,
          serviceMultiplier: node.serviceMultiplier ?? null,
          serviceHours: node.serviceHours ?? null,
          dependencies: node.dependencies ?? []
        };

        let newId: string | null = null;
        try {
          const created = await apiRequest<{ id?: string; node?: { id?: string } }>("/wbs", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${authToken}`,
              "X-Organization-Id": currentOrganizationId
            },
            body: JSON.stringify({ projectId: selectedProjectId, ...payload })
          });
          newId = created?.id ?? created?.node?.id ?? null;
        } catch (error) {
          console.error("Failed to duplicate node", error);
        }

        if (newId) {
          const siblings = (parentId ? rowMap.get(parentId)?.node.children : treeNodes) ?? [];
          const activeSiblings = siblings.filter((s: any) => !s.deletedAt);
          const ordered = activeSiblings.reduce((arr: string[], s: any) => {
            arr.push(s.id);
            if (s.id === node.id) arr.push(newId!);
            return arr;
          }, [] as string[]);

          await apiRequest("/wbs/reorder", {
            method: "PATCH",
            headers: {
              Authorization: `Bearer ${authToken}`,
              "X-Organization-Id": currentOrganizationId
            },
            body: JSON.stringify({
              projectId: selectedProjectId,
              parentId,
              orderedIds: ordered
            })
          });
        }

        await onReloadWbs();
      } else if (action === "TRASH") {
        const targetIds =
          selectedTaskIds.length > 0 && selectedTaskIds.includes(node.id) ? selectedTaskIds : [node.id];
        const confirmMove =
          targetIds.length > 1
            ? window.confirm(`Enviar ${targetIds.length} tarefas para a lixeira?`)
            : window.confirm("Enviar esta tarefa para a lixeira?");
        if (!confirmMove) {
          setOpenMenuId(null);
          return;
        }
        await apiRequest("/wbs/bulk-delete", {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${authToken}`,
            "X-Organization-Id": currentOrganizationId
          },
          body: JSON.stringify({ ids: targetIds })
        });
        console.log("[trash] soft delete", targetIds);
        await onReloadWbs();
      }
    } catch (error) {
      console.error("Menu action error", error);
    }

    setOpenMenuId(null);
  };

  const handleBulkTrash = async () => {
    if (!canDelete) return;
    if (!selectedProjectId || selectedProjectId === "all" || !authToken || !currentOrganizationId) return;
    if (selectedTaskIds.length === 0) return;
    const confirmMove = window.confirm(`Enviar ${selectedTaskIds.length} tarefas para a lixeira?`);
    if (!confirmMove) return;
    try {
      await apiRequest("/wbs/bulk-delete", {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "X-Organization-Id": currentOrganizationId
        },
        body: JSON.stringify({ ids: selectedTaskIds })
      });
      console.log("[trash] soft delete", selectedTaskIds);
      setSelectedTaskIds([]);
      if (typeof onReloadWbs === "function") {
        await onReloadWbs();
      }
    } catch (error) {
      console.error("Bulk trash error", error);
    }
  };

  const handleCreateBottomTask = async (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    if (!canCreate) return;
    if (isCreatingBottomTask) return;
    if (!selectedProjectId || selectedProjectId === "all") return;
    if (typeof onCreate !== "function") return;

    setIsCreatingBottomTask(true);
    try {
      await onCreate(null, {
        title: "Nova tarefa",
        status: "BACKLOG",
        parentId: null
      });
      if (typeof onReloadWbs === "function") {
        await onReloadWbs();
      }
    } catch (error) {
      console.error("Create bottom task error", error);
    } finally {
      setIsCreatingBottomTask(false);
    }
  };







  const handleCloseDetails = (event: MouseEvent<HTMLButtonElement>) => {



    event.stopPropagation();



    onSelect(null);



    setOpenMenuId(null);



  };







  const handleDetailsButton = (event: MouseEvent<HTMLButtonElement>, nodeId: string) => {



    event.stopPropagation();



    const row = rowMap.get(nodeId);



    if (row && typeof onOpenDetails === "function") {



      onOpenDetails(row.node);



      return;



    }



    handleRowSelect(nodeId);



  };







  if (!treeNodes.length) {



    return <p className="muted">Nenhum item cadastrado.</p>;



  }







  return (
    <>
      <div className="wbs-table-card" data-has-selection={selectedTaskIds.length > 0}>



      <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <div className="edt-horizontal-scroll">
          <table className="wbs-table w-full table-fixed">
          <colgroup>
            <col style={{ width: "28px" }} />
            <col style={{ width: "32px" }} />
            <col style={{ width: "60px" }} />
            <col style={{ width: "70px" }} />
            <col style={{ width: "120px" }} />
            <col style={{ width: "320px" }} />
            <col style={{ width: "180px" }} />
            <col style={{ width: "170px" }} />
            <col style={{ width: "200px" }} />
            <col style={{ width: "200px" }} />
            <col style={{ width: "120px" }} />
            <col style={{ width: "180px" }} />
            <col style={{ width: "200px" }} />
            <col style={{ width: "110px" }} />
            <col style={{ width: "120px" }} />
            <col style={{ width: "150px" }} />
            <col style={{ width: "150px" }} />
          </colgroup>
          <thead>
          <tr className="bg-slate-50 text-[11px] font-semibold text-slate-600 uppercase">
            <th className="px-1 py-2 text-center align-middle" aria-hidden="true" />
            <th className="px-1 py-2 text-center align-middle">
              <input
                type="checkbox"
                aria-label="Selecionar todas as tarefas"
                ref={selectAllRef}
                checked={isAllVisibleSelected}
                onChange={(event) => handleSelectAllVisible(event.target.checked)}
              />
            </th>
            <th className="px-1 py-2 text-center align-middle">ID</th>
            <th className="px-1 py-2 text-center align-middle" title="Comentários da tarefa">Chat</th>
            <th className="px-1 py-2 text-center align-middle">Nível</th>
            <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500">
              <div className="wbs-name-header">
                <span>Nome da tarefa</span>
                <div className="wbs-name-header__actions">
                  <button
                    type="button"
                    className="wbs-name-header__action"
                    onClick={handleCollapseAllLevels}
                    aria-label="Recolher todos os níveis"
                    title="Recolher todos os níveis"
                    disabled={!hasExpandableLevels}
                  >
                    <CollapseAllIcon width={14} height={14} />
                  </button>
                  <button
                    type="button"
                    className="wbs-name-header__action"
                    onClick={handleExpandAllLevels}
                    aria-label="Expandir todos os níveis"
                    title="Expandir todos os níveis"
                    disabled={!hasExpandableLevels}
                  >
                    <ExpandAllIcon width={14} height={14} />
                  </button>
                </div>
              </div>
            </th>
            <th className="w-[180px] px-3 py-2 text-left align-middle wbs-status-col">Status</th>
            <th className="w-[170px] px-3 py-2 text-left align-middle wbs-priority-col">Prioridade</th>
            <th className="wbs-date-col wbs-date-col-start w-[200px] px-2 py-2 text-left text-xs font-semibold text-slate-500">Início</th>
            <th className="wbs-date-col wbs-date-col-end w-[200px] px-2 py-2 text-left text-xs font-semibold text-slate-500">Término</th>
            <th className="w-[120px] px-2 py-2 text-left align-middle wbs-quantity-col">Quantidade</th>
            <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500">Responsável</th>
            <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500">Catálogo de Serviços</th>
            <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500">Multi.</th>
            <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500">
              <div className="flex flex-col leading-tight">
                <span>Horas Previstas</span>
                <span className="text-[10px] text-slate-400 font-medium normal-case">
                  Total {plannedHoursLabel}
                </span>
              </div>
            </th>
            <th className="w-[150px] px-3 py-2 text-left align-middle">Dependência</th>
            <th className="w-[150px] px-3 py-2 text-center align-middle">Detalhes</th>
          </tr>
        </thead>

          <SortableContext items={visibleIds} strategy={verticalListSortingStrategy}>
            <tbody>



                {filteredRows.map((row) => {



              const displayId = resolveDisplayCode(row.node, row.displayId);



              const visualLevel = Number.isFinite(row.level) ? row.level : typeof row.node.level === "number" ? row.node.level : 0;
              const autoDateFromChildren = shouldAutoDateFromChildren(row);
              const autoDateSummary = autoDateFromChildren ? autoDateSummaryById.get(String(row.node.id)) : null;
              const effectiveStartDate = autoDateSummary?.startDate ?? row.node.startDate ?? null;
              const effectiveEndDate = autoDateSummary?.endDate ?? row.node.endDate ?? null;
              const durationInputValue = getDurationInputValue({
                ...row.node,
                startDate: effectiveStartDate,
                endDate: effectiveEndDate
              });
              const displayLevel = visualLevel + 1;



              const status = resolveStatus(row.node.status);



              const isExpanded = row.hasChildren
                ? (expandedNodes[row.node.id] ?? visualLevel < 1)
                : false;



              const isActive = selectedNodeId === row.node.id;



              const responsibleMembershipId = row.node.responsible?.membershipId ?? "";



              const dependencyBadges = autoDateFromChildren
                ? []
                : Array.isArray(row.node.dependencies)
                ? row.node.dependencies
                : [];
              const dependencyOptionsList: DependencyOption[] = allRows
                .filter((optionRow) => optionRow.node.id !== row.node.id)
                .map((optionRow) => {
                  const optionDisplayCode = resolveDisplayCode(optionRow.node, optionRow.displayId);

                  return {
                    id: optionRow.node.id,
                    name: optionRow.node.title ?? optionRow.node.name ?? "Tarefa sem nome",
                    displayCode: optionDisplayCode,
                    wbsCode: optionRow.node.wbsCode ?? optionRow.displayId
                };
              });

              const dependencyInfos = dependencyBadges.map((dependencyId: string) => {
                const dependencyRow = rowMap.get(dependencyId);

                if (!dependencyRow) {
                  return {
                    id: dependencyId,
                    label: dependencyId,
                    tooltip: "Tarefa não encontrada",
                    row: null
                  };
                }

                const label = resolveDisplayCode(dependencyRow.node, dependencyRow.displayId);

                return {
                  id: dependencyId,
                  label,
                  tooltip: `${label} - ${dependencyRow.node.title ?? ""}`,
                  row: dependencyRow
                };
              });

              const applyDependencyDownChain = () => {
                if (!canEdit) return;
                const fromIndex = filteredRows.findIndex((candidate) => candidate.node.id === row.node.id);
                if (fromIndex < 0 || fromIndex >= filteredRows.length - 1) return;
                for (let index = fromIndex + 1; index < filteredRows.length; index += 1) {
                  const target = filteredRows[index];
                  const targetIsParent = shouldAutoDateFromChildren(target);
                  const currentDeps = Array.isArray(target.node.dependencies)
                    ? target.node.dependencies.map((dep: unknown) => String(dep))
                    : [];
                  if (targetIsParent) {
                    if (currentDeps.length > 0) {
                      onUpdate(target.node.id, { dependencies: [] });
                    }
                    continue;
                  }
                  let previousIndex = index - 1;
                  while (previousIndex >= 0 && shouldAutoDateFromChildren(filteredRows[previousIndex])) {
                    previousIndex -= 1;
                  }
                  if (previousIndex < 0) continue;
                  const previous = filteredRows[previousIndex];
                  const previousId = String(previous.node.id);
                  if (currentDeps.length !== 1 || currentDeps[0] !== previousId) {
                    onUpdate(target.node.id, { dependencies: [previousId] });
                  }
                }
              };



              const selectedService =
                serviceCatalog.find((service) => service.id === row.node.serviceCatalogId) ?? null;



              const serviceMultiplierValue = Number(row.node.serviceMultiplier ?? 1) || 1;



              const serviceBaseHours =
                selectedService && selectedService.hoursBase !== undefined
                  ? Number(selectedService.hoursBase ?? 0)
                  : selectedService && selectedService.hours !== undefined
                  ? Number(selectedService.hours ?? 0)
                  : null;



              const computedServiceHours =
                typeof row.node.serviceHours === "number"
                  ? row.node.serviceHours
                  : serviceBaseHours !== null
                  ? serviceBaseHours * serviceMultiplierValue
                  : null;



              const parentRow = row.parentId ? rowMap.get(row.parentId) : null;



              const siblingsAtLevel = parentRow ? parentRow.node.children ?? [] : treeNodes;



              const currentLevelIndex = siblingsAtLevel.findIndex((child: any) => child.id === row.node.id);



              const canLevelUp = Boolean(parentRow);



              const canLevelDown = currentLevelIndex > 0;



              const limitedLevel = Math.max(0, Math.min(visualLevel, 4));



              const levelClass = `level-${limitedLevel}`;



              const isEditingTitle = editingNodeId === row.node.id;



              const normalizedStatus = normalizeStatus(row.node.status);
              const statusClass = STATUS_CLASS[normalizedStatus] ?? STATUS_CLASS.default;
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              const endDateOnly = toLocalDateOnly(effectiveEndDate);
              const daysToEnd = endDateOnly ? Math.round((endDateOnly.getTime() - today.getTime()) / MS_IN_DAY) : null;
              const isEndDateOverdue = Boolean(
                endDateOnly && endDateOnly.getTime() < today.getTime() && normalizedStatus !== "Finalizado"
              );
              const isEndDateSoon = Boolean(
                !isEndDateOverdue && (daysToEnd === 1 || daysToEnd === 0) && normalizedStatus !== "Finalizado"
              );
              const isDoneStatus = normalizedStatus === "Finalizado";
              const isInProgressStatus = normalizedStatus === "Em andamento";
              const durationInDays = calcDurationInDays(effectiveStartDate, effectiveEndDate);
              const isStatusPickerOpen = statusPickerId === row.node.id;
              const priorityValue = normalizePriorityValue(
                row.node.priority ?? row.node.prioridade ?? row.node.task_priority
              );
              const priorityTone = getPriorityTone(priorityValue);



              const progressValue = progressMap.get(row.node.id) ?? 0;



              const isRootLevel = visualLevel === 0;
              const formattedLevel = `${displayLevel}`;



              return (



                <SortableRow
                  key={row.node.id}
                  id={row.node.id}
                  className={`wbs-row level-${limitedLevel} ${isActive ? "is-active" : ""}`}
                  data-progress={progressValue}
                  data-node-id={row.node.id}
                >
                  {({ attributes, listeners, isDragging }) => (



                    <>
                      <td className="px-1 py-2 text-center align-middle">
                        <button
                          type="button"
                          className="wbs-drag-handle"
                          disabled={!canEdit}
                          onClick={(event) => event.stopPropagation()}
                          {...attributes}
                          {...listeners}
                          data-dragging={isDragging || undefined}
                          aria-label="Arrastar para reordenar"
                        >
                          ::
                        </button>
                      </td>

                      <td className="px-1 py-2 text-center align-middle">
                        <input
                          type="checkbox"
                          aria-label={`Selecionar tarefa ${displayId}`}
                          checked={selectedTaskIds.includes(row.node.id)}
                          onChange={(event) => {
                            event.stopPropagation();
                            handleSelectRow(event.target.checked, row.node.id);
                          }}
                          onClick={(event) => event.stopPropagation()}
                        />
                      </td>

                    <td className="px-1 py-2 text-center align-middle text-[11px] text-slate-700">{displayId}</td>
                    <td className="px-1 py-2 text-center align-middle">
                      <button
                        type="button"
                        className="wbs-chat-button relative inline-flex h-7 min-w-[40px] items-center justify-center gap-1 rounded-full border border-slate-200 bg-white px-2 text-[11px] text-slate-700 hover:bg-slate-50 transition"
                        aria-label={`Comentários da tarefa ${displayId}`}
                        onClick={(event) => {
                          event.stopPropagation();
                          setOpenChatTaskId(row.node.id);
                        }}
                      >
                        <ChatIcon />
                        <span className="text-xs font-medium text-slate-600">
                          {chatCounts[row.node.id] ?? row.node.comments?.length ?? 0}
                        </span>
                        {(chatCounts[row.node.id] ?? row.node.comments?.length ?? 0) > 0 && (
                          <span className="absolute -top-[3px] -right-[3px] h-2.5 w-2.5 rounded-full bg-red-500 border border-white shadow-sm" />
                        )}
                      </button>
                    </td>



                    <td className="px-2 py-2 text-center align-middle w-[80px]">
                      <div
                        style={{
                          display: "inline-flex",
                          flexDirection: "row",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "6px",
                          lineHeight: 1
                        }}
                    >
                      <button
                        type="button"
                        onClick={(event) => handleLevelAdjust(event, row.node.id, "up")}
                        disabled={!canEdit}
                        style={{
                          border: "none",
                          background: "transparent",
                          padding: 0,
                          margin: 0,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "14px"
                        }}
                      >
                        {"<"}
                      </button>
                        <span
                          style={{
                            minWidth: "12px",
                            textAlign: "center",
                            fontSize: "14px",
                            fontWeight: 600
                          }}
                        >
                          {displayLevel}
                        </span>
                        <button
                          type="button"
                          onClick={(event) => handleLevelAdjust(event, row.node.id, "down")}
                          disabled={!canEdit}
                          style={{
                            border: "none",
                            background: "transparent",
                            padding: 0,
                            margin: 0,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "14px"
                          }}
                        >
                          {"\u003e"}
                        </button>
                      </div>
                    </td>



                    <td className="w-[140px] px-3 py-2 align-middle">



                      <div className={`flex w-full items-center gap-2 flex-1 min-w-[220px] max-w-none wbs-task-name ${visualLevel <= 1 ? "is-phase" : ""} ${levelClass}`}>



                        {row.hasChildren ? (



                          <button



                            type="button"



                            className={`wbs-toggle ${isExpanded ? "is-open" : ""}`}



                            onClick={(event) => handleToggle(event, row.node.id, visualLevel)}



                            aria-label={isExpanded ? "Recolher subtarefas" : "Expandir subtarefas"}



                            aria-expanded={isExpanded}



                          >



                            {">"}



                          </button>



                        ) : (



                          <span className="wbs-toggle placeholder" />



                        )}



                        <div className="flex items-center gap-2 flex-1 min-w-[220px] max-w-none">



                          <span className={`wbs-node-icon ${row.hasChildren ? "is-folder" : "is-task"}`}>



                            {row.hasChildren ? <FolderIcon /> : <TaskIcon />}



                          </span>



                          <div



                            className="wbs-task-text"



                            title={row.node.title ?? "Tarefa sem nome"}



                            onDoubleClick={(event) => handleBeginTitleEdit(event, row.node)}



                          >



                            {isEditingTitle ? (



                              <input



                                className="wbs-title-input"



                                value={editingTitle}



                                onChange={(event) => setEditingTitle(event.target.value)}



                                onBlur={commitTitleEdit}



                                onKeyDown={handleTitleKeyDown}



                                onClick={(event) => event.stopPropagation()}



                                autoFocus



                                placeholder="Nome da tarefa"



                              />



                            ) : (



                              <>



                                <span
                                  className={clsx(
                                    "wbs-task-text",
                                    row.node.level === 0 ? "font-semibold" : "font-normal"
                                  )}
                                >
                                  {row.node.title ?? row.node.name ?? "Tarefa sem nome"}
                                </span>






                              </>



                            )}



                          </div>



                        </div>



                      </div>



                    </td>



                    <td className="px-3 py-2 align-middle wbs-status-cell">
                      <div className="wbs-inline-picker">
                        <button
                          type="button"
                          className={clsx("wbs-status-select wbs-choice-trigger", statusClass)}
                          onClick={(event) => handleStatusToggle(event, row.node.id)}
                          disabled={!canEdit}
                          aria-label="Alterar situação da tarefa"
                          aria-haspopup="listbox"
                          aria-expanded={isStatusPickerOpen}
                        >
                          <span className="wbs-choice-trigger__text">{normalizedStatus}</span>
                          <span className="wbs-choice-trigger__caret" aria-hidden="true">
                            v
                          </span>
                        </button>
                        {isStatusPickerOpen && (
                          <div
                            className={clsx(
                              "wbs-choice-menu wbs-choice-menu--status",
                              statusPickerOpenUpId === row.node.id && "wbs-choice-menu--up"
                            )}
                            role="listbox"
                            aria-label="Opções de status"
                          >
                            {STATUS_ORDER.map((statusOption) => {
                              const tone = STATUS_TONE[statusOption];
                              const isSelected = normalizedStatus === statusOption;
                              return (
                                <button
                                  key={statusOption}
                                  type="button"
                                  role="option"
                                  aria-selected={isSelected}
                                  className={clsx(
                                    "wbs-choice-option",
                                    `wbs-choice-option--${tone}`,
                                    isSelected && "is-selected"
                                  )}
                                  onClick={(event) => handleStatusChange(event, row.node.id, statusOption)}
                                >
                                  {statusOption}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </td>

                    <td className="px-3 py-2 align-middle wbs-priority-cell">
                      <div className="wbs-inline-picker">
                        <button
                          type="button"
                          className={clsx("wbs-priority-select wbs-choice-trigger", `wbs-priority-${priorityTone}`)}
                          onClick={(event) => handlePriorityToggle(event, row.node.id)}
                          disabled={!canEdit}
                          aria-label="Alterar prioridade da tarefa"
                          aria-haspopup="listbox"
                          aria-expanded={priorityPickerId === row.node.id}
                        >
                          <span className="wbs-choice-trigger__text">
                            {PRIORITY_OPTIONS.find((option) => option.value === priorityValue)?.label ?? "Média"}
                          </span>
                          <span className="wbs-choice-trigger__caret" aria-hidden="true">
                            v
                          </span>
                        </button>
                        {priorityPickerId === row.node.id && (
                          <div
                            className={clsx(
                              "wbs-choice-menu wbs-choice-menu--priority",
                              priorityPickerOpenUpId === row.node.id && "wbs-choice-menu--up"
                            )}
                            role="listbox"
                            aria-label="Opções de prioridade"
                          >
                            {PRIORITY_OPTIONS.map((option) => {
                              const optionTone = getPriorityTone(option.value);
                              const isSelected = priorityValue === option.value;
                              return (
                                <button
                                  key={option.value}
                                  type="button"
                                  role="option"
                                  aria-selected={isSelected}
                                  className={clsx(
                                    "wbs-choice-option",
                                    `wbs-choice-option--${optionTone}`,
                                    isSelected && "is-selected"
                                  )}
                                  onClick={(event) => handlePriorityChange(event, row.node.id, option.value)}
                                >
                                  {option.label}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </td>



                    <td className="wbs-date-col wbs-date-col-start px-2 py-2 align-middle w-[200px]">
                      <div className="wbs-date-input-wrapper">
                        <CleanDatePicker
                          value={formatDateInputValue(effectiveStartDate)}
                          onChange={(nextValue) => handleDateFieldChange(row.node.id, "startDate", nextValue)}
                          placeholder="dd/mm/aaaa"
                          className="wbs-date-input"
                          disabled={!canEdit || autoDateFromChildren}
                          title={autoDateFromChildren ? "Resumo automático do nível 1 com base nos filhos." : undefined}
                        />
                      </div>
                    </td>



                    <td className="wbs-date-col wbs-date-col-end px-2 py-2 align-middle w-[200px]">
                      <div className="wbs-date-input-wrapper">
                        <CleanDatePicker
                          value={formatDateInputValue(effectiveEndDate)}
                          onChange={(nextValue) => handleDateFieldChange(row.node.id, "endDate", nextValue)}
                          placeholder="dd/mm/aaaa"
                          className={clsx(
                            "wbs-date-input",
                            isEndDateOverdue && "wbs-date-input--overdue",
                            !isEndDateOverdue && isEndDateSoon && "wbs-date-input--warning",
                            isDoneStatus && "wbs-date-input--done",
                            !isDoneStatus && !isEndDateOverdue && isInProgressStatus && "wbs-date-input--progress"
                          )}
                          disabled={!canEdit || autoDateFromChildren}
                          title={autoDateFromChildren ? "Resumo automático do nível 1 com base nos filhos." : undefined}
                        />
                        {isEndDateOverdue && <span className="wbs-date-alert">!</span>}
                        {!isEndDateOverdue && isEndDateSoon && <span className="wbs-date-clock">{"\u23F0"}</span>}
                        {isDoneStatus && <span className="wbs-date-check">{"\u2713"}</span>}
                        {!isDoneStatus && !isEndDateOverdue && isInProgressStatus && (
                          <span className="wbs-date-progress">{"\u25B6"}</span>
                        )}
                      </div>
                    </td>

                    <td
                      className="w-[120px] px-2 py-2 align-middle wbs-quantity-cell wbs-duration-cell"
                      data-duration-label={durationInDays === 1 ? "dia" : "dias"}
                    >
                      <input
                        type="number"
                        min={1}
                        step={1}
                        value={durationInputValue}
                        onChange={(event) => handleDurationInputChange(row.node.id, event.target.value)}
                        onClick={(event) => event.stopPropagation()}
                        className="wbs-duration-input"
                        disabled={!canEdit || autoDateFromChildren}
                        title={autoDateFromChildren ? "Duracao calculada automaticamente pelos filhos." : undefined}
                        aria-label="Quantidade de dias"
                      />
                    </td>



                    <td className="px-4 py-2 align-middle min-w-[180px]">
                      <select
                        className="wbs-responsible-select"
                        value={responsibleMembershipId}
                        disabled={!canEdit}
                        onClick={(event) => event.stopPropagation()}
                        onChange={(event) => onChangeResponsible?.(row.node.id, event.target.value || null)}
                      >
                        <option value="">Sem Responsável</option>
                        {members.map((member) => (
                          <option key={member.id} value={member.id}>
                            {member.name ?? member.email ?? member.userId}
                          </option>
                        ))}
                      </select>
                    </td>



                    <td className="px-3 py-2 align-middle min-w-[200px]">
                      <select
                        className="wbs-service-select"
                        value={row.node.serviceCatalogId ?? ""}
                        disabled={!canEdit || !serviceCatalog?.length}
                        title={
                          serviceCatalog?.length
                            ? "Selecione um serviço"
                            : "Use 'Importar serviços' para carregar o catálogo"
                        }
                        onClick={(event) => event.stopPropagation()}
                        onChange={(event) => {
                          event.stopPropagation();
                          const newServiceId = event.target.value || null;
                          const catalogItem = serviceCatalog.find((service) => service.id === newServiceId);
                          const baseHours = catalogItem
                            ? Number(catalogItem.hoursBase ?? catalogItem.hours ?? 0)
                            : null;
                          const hours =
                            baseHours !== null && baseHours !== undefined
                              ? baseHours * (Number(serviceMultiplierValue) || 1)
                              : null;
                          onUpdate(row.node.id, {
                            serviceCatalogId: newServiceId,
                            serviceMultiplier: serviceMultiplierValue,
                            serviceHours: hours ?? undefined
                          });
                        }}
                        >
                        <option value="">Sem serviço</option>
                        {serviceCatalog?.length === 0 ? (
                          <option value="" disabled>
                            Catálogo não configurado
                          </option>
                        ) : (
                          serviceCatalog.map((service) => {
                            const base = service.hoursBase ?? service.hours ?? null;
                            const label =
                              base !== null && base !== undefined ? `${service.name} (${base}h)` : service.name;
                            return (
                              <option key={service.id} value={service.id} title={label}>
                                {label}
                              </option>
                            );
                          })
                        )}
                      </select>
                    </td>



                    <td className="px-3 py-2 align-middle w-[110px]">
                      <input
                        type="number"
                        min={1}
                        step={1}
                        className="wbs-multiplier-input"
                        value={serviceMultiplierValue}
                        disabled={!canEdit}
                        onClick={(event) => event.stopPropagation()}
                        onChange={(event) => {
                          event.stopPropagation();
                          const value = Math.max(1, Number(event.target.value) || 1);
                          const catalogItem = row.node.serviceCatalogId
                            ? serviceCatalog.find((service) => service.id === row.node.serviceCatalogId)
                            : null;
                          const baseHours = catalogItem
                            ? Number(catalogItem.hoursBase ?? catalogItem.hours ?? 0)
                            : null;
                          const hours = baseHours !== null && baseHours !== undefined ? baseHours * value : null;
                          onUpdate(row.node.id, {
                            serviceCatalogId: row.node.serviceCatalogId ?? null,
                            serviceMultiplier: value,
                            serviceHours: hours ?? undefined,
                          });
                        }}
                      />
                    </td>



                    <td className="px-3 py-2 align-middle text-center">
                      <span className="wbs-hr-badge">
                        {computedServiceHours !== null && computedServiceHours !== undefined
                          ? `${Math.max(0, Math.round(computedServiceHours * 100) / 100)}h`
                          : "-"}
                      </span>
                    </td>



                    <td className="wbs-dependencies-cell w-[150px] px-3 py-2 align-middle">
                      {autoDateFromChildren ? (
                        <span
                          className="wbs-dependencies-placeholder"
                          aria-hidden="true"
                          title="Linha pai de resumo automático."
                        >
                          &nbsp;
                        </span>
                      ) : (
                        <DependenciesDropdown
                          options={dependencyOptionsList}
                          selectedIds={dependencyBadges}
                          onChange={(newSelected) => {
                            if (autoDateFromChildren) return;
                            onUpdate(row.node.id, { dependencies: newSelected });
                          }}
                          onApplyDownChain={autoDateFromChildren ? undefined : applyDependencyDownChain}
                          currentTaskName={row.node.title ?? row.node.name ?? "Tarefa sem nome"}
                          currentTaskCode={displayId}
                          disabled={!canEdit || autoDateFromChildren}
                          disabledReason={
                            !canEdit
                              ? "Você não possui permissão para editar dependências."
                              : "Tarefa com filhos e resumida automaticamente nao pode ter dependencia."
                          }
                        />
                      )}
                    </td>



                    <td className="wbs-details-cell w-[150px] px-3 py-2 align-middle text-center">

                      <div className="wbs-details-actions">

                        <button
                          type="button"
                          className={`wbs-details-button ${isActive ? "is-active" : ""}`}
                          onClick={(event) => handleDetailsButton(event, row.node.id)}
                          aria-label="Ver detalhes da tarefa"
                        >

                          <DetailsIcon />

                          <span className="details-label">Detalhes</span>

                        </button>
                      </div>

                    </td>



                    </>
                  )}
                </SortableRow>



              );



            })}
            {canCreate && typeof onCreate === "function" && selectedProjectId && selectedProjectId !== "all" ? (
              <tr className="wbs-create-row" data-node-id="create-new-row">
                <td colSpan={17}>
                  <button
                    type="button"
                    className="wbs-create-row__button"
                    onClick={handleCreateBottomTask}
                    disabled={isCreatingBottomTask}
                  >
                    {isCreatingBottomTask ? "Criando tarefa..." : "+ Criar nova tarefa"}
                  </button>
                </td>
              </tr>
            ) : null}



            </tbody>
          </SortableContext>


          </table>

        </div>
      </DndContext>

      {selectedTaskIds.length > 0 && (
        <div className="wbs-bulk-bar">
          <div className="wbs-bulk-actions">
            <button type="button" className="btn-secondary" onClick={() => setSelectedTaskIds([])}>
              Limpar seleção
            </button>
            {canDelete ? (
              <button type="button" className="btn-danger-ghost" onClick={handleBulkTrash}>
                Enviar para lixeira
              </button>
            ) : null}
          </div>
          <span className="wbs-bulk-info">{selectedTaskIds.length} selecionada(s)</span>
        </div>
      )}

      {openMenuId && menuPosition && activeMenuNode &&
        createPortal(
          <div
            className="wbs-actions-menu-overlay"
            style={{
              position: "fixed",
              top: menuPosition.top,
              left: menuPosition.left,
              zIndex: 9999,
              width: menuPosition.width
            }}
            ref={menuRef}
          >
            <div className="wbs-actions-menu">
              {[
                { label: "Subir tarefa", action: "MOVE_UP", allowed: canEdit },
                { label: "Descer tarefa", action: "MOVE_DOWN", allowed: canEdit },
                { label: "Adicionar subtarefa", action: "ADD_CHILD", allowed: canCreate && typeof onCreate === "function" },
                { label: "Duplicar", action: "DUPLICATE", allowed: canCreate },
                { label: "Enviar para lixeira", action: "TRASH", allowed: canDelete }
              ]
                .filter((item) => item.allowed)
                .map((item) => (
                <button
                  type="button"
                  key={item.action}
                  className="wbs-actions-item"
                  onClick={(event) => handleMenuAction(event, item.action as RowAction, activeMenuNode)}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>,
          document.body
        )}

    </div>

    {openChatRow && (
      <div className="gp-modal-backdrop" onClick={() => setOpenChatTaskId(null)}>
        <div
          className="gp-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="wbs-chat-title"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="gp-modal-header wbs-chat-header">
            <div className="wbs-chat-title-wrapper">
              <h2 id="wbs-chat-title" className="wbs-chat-title">
                {openChatRow.node.title ?? "Tarefa"}
              </h2>
              <p className="wbs-chat-subtitle">
                Tarefa {openChatRow.node.wbsCode ?? openChatRow.displayId}
              </p>
            </div>
            <div className="wbs-chat-header-actions">
              <div className="wbs-chat-pills">
                <span className={`wbs-chat-pill wbs-chat-pill--${chatStatusTone}`}>
                  {chatStatus ?? "Status"}
                </span>
                <span className={`wbs-chat-pill wbs-chat-pill--${chatPriorityTone}`}>
                  {chatPriorityLabel}
                </span>
              </div>
              <button
                type="button"
                className="gp-modal-close"
                aria-label="Fechar"
                onClick={() => setOpenChatTaskId(null)}
              >
                X
              </button>
            </div>
          </div>
          <div className="gp-modal-body wbs-chat-body">
            <div className="wbs-chat-messages">
              {isChatLoading && <p className="wbs-chat-empty">Carregando comentários...</p>}
              {!isChatLoading &&
                chatMessagesForModal.map((message: WbsComment) => {
                  const isAuthor = Boolean(currentUserId && message.authorId && message.authorId === currentUserId);
                  const isMe =
                    Boolean(currentUserId && message.authorId && message.authorId === currentUserId) ||
                    (currentUserName &&
                      message.authorName &&
                      message.authorName.trim().toLowerCase() === currentUserName.trim().toLowerCase());
                  return (
                  <div
                    key={message.id}
                    className={`wbs-chat-message ${isMe ? "is-me" : "is-other"}`}
                  >
                    <div className="wbs-chat-avatar">{getInitials(message.authorName ?? "Autor")}</div>
                    <div className="wbs-chat-bubble">
                      <div className="wbs-chat-message__meta">
                        <div className="wbs-chat-meta-left">
                          <span className="wbs-chat-author">{message.authorName ?? "Autor"}</span>
                          <span className="wbs-chat-time">
                            {message.createdAt
                              ? new Date(message.createdAt).toLocaleString("pt-BR", {
                                  day: "2-digit",
                                  month: "2-digit",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit"
                                })
                              : ""}
                          </span>
                        </div>
                        {isAuthor && (
                          <div className="wbs-chat-message-actions">
                            <button type="button" onClick={() => handleStartEditComment(message)}>
                              Editar
                            </button>
                            <button type="button" onClick={() => handleDeleteComment(message.id)}>
                              Excluir
                            </button>
                          </div>
                        )}
                      </div>
                      {editingCommentId === message.id ? (
                        <div className="wbs-chat-edit">
                          <div
                            className="wbs-chat-editor wbs-chat-editor--inline"
                            contentEditable
                            role="textbox"
                            aria-multiline="true"
                            suppressContentEditableWarning
                            onInput={(event) => {
                              editingDraftRef.current = (event.target as HTMLDivElement).innerHTML;
                            }}
                            dangerouslySetInnerHTML={{ __html: editingDraftRef.current }}
                          />
                          <div className="wbs-chat-edit-actions">
                            <button type="button" className="btn-secondary" onClick={handleCancelEditComment}>
                              Cancelar
                            </button>
                            <button type="button" className="btn-primary" onClick={handleSaveEditComment}>
                              Salvar
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div
                          className="wbs-chat-text"
                          dangerouslySetInnerHTML={{ __html: renderChatMessage(message.message) }}
                        />
                      )}
                    </div>
                  </div>
                );
                })}
              {!isChatLoading && chatMessagesForModal.length === 0 && (
                <p className="wbs-chat-empty">Nenhum comentário ainda.</p>
              )}
              {chatError && <p className="error-text">{chatError}</p>}
            </div>
            <div className="wbs-chat-composer">
              <div className="wbs-chat-toolbar">
                <div className="wbs-chat-textstyle">
                  <button
                    type="button"
                    className="wbs-chat-tool wbs-chat-tool--text"
                    onMouseDown={handleChatToolMouseDown}
                    onClick={() => setShowTextStyleMenu((prev) => !prev)}
                  >
                    T<span>Texto</span>
                  </button>
                  {showTextStyleMenu && (
                    <div className="wbs-chat-textstyle-menu">
                      <button
                        type="button"
                        onMouseDown={handleChatToolMouseDown}
                        onClick={() => applyTextStyle("p")}
                      >
                        Normal text
                      </button>
                      <button
                        type="button"
                        onMouseDown={handleChatToolMouseDown}
                        onClick={() => applyTextStyle("h1")}
                      >
                        Heading 1
                      </button>
                      <button
                        type="button"
                        onMouseDown={handleChatToolMouseDown}
                        onClick={() => applyTextStyle("h2")}
                      >
                        Heading 2
                      </button>
                      <button
                        type="button"
                        onMouseDown={handleChatToolMouseDown}
                        onClick={() => applyTextStyle("h3")}
                      >
                        Heading 3
                      </button>
                      <button
                        type="button"
                        onMouseDown={handleChatToolMouseDown}
                        onClick={() => applyTextStyle("h4")}
                      >
                        Heading 4
                      </button>
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  className={`wbs-chat-tool is-bold ${chatFormatState.bold ? "is-active" : ""}`}
                  onMouseDown={handleChatToolMouseDown}
                  onClick={() => handleChatTool("bold")}
                >
                  B
                </button>
                <button
                  type="button"
                  className={`wbs-chat-tool is-italic ${chatFormatState.italic ? "is-active" : ""}`}
                  onMouseDown={handleChatToolMouseDown}
                  onClick={() => handleChatTool("italic")}
                >
                  I
                </button>
                <button
                  type="button"
                  className={`wbs-chat-tool is-underline ${chatFormatState.underline ? "is-active" : ""}`}
                  onMouseDown={handleChatToolMouseDown}
                  onClick={() => handleChatTool("underline")}
                >
                  U
                </button>
                <span className="wbs-chat-sep" />
                <button
                  type="button"
                  className={`wbs-chat-tool ${chatFormatState.bullets ? "is-active" : ""}`}
                  onMouseDown={handleChatToolMouseDown}
                  onClick={() => handleChatTool("bullets")}
                >
                  •
                </button>
                <button
                  type="button"
                  className={`wbs-chat-tool ${chatFormatState.numbered ? "is-active" : ""}`}
                  onMouseDown={handleChatToolMouseDown}
                  onClick={() => handleChatTool("numbered")}
                >
                  1.
                </button>
                <button
                  type="button"
                  className="wbs-chat-tool"
                  onMouseDown={handleChatToolMouseDown}
                  onClick={() => handleChatTool("checklist")}
                >
                  ?
                </button>
                <div className="wbs-chat-textcolor">
                  <button
                    type="button"
                    className="wbs-chat-tool wbs-chat-tool--color"
                    onMouseDown={handleChatToolMouseDown}
                    onClick={() => setShowTextColorPicker((prev) => !prev)}
                  >
                    A
                  </button>
                  {showTextColorPicker && (
                    <div className="wbs-chat-color-menu">
                      {[
                        "#111827",
                        "#1f3b6d",
                        "#0f766e",
                        "#15803d",
                        "#f59e0b",
                        "#dc2626",
                        "#7c3aed",
                        "#6b7280",
                        "#2563eb",
                        "#0891b2",
                        "#16a34a",
                        "#f97316",
                        "#ef4444",
                        "#9333ea",
                        "#111827",
                        "#e2e8f0"
                      ].map((color) => (
                        <button
                          key={color}
                          type="button"
                          className="wbs-chat-color"
                          style={{ background: color }}
                          onClick={() => setTextColor(color)}
                        />
                      ))}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  className="wbs-chat-tool"
                  onMouseDown={handleChatToolMouseDown}
                  onClick={() => handleChatTool("link")}
                >
                  ??
                </button>
                <button
                  type="button"
                  className="wbs-chat-tool"
                  onMouseDown={handleChatToolMouseDown}
                  onClick={() => handleChatTool("mention")}
                >
                  @
                </button>
                <button
                  type="button"
                  className="wbs-chat-tool"
                  onMouseDown={handleChatToolMouseDown}
                  onClick={() => setShowEmojiPicker((prev) => !prev)}
                >
                  ??
                </button>
              </div>
              {showEmojiPicker && (
                <div className="wbs-chat-emoji-picker">
                  {emojiList.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      className="wbs-chat-emoji"
                      onClick={() => insertEmoji(emoji)}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
              <div
                ref={chatEditorRef}
                className="wbs-chat-editor"
                contentEditable
                role="textbox"
                aria-multiline="true"
                data-placeholder="Escreva um comentário… use @ para mencionar alguém"
                onInput={(event) => {
                  setChatDraft((event.target as HTMLDivElement).innerHTML);
                  updateChatFormatState();
                }}
                onKeyUp={updateChatFormatState}
                onMouseUp={updateChatFormatState}
              />
              <div className="wbs-chat-actions">
                <button type="button" className="btn-secondary" onClick={() => setOpenChatTaskId(null)}>
                  Fechar
                </button>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={handleSendChat}
                  disabled={!getPlainTextFromHtml(chatDraft) || isChatLoading}
                >
                  Enviar
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
  )}
    {pendingDeleteCommentId && (
      <div className="gp-modal-backdrop" onClick={() => setPendingDeleteCommentId(null)}>
        <div
          className="gp-modal gp-modal--compact"
          role="dialog"
          aria-modal="true"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="gp-modal-header">
            <h2>Excluir comentário</h2>
            <button
              type="button"
              className="gp-modal-close"
              aria-label="Fechar"
              onClick={() => setPendingDeleteCommentId(null)}
            >
              X
            </button>
          </div>
          <div className="gp-modal-body">
            <p className="muted">Tem certeza que deseja excluir este comentário? Esta ação não pode ser desfeita.</p>
            <div className="wbs-chat-confirm-actions">
              <button type="button" className="btn-secondary" onClick={() => setPendingDeleteCommentId(null)}>
                Cancelar
              </button>
              <button type="button" className="btn-danger" onClick={confirmDeleteComment} disabled={isChatLoading}>
                Excluir
              </button>
            </div>
          </div>
        </div>
      </div>
    )}
    </>
  );

};



export const GanttTimeline = ({ tasks, milestones: _milestones }: { tasks: any[]; milestones: any[] }) => {
  const [viewDate, setViewDate] = useState(() => new Date());

  const monthStart = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
  const monthEnd = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0);
  const daysInMonth = monthEnd.getDate();
  const dayList = Array.from({ length: daysInMonth }, (_, index) => {
    const date = new Date(monthStart);
    date.setDate(index + 1);
    return date;
  });
  const monthLabel = monthStart.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  const today = new Date();
  const todayKey = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const todayIndex = dayList.findIndex((date) => date.getTime() === todayKey);

  const visibleTasks = tasks.filter((task) => {
    if (!task.startDate && !task.endDate) return false;
    const startDate = task.startDate ? new Date(task.startDate) : task.endDate ? new Date(task.endDate) : null;
    const endDate = task.endDate ? new Date(task.endDate) : startDate;
    if (!startDate || !endDate) return false;
    return startDate <= monthEnd && endDate >= monthStart;
  });
  const hasVisibleTasks = visibleTasks.length > 0;

  const statusTone = (status?: string | null) => {
    const normalized = normalizeStatus(status ?? "");
    if (normalized === "Em andamento") return "in-progress";
    if (normalized === "Finalizado") return "done";
    if (normalized === "Em atraso") return "late";
    if (normalized === "Em risco") return "risk";
    if (normalized === "Homologação") return "review";
    if (normalized === "Não iniciado") return "not-started";
    return "not-started";
  };

  const clampIndex = (value: number) => Math.min(Math.max(value, 0), daysInMonth - 1);

  const getBarStyle = (start?: string | null, end?: string | null) => {
    const startDate = start ? new Date(start) : end ? new Date(end) : null;
    const endDate = end ? new Date(end) : startDate;
    if (!startDate || !endDate) return { left: "0%", width: "0%" };
    const startIndex = clampIndex(Math.floor((startDate.getTime() - monthStart.getTime()) / 86400000));
    const endIndex = clampIndex(Math.floor((endDate.getTime() - monthStart.getTime()) / 86400000));
    const left = (startIndex / daysInMonth) * 100;
    const width = ((Math.max(endIndex, startIndex) - startIndex + 1) / daysInMonth) * 100;
    return { left: `${left}%`, width: `${width}%` };
  };

  return (
    <div className="timeline-board">
      <div className="timeline-toolbar">
        <div className="timeline-toolbar__nav">
          <button
            type="button"
            className="timeline-btn timeline-btn--icon"
            onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))}
            aria-label="Mês anterior"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M15 18 9 12l6-6" />
            </svg>
          </button>
          <button
            type="button"
            className="timeline-btn timeline-btn--icon"
            onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))}
            aria-label="Próximo mês"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M9 6l6 6-6 6" />
            </svg>
          </button>
          <button type="button" className="timeline-btn timeline-btn--ghost" onClick={() => setViewDate(new Date())}>
            Hoje
          </button>
        </div>
        <div className="timeline-toolbar__title">
          <span className="timeline-toolbar__icon" aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <path d="M16 2v4" />
              <path d="M8 2v4" />
              <path d="M3 10h18" />
            </svg>
          </span>
          {monthLabel}
        </div>
        <div className="timeline-toolbar__legend">
          <span className="timeline-legend-item is-not-started">Não Iniciado</span>
          <span className="timeline-legend-item is-in-progress">Em Andamento</span>
          <span className="timeline-legend-item is-done">Concluído</span>
          <span className="timeline-legend-item is-late">Atrasado</span>
          <span className="timeline-legend-item is-risk">Em risco</span>
          <span className="timeline-legend-item is-review">Homologação</span>
        </div>
      </div>

      <div
        className="timeline-grid"
        style={{
          ["--days" as any]: daysInMonth,
          ["--today-index" as any]: Math.max(todayIndex, 0),
          ["--label-width" as any]: "240px"
        }}
      >
        <div className="timeline-header">
          <div className="timeline-header__label">Tarefa</div>
          <div className="timeline-header__days">
            {dayList.map((date) => {
              const isToday = date.getTime() === todayKey;
              const dayName = date.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", "");
              return (
                <div key={date.toISOString()} className={`timeline-day ${isToday ? "is-today" : ""}`}>
                  <span>{dayName}</span>
                  <strong>{String(date.getDate()).padStart(2, "0")}</strong>
                </div>
              );
            })}
          </div>
        </div>

        <div className="timeline-body">
          {todayIndex >= 0 ? <span className="timeline-today-marker" aria-hidden="true" /> : null}
          {hasVisibleTasks ? (
            visibleTasks.map((task: any) => (
              <div key={task.id} className="timeline-row">
              <div className="timeline-row__label">
                <strong>{task.title}</strong>
                <span>{normalizeStatus(task.status ?? "") || "Sem status"}</span>
                {task.projectName ? <span className="timeline-row__project">{task.projectName}</span> : null}
              </div>
                <div className="timeline-row__track">
                  <div className={`timeline-bar ${statusTone(task.status)}`} style={getBarStyle(task.startDate, task.endDate)}>
                    <span>{task.title}</span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="timeline-row timeline-row--empty">
              <div className="timeline-row__label">
                <strong>Nenhuma tarefa neste mês</strong>
                <span>Defina datas para visualizar o cronograma.</span>
              </div>
              <div className="timeline-row__track" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};



type ProjectDetailsTabsProps = {



  projectMeta: PortfolioProject | null;



  projectLoading?: boolean;



  onEditProject?: () => void;



  onAddTask?: () => void;



  summary: any;



  summaryError: string | null;



  filters: { rangeDays: number };



  onRangeChange: (range: number) => void;



  myTasks: any[];



  members: any[];



  membersError: string | null;



  attachments: any[];



  attachmentsError: string | null;



  attachmentsLoading: boolean;

  reportMetrics: any | null;

  reportMetricsError: string | null;

  reportMetricsLoading: boolean;

  boardColumns: any[];

  kanbanColumns: KanbanColumn[];

  boardError: string | null;

  onCreateTask: (event: FormEvent<HTMLFormElement>) => Promise<boolean>;



  onReloadBoard?: () => Promise<void>;



  onDragTask: (result: DropResult) => void;



  newTaskTitle: string;



  onTaskTitleChange: (value: string) => void;



  newTaskColumn: string;



  onTaskColumnChange: (value: string) => void;

  newTaskStartDate: string;

  onTaskStartDateChange: (value: string) => void;

  newTaskEndDate: string;

  onTaskEndDateChange: (value: string) => void;

  newTaskAssignee: string;

  onTaskAssigneeChange: (value: string) => void;

  newTaskEstimateHours: string;

  onTaskEstimateHoursChange: (value: string) => void;

  wbsNodes: any[];

  wbsError: string | null;

  serviceCatalog?: Array<{
    id: string;
    name: string;
    description?: string | null;
    hoursBase?: number | null;
    hours?: number | null;
  }>;
  serviceCatalogError?: string | null;
  onImportServiceCatalog?: (file: File | null) => Promise<any>;
  onCreateServiceCatalog?: (payload: { name: string; hoursBase: number; description?: string | null }) => Promise<any>;
  onUpdateServiceCatalog?: (
    serviceId: string,
    payload: { name?: string; hoursBase?: number; description?: string | null }
  ) => Promise<any>;
  onDeleteServiceCatalog?: (serviceId: string) => Promise<any>;
  onReloadWbs?: () => void;

  onMoveNode: (nodeId: string, parentId: string | null, position: number) => void;

  onUpdateNode: (

    nodeId: string,

    changes: {

      title?: string;

      status?: string;

      startDate?: string | null;

      endDate?: string | null;

      description?: string | null;

      estimateHours?: number | null;

    }

  ) => void;

  selectedNodeId: string | null;

  onSelectNode: (nodeId: string | null) => void;

  comments: any[];



  commentsError: string | null;



  onSubmitComment: (event: FormEvent<HTMLFormElement>) => void;



  commentBody: string;



  onCommentBodyChange: (value: string) => void;



  timeEntryDate: string;



  timeEntryHours: string;



  timeEntryDescription: string;



  timeEntryError: string | null;

  onTimeEntryDateChange: (value: string) => void;

  onTimeEntryHoursChange: (value: string) => void;

  onTimeEntryDescriptionChange: (value: string) => void;

  onLogTime: (event: FormEvent<HTMLFormElement>) => void;

  ganttTasks: any[];

  ganttMilestones: any[];

  ganttError: string | null;

  onKanbanTaskClick?: (task: any) => void;

};





export const ProjectDetailsTabs = ({



  projectMeta,



  projectLoading,



  onEditProject,



  onAddTask,



  summary,



  summaryError,



  filters,



  onRangeChange,



  myTasks,



  members,



  membersError,



  attachments,

  attachmentsError,

  attachmentsLoading,

  reportMetrics,

  reportMetricsError,

  reportMetricsLoading,

  boardColumns,

  kanbanColumns,

  boardError,

  onCreateTask,



  onReloadBoard,



  onDragTask,



  newTaskTitle,



  onTaskTitleChange,



  newTaskColumn,



  onTaskColumnChange,



  newTaskStartDate,



  onTaskStartDateChange,



  newTaskEndDate,



  onTaskEndDateChange,



  newTaskAssignee,



  onTaskAssigneeChange,



  newTaskEstimateHours,



  onTaskEstimateHoursChange,



  wbsNodes,



  wbsError,

  serviceCatalog,

  serviceCatalogError,

  onImportServiceCatalog,
  onCreateServiceCatalog,
  onUpdateServiceCatalog,
  onDeleteServiceCatalog,

  onReloadWbs,

  onMoveNode,



  onUpdateNode,



  selectedNodeId,



  onSelectNode,



  comments,



  commentsError,



  onSubmitComment,



  commentBody,



  onCommentBodyChange,



  timeEntryDate,



  timeEntryHours,



  timeEntryDescription,



  timeEntryError,



  onTimeEntryDateChange,



  onTimeEntryHoursChange,



  onTimeEntryDescriptionChange,

  onLogTime,

  ganttTasks,

  ganttMilestones,

  ganttError,

  onKanbanTaskClick

}: ProjectDetailsTabsProps) => {

  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("overview");





  const tabs = [

    { id: "overview", label: "Viso geral" },

    { id: "edt", label: "EDT" },

    { id: "board", label: "Board" },

    { id: "gantt", label: "Cronograma" },

    { id: "calendar", label: "Calendrio" },

    { id: "docs", label: "Documentos" },

    { id: "activity", label: "Atividade" }

  ];





  const progressPercent = summary?.totals?.total



    ? Math.round((summary.totals.done / summary.totals.total) * 100)



    : 0;



  const circumference = 2 * Math.PI * 54;



  const strokeValue = (progressPercent / 100) * circumference;







  const calendarEvents = useMemo(() => {



    const milestoneEvents = (ganttMilestones ?? [])



      .filter((milestone) => milestone?.dueDate)



      .map((milestone) => ({



        id: milestone.id ?? milestone.name,



        title: milestone.name ?? "Marco",



        date: milestone.dueDate,



        type: "Marco"



      }));







    const taskEvents = (ganttTasks ?? [])



      .filter((task) => task.startDate || task.endDate)



      .slice(0, 6)



      .map((task) => ({



        id: task.id,



        title: task.title,



        date: task.startDate ?? task.endDate,



        type: task.status ?? "Tarefa"



      }));







    return [...milestoneEvents, ...taskEvents].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());



  }, [ganttMilestones, ganttTasks]);







  const activityItems = useMemo(

    () =>

      (comments ?? []).map((comment) => ({

        id: comment.id,

        author: comment.author?.name ?? comment.authorName ?? "Colaborador",

        role: comment.author?.role ?? comment.authorRole ?? "Equipe",

        body: comment.body ?? comment.message,

        createdAt: comment.createdAt ?? new Date().toISOString()

      })),

    [comments]

  );



  const commentTextareaRef = useRef<HTMLTextAreaElement | null>(null);



  const focusCommentComposer = () => {

    if (commentTextareaRef.current) {

      commentTextareaRef.current.focus();

      commentTextareaRef.current.scrollIntoView({ behavior: "smooth", block: "center" });

    }

  };



  const handleAddDocument = () => {

    if (typeof window !== "undefined") {

      window.alert("Integração de upload em breve.");

    }

  };





  const formatShortDate = (value?: string | null) => {
    if (!value) return "-";

    try {
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) return "-";
      const safeDate = new Date(date.getTime() + date.getTimezoneOffset() * 60000);
      return safeDate.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "short"
      });
    } catch {
      return "-";
    }
  };







  const formatFileSize = (value?: number | null) => {
    if (!value) return "-";

    if (value < 1024) return `${value} B`;
    if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
    return `${(value / (1024 * 1024)).toFixed(1)} MB`;
  };







  const renderStatusBadge = (status?: string | null) => {



    if (!status) return <span className="pill pill-neutral">Sem status</span>;



    const normalized = status.toUpperCase();



    const toneMap: Record<string, string> = {



      DONE: "pill-success",



      COMPLETED: "pill-success",



      IN_PROGRESS: "pill-warning",



      PLANNED: "pill-neutral",



      AT_RISK: "pill-danger",



      BLOCKED: "pill-danger"



    };



    const labelMap: Record<string, string> = {



      DONE: "Concludo",



      COMPLETED: "Concludo",



      IN_PROGRESS: "Em andamento",



      PLANNED: "Planejado",



      AT_RISK: "Em risco",



      BLOCKED: "Bloqueado"



    };



    return <span className={`pill ${toneMap[normalized] ?? "pill-neutral"}`}>{labelMap[normalized] ?? status}</span>;



  };







  if (!projectMeta) {



    return (



      <section className="project-details">



        <article className="card">



          <h2>{projectLoading ? "Carregando dados do projeto..." : "Selecione um projeto"}</h2>



          <p className="muted">



            {projectLoading ? "Buscando cards do portfólio para montar o cabeçalho." : "Escolha um projeto no topo para ver os detalhes completos."}



          </p>



        </article>



      </section>



    );



  }







  const overviewHeader = (



    <>



      <div className="project-details__header">



        <div>



          <p className="eyebrow">Detalhes do projeto</p>



          <h2>{projectMeta.projectName}</h2>


          <p className="subtext">
            Código {projectMeta.code ?? "N/A"} · Cliente {projectMeta.clientName ?? "Não informado"}
          </p>



          <div className="project-header__meta">



            {renderStatusBadge(projectMeta.status)}



            <span>Responsável: {projectMeta.responsibleName ?? "Não informado"}</span>



            <span>



              Período: {formatShortDate(projectMeta.startDate)} — {formatShortDate(projectMeta.endDate)}



            </span>



          </div>



        </div>



        <div className="project-header__actions">



          <button



            type="button"



            className="secondary-button project-action project-action--secondary"



            onClick={onEditProject}



            disabled={!onEditProject}



          >



            Editar projeto



          </button>



          <button type="button" className="primary-button project-action project-action--primary" onClick={onAddTask}>



            Adicionar tarefa



          </button>



          <button type="button" className="ghost-button project-action project-action--link">



            Compartilhar



          </button>



        </div>



      </div>







      <div className="tabs">



      {tabs.map((tab) => (



        <button



          key={tab.id}



          type="button"



          className={activeTab === tab.id ? "is-active" : ""}



          onClick={() => {

            if (tab.id === "edt") {

              const targetId = projectMeta?.projectId ?? (projectMeta as any)?.id ?? null;

              if (targetId) {

                navigate(`/projects/${targetId}/edt`);

              }

              return;

            }

          if (tab.id === "board") {

            const targetId = projectMeta?.projectId ?? (projectMeta as any)?.id ?? null;

            if (targetId) {

              navigate(`/projects/${targetId}/board`);

            }

            return;

          }

          if (tab.id === "gantt") {

            const targetId = projectMeta?.projectId ?? (projectMeta as any)?.id ?? null;

            if (targetId) {

              navigate(`/projects/${targetId}/cronograma`);

            }

            return;

          }

          if (tab.id === "docs") {

            const targetId = projectMeta?.projectId ?? (projectMeta as any)?.id ?? null;

            if (targetId) {

              navigate(`/projects/${targetId}/documentos`);

            }

            return;

          }

          if (tab.id === "activity") {

            const targetId = projectMeta?.projectId ?? (projectMeta as any)?.id ?? null;

            if (targetId) {

              navigate(`/projects/${targetId}/atividades`);

            }

            return;

          }

          setActiveTab(tab.id);

        }}



      >



            {tab.label}



          </button>



        ))}



      </div>



    </>



  );







  const overviewContent = (



    <div className="tab-panel">



      <div className="status-grid">



        <article className="card status-card">



          <h3>Progresso geral</h3>



          <div className="progress-ring">



            <svg width="140" height="140">



              <circle cx="70" cy="70" r="54" strokeWidth="12" className="progress-ring__bg" />



              <circle



                cx="70"



                cy="70"



                r="54"



                strokeWidth="12"



                className="progress-ring__value"



                strokeDasharray={`${strokeValue} ${circumference}`}



              />



            </svg>



            <div className="progress-ring__label">



              <strong>{progressPercent}%</strong>



              <span>Concludo</span>



            </div>



          </div>



          <ul className="progress-legend">



            <li>



              <span className="dot dot-done" />



              {summary?.totals?.done ?? 0} Concludas



            </li>



            <li>



              <span className="dot dot-inprogress" />



              {summary?.totals?.inProgress ?? 0} em andamento



            </li>



            <li>



              <span className="dot dot-backlog" />



              {summary?.totals?.backlog ?? 0} backlog



            </li>



          </ul>



        </article>







        <article className="card">



          <div className="card-header">



            <div>



              <h3>Burn-down / Horas</h3>



              <p className="subtext">Visão dos últimos {filters.rangeDays} dias</p>



            </div>



            <label className="inline-select">



              Intervalo



              <select value={filters.rangeDays} onChange={(event) => onRangeChange(Number(event.target.value))}>



                <option value={7}>7</option>



                <option value={14}>14</option>



                <option value={30}>30</option>



              </select>



            </label>



          </div>



          {summaryError && <p className="error-text">{summaryError}</p>}



          {summary ? (



            <div className="chart-grid">



              <div className="chart-card">



                <ResponsiveContainer width="100%" height={200}>



                  <LineChart data={summary.burnDown}>



                    <XAxis dataKey="date" tickFormatter={formatDate} stroke="#94a3b8" />



                    <YAxis stroke="#94a3b8" />



                    <Tooltip



                      contentStyle={{ borderRadius: 12, borderColor: "rgba(12,23,42,0.1)" }}



                      labelStyle={{ fontWeight: 600, color: "#0c2748" }}



                    />



                    <Legend />



                    <Line type="monotone" dataKey="done" stroke="#34d399" strokeWidth={3} dot={{ r: 4 }} />



                    <Line type="monotone" dataKey="remaining" stroke="#f87171" strokeWidth={3} dot={{ r: 4 }} />



                  </LineChart>



                </ResponsiveContainer>



              </div>



              <div className="chart-card">



                <ResponsiveContainer width="100%" height={200}>



                  <BarChart data={summary.timeEntries}>



                    <XAxis dataKey="date" tickFormatter={formatDate} stroke="#94a3b8" />



                    <YAxis stroke="#94a3b8" />



                    <Tooltip



                      contentStyle={{ borderRadius: 12, borderColor: "rgba(12,23,42,0.1)" }}



                      labelStyle={{ fontWeight: 600, color: "#0c2748" }}



                    />



                    <Bar dataKey="hours" fill="#6b4eff" radius={[8, 8, 0, 0]} />



                  </BarChart>



                </ResponsiveContainer>



              </div>



            </div>



          ) : (



            <p className="muted">Selecione um projeto para ver o resumo.</p>



          )}



        </article>



      </div>







      {summary && (



        <div className="summary-stats">



          <div>



            <span>Total</span>



            <strong>{summary.totals.total}</strong>



          </div>



          <div>



            <span>Concludas</span>



            <strong>{summary.totals.done}</strong>



          </div>



          <div>



            <span>Em andamento</span>



            <strong>{summary.totals.inProgress}</strong>



          </div>



          <div>



            <span>Backlog</span>



            <strong>{summary.totals.backlog}</strong>



          </div>



          <div>



            <span>Bloqueadas</span>



            <strong>{summary.totals.blocked}</strong>



          </div>



          <div>



            <span>Atrasadas</span>



            <strong>{summary.overdueTasks}</strong>



          </div>



        </div>



      )}







      <div className="overview-grid">



        <article className="card">



          <div className="card-header">



            <h3>Marcos</h3>



          </div>



          {ganttMilestones?.length ? (



            <ul className="milestone-list">



              {ganttMilestones.slice(0, 4).map((milestone) => (



                <li key={milestone.id}>



                  <div>



                    <strong>{milestone.name}</strong>



                    <span>{formatShortDate(milestone.dueDate)}</span>



                  </div>



                  <span className="pill pill-neutral">{milestone.status ?? "Previsto"}</span>



                </li>



              ))}



            </ul>



          ) : (



            <p className="muted">Nenhum marco cadastrado.</p>



          )}



        </article>







        <article className="card">



          <div className="card-header">



            <h3>Riscos e impedimentos</h3>



          </div>



          <p className="highlight-number">{projectMeta.risksOpen ?? 0}</p>



          <p className="subtext">Riscos abertos</p>



          <p className="muted">Acompanhe o plano de mitigação e distribua responsáveis para cada item crítico.</p>



        </article>







        <article className="card">



          <div className="card-header">



            <h3>Horas registradas</h3>



          </div>



          <p className="highlight-number">



            {Number(projectMeta.hoursTracked ?? summary?.hoursTracked ?? 0).toFixed(1)}h



          </p>



          <p className="subtext">Somatório das últimas entregas</p>



        </article>



      </div>







      <div className="split-grid">



        <article className="card">



          <div className="card-header">



            <h3>Minhas tarefas</h3>



            <button type="button" className="ghost-button">



              Ver todas



            </button>



          </div>



          {myTasks.length ? (



            <ul className="task-list">



              {myTasks.map((task: any) => (



                <li key={task.id}>



                  <div>



                    <strong>{task.title}</strong>



                    <span>{task.column}</span>



                  </div>



                  <span className={`pill ${task.status.toLowerCase()}`}>{task.status}</span>



                </li>



              ))}



            </ul>



          ) : (



            <p className="muted">Nenhuma tarefa atribuída.</p>



          )}



        </article>







        <article className="card">



          <div className="card-header">



            <h3>Equipe</h3>



          </div>



          {membersError && <p className="error-text">{membersError}</p>}



          {members.length ? (



            <ul className="team-list">



              {members.map((member: any) => (



                <li key={member.id}>



                  <div className="avatar">{member.name?.slice(0, 2).toUpperCase()}</div>



                  <div>



                    <strong>{member.name}</strong>



                    <span>{member.role}</span>



                  </div>



                  <span>{member.capacityWeekly ?? 0}h</span>



                </li>



              ))}



            </ul>



          ) : (



            <p className="muted">Nenhum membro vinculado.</p>



          )}



        </article>



      </div>



    </div>



  );
};

export const DashboardLayout = ({
  userEmail,
  organizations,
  selectedOrganizationId,
  onOrganizationChange,
  currentOrgRole,
  currentOrgModulePermissions,
  orgError,
  onSignOut,
  projects,
  selectedProjectId,
  onProjectChange,
  onSelectProject,
  projectLimits,
  projectsError,
  filters,
  onRangeChange,
  summary,
  summaryError,
  members,
  membersError,
  attachments,
  attachmentsError,
  attachmentsLoading,
  reportMetrics,
  reportMetricsError,
  reportMetricsLoading,
  boardColumns,
  kanbanColumns,
  boardError,
  onCreateTask,
  onReloadBoard,
  onDragTask,
  newTaskTitle,
  onTaskTitleChange,
  newTaskColumn,
  onTaskColumnChange,
  newTaskStartDate,
  onTaskStartDateChange,
  newTaskEndDate,
  onTaskEndDateChange,
  newTaskAssignee,
  onTaskAssigneeChange,
  newTaskEstimateHours,
  onTaskEstimateHoursChange,
  wbsNodes,
  wbsError,
  serviceCatalog,
  serviceCatalogError,
  onImportServiceCatalog,
  onCreateServiceCatalog,
  onUpdateServiceCatalog,
  onDeleteServiceCatalog,
  onReloadWbs,
  onMoveNode,
  onUpdateWbsNode,
  onUpdateWbsResponsible,
  onCreateWbsItem,
  selectedNodeId,
  onSelectNode,
  comments,
  commentsError,
  onSubmitComment,
  commentBody,
  onCommentBodyChange,
  timeEntryDate,
  timeEntryHours,
  timeEntryDescription,
  timeEntryError,
  onTimeEntryDateChange,
  onTimeEntryHoursChange,
  onTimeEntryDescriptionChange,
  onLogTime,
  ganttTasks,
  ganttMilestones,
  ganttError,
  portfolio,
  portfolioError,
  portfolioLoading,
  onExportPortfolio,
  onReloadPortfolio,
  onCreateProject,
  onUpdateProject
}: DashboardLayoutProps) => {
  const location = useLocation();
  const eapRouteProjectId = useMemo(() => {
    const match = location.pathname.match(/^\/EAP\/organizacao\/[^/]+\/projeto\/([^/?#]+)/i);
    if (!match?.[1]) return null;
    try {
      return decodeURIComponent(match[1]);
    } catch {
      return match[1];
    }
  }, [location.pathname]);

  const navigate = useNavigate();

  const { signOut } = useAuth();

  const isEapRoute = useMemo(() => location.pathname.toLowerCase().startsWith("/eap"), [location.pathname]);

  const canUseAllProjects = useMemo(() => {
    const allowedPaths = ["/dashboard", "/kanban", "/cronograma", "/orcamento", "/documentos", "/relatorios"];
    const currentPath = location.pathname.toLowerCase();
    return allowedPaths.some((allowed) => currentPath === allowed || currentPath.startsWith(`${allowed}/`));
  }, [location.pathname]);

  const projectMeta = useMemo<PortfolioProject | null>(() => {
    if (!selectedProjectId || selectedProjectId === "all") return null;
    const selectedFromPortfolio = portfolio.find((project) => project.projectId === selectedProjectId) ?? null;
    if (selectedFromPortfolio) return selectedFromPortfolio;
    const selectedFromProjects = projects.find((project) => project.id === selectedProjectId) ?? null;
    if (!selectedFromProjects) return null;
    return {
      projectId: selectedFromProjects.id,
      projectName: selectedFromProjects.name
    };
  }, [portfolio, projects, selectedProjectId]);

  const myTasks = useMemo(() => {
    const source = summary as { myTasks?: unknown } | null;
    return Array.isArray(source?.myTasks) ? source.myTasks : [];
  }, [summary]);

  const normalizedRole =
    currentOrgRole === "OWNER" || currentOrgRole === "ADMIN" || currentOrgRole === "MEMBER" || currentOrgRole === "VIEWER"
      ? currentOrgRole
      : "MEMBER";
  const currentOrgModuleAccess = useMemo(
    () => normalizeModulePermissionsForRole(normalizedRole, currentOrgModulePermissions),
    [normalizedRole, currentOrgModulePermissions]
  );
  const requiredModuleForPath = useMemo(() => resolveModuleFromPath(location.pathname), [location.pathname]);
  const hasAccessToCurrentPath = !requiredModuleForPath || Boolean(currentOrgModuleAccess[requiredModuleForPath]?.view);
  const firstAllowedPath = useMemo(() => {
    for (const item of sidebarNavigation) {
      const moduleKey = sidebarModuleById[item.id] ?? "dashboard";
      if (currentOrgModuleAccess[moduleKey]?.view) {
        return item.path;
      }
    }
    return "/dashboard";
  }, [currentOrgModuleAccess]);
  const blockedModuleLabel = requiredModuleForPath ? moduleLabelByKey[requiredModuleForPath] : "esta área";

  const [isProjectModalOpen, setProjectModalOpen] = useState(false);

  useEffect(() => {
    const needsProject = !selectedProjectId || (selectedProjectId === "all" && !canUseAllProjects);
    if (!isEapRoute || !needsProject) return;
    if (eapRouteProjectId) return;
    if (!projects?.length) return;
    onSelectProject(projects[0].id);
  }, [isEapRoute, selectedProjectId, projects, onSelectProject, eapRouteProjectId, canUseAllProjects]);



  const [projectForm, setProjectForm] = useState(createEmptyProjectForm());



  const [projectModalError, setProjectModalError] = useState<string | null>(null);



  const [projectModalLoading, setProjectModalLoading] = useState(false);



  const [projectToast, setProjectToast] = useState<string | null>(null);





  const [projectModalMode, setProjectModalMode] = useState<"create" | "edit">("create");

  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);

  const [isTaskModalOpen, setTaskModalOpen] = useState(false);

  const [taskModalLoading, setTaskModalLoading] = useState(false);

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isProjectSelectorOpen, setProjectSelectorOpen] = useState(false);
  const [projectSearchTerm, setProjectSearchTerm] = useState("");
  const projectSelectorRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!isProjectSelectorOpen) return;
    const handlePointerDown = (event: globalThis.MouseEvent) => {
      const target = event.target as Node | null;
      if (projectSelectorRef.current && target && !projectSelectorRef.current.contains(target)) {
        setProjectSelectorOpen(false);
      }
    };
    const handleEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") {
        setProjectSelectorOpen(false);
      }
    };
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isProjectSelectorOpen]);
  useEffect(() => {
    if (!isProjectSelectorOpen && projectSearchTerm) {
      setProjectSearchTerm("");
    }
  }, [isProjectSelectorOpen, projectSearchTerm]);






  useEffect(() => {



    if (!newTaskColumn && boardColumns.length) {



      onTaskColumnChange(boardColumns[0].id);



    }



  }, [boardColumns, newTaskColumn, onTaskColumnChange]);







  useEffect(() => {

    if (!projectToast) return;

    const timeout = setTimeout(() => setProjectToast(null), 4000);

    return () => clearTimeout(timeout);

  }, [projectToast]);



  const handleProjectFieldChange = (field: keyof ReturnType<typeof createEmptyProjectForm>, value: string) =>



    setProjectForm((prev) => ({ ...prev, [field]: value }));







  const resetProjectForm = () => {



    setProjectForm(createEmptyProjectForm());



    setEditingProjectId(null);



    setProjectModalMode("create");



  };







  const handleOpenProjectModal = () => {


    setProjectModalError(null);



    resetProjectForm();



    setProjectModalOpen(true);



  };







  const handleOpenEditProjectModal = () => {



    if (!projectMeta) return;



    setProjectModalError(null);



    setProjectModalMode("edit");



    setEditingProjectId(projectMeta.projectId);



    setProjectForm({



      name: projectMeta.projectName ?? "",



      clientName: projectMeta.clientName ?? "",



      budget: "",



      repositoryUrl: "",



      startDate: projectMeta.startDate ? projectMeta.startDate.slice(0, 10) : "",



      endDate: projectMeta.endDate ? projectMeta.endDate.slice(0, 10) : "",



      description: "",



      teamMembers: ""



    });



    setProjectModalOpen(true);



  };







  const handleCloseProjectModal = () => {



    setProjectModalOpen(false);



    setProjectModalMode("create");



    setEditingProjectId(null);



  };







  const handleOpenTaskModal = async () => {



    if (!boardColumns.length && onReloadBoard) {



      await onReloadBoard();



    }



    if (!newTaskColumn && boardColumns.length) {



      onTaskColumnChange(boardColumns[0].id);



    }



    setTaskModalOpen(true);



  };







  const handleCloseTaskModal = () => {



    setTaskModalOpen(false);



    setTaskModalLoading(false);



  };







  const handleProjectModalSubmit = async (event: FormEvent<HTMLFormElement>) => {



    event.preventDefault();



    setProjectModalError(null);



    if (!projectForm.name.trim()) {



      setProjectModalError("O nome do projeto é obrigatório.");



      return;



    }



    if (!projectForm.clientName.trim()) {



      setProjectModalError("Informe o cliente Responsável.");



      return;



    }







    const payload = {



      name: projectForm.name.trim(),



      clientName: projectForm.clientName.trim(),



      budget: Number(projectForm.budget) || 0,



      repositoryUrl: projectForm.repositoryUrl.trim() || undefined,



      startDate: projectForm.startDate || undefined,



      endDate: projectForm.endDate || undefined,



      description: projectForm.description.trim() || undefined,



      teamMembers: projectForm.teamMembers



        .split(",")



        .map((member) => member.trim())



        .filter(Boolean)



    };







    setProjectModalLoading(true);



    try {



      if (projectModalMode === "edit" && editingProjectId) {



        await onUpdateProject(editingProjectId, payload);



        setProjectToast("Projeto atualizado com sucesso.");



      } else {



        await onCreateProject(payload);



        setProjectToast("Projeto criado com sucesso.");



      }



      resetProjectForm();



      setProjectModalOpen(false);



    } catch (error) {



      setProjectModalError(getApiErrorMessage(error, "Erro ao salvar projeto"));



    } finally {



      setProjectModalLoading(false);



    }



  };







  const handleTaskModalSubmit = async (event: FormEvent<HTMLFormElement>) => {



    event.preventDefault();



    setTaskModalLoading(true);



    const success = await onCreateTask(event);



    setTaskModalLoading(false);



    if (success) {



      setTaskModalOpen(false);



    }



  };







  const handleViewProjectDetails = useCallback(

    (projectId: string) => {

      if (projectId && projectId !== selectedProjectId) {

        onProjectChange(projectId);

      }

      navigate(`/projects/${projectId}`);

    },

    [onProjectChange, selectedProjectId, navigate]

  );







  const outletContext: DashboardOutletContext = {

    organizations,

    selectedOrganizationId,

    onOrganizationChange,

    currentOrgRole,

    currentOrgModulePermissions,

  projects,

  selectedProjectId,

  onProjectChange,

  onSelectProject,

  projectLimits,

  selectedProject: projectMeta,

  projectMeta,

  onSignOut,

  handleOpenProjectModal,

  handleOpenEditProjectModal,

  handleOpenTaskModal,

  onCreateProject,

  onUpdateProject,

  portfolio,

  portfolioError,

  portfolioLoading,

  onExportPortfolio,
  onReloadPortfolio,

  handleViewProjectDetails,

  kanbanColumns,

  summary,

  summaryError,

  filters,

  onRangeChange,

  myTasks,

  members,

  membersError,

  attachments,

  attachmentsError,

  attachmentsLoading,

  reportMetrics,

  reportMetricsError,

  reportMetricsLoading,

  reportsData: reportMetrics,

  reportsError: reportMetricsError,

  reportsLoading: reportMetricsLoading,

  projectTimelineData: { tasks: ganttTasks, milestones: ganttMilestones },

  projectTimelineLoading: false,

  projectTimelineError: ganttError,

  onUpdateProjectTimelineItem: undefined,

  onChangeProjectTimelineDate: undefined,

  projectActivities: comments ?? [],

  projectActivitiesLoading: false,

  projectActivitiesError: commentsError,

  projectDocuments: attachments,

  projectDocumentsLoading: attachmentsLoading,

  projectDocumentsError: attachmentsError,

  onUploadProjectDocument: undefined,

  onDeleteProjectDocument: undefined,

  onDownloadProjectDocument: undefined,

  boardColumns,

  boardError,

  onCreateTask,

  projectBoardColumns: kanbanColumns,

  projectBoardError: boardError,

  onMoveProjectTask: onDragTask,

  onCreateProjectTask: onCreateTask,

  onReloadProjectBoard: onReloadBoard,

  newProjectTaskTitle: newTaskTitle,

  onProjectTaskTitleChange: onTaskTitleChange,

  newProjectTaskColumn: newTaskColumn,

  onProjectTaskColumnChange: onTaskColumnChange,

  projectToast,

  orgError,

  projectsError,

  projectLoading: portfolioLoading,

  projectError: null,

  newTaskTitle,

  onTaskTitleChange,

  newTaskColumn,

  onTaskColumnChange,

  newTaskStartDate,

  onTaskStartDateChange,

  newTaskEndDate,

  onTaskEndDateChange,

  newTaskAssignee,

  onTaskAssigneeChange,

  newTaskEstimateHours,

  onTaskEstimateHoursChange,

  wbsNodes,

  wbsError,

  serviceCatalog,

  serviceCatalogError,

  onImportServiceCatalog,
  onCreateServiceCatalog,
  onUpdateServiceCatalog,
  onDeleteServiceCatalog,
  onReloadWbs,

  wbsLoading: undefined,

  onCreateWbsItem,

  onDeleteWbsItem: undefined,

  onRestoreWbsItem: undefined,

  onUpdateDependency: undefined,

  dependencyOptions: [],

  projectWbsNodes: wbsNodes,

  projectWbsError: wbsError,

  projectWbsLoading: undefined,

  onCreateProjectWbsItem: undefined,

  onUpdateProjectWbsItem: onUpdateWbsNode,

  onDeleteProjectWbsItem: undefined,

  onRestoreProjectWbsItem: undefined,

  projectDependencyOptions: [],

  onUpdateProjectDependency: undefined,

  onMoveNode,

  onUpdateWbsNode,

  onUpdateWbsResponsible,

  selectedNodeId,

  onSelectNode,

  comments,

  commentsError,

  onSubmitComment,

  commentBody,

  onCommentBodyChange,

  timeEntryDate,

  timeEntryHours,

  timeEntryDescription,

  timeEntryError,

  onTimeEntryDateChange,

  onTimeEntryHoursChange,

  onTimeEntryDescriptionChange,

  onLogTime,

  ganttTasks,

  ganttMilestones,

  ganttError,

  onReloadBoard,

  onDragTask

  };





  const appShellClassName = `app-shell ${isCollapsed ? "app-shell--collapsed" : ""}`.trim();
  const currentOrganization = organizations.find((org) => org.id === selectedOrganizationId) ?? null;
  const selectedProjectName = useMemo(() => {
    if (selectedProjectId === "all" && canUseAllProjects) return "Todos os projetos";
    if (!selectedProjectId) return "Selecione um projeto";
    return projects.find((project) => project.id === selectedProjectId)?.name ?? "Selecione um projeto";
  }, [projects, selectedProjectId, canUseAllProjects]);
  const filteredProjects = useMemo(() => {
    const query = projectSearchTerm.trim().toLowerCase();
    const base = !query
      ? projects || []
      : (projects || []).filter((project) => (project.name ?? "").toLowerCase().includes(query));
    if (!canUseAllProjects) return base;
    const shouldShowAllOption = !query || "todos os projetos".includes(query) || "todos".includes(query);
    if (!shouldShowAllOption) return base;
    return [{ id: "all", name: "Todos os projetos" }, ...base];
  }, [projects, projectSearchTerm, canUseAllProjects]);
  const isProjectSelectorDisabled = !projects?.length;
  const handleProjectSelectFromMenu = (projectId: string) => {
    onSelectProject(projectId);
    setProjectSelectorOpen(false);
    setProjectSearchTerm("");
  };






  return (



    <div className={appShellClassName}>
      <aside className="dashboard-sidebar sidebar">
        <div className="sidebar-header">
          <button
            type="button"
            className="sidebar-brand"
            onClick={() => setIsCollapsed((prev) => !prev)}
            aria-label={isCollapsed ? "Expandir menu" : "Recolher menu"}
          >
            <img src="/logo.png" alt="G&P Gestão de Projetos" className="sidebar-logo-img" />
            {!isCollapsed && (
              <div className="sidebar-brand-text">
                <span className="brand-sigla">Meu G&P</span>
                <span className="brand-subtitle">Gestão de Projetos</span>
              </div>
            )}
            <span className={`sidebar-toggle-icon ${isCollapsed ? "is-collapsed" : ""}`}>
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M15 18 9 12l6-6" />
              </svg>
            </span>
</button>
        </div>


        <nav className="sidebar-nav">

          <div className="sidebar-title"></div>

          {sidebarNavigation.map((item) => {
            const Icon = item.icon;
            const moduleKey = sidebarModuleById[item.id] ?? "dashboard";
            if (!currentOrgModuleAccess[moduleKey]?.view) {
              return null;
            }
            const computedPath =
              item.id === "edt" && selectedOrganizationId && selectedProjectId && selectedProjectId !== "all"
                ? `/EAP/organizacao/${selectedOrganizationId}/projeto/${selectedProjectId}`
                : item.path;

            const link = (
              <NavLink
                key={item.id}
                to={computedPath}
                className={({ isActive }) => `sidebar-item ${isActive ? "sidebar-item--active" : ""}`}
                title={isCollapsed ? item.label : undefined}
                aria-label={isCollapsed ? item.label : undefined}
              >
                <span className="sidebar-item-icon" aria-hidden="true">
                  <Icon width={18} height={18} />
                </span>
                <span className="sidebar-item-label">{item.label}</span>
              </NavLink>
            );
            return (
              <Fragment key={item.id}>
                {link}
                {item.id === "diagrama" ? <div className="sidebar-divider" /> : null}
              </Fragment>
            );
          })}

        </nav>

      </aside>







      <div className="app-main">







        

      <header className="dashboard-topbar topbar">
        <div className="topbar-inner">
          <div className="topbar-left">
            <div className="header-search-wrapper">
              <div className="header-search">
                <Search className="header-search-icon" aria-hidden="true" />
                <input
                  className="header-search-input"
                  type="search"
                  placeholder="Buscar projetos, tarefas, pessoas..."
                />
              </div>
            </div>
          </div>

          <div className="topbar-center">
            <div className="header-context">
              <div className="context-item">
                <span className="context-label">Organização</span>
                <span className="context-value">{currentOrganization?.name ?? "Nenhuma selecionada"}</span>
              </div>
              <div className="context-item context-item--project-selector">
                <span className="context-label">Projeto atual</span>
                <div
                  className={`project-selector ${isProjectSelectorOpen ? "is-open" : ""} ${isProjectSelectorDisabled ? "is-disabled" : ""}`}
                  ref={projectSelectorRef}
                >
                  <button
                    type="button"
                    className="project-selector-trigger"
                    onClick={() => {
                      if (isProjectSelectorDisabled) return;
                      setProjectSelectorOpen((prev) => !prev);
                    }}
                    disabled={isProjectSelectorDisabled}
                    aria-haspopup="listbox"
                    aria-expanded={isProjectSelectorOpen}
                  >
                    <span className="project-selector-value">{selectedProjectName}</span>
                    <span className="project-selector-caret" aria-hidden="true">
                      v
                    </span>
                  </button>
                  {isProjectSelectorOpen && !isProjectSelectorDisabled && (
                    <div className="project-selector-dropdown" role="listbox" aria-label="Lista de projetos">
                      <div className="project-selector-search">
                        <Search className="project-selector-search-icon" aria-hidden="true" />
                        <input
                          className="project-selector-search-input"
                          type="search"
                          placeholder="Buscar projeto..."
                          value={projectSearchTerm}
                          onChange={(event) => setProjectSearchTerm(event.target.value)}
                          autoFocus
                        />
                      </div>
                      <div className="project-selector-options">
                        {filteredProjects.length ? (
                          filteredProjects.map((project) => (
                            <button
                              key={project.id}
                              type="button"
                              className={`project-selector-option ${project.id === selectedProjectId ? "is-active" : ""}`}
                              onClick={() => handleProjectSelectFromMenu(project.id)}
                            >
                              <span className="project-selector-option-name">{project.name}</span>
                              {project.id === selectedProjectId ? (
                                <span className="project-selector-option-check">Atual</span>
                              ) : null}
                            </button>
                          ))
                        ) : (
                          <p className="project-selector-empty">Nenhum projeto encontrado</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                {!projects?.length && <small className="muted">Nenhum projeto cadastrado</small>}
              </div>
            </div>
          </div>

          <div className="topbar-right">
            <div className="header-user">
              <div className="avatar">{userEmail?.slice(0, 2).toUpperCase()}</div>
              <button
                type="button"
                className="logout-button"
                onClick={() => {
                  signOut();
                  navigate("/", { replace: true });
                }}
              >
                <LogOut className="logout-icon" aria-hidden="true" />
                Sair
              </button>
            </div>
          </div>
        </div>
      </header>






        <main className="app-content">

          <div className="page-container">

            {hasAccessToCurrentPath ? (
              <Outlet context={outletContext} />
            ) : (
              <section className="module-access-block">
                <EmptyStateCard
                  icon={ReportIcon}
                  title="Acesso restrito"
                  description={`Seu perfil não possui permissão para visualizar ${blockedModuleLabel}.`}
                  actionLabel="Ir para área permitida"
                  onAction={() => navigate(firstAllowedPath)}
                />
              </section>
            )}

          </div>

        </main>





        {isProjectModalOpen && (



          <div className="modal-overlay" role="dialog" aria-modal="true">



            <div className="modal">



              <header className="modal-header">



                <div>



                  <p className="eyebrow">{projectModalMode === "edit" ? "Editar projeto" : "Novo projeto"}</p>



                  <h3>{projectModalMode === "edit" ? "Atualize as informações principais" : "Planeje um novo trabalho"}</h3>



                  <p className="subtext">



                    {projectModalMode === "edit"



                      ? "Ajuste cliente, datas ou links principais do projeto selecionado."



                      : "Informe dados básicos para criarmos o projeto no portfólio."}



                  </p>



                </div>



                <button type="button" className="ghost-button" onClick={handleCloseProjectModal}>



                  Fechar



                </button>



              </header>







              <form className="modal-form" onSubmit={handleProjectModalSubmit}>



                <label>



                  Nome do projeto



                  <input



                    type="text"



                    value={projectForm.name}



                    onChange={(event) => handleProjectFieldChange("name", event.target.value)}



                    placeholder="ImplementAo ERP 2025"



                    required



                  />



                </label>



                <label>



                  Cliente / unidade



                  <input



                    type="text"



                    value={projectForm.clientName}



                    onChange={(event) => handleProjectFieldChange("clientName", event.target.value)}



                    placeholder="Corp Holding"



                    required



                  />



                </label>



                <label>



                  Orçamento aprovado (R$)



                  <input



                    type="number"



                    min="0"



                    step="1000"



                    value={projectForm.budget}



                    onChange={(event) => handleProjectFieldChange("budget", event.target.value)}



                    placeholder="250000"



                  />



                </label>



                <label>



                  Repositório GitHub



                  <input



                    type="url"



                    value={projectForm.repositoryUrl}



                    onChange={(event) => handleProjectFieldChange("repositoryUrl", event.target.value)}



                    placeholder="https://github.com/org/projeto"



                  />



                </label>



                <div className="modal-grid">



                  <label>



                    Incio planejado



                    <input



                      type="date"



                      value={projectForm.startDate}



                      onChange={(event) => handleProjectFieldChange("startDate", event.target.value)}



                    />



                  </label>



                  <label>



                    Conclusão prevista



                    <input



                      type="date"



                      value={projectForm.endDate}



                      onChange={(event) => handleProjectFieldChange("endDate", event.target.value)}



                    />



                  </label>



                </div>



                <label>



                  Equipe (e-mails separados por vírgula)



                  <textarea



                    value={projectForm.teamMembers}



                    onChange={(event) => handleProjectFieldChange("teamMembers", event.target.value)}



                    placeholder="ana@empresa.com, joao@empresa.com"



                  />



                </label>



                <label>



                  Descrição



                  <textarea



                    value={projectForm.description}



                    onChange={(event) => handleProjectFieldChange("description", event.target.value)}



                    placeholder="Objetivos, entregas e premissas iniciais..."



                  />



                </label>







                {projectModalError && <p className="error-text">{projectModalError}</p>}







                <footer className="modal-actions">



                  <button type="button" className="ghost-button" onClick={handleCloseProjectModal}>



                    Cancelar



                  </button>



                  <button type="submit" className="primary-button" disabled={projectModalLoading}>



                    {projectModalLoading



                      ? "Enviando..."



                      : projectModalMode === "edit"



                      ? "Salvar alterações"



                      : "Criar projeto"}



                  </button>



                </footer>



              </form>



            </div>



          </div>



        )}







        {isTaskModalOpen && (



          <div className="modal-overlay" role="dialog" aria-modal="true">



            <div className="modal">



              <header className="modal-header">



                <div>



                  <p className="eyebrow">Nova tarefa</p>



                  <h3>Adicionar item ao quadro</h3>



                  <p className="subtext">Informe o título e escolha a coluna inicial.</p>



                </div>



                <button type="button" className="ghost-button" onClick={handleCloseTaskModal}>



                  Fechar



                </button>



              </header>







              {boardColumns.length ? (



                <form className="modal-form" onSubmit={handleTaskModalSubmit}>



                  <label>



                    título da tarefa



                    <input



                      type="text"



                      value={newTaskTitle}



                      onChange={(event) => onTaskTitleChange(event.target.value)}



                      placeholder="Configurar ambiente, revisar contrato..."



                      required



                    />



                  </label>







                  <label>



                    Coluna inicial



                    <select value={newTaskColumn} onChange={(event) => onTaskColumnChange(event.target.value)}>



                      {boardColumns.map((column) => (



                        <option key={column.id} value={column.id}>



                          {column.label}



                        </option>



                      ))}



                    </select>



                  </label>







                  <div className="modal-grid">



                    <label>



                      Incio planejado



                      <input



                        type="date"



                        value={newTaskStartDate}



                        onChange={(event) => onTaskStartDateChange(event.target.value)}



                      />



                    </label>



                    <label>



                      Fim planejado



                      <input



                        type="date"



                        value={newTaskEndDate}



                        onChange={(event) => onTaskEndDateChange(event.target.value)}



                      />



                    </label>



                  </div>







                  <label>



                    Responsável



                    <select value={newTaskAssignee} onChange={(event) => onTaskAssigneeChange(event.target.value)}>



                      <option value="">Selecione...</option>



                      {members.map((member: any) => (



                        <option key={member.id} value={member.userId ?? member.id}>



                          {member.name ?? member.fullName ?? member.email}



                        </option>



                      ))}



                    </select>



                  </label>







                  <label>



                    Horas estimadas



                    <input



                      type="number"



                      min="0"



                      step="0.5"



                      value={newTaskEstimateHours}



                      onChange={(event) => onTaskEstimateHoursChange(event.target.value)}



                      placeholder="Ex.: 4"



                    />



                  </label>







                  {boardError && (



                    <p className="error-text" role="status">



                      {boardError}



                    </p>



                  )}







                  <footer className="modal-actions">



                    <button type="button" className="ghost-button" onClick={handleCloseTaskModal}>



                      Cancelar



                    </button>



                    <button type="submit" className="primary-button" disabled={taskModalLoading || !newTaskTitle.trim()}>



                      {taskModalLoading ? "Salvando..." : "Criar tarefa"}



                    </button>



                  </footer>



                </form>



              ) : (



                <div className="modal-form">



                  <p className="muted">



                    Este projeto ainda No possui colunas configuradas. Configure o quadro para criar tarefas.



                  </p>



                  <footer className="modal-actions">



                    <button type="button" className="ghost-button" onClick={handleCloseTaskModal}>



                      Fechar



                    </button>



                  </footer>



                </div>



              )}



            </div>



          </div>



        )}



      </div>



    </div>



  );



};



export const TemplatesPanel = ({



  templates,



  isLoading,



  error,



  onSaveTemplate



}: {



  templates: TemplateSummary[];



  isLoading: boolean;



  error: string | null;



  onSaveTemplate: (templateId: string, payload: TemplateEditorPayload) => Promise<void>;



}) => {



  type TemplateCard = {



    id: string;



    name: string;



    type: string;



    clientName?: string;



    repositoryUrl?: string;



    defaultBudget?: number;



    phases: number;



    tasks: number;



    tags: string[];



    updatedAt: string;



    columns: string[];



    wbs: TemplateTreeNode[];



    customFields: TemplateCustomField[];



  };







  const defaultColumns = ["Backlog", "Planejamento", "Execucao", "Concluido"];







  const sampleTemplates: TemplateCard[] = [



    {



      id: "temp-pmo",



      name: "Projeto PMO",



      type: "PMO / Governanca",



      clientName: "Corp PMO",



      repositoryUrl: "https://github.com/gp/templates-pmo",



      defaultBudget: 250000,



      phases: 5,



      tasks: 42,



      tags: ["PMO", "Governanca", "Compliance"],



      updatedAt: "2025-02-10",



      columns: ["Backlog", "Planejamento", "Execucao", "Aprovacao", "Concluido"],



      wbs: [



        {



          id: "temp-pmo-1",



          title: "Iniciacao",



          children: [



            { id: "temp-pmo-1-1", title: "Business case" },



            { id: "temp-pmo-1-2", title: "Stakeholders" }



          ]



        },



        {



          id: "temp-pmo-2",



          title: "Planejamento",



          children: [



            { id: "temp-pmo-2-1", title: "Plano do projeto" },



            { id: "temp-pmo-2-2", title: "Estrategia de riscos" }



          ]



        }



      ],



      customFields: [



        { id: "field-owner", label: "Patrocinador", type: "text", required: true },



        { id: "field-budget", label: "Orcamento aprovado", type: "number" }



      ]



    },



    {



      id: "temp-ti",



      name: "Implantacao de TI",



      type: "Tecnologia",



      clientName: "Squad Infra",



      repositoryUrl: "https://github.com/gp/templates-ti",



      defaultBudget: 180000,



      phases: 4,



      tasks: 30,



      tags: ["Infra", "Seguranca", "Deploy"],



      updatedAt: "2025-02-08",



      columns: ["Backlog", "Planejamento", "Em andamento", "QA", "Done"],



      wbs: [



        {



          id: "temp-ti-1",



          title: "Discovery",



          children: [



            { id: "temp-ti-1-1", title: "Mapear sistemas" },



            { id: "temp-ti-1-2", title: "Inventario de acessos" }



          ]



        },



        {



          id: "temp-ti-2",



          title: "Deploy",



          children: [



            { id: "temp-ti-2-1", title: "Ambiente de staging" },



            { id: "temp-ti-2-2", title: "Go live" }



          ]



        }



      ],



      customFields: [



        { id: "field-env", label: "Ambiente alvo", type: "select" },



        { id: "field-risk", label: "Nvel de risco", type: "select" }



      ]



    },



    {



      id: "temp-mkt",



      name: "Campanha de Marketing",



      type: "Marketing",



      clientName: "Equipe Growth",



      repositoryUrl: "https://github.com/gp/templates-mkt",



      defaultBudget: 120000,



      phases: 3,



      tasks: 24,



      tags: ["Growth", "Social", "Paid Media"],



      updatedAt: "2025-02-05",



      columns: ["Ideias", "Criacao", "Producao", "Publicacao", "Mensuracao"],



      wbs: [



        {



          id: "temp-mkt-1",



          title: "Briefing",



          children: [



            { id: "temp-mkt-1-1", title: "Mapear publico" },



            { id: "temp-mkt-1-2", title: "Definir verba" }



          ]



        },



        {



          id: "temp-mkt-2",



          title: "Execucao",



          children: [



            { id: "temp-mkt-2-1", title: "Pecas criativas" },



            { id: "temp-mkt-2-2", title: "Veiculacao" }



          ]



        }



      ],



      customFields: [



        { id: "field-channel", label: "Canal principal", type: "text" },



        { id: "field-kpi", label: "KPI alvo", type: "text", required: true }



      ]



    }



  ];







  const countWbsNodes = (nodes: TemplateNodeInput[] = []): number =>



    nodes.reduce((acc, node) => acc + 1 + countWbsNodes(node.children ?? []), 0);







  const mapTemplateNodes = (nodes?: TemplateNodeInput[], parentPath = "tpl"): TemplateTreeNode[] =>



    (nodes ?? []).map((node, index) => {



      const path = `${parentPath}-${index}`;



      return {



        id: node.id ?? path,



        title: node.title ?? "Entrega",



        children: mapTemplateNodes(node.children, path)



      };



    });







  const normalizeFieldType = (value?: string): TemplateCustomField["type"] => {



    if (value === "number" || value === "select" || value === "date") {



      return value;



    }



    return "text";



  };







  const normalizeTemplate = (template: TemplateSummary): TemplateCard => ({



    id: template.id,



    name: template.name,



    type: template.type,



    clientName: template.clientName ?? undefined,



    repositoryUrl: template.repositoryUrl ?? undefined,



    defaultBudget: template.budget ?? undefined,



    phases: template.wbs?.length ?? 0,



    tasks: countWbsNodes(template.wbs ?? []),



    tags: (template.customFields ?? []).map((field) => field.label).filter(Boolean) as string[],



    updatedAt: template.updatedAt ?? new Date().toISOString(),



    columns: template.columns ?? defaultColumns,



    wbs: mapTemplateNodes(template.wbs),



    customFields: (template.customFields ?? []).map((field) => ({



      id: field.id ?? `field-${Date.now()}-${Math.round(Math.random() * 1000)}`,



      label: field.label ?? "Campo",



      type: normalizeFieldType(field.type),



      required: Boolean(field.required)



    }))



  });







  const templatesToUse: TemplateCard[] = useMemo(() => {



    if (templates.length) {



      return templates.map(normalizeTemplate);



    }



    return sampleTemplates;



  }, [templates]);



  const initialTemplate = templatesToUse[0];







  useEffect(() => {



    if (!templates.length) return;



    setSelectedTemplateId((current) => {



      if (templates.some((template) => template.id === current)) {



        return current;



      }



      return templates[0].id;



    });



  }, [templates]);







  const cloneNodes = (nodes: TemplateTreeNode[]): TemplateTreeNode[] =>



    nodes.map((node) => ({



      ...node,



      children: node.children ? cloneNodes(node.children) : []



    }));







  const [selectedTemplateId, setSelectedTemplateId] = useState(() => templatesToUse[0]?.id ?? "");



  const selectedTemplate = templatesToUse.find((template) => template.id === selectedTemplateId) ?? null;







  const [wbsDraft, setWbsDraft] = useState<TemplateTreeNode[]>(initialTemplate ? cloneNodes(initialTemplate.wbs) : []);



  const [boardColumnsDraft, setBoardColumnsDraft] = useState<string[]>(



    initialTemplate ? [...initialTemplate.columns] : defaultColumns



  );



  const [customFieldsDraft, setCustomFieldsDraft] = useState<TemplateCustomField[]>(



    initialTemplate ? initialTemplate.customFields.map((field) => ({ ...field })) : []



  );



  const [templateMeta, setTemplateMeta] = useState({



    name: initialTemplate?.name ?? "Novo template",



    type: initialTemplate?.type ?? "Custom",



    clientName: initialTemplate?.clientName ?? "",



    repositoryUrl: initialTemplate?.repositoryUrl ?? "",



    budget: initialTemplate?.defaultBudget?.toString() ?? ""



  });



  const [templateModalOpen, setTemplateModalOpen] = useState(false);



  const [templateModalError, setTemplateModalError] = useState<string | null>(null);



  const [templateModalLoading, setTemplateModalLoading] = useState(false);



  const [templateToast, setTemplateToast] = useState<string | null>(null);



  const [isDraftTemplate, setIsDraftTemplate] = useState(false);







  useEffect(() => {



    if (!selectedTemplate || isDraftTemplate) return;



    setWbsDraft(cloneNodes(selectedTemplate.wbs));



    setBoardColumnsDraft([...selectedTemplate.columns]);



    setCustomFieldsDraft(selectedTemplate.customFields.map((field) => ({ ...field })));



    setTemplateMeta({



      name: selectedTemplate.name,



      type: selectedTemplate.type,



      clientName: selectedTemplate.clientName ?? "",



      repositoryUrl: selectedTemplate.repositoryUrl ?? "",



      budget: selectedTemplate.defaultBudget?.toString() ?? ""



    });



  }, [selectedTemplate, isDraftTemplate]);







  useEffect(() => {



    if (!templateToast) return;



    const timeout = setTimeout(() => setTemplateToast(null), 4000);



    return () => clearTimeout(timeout);



  }, [templateToast]);







  const createTreeNode = (title = "Nova etapa"): TemplateTreeNode => ({



    id: `node-${Date.now()}-${Math.round(Math.random() * 1000)}`,



    title,



    children: []



  });







  const updateNodeTitle = (nodes: TemplateTreeNode[], nodeId: string, value: string): TemplateTreeNode[] =>



    nodes.map((node) => {



      if (node.id === nodeId) {



        return { ...node, title: value };



      }



      return {



        ...node,



        children: node.children ? updateNodeTitle(node.children, nodeId, value) : []



      };



    });







  const addChildToTree = (nodes: TemplateTreeNode[], nodeId: string, child: TemplateTreeNode): TemplateTreeNode[] =>



    nodes.map((node) => {



      if (node.id === nodeId) {



        return { ...node, children: [...(node.children ?? []), child] };



      }



      return {



        ...node,



        children: node.children ? addChildToTree(node.children, nodeId, child) : []



      };



    });







  const removeNodeFromTree = (nodes: TemplateTreeNode[], nodeId: string): TemplateTreeNode[] =>



    nodes



      .filter((node) => node.id !== nodeId)



      .map((node) => ({



        ...node,



        children: node.children ? removeNodeFromTree(node.children, nodeId) : []



      }));







  const handleNodeTitleChange = (nodeId: string, value: string) =>



    setWbsDraft((prev) => updateNodeTitle(prev, nodeId, value));







  const handleAddChild = (nodeId: string) =>



    setWbsDraft((prev) => addChildToTree(prev, nodeId, createTreeNode("Nova entrega")));







  const handleRemoveNode = (nodeId: string) => setWbsDraft((prev) => removeNodeFromTree(prev, nodeId));







  const handleAddStage = () => setWbsDraft((prev) => [...prev, createTreeNode()]);







  const handleColumnChange = (index: number, value: string) =>



    setBoardColumnsDraft((prev) => {



      const clone = [...prev];



      clone[index] = value;



      return clone;



    });







  const handleAddColumn = () => setBoardColumnsDraft((prev) => [...prev, `Etapa ${prev.length + 1}`]);







  const handleRemoveColumn = (index: number) =>



    setBoardColumnsDraft((prev) => prev.filter((_, columnIndex) => columnIndex !== index));







  const handleFieldChange = (fieldId: string, key: keyof TemplateCustomField, value: string | boolean) =>



    setCustomFieldsDraft((prev) =>



      prev.map((field) =>



        field.id === fieldId



          ? {



              ...field,



              [key]:



                key === "type"



                  ? (value as TemplateCustomField["type"])



                  : key === "required"



                  ? Boolean(value)



                  : (value as string)



            }



          : field



      )



    );







  const handleAddField = () =>



    setCustomFieldsDraft((prev) => [



      ...prev,



      { id: `field-${Date.now()}`, label: "Novo campo", type: "text", required: false }



    ]);







  const handleRemoveField = (fieldId: string) =>



    setCustomFieldsDraft((prev) => prev.filter((field) => field.id !== fieldId));







  const handleTemplateMetaChange = (field: keyof typeof templateMeta, value: string) =>



    setTemplateMeta((prev) => ({ ...prev, [field]: value }));







  const handleStartTemplate = () => {



    setIsDraftTemplate(true);



    const draftId = `draft-${Date.now()}`;



    setSelectedTemplateId(draftId);



    setTemplateMeta({



      name: "Novo template",



      type: "Custom",



      clientName: "",



      repositoryUrl: "",



      budget: ""



    });



    setBoardColumnsDraft([...defaultColumns]);



    setWbsDraft([createTreeNode("IniciAo")]);



    setCustomFieldsDraft([]);



    setTemplateModalError(null);



    setTemplateModalOpen(true);



  };







  const openTemplateModal = (templateId: string) => {



    if (templateId !== selectedTemplateId) {



      setSelectedTemplateId(templateId);



    }



    setIsDraftTemplate(false);



    setTemplateModalError(null);



    setTemplateModalOpen(true);



  };







  const closeTemplateModal = () => setTemplateModalOpen(false);







  const renderWbsNodes = (nodes: TemplateTreeNode[]) => (



    <ul>



      {nodes.map((node) => (



        <li key={node.id}>



          <div className="wbs-node">



            <input value={node.title} onChange={(event) => handleNodeTitleChange(node.id, event.target.value)} />



            <div className="wbs-node__actions">



              <button type="button" className="ghost-button" onClick={() => handleAddChild(node.id)}>



                + Subtarefa



              </button>



              <button type="button" className="ghost-button" onClick={() => handleRemoveNode(node.id)}>



                Remover



              </button>



            </div>



          </div>



          {node.children && node.children.length > 0 && renderWbsNodes(node.children)}



        </li>



      ))}



    </ul>



  );







  const mapNodesToPayload = (nodes: TemplateTreeNode[]): TemplateNodeInput[] =>



    nodes.map((node) => ({



      title: node.title.trim(),



      children: node.children && node.children.length ? mapNodesToPayload(node.children) : undefined



    }));







  const handleTemplateSubmit = async (event: FormEvent<HTMLFormElement>) => {



    event.preventDefault();



    if (!templateMeta.name.trim()) {



      setTemplateModalError("O nome do template é obrigatório.");



      return;



    }







    setTemplateModalLoading(true);



    try {



      const templateId = selectedTemplateId || `template-${Date.now()}`;



      await onSaveTemplate(templateId, {



        name: templateMeta.name.trim(),



        type: templateMeta.type.trim(),



        clientName: templateMeta.clientName.trim() || undefined,



        repositoryUrl: templateMeta.repositoryUrl.trim() || undefined,



        budget: templateMeta.budget ? Number(templateMeta.budget) : undefined,



        columns: boardColumnsDraft,



        wbs: mapNodesToPayload(wbsDraft),



        customFields: customFieldsDraft.map((field) => ({



          id: field.id,



          label: field.label.trim(),



          type: field.type,



          required: field.required



        }))



      });



      setTemplateToast("Template atualizado com sucesso.");



      setSelectedTemplateId(templateId);



      setIsDraftTemplate(false);



      setTemplateModalOpen(false);



    } catch (error) {



      setTemplateModalError(getApiErrorMessage(error, "Erro ao salvar template"));



    } finally {



      setTemplateModalLoading(false);



    }



  };







  return (



    <div className="templates-panel">



      <div className="templates-actions">



        <button type="button" className="primary-button" onClick={handleStartTemplate}>



          + Criar template



        </button>



        <button type="button" className="secondary-button">



          Importar modelo



        </button>



      </div>







      {templateToast && <p className="success-text">{templateToast}</p>}







      <div className="templates-layout">



        <div className="templates-grid">



          {isLoading && <p className="muted">Carregando templates...</p>}



          {!isLoading &&



            templatesToUse.map((template) => (



              <article



                key={template.id}



                className={`template-card ${selectedTemplateId === template.id ? "is-active" : ""}`}



                onClick={() => {



                  setIsDraftTemplate(false);



                  setSelectedTemplateId(template.id);



                }}



              role="button"



              tabIndex={0}



            >



              <header>



                <div>



                  <p className="eyebrow">{template.type}</p>



                  <h4>{template.name}</h4>



                </div>



                <span className="pill pill-neutral">{template.phases} fases</span>



              </header>



              <p className="muted">



                {template.tasks} tarefas - Atualizado em {new Date(template.updatedAt).toLocaleDateString("pt-BR")}



              </p>



              <div className="template-tags">



                {template.tags.map((tag) => (



                  <span key={`${template.id}-${tag}`}>{tag}</span>



                ))}



              </div>



              <div className="template-columns">



                {template.columns.map((column) => (



                  <small key={`${template.id}-${column}`}>{column}</small>



                ))}



              </div>



              <div className="template-actions">



                <button



                  type="button"



                  className="secondary-button"



                  onClick={(event) => {



                    event.stopPropagation();



                    openTemplateModal(template.id);



                  }}



                >



                  Editar



                </button>



                <button type="button" className="ghost-button">



                  Duplicar



                </button>



                <button type="button" className="ghost-button">



                  Excluir



                </button>



              </div>



            </article>



          ))}



        </div>







        <aside className="templates-editor">



          <header>



            <p className="eyebrow">Editor do template</p>



            <h3>{templateMeta.name}</h3>



            <p className="subtext">



              Pre-visualize a EDT padrao, ajuste colunas do board e defina campos customizados para novos projetos.



            </p>



          </header>







          <article className="editor-card">



            <div className="editor-card__header">



              <h4>Previa da EDT</h4>



              <button type="button" className="ghost-button" onClick={handleAddStage}>



                + Adicionar etapa



              </button>



            </div>



            <div className="wbs-preview">{renderWbsNodes(wbsDraft)}</div>



          </article>







          <article className="editor-card">



            <div className="editor-card__header">



              <h4>Colunas do board</h4>



              <button type="button" className="ghost-button" onClick={handleAddColumn}>



                + Nova coluna



              </button>



            </div>



            <ul className="board-columns-editor">



              {boardColumnsDraft.map((column, index) => (



                <li key={`${selectedTemplateId}-column-${column}-${index}`}>



                  <input value={column} onChange={(event) => handleColumnChange(index, event.target.value)} />



                  <button type="button" className="ghost-button" onClick={() => handleRemoveColumn(index)}>



                    Remover



                  </button>



                </li>



              ))}



            </ul>



          </article>







          <article className="editor-card">



            <div className="editor-card__header">



              <h4>Campos customizados</h4>



              <button type="button" className="ghost-button" onClick={handleAddField}>



                + Novo campo



              </button>



            </div>



            <div className="custom-fields-editor">



              {customFieldsDraft.map((field) => (



                <div key={field.id} className="custom-field-card">



                  <label>



                    Nome



                    <input value={field.label} onChange={(event) => handleFieldChange(field.id, "label", event.target.value)} />



                  </label>



                  <label>



                    Tipo



                    <select value={field.type} onChange={(event) => handleFieldChange(field.id, "type", event.target.value)}>



                      <option value="text">Texto</option>



                      <option value="number">Numero</option>



                      <option value="date">Data</option>



                      <option value="select">Lista</option>



                    </select>



                  </label>



                  <label className="settings-toggle">



                    <input



                      type="checkbox"



                      checked={Boolean(field.required)}



                      onChange={(event) => handleFieldChange(field.id, "required", event.target.checked)}



                    />



                    <span>Obrigatorio</span>



                  </label>



                  <button type="button" className="ghost-button" onClick={() => handleRemoveField(field.id)}>



                    Remover



                  </button>



                </div>



              ))}



            </div>



          </article>



        </aside>



      </div>







      {templateModalOpen && (



        <div className="modal-overlay" role="dialog" aria-modal="true">



          <div className="modal">



            <header className="modal-header">



              <div>



                <p className="eyebrow">Editar template</p>



                <h3>{templateMeta.name}</h3>



                <p className="subtext">



                  Ajuste os metadados do template e sincronize com o backend para novos projetos.



                </p>



              </div>



              <button type="button" className="ghost-button" onClick={closeTemplateModal}>



                Fechar



              </button>



            </header>







            <form className="modal-form" onSubmit={handleTemplateSubmit}>



              <label>



                Nome



                <input



                  type="text"



                  value={templateMeta.name}



                  onChange={(event) => handleTemplateMetaChange("name", event.target.value)}



                  required



                />



              </label>



              <label>



                Categoria



                <input



                  type="text"



                  value={templateMeta.type}



                  onChange={(event) => handleTemplateMetaChange("type", event.target.value)}



                  required



                />



              </label>



              <label>



                Cliente/área padrão



                <input



                  type="text"



                  value={templateMeta.clientName}



                  onChange={(event) => handleTemplateMetaChange("clientName", event.target.value)}



                  placeholder="Ex.: Corp PMO"



                />



              </label>



              <label>



                Repositório GitHub



                <input



                  type="url"



                  value={templateMeta.repositoryUrl}



                  onChange={(event) => handleTemplateMetaChange("repositoryUrl", event.target.value)}



                  placeholder="https://github.com/org/template"



                />



              </label>



              <label>



                Orçamento base (R$)



                <input



                  type="number"



                  min="0"



                  step="1000"



                  value={templateMeta.budget}



                  onChange={(event) => handleTemplateMetaChange("budget", event.target.value)}



                  placeholder="150000"



                />



              </label>







              <p className="subtext">



                Este envio inclui a estrutura da EDT, colunas do board e campos customizados configurados nesta tela.



              </p>







              {templateModalError && <p className="error-text">{templateModalError}</p>}







              <footer className="modal-actions">



                <button type="button" className="ghost-button" onClick={closeTemplateModal}>



                  Cancelar



                </button>



                <button type="submit" className="primary-button" disabled={templateModalLoading}>



                  {templateModalLoading ? "Salvando..." : "Salvar template"}



                </button>



              </footer>



            </form>



          </div>



        </div>



      )}



    </div>



  );



};

























