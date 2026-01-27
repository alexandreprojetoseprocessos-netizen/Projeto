import type { DropResult } from "@hello-pangea/dnd";

import { NavLink, Outlet, useLocation, useNavigate, useOutletContext } from "react-router-dom";
import { createPortal } from "react-dom";

import { useAuth } from "../contexts/AuthContext";
import { apiUrl } from "../config/api";

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

import { DndContext, closestCenter, type DragEndEvent } from "@dnd-kit/core";
import { normalizeStatus, STATUS_ORDER, type Status } from "../utils/status";
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import clsx from "clsx";
import { DependenciesDropdown, type DependencyOption } from "./DependenciesDropdown";
import type { PortfolioProject } from "./ProjectPortfolio";

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







const BriefcaseIcon: KPIIcon = (props) => (



  <svg viewBox="0 0 24 24" {...svgStrokeProps} {...props}>



    <path d="M6 7V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v1" />



    <rect x="3" y="7" width="18" height="13" rx="2" />



    <path d="M16 7H8" />



    <path d="M12 12v3" />



  </svg>



);







const ListChecksIcon: KPIIcon = (props) => (



  <svg viewBox="0 0 24 24" {...svgStrokeProps} {...props}>



    <rect x="3" y="4" width="10" height="16" rx="2" />



    <path d="M8 8h3" />



    <path d="M8 12h3" />



    <path d="M8 16h3" />



    <path d="M17 8l2 2 3-3" />



    <path d="M17 14l2 2 3-3" />



  </svg>



);







const AlertTriangleIcon: KPIIcon = (props) => (



  <svg viewBox="0 0 24 24" {...svgStrokeProps} {...props}>



    <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />



    <line x1="12" y1="9" x2="12" y2="13" />



    <line x1="12" y1="17" x2="12.01" y2="17" />



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

    attributes: Record<string, any>;

    listeners: Record<string, any>;

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

      {children({ attributes: attributes ?? {}, listeners: listeners ?? {}, isDragging })}

    </tr>



  );



}







const ClockIcon: KPIIcon = (props) => (



  <svg viewBox="0 0 24 24" {...svgStrokeProps} {...props}>



    <circle cx="12" cy="12" r="8" />



    <path d="M12 8v5l3 2" />



  </svg>



);







const UsersIcon: KPIIcon = (props) => (



  <svg viewBox="0 0 24 24" {...svgStrokeProps} {...props}>



    <circle cx="9" cy="7" r="4" />



    <path d="M17 11a4 4 0 1 0-3.36-6.17" />



    <path d="M2 21v-1a6 6 0 0 1 6-6h2a6 6 0 0 1 6 6v1" />



    <path d="M17 21v-1.5a4.5 4.5 0 0 0-2-3.74" />



  </svg>



);







const BarChartIcon: KPIIcon = (props) => (



  <svg viewBox="0 0 24 24" {...svgStrokeProps} {...props}>



    <line x1="3" y1="21" x2="21" y2="21" />



    <rect x="6" y="4" width="3" height="13" rx="1.5" />



    <rect x="11" y="9" width="3" height="8" rx="1.5" />



    <rect x="16" y="6" width="3" height="11" rx="1.5" />



  </svg>



);







const SettingsIcon: KPIIcon = (props) => (

  <svg viewBox="0 0 24 24" {...svgStrokeProps} {...props}>

    <circle cx="12" cy="12" r="3" />

    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l0 0a2 2 0 1 1-2.83 2.83h0a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v0a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33h0a2 2 0 1 1-2.83-2.83h0a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h0a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82h0a2 2 0 1 1 2.83-2.83h0a1.65 1.65 0 0 0 1.82.33h0A1.65 1.65 0 0 0 9 3.1V3a2 2 0 0 1 4 0v0a1.65 1.65 0 0 0 1 1.51h0a1.65 1.65 0 0 0 1.82-.33h0a2 2 0 1 1 2.83 2.83h0a1.65 1.65 0 0 0-.33 1.82v0a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h0a1.65 1.65 0 0 0-1.51 1Z" />

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



const UploadCloudIcon: KPIIcon = (props) => (

  <svg viewBox="0 0 24 24" {...svgStrokeProps} {...props}>

    <path d="M12 16V4" />

    <path d="m6 10 6-6 6 6" />

    <path d="M20 16.5a4.5 4.5 0 0 0-3.5-7.5h-1" />

    <path d="M6 19a4 4 0 0 1 0-8h1" />

  </svg>

);



const DownloadIcon: KPIIcon = (props) => (

  <svg viewBox="0 0 24 24" {...svgStrokeProps} {...props}>

    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />

    <path d="m7 10 5 5 5-5" />

    <path d="M12 15V3" />

  </svg>

);



const TrashIcon: KPIIcon = (props) => (

  <svg viewBox="0 0 24 24" {...svgStrokeProps} {...props}>

    <path d="M3 6h18" />

    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />

    <path d="M14 10v8" />

    <path d="M10 10v8" />

    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />

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
  { id: "organizacao", label: "Organizacoes", icon: BuildingIcon, path: "/organizacao" },
  { id: "dashboard", label: "Dashboard", icon: BriefcaseIcon, path: "/dashboard" },
  { id: "projects", label: "Projetos", icon: ListChecksIcon, path: "/projects" },
  { id: "edt", label: "EAP", icon: UsersIcon, path: "/EAP" },
  { id: "board", label: "Kanban", icon: ListChecksIcon, path: "/kanban" },
  { id: "cronograma", label: "Cronograma", icon: ClockIcon, path: "/cronograma" },
  { id: "atividades", label: "Timeline", icon: CommentIcon, path: "/atividades" },
  { id: "documentos", label: "Documentos", icon: FileIcon, path: "/documentos" },
  { id: "Relatórios", label: "Relatórios", icon: BarChartIcon, path: "/Relatórios" },
  { id: "equipe", label: "Equipes", icon: UsersIcon, path: "/equipe" },
  { id: "plano", label: "Meu plano", icon: BriefcaseIcon, path: "/plano" }
];





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







type Organization = { id: string; name: string; role: string; plan?: string | null };



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



  onCreateProject: (payload: CreateProjectPayload) => Promise<void>;



  onUpdateProject: (projectId: string, payload: CreateProjectPayload) => Promise<void>;



};











export type DashboardOutletContext = {
  organizations: Organization[];
  selectedOrganizationId: string;
  onOrganizationChange: (organizationId: string) => void;
  currentOrgRole?: string | null;
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





const CalendarIcon = () => (

  <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">



    <rect x="3" y="5.5" width="18" height="15" rx="2" ry="2" fill="none" stroke="currentColor" strokeWidth="1.5" />



    <line x1="3" y1="9" x2="21" y2="9" stroke="currentColor" strokeWidth="1.5" />



    <line x1="8" y1="3" x2="8" y2="7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />



    <line x1="16" y1="3" x2="16" y2="7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />



  </svg>



);







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







const MoreIcon = () => (



  <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">



    <circle cx="5" cy="12" r="1.6" fill="currentColor" />



    <circle cx="12" cy="12" r="1.6" fill="currentColor" />



    <circle cx="19" cy="12" r="1.6" fill="currentColor" />



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
  "Não iniciado": "bg-slate-50 text-slate-700 border-slate-300",
  "Em andamento": "bg-blue-50 text-blue-700 border-blue-300",
  "Em atraso": "bg-red-50 text-red-700 border-red-300",
  "Em risco": "bg-amber-50 text-amber-800 border-amber-300",
  "Homologação": "bg-indigo-50 text-indigo-800 border-indigo-300",
  "Finalizado": "bg-emerald-50 text-emerald-700 border-emerald-300",
  default: "bg-slate-50 text-slate-700 border-slate-300",
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
  filterOverdue

}: WbsTreeViewProps) => {



  const {

    selectedOrganizationId: currentOrganizationId,

    selectedProjectId,

    onReloadWbs

  } = useOutletContext<DashboardOutletContext>();
  const { token: authToken, user: currentUser } = useAuth();






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



  const [editingDependenciesId, setEditingDependenciesId] = useState<string | null>(null);



  const [pendingDependencies, setPendingDependencies] = useState<string[]>([]);



  const dependencyEditorRef = useRef<HTMLDivElement | null>(null);


  const menuRef = useRef<HTMLDivElement | null>(null);
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const selectAllRef = useRef<HTMLInputElement | null>(null);
  const [openChatTaskId, setOpenChatTaskId] = useState<string | null>(null);
  const [chatDraft, setChatDraft] = useState("");
  const [chatMessages, setChatMessages] = useState<WbsComment[]>([]);
  const [chatCounts, setChatCounts] = useState<Record<string, number>>({});
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const lastClearKeyRef = useRef<number | undefined>(undefined);







  type WbsComment = {
    id: string;
    wbsNodeId: string;
    authorName?: string | null;
    message: string;
    createdAt: string;
  };

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



    setStatusPickerId(null);



    setEditingNodeId(node.id);



    setEditingTitle(node.title ?? "");



  };







  const commitTitleEdit = () => {



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







  const handleStatusToggle = (event: { stopPropagation: () => void }, nodeId: string) => {



    event.stopPropagation();



    cancelTitleEdit();



    setStatusPickerId(nodeId);



  };







  const handleStatusChange = (event: { stopPropagation: () => void }, nodeId: string, statusValue: string) => {



    event.stopPropagation();



    setStatusPickerId(null);



    const normalized = statusValue.toUpperCase();



    const current = (rowMap.get(nodeId)?.node.status ?? "").toUpperCase();



    if (current === normalized) return;



    onUpdate(nodeId, { status: normalized });



  };







  const handleDateFieldChange = (nodeId: string, field: "startDate" | "endDate", inputValue: string) => {



    cancelTitleEdit();



    setStatusPickerId(null);



    const row = rowMap.get(nodeId);



    if (!row) return;



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



    cancelTitleEdit();



    setStatusPickerId(null);



    if (!value) return;



    const parsed = Number(value);



    if (!Number.isFinite(parsed) || parsed <= 0) return;



    const DurationDays = Math.max(1, Math.round(parsed));



    const row = rowMap.get(nodeId);



    if (!row) return;



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

  const filteredRows = useMemo(() => {
    const q = filterText?.trim().toLowerCase();
    const normalizedFilter = filterStatus && filterStatus !== "ALL" ? normalizeStatus(filterStatus) : null;

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
  }, [filterText, filterOverdue, filterOwner, filterService, filterStatus, resolveDisplayCode, visibleRows]);

  const visibleIds = useMemo(() => filteredRows.map((row) => row.node.id), [filteredRows]);



  const handleDragEnd = useCallback(

    async (event: DragEndEvent) => {



      const { active, over } = event;



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



      if (!authToken || !selectedProjectId) return;



      try {

        await fetch(apiUrl("/wbs/reorder"), {

          method: "PATCH",

          headers: {

            "Content-Type": "application/json",

            Authorization: `Bearer ${authToken}`,

            "X-Organization-Id": currentOrganizationId

          },

          body: JSON.stringify({

            projectId: selectedProjectId,

            parentId: activeParentId,

            orderedIds

          })

        });

      } catch (error) {

        console.error("Failed to reorder WBS", error);

        setTreeNodes(nodes);

        onReloadWbs?.();

      }

    },

    [authToken, currentOrganizationId, nodes, onReloadWbs, rowMap, selectedProjectId, treeNodes, updateSiblingsInTree]

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
            const res = await fetch(apiUrl(`/wbs/${row.node.id}/comments`), {
              headers: {
                Authorization: `Bearer ${authToken ?? ""}`,
                "X-Organization-Id": currentOrganizationId
              },
              signal: controller.signal
            });

            if (!res.ok) return;

            const comments: unknown = await res.json();
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

  useEffect(() => {
    if (!openChatTaskId) {
      setChatMessages([]);
      setChatError(null);
      return;
    }

    let active = true;
    setIsChatLoading(true);
    setChatError(null);

    const loadComments = async () => {
      try {
        const response = await fetch(apiUrl(`/wbs/${openChatTaskId}/comments`), {
          headers: {
            Authorization: `Bearer ${authToken ?? ""}`,
            "X-Organization-Id": currentOrganizationId
          }
        });

        if (!response.ok) {
          console.error("Erro na API de Comentários (GET)", response.status, await response.text());
          if (active) setChatError("Erro ao listar Comentários");
          return;
        }

        const data = (await response.json()) as WbsComment[];
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
    const trimmed = chatDraft.trim();
    if (!trimmed || !openChatTaskId) return;
    
    setIsChatLoading(true);
    setChatError(null);
    
    try {
      const response = await fetch(apiUrl(`/wbs/${openChatTaskId}/comments`), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authToken ?? ""}`,
          "Content-Type": "application/json",
          "X-Organization-Id": currentOrganizationId
        },
        body: JSON.stringify({ message: trimmed, authorName: (currentUser as { name?: string } | null)?.name ?? null })
      });
      
      if (!response.ok) {
        console.error("Erro na API de Comentários (POST)", response.status, await response.text());
        setChatError("Erro ao criar comentário");
        return;
      }
      
      const created = (await response.json()) as WbsComment;
      setChatMessages((prev) => [...prev, created]);
      setChatCounts((prev) => ({ ...prev, [openChatTaskId]: (prev[openChatTaskId] ?? 0) + 1 }));
      setChatDraft("");
      setChatError(null);
    } catch (error) {
      console.error("Erro na API de Comentários (POST)", error);
      setChatError("Erro ao enviar comentário");
    } finally {
      setIsChatLoading(false);
    }
  };








  const handleLevelAdjust = (event: MouseEvent<HTMLButtonElement>, nodeId: string, direction: "up" | "down") => {



    event.stopPropagation();



    cancelTitleEdit();



    setStatusPickerId(null);



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



    cancelTitleEdit();



    closeDependencyEditor();



  };







  const openDependencyEditorForNode = (nodeId: string, dependencies: string[]) => {



    cancelTitleEdit();



    setStatusPickerId(null);



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



    if (event.key === "Enter" || event.key === " ") {



      event.preventDefault();



      openDependencyEditorForNode(nodeId, dependencies);



    } else if (event.key === "Escape") {



      event.preventDefault();



      closeDependencyEditor();



    }



  };







  const handleDependencyToggle = (nodeId: string, dependencyId: string, checked: boolean) => {



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



    cancelTitleEdit();



    setStatusPickerId(null);



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
      if (!selectedProjectId || !authToken || !currentOrganizationId) return;
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
        await fetch(apiUrl("/wbs/reorder"), {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
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
    [authToken, currentOrganizationId, onReloadWbs, rowMap, selectedProjectId, treeNodes]
  );

  const handleMenuAction = async (event: MouseEvent<HTMLButtonElement>, action: RowAction, node: any) => {
    event.stopPropagation();

    if (!selectedProjectId || !authToken || !currentOrganizationId) {
      setOpenMenuId(null);
      return;
    }

    const parentId = node.parentId ?? null;

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
          const createRes = await fetch(apiUrl("/wbs"), {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${authToken}`,
              "X-Organization-Id": currentOrganizationId
            },
            body: JSON.stringify({ projectId: selectedProjectId, ...payload })
          });
          const created = await createRes.json();
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

          await fetch(apiUrl("/wbs/reorder"), {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
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
        await fetch(apiUrl("/wbs/bulk-delete"), {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
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
    if (!selectedProjectId || !authToken || !currentOrganizationId) return;
    if (selectedTaskIds.length === 0) return;
    const confirmMove = window.confirm(`Enviar ${selectedTaskIds.length} tarefas para a lixeira?`);
    if (!confirmMove) return;
    try {
      await fetch(apiUrl("/wbs/bulk-delete"), {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
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
          <table className="wbs-table w-full border-collapse table-fixed" style={{ borderSpacing: 0 }}>
<colgroup>
            <col style={{ width: "28px" }} />
            <col style={{ width: "32px" }} />
            <col style={{ width: "50px" }} />
            <col style={{ width: "70px" }} />
            <col style={{ width: "90px" }} />
            <col style={{ width: "320px" }} />
            <col style={{ width: "170px" }} />
            <col style={{ width: "140px" }} />
            <col style={{ width: "85px" }} />
            <col style={{ width: "180px" }} />
            <col style={{ width: "180px" }} />
            <col style={{ width: "180px" }} />
            <col style={{ width: "200px" }} />
            <col style={{ width: "110px" }} />
            <col style={{ width: "90px" }} />
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
            <th className="px-1 py-2 text-center align-middle">Nvel</th>
            <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500">Nome da tarefa</th>
            <th className="w-[150px] px-3 py-2 text-left align-middle">Situação</th>
            <th className="w-[140px] px-3 py-2 text-left align-middle">Prioridade</th>
            <th className="w-[140px] px-3 py-2 text-left align-middle">Durao</th>
            <th className="w-[220px] px-4 py-2 text-left text-xs font-semibold text-slate-500">Incio</th>
            <th className="w-[220px] px-4 py-2 text-left text-xs font-semibold text-slate-500">Trmino</th>
            <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500">Responsável</th>
            <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500">Catálogo de Serviços</th>
            <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500">Multiplicador</th>
            <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500">HR</th>
            <th className="w-[150px] px-3 py-2 text-left align-middle">Dependncias</th>
            <th className="w-[150px] px-3 py-2 text-center align-middle">Detalhes</th>
          </tr>
        </thead>

          <SortableContext items={visibleIds} strategy={verticalListSortingStrategy}>
            <tbody>



                {filteredRows.map((row) => {



              const displayId = resolveDisplayCode(row.node, row.displayId);



              const visualLevel = typeof row.node.level === "number" ? row.node.level : row.level;



              const status = resolveStatus(row.node.status);



              const isExpanded = row.hasChildren
                ? (expandedNodes[row.node.id] ?? visualLevel < 1)
                : false;



              const isActive = selectedNodeId === row.node.id;



              const responsibleMembershipId = row.node.responsible?.membershipId ?? "";



              const dependencyBadges = Array.isArray(row.node.dependencies) ? row.node.dependencies : [];
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
              const durationInDays = calcDurationInDays(row.node.startDate, row.node.endDate);
              const isStatusPickerOpen = statusPickerId === row.node.id;
              const priorityValue = normalizePriorityValue(
                row.node.priority ?? row.node.prioridade ?? row.node.task_priority
              );



              const progressValue = progressMap.get(row.node.id) ?? 0;



              const isRootLevel = visualLevel === 0;
              const formattedLevel = `${visualLevel}`;



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
                          {row.node.level}
                        </span>
                        <button
                          type="button"
                          onClick={(event) => handleLevelAdjust(event, row.node.id, "down")}
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
                          {">"}
                        </button>
                      </div>
                    </td>



                    <td className="w-[140px] px-3 py-2 align-middle">



                      <div className={`flex w-full items-center gap-2 flex-1 min-w-[380px] max-w-none wbs-task-name ${visualLevel <= 1 ? "is-phase" : ""} ${levelClass}`}>



                        {row.hasChildren ? (



                          <button



                            type="button"



                            className={`wbs-toggle ${isExpanded ? "is-open" : ""}`}



                            onClick={(event) => handleToggle(event, row.node.id, visualLevel)}



                            aria-label={isExpanded ? "Recolher subtarefas" : "Expandir subtarefas"}



                            aria-expanded={isExpanded}



                          >



                            {isExpanded ? "v" : ">"}



                          </button>



                        ) : (



                          <span className="wbs-toggle placeholder" />



                        )}



                        <div className="flex items-center gap-2 flex-1 min-w-[380px] max-w-none">



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



                    <td className="px-3 py-2 align-middle">
                      <select
                        value={normalizeStatus(row.node.status)}
                        onClick={(event) => event.stopPropagation()}
                        onChange={(event) => {
                          event.stopPropagation();
                          onUpdate(row.node.id, { status: event.target.value });
                        }}
                        aria-label="Alterar situação da tarefa"
                        className={clsx(
                          "wbs-status-select",
                          STATUS_CLASS[normalizeStatus(row.node.status)] ?? STATUS_CLASS.default
                        )}
                      >
                        {STATUS_ORDER.map((statusOption) => (
                          <option key={statusOption} value={statusOption}>
                            {statusOption}
                          </option>
                        ))}
                      </select>
                    </td>

                    <td className="px-3 py-2 align-middle">
                      <select
                        className="wbs-priority-select"
                        value={priorityValue}
                        onClick={(event) => event.stopPropagation()}
                        onChange={(event) => {
                          event.stopPropagation();
                          onUpdate(row.node.id, { priority: event.target.value });
                        }}
                        aria-label="Alterar prioridade da tarefa"
                      >
                        {PRIORITY_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </td>



                    <td className="w-[140px] px-3 py-2 align-middle">
                      <span className="inline-flex items-center whitespace-nowrap rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700">
                        {durationInDays} {durationInDays === 1 ? "dia" : "dias"}
                      </span>
                    </td>



                    <td className="px-4 py-2 align-middle w-[220px]">
                      <div className="wbs-date-input-wrapper">
                        <input
                          type="date"
                          value={formatDateInputValue(row.node.startDate)}
                          onChange={(event) => handleDateFieldChange(row.node.id, "startDate", event.target.value)}
                          onClick={(event) => event.stopPropagation()}
                          placeholder="dd/mm/aaaa"
                          className="wbs-date-input"
                        />
                      </div>
                    </td>



                    <td className="px-4 py-2 align-middle w-[220px]">
                      <div className="wbs-date-input-wrapper">
                        <input
                          type="date"
                          value={formatDateInputValue(row.node.endDate)}
                          onChange={(event) => handleDateFieldChange(row.node.id, "endDate", event.target.value)}
                          onClick={(event) => event.stopPropagation()}
                          placeholder="dd/mm/aaaa"
                          className="wbs-date-input"
                        />
                      </div>
                    </td>



                    <td className="px-4 py-2 align-middle min-w-[180px]">
                      <select
                        className="wbs-responsible-select"
                        value={responsibleMembershipId}
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
                        disabled={!serviceCatalog?.length}
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

                      <DependenciesDropdown
                        options={dependencyOptionsList}
                        selectedIds={dependencyBadges}
                        onChange={(newSelected) => onUpdate(row.node.id, { dependencies: newSelected })}
                      />

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



            </tbody>
          </SortableContext>


          </table>

        </div>
      </DndContext>

      {selectedTaskIds.length > 0 && (
        <div className="wbs-bulk-bar">
          <span className="wbs-bulk-info">{selectedTaskIds.length} selecionada(s)</span>
          <div className="wbs-bulk-actions">
            <button type="button" className="btn-secondary" onClick={() => setSelectedTaskIds([])}>
              Limpar seleção
            </button>
            <button type="button" className="btn-danger-ghost" onClick={handleBulkTrash}>
              Enviar para lixeira
            </button>
          </div>
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
                { label: "Subir tarefa", action: "MOVE_UP" },
                { label: "Descer tarefa", action: "MOVE_DOWN" },
                { label: "Adicionar subtarefa", action: "ADD_CHILD" },
                { label: "Duplicar", action: "DUPLICATE" },
                { label: "Enviar para lixeira", action: "TRASH" }
              ].map((item) => (
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
          <div className="gp-modal-header">
            <h2 id="wbs-chat-title">
              Chat da tarefa {openChatRow.node.wbsCode ?? openChatRow.displayId} - {openChatRow.node.title ?? "Tarefa"}
            </h2>
            <button type="button" className="gp-modal-close" aria-label="Fechar" onClick={() => setOpenChatTaskId(null)}>
              X
            </button>
          </div>
          <div className="gp-modal-body wbs-chat-body">
            <div className="wbs-chat-messages">
              {isChatLoading && <p className="muted">Carregando Comentários...</p>}
              {!isChatLoading &&
                chatMessagesForModal.map((message: WbsComment) => (
                  <div key={message.id} className="wbs-chat-message">
                    <div className="wbs-chat-message__meta">
                      <strong>{message.authorName ?? "Autor"}</strong>
                      <span>{message.createdAt ? new Date(message.createdAt).toLocaleString("pt-BR") : ""}</span>
                    </div>
                    <p>{message.message}</p>
                  </div>
                ))}
              {!isChatLoading && chatMessagesForModal.length === 0 && <p className="muted">Nenhum comentário ainda.</p>}
              {chatError && <p className="error-text">{chatError}</p>}
            </div>
            <div className="wbs-chat-composer">
              <textarea
                value={chatDraft}
                onChange={(event) => setChatDraft(event.target.value)}
                placeholder="Escreva um comentário… use @ para mencionar alguém"
                rows={3}
              />
              <div className="wbs-chat-actions">
                <button type="button" className="btn-secondary" onClick={() => setOpenChatTaskId(null)}>
                  Fechar
                </button>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={handleSendChat}
                  disabled={!chatDraft.trim() || isChatLoading}
                >
                  Enviar
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
  )}
    </>
  );

};



export const GanttTimeline = ({ tasks, milestones }: { tasks: any[]; milestones: any[] }) => {



  if (!tasks.length) return <p className="muted">Nenhuma tarefa com datas definidas.</p>;







  const allDates = [



    ...tasks.flatMap((task) => [task.startDate, task.endDate]),



    ...milestones.map((milestone) => milestone.dueDate)



  ]



    .filter(Boolean)



    .map((value) => new Date(value as string));







  if (!allDates.length) {



    return <p className="muted">Defina datas para visualizar o cronograma.</p>;



  }







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



    <div className="gantt">



      {tasks.map((task) => (



        <div key={task.id} className="gantt-row">



          <div className="gantt-row__label">



            <strong>{task.title}</strong>



            <span>{task.status}</span>



          </div>



          <div className="gantt-row__bar">



            <span



              style={{



                left: `${offsetPercent(task.startDate)}%`,



                width: `${widthPercent(task.startDate, task.endDate)}%`



              }}



            />



          </div>



        </div>



      ))}



      <div className="gantt-milestones">



        <strong>Marcos:</strong>{" "}



        {milestones.length



          ? milestones.map((milestone) => `${milestone.name} (${formatDate(milestone.dueDate)})`).join(", ")



          : "Nenhum marco"}



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
      return new Date(value).toLocaleDateString("pt-BR", {
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







  





  const boardContent = (

    <div className="tab-panel">

      {boardError && <p className="error-text">{boardError}</p>}

      <CustomKanbanBoard

        columns={kanbanColumns}

        onDragEnd={onDragTask}

        onCreate={onCreateTask}

        onTaskClick={onKanbanTaskClick}

        newTaskTitle={newTaskTitle}

        onTaskTitleChange={onTaskTitleChange}

        newTaskColumn={newTaskColumn}

        onTaskColumnChange={onTaskColumnChange}

      />

    </div>




  );





  const ganttContent = (



    <div className="tab-panel">



      {ganttError && <p className="error-text">{ganttError}</p>}



      <GanttTimeline tasks={ganttTasks} milestones={ganttMilestones} />



    </div>



  );







  const calendarContent = (



    <div className="tab-panel">



      {calendarEvents.length ? (



        <ul className="calendar-list">



          {calendarEvents.map((event) => (



            <li key={event.id}>



              <div className="calendar-date">



                <span>{formatShortDate(event.date)}</span>



                <small>{event.type}</small>



              </div>



              <strong>{event.title}</strong>



            </li>



          ))}



        </ul>



      ) : (



        <p className="muted">Nenhum evento agendado.</p>



      )}



    </div>



  );







  const docsContent = (



    <div className="tab-panel">



      {attachmentsError && <p className="error-text">{attachmentsError}</p>}



      {attachmentsLoading ? (



        <div className="docs-grid">



          {[0, 1, 2].map((index) => (



            <article key={index} className="doc-card skeleton-card">



              <div className="skeleton skeleton-title" />



              <div className="skeleton skeleton-text" />



              <div className="skeleton skeleton-text" style={{ width: "40%" }} />



            </article>



          ))}



        </div>



      ) : attachments.length ? (

        <div className="docs-grid">

          {attachments.map((doc) => (

            <article key={doc.id} className="doc-card">

              <div>

                <h4>{doc.fileName}</h4>



                <p className="subtext">{doc.category ?? "Documento"}</p>



              </div>



              <small>



                {doc.uploadedBy?.fullName ?? doc.uploadedBy?.email ?? "Equipe"} · {formatShortDate(doc.createdAt)}



              </small>



              <small>



                {formatFileSize(doc.fileSize)} · {doc.targetType === "WBS_NODE" ? "Vinculado à WBS" : "Projeto"}



              </small>



              <button



                type="button"



                className="ghost-button"



                onClick={() => window.alert("Integração de download em breve.")}



              >



                Baixar



              </button>



            </article>

          ))}

        </div>

      ) : (

        <EmptyStateCard

          icon={FileIcon}

          title="Nenhum documento enviado"

          description="Centralize atas, contratos e anexos importantes para facilitar o acompanhamento."

          actionLabel="Adicionar documento"

          onAction={handleAddDocument}

        />

      )}

    </div>

  );





  const activityContent = (



    <div className="tab-panel activity-panel">



      <article className="card">



        <div className="card-header">



          <h3>Timeline de atividades</h3>



        </div>



        {commentsError && <p className="error-text">{commentsError}</p>}



        {activityItems.length ? (

          <ul className="activity-timeline">

            {activityItems.map((activity) => (

              <li key={activity.id}>

                <div className="activity-avatar">{activity.author?.slice(0, 2).toUpperCase()}</div>

                <div>

                  <strong>{activity.author}</strong>



                  <span>{activity.role}</span>



                  <p>{activity.body}</p>



                  <small>{formatShortDate(activity.createdAt)}</small>



                </div>



              </li>

            ))}

          </ul>

        ) : (

          <EmptyStateCard

            icon={CommentIcon}

            title="Nenhuma atividade registrada"

            description="Compartilhe atualizações ou registre horas para construir o histórico colaborativo do projeto."

            actionLabel="Registrar atualizAo"

            onAction={focusCommentComposer}

          />

        )}

      </article>





      <div className="split-grid">



        <article className="card">



          <div className="card-header">



            <h3>Novo comentário</h3>



          </div>



          <form onSubmit={onSubmitComment} className="feedback-form">



            <p className="muted">Selecione um item na EDT para vincular o comentário.</p>



            <textarea

              ref={commentTextareaRef}

              placeholder="Anote atualizações ou decisões..."

              value={commentBody}

              onChange={(event) => onCommentBodyChange(event.target.value)}

            />

            <button type="submit" className="primary-button" disabled={!selectedNodeId || !commentBody.trim()}>



              Registrar comentário



            </button>



          </form>



        </article>







        <article className="card">



          <div className="card-header">



            <h3>Registro rápido de horas</h3>



          </div>



          <form onSubmit={onLogTime} className="time-form">



            <p className="muted">Selecione uma tarefa na EDT antes de registrar.</p>



            <label>



              Data



              <input type="date" value={timeEntryDate} onChange={(event) => onTimeEntryDateChange(event.target.value)} />



            </label>



            <label>



              Horas



              <input



                type="number"



                min="0.25"



                step="0.25"



                value={timeEntryHours}



                onChange={(event) => onTimeEntryHoursChange(event.target.value)}



              />



            </label>



            <label>



              descrição



              <textarea value={timeEntryDescription} onChange={(event) => onTimeEntryDescriptionChange(event.target.value)} />



            </label>



            {timeEntryError && (



              <p className="error-text" role="status">



                {timeEntryError}



              </p>



            )}



            <button type="submit" className="primary-button" disabled={!selectedNodeId}>



              Registrar horas



            </button>



          </form>



        </article>



      </div>



    </div>



  );



  const boardTabPlaceholder = (

    <div className="tab-panel">

      <p className="muted">O board deste projeto está em uma página dedicada.</p>

    </div>

  );



  const ganttTabPlaceholder = (

    <div className="tab-panel">

      <p className="muted">O cronograma deste projeto está em uma página dedicada.</p>

    </div>

  );



  const docsTabPlaceholder = (

    <div className="tab-panel">

      <p className="muted">Os documentos deste projeto estão em uma página dedicada.</p>

    </div>

  );







  const tabContentMap: Record<string, JSX.Element> = {



    overview: overviewContent,



    board: boardTabPlaceholder,



    gantt: ganttTabPlaceholder,



    calendar: calendarContent,



    docs: docsTabPlaceholder,



    activity: activityContent



  };







  return (



    <section className="project-details">



      {overviewHeader}



      {tabContentMap[activeTab]}



    </section>



  );



};







const TeamPanel = ({



  members,



  membersError,



  projectName



}: {



  members: any[];



  membersError: string | null;



  projectName: string | null;



}) => {



  const [roleFilter, setRoleFilter] = useState("all");



  const [statusFilter, setStatusFilter] = useState("all");



  const [search, setSearch] = useState("");



  const [selectedMember, setSelectedMember] = useState<any | null>(null);







  const enrichedMembers = useMemo(() => {



    return members.map((member) => {



      const allocation = Math.min(100, Math.round(((member.capacityWeekly ?? 40) / 40) * 100));



      const status =



        allocation >= 90 ? "Alta carga" : allocation <= 40 ? "disponível" : "Balanceado";



      const skills =



        Array.isArray((member as any).skills) && (member as any).skills.length



          ? (member as any).skills



          : [member.role, `Carga ${allocation}%`];



      return {



        ...member,



        allocation,



        status,



        skills,



        avatar: member.name?.slice(0, 2).toUpperCase() ?? "EQ",



        workload: allocation



      };



    });



  }, [members]);







  const filteredMembers = useMemo(() => {



    return enrichedMembers.filter((member) => {



      const matchesRole = roleFilter === "all" || member.role === roleFilter;



      const matchesStatus = statusFilter === "all" || member.status === statusFilter;



      const matchesSearch =



        !search ||



        member.name?.toLowerCase().includes(search.toLowerCase()) ||



        member.email?.toLowerCase().includes(search.toLowerCase());



      return matchesRole && matchesStatus && matchesSearch;



    });



  }, [enrichedMembers, roleFilter, statusFilter, search]);







  const roleOptions = useMemo(



    () => Array.from(new Set(members.map((member) => member.role))).filter(Boolean),



    [members]



  );







  if (!members.length && !membersError) {



    return null;



  }







  return (



    <section className="team-section">



      <div className="team-section__header">



        <div>



          <p className="eyebrow">Equipe</p>



          <h2>Visão da Equipe do projeto</h2>



          <p className="subtext">



            Filtre por papel, status ou busque pessoas para abrir o painel detalhado.



          </p>



        </div>



        <div className="team-summary">



          <strong>{members.length}</strong>



          <span>Colaboradores no projeto {projectName ?? "atual"}</span>



        </div>



      </div>







      <div className="team-filters">



        <label>



          Papel



          <select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)}>



            <option value="all">Todos</option>



            {roleOptions.map((role) => (



              <option key={role} value={role}>



                {role}



              </option>



            ))}



          </select>



        </label>



        <label>



          Status



          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>



            <option value="all">Todos</option>



            <option value="disponível">disponível</option>



            <option value="Alocado">Alocado</option>



            <option value="Em férias / folga">Em férias / folga</option>



          </select>



        </label>



        <label className="search-field">



          Busca



          <input



            type="search"



            placeholder="Nome ou e-mail..."



            value={search}



            onChange={(event) => setSearch(event.target.value)}



          />



        </label>



      </div>







      {membersError && <p className="error-text">{membersError}</p>}







      {filteredMembers.length ? (



        <div className="team-grid">



          {filteredMembers.map((member) => (



            <article



              key={member.id}



              className="team-card"



              onClick={() => setSelectedMember(member)}



            >



              <div className="team-card__header">



                <div className="avatar">{member.avatar}</div>



                <div>



                  <strong>{member.name}</strong>



                  <span>{member.role}</span>



                </div>



                <span className="pill pill-neutral">{member.status}</span>



              </div>



              <div className="team-card__body">



                <p>{member.email}</p>



                <div className="progress-bar team-card__allocation">



                  <span style={{ width: `${member.allocation}%` }} />



                </div>



                <small>AlocAo: {member.allocation}%</small>



                <div className="team-card__skills">



                  {member.skills.map((skill: string) => (



                    <span key={`${member.id}-${skill}`}>{skill}</span>



                  ))}



                </div>



              </div>



              <button type="button" className="ghost-button">



                Ver detalhes



              </button>



            </article>



          ))}



        </div>



      ) : (



        <p className="muted">Nenhum membro corresponde aos filtros selecionados.</p>



      )}







      {selectedMember && (



        <div className="team-drawer" onClick={() => setSelectedMember(null)}>



          <div className="team-drawer__content" onClick={(event) => event.stopPropagation()}>



            <header>



              <div className="avatar is-large">{selectedMember.avatar}</div>



              <div>



                <h3>{selectedMember.name}</h3>



                <p>{selectedMember.email}</p>



                <span className="pill pill-neutral">{selectedMember.status}</span>



              </div>



              <button type="button" className="ghost-button" onClick={() => setSelectedMember(null)}>



                Fechar



              </button>



            </header>



            <div className="team-drawer__details">



              <div>



                <strong>Papel</strong>



                <p>{selectedMember.role}</p>



              </div>



              <div>



                <strong>Capacidade semanal</strong>



                <p>{selectedMember.capacityWeekly ?? 0}h</p>



              </div>



              <div>



                <strong>AlocAo</strong>



                <p>{selectedMember.allocation}%</p>



              </div>



            </div>



            <div>



              <strong>Skills</strong>



              <div className="team-card__skills">



                {selectedMember.skills.map((skill: string) => (



                  <span key={`${selectedMember.id}-${skill}`}>{skill}</span>



                ))}



              </div>



            </div>



          </div>



        </div>



      )}



    </section>



  );



};







export const ReportsPanel = ({



  metrics,



  metricsError,



  metricsLoading



}: {



  metrics: any | null;



  metricsError: string | null;



  metricsLoading: boolean;



}) => {



  const [activeTab, setActiveTab] = useState("status");







  const statusData = useMemo<{ status: string; value: number }[]>(() => {



    if (!metrics?.byStatus) return [];



    return Object.entries(metrics.byStatus).map(([status, value]) => ({



      status,



      value: Number(value)



    }));



  }, [metrics]);







  const riskData = metrics?.riskSummary ?? { open: 0, closed: 0 };



  const hoursByProject =



    ((metrics?.hoursByProject as { projectId: string; projectName: string; hours: number }[] | undefined) ?? []).slice(



      0,



      5



    );



  const progressSeries =



    (metrics?.progressSeries as { date: string; progress: number }[] | undefined) ?? [];







  if (!metrics && !metricsError && !metricsLoading) return null;







  return (



    <section className="reports-section">



      <header className="reports-header">



        <div>



          <p className="eyebrow">Relatórios</p>



          <h2>Visão analítica</h2>



          <p className="subtext">Escolha o foco para comparar resultados do portfólio.</p>



        </div>



        <div className="reports-tabs">



          {[



            { id: "status", label: "Status" },



            { id: "risks", label: "Riscos" },



            { id: "hours", label: "Horas" },



            { id: "progress", label: "Progresso" }



          ].map((tab) => (



            <button



              key={tab.id}



              type="button"



              className={activeTab === tab.id ? "is-active" : ""}



              onClick={() => setActiveTab(tab.id)}



            >



              {tab.label}



            </button>



          ))}



        </div>



      </header>







      {metricsError && <p className="error-text">{metricsError}</p>}







      {metricsLoading ? (



        <p className="muted">Carregando Relatórios...</p>



      ) : (



        <div className="reports-grid">



          {activeTab === "status" && (

            <article className="reports-card">

              <h3>Status dos projetos</h3>

              {statusData.length ? (

                <ul className="reports-list">

                  {statusData.map((item) => (

                    <li key={item.status}>

                      <span>{item.status}</span>

                      <strong>{item.value}</strong>

                    </li>

                  ))}

                </ul>

              ) : (

                <EmptyStateCard

                  icon={InsightIcon}

                  title="Sem status consolidados"

                  description="Assim que os projetos forem sincronizados, mostraremos o panorama por status aqui."

                />

              )}

            </article>

          )}



          {activeTab === "risks" && (

            <article className="reports-card">

              <h3>Riscos</h3>

              {riskData.open || riskData.closed ? (

                <div className="reports-risk">

                  <div>

                    <span>Abertos</span>

                    <strong>{riskData.open}</strong>

                  </div>

                  <div>

                    <span>Fechados</span>

                    <strong>{riskData.closed}</strong>

                  </div>

                </div>

              ) : (

                <EmptyStateCard

                  icon={InsightIcon}

                  title="Nenhum risco registrado"

                  description="Cadastre riscos nos projetos para acompanhar o volume por status."

                />

              )}

            </article>

          )}



          {activeTab === "hours" && (

            <article className="reports-card">

              <h3>Horas por projeto</h3>

              {hoursByProject.length ? (

                <ul className="reports-list">

                  {hoursByProject.map((project: any) => (

                    <li key={project.projectId}>

                      <span>{project.projectName}</span>

                      <strong>{project.hours?.toFixed ? project.hours.toFixed(1) : project.hours}h</strong>

                    </li>

                  ))}

                </ul>

              ) : (

                <EmptyStateCard

                  icon={InsightIcon}

                  title="Sem apontamentos de horas"

                  description="Registre horas nos projetos para comparar o esforço entre Equipes."

                />

              )}

            </article>

          )}



          {activeTab === "progress" && (

            <article className="reports-card">

              <h3>Progresso médio</h3>

              {progressSeries.length ? (

                <div className="reports-sparkline">

                  {progressSeries.map((point: any) => (

                    <span

                      key={point.date}

                      style={{ height: `${Math.max(5, point.progress)}%` }}

                      title={`${point.date} - ${point.progress}%`}

                    />

                  ))}

                </div>

              ) : (

                <EmptyStateCard

                  icon={InsightIcon}

                  title="Progresso indisponível"

                  description="Atualize o status das tarefas para gerar a linha de tendência do portfólio."

                />

              )}

            </article>

          )}

        </div>

      )}



    </section>



  );



};







const SettingsPanel = () => {



  const [activeSection, setActiveSection] = useState("profile");







  const sections = [



    { id: "profile", label: "Perfil" },



    { id: "notifications", label: "Notificações" },



    { id: "organization", label: "Organização" },



    { id: "permissions", label: "Permissões" },



    { id: "integrations", label: "Integrações" },



    { id: "billing", label: "Faturamento" }



  ];







  return (



    <section className="settings-section">



      <header>



        <div>



          <p className="eyebrow">Configurações</p>



          <h2>Central de ajustes</h2>



          <p className="subtext">Gerencie perfil, notificações, Organização e integrações.</p>



        </div>



      </header>







      <div className="settings-layout">



        <nav className="settings-menu">



          {sections.map((section) => (



            <button



              key={section.id}



              type="button"



              className={activeSection === section.id ? "is-active" : ""}



              onClick={() => setActiveSection(section.id)}



            >



              {section.label}



            </button>



          ))}



        </nav>







        <div className="settings-content">



          {activeSection === "profile" && (



            <form className="settings-form">



              <h3>Perfil</h3>



              <label>



                Nome completo



                <input type="text" placeholder="Seu nome" />



              </label>



              <label>



                E-mail



                <input type="email" placeholder="voce@empresa.com" />



              </label>



              <label>



                Idioma



                <select>



                  <option>Português (Brasil)</option>



                  <option>Inglês</option>



                </select>



              </label>



              <button type="button" className="primary-button">



                Atualizar perfil



              </button>



            </form>



          )}







          {activeSection === "notifications" && (



            <div className="settings-form">



              <h3>Notificações</h3>



              <label className="settings-toggle">



                <input type="checkbox" defaultChecked />



                <span>E-mails sobre tarefas atribuídas</span>



              </label>



              <label className="settings-toggle">



                <input type="checkbox" />



                <span>Mensagens em canais do Slack</span>



              </label>



              <label className="settings-toggle">



                <input type="checkbox" defaultChecked />



                <span>Alertas de riscos</span>



              </label>



            </div>



          )}







          {activeSection === "organization" && (



            <div className="settings-form">



              <h3>Organização</h3>



              <label>



                Nome da Organização



                <input type="text" placeholder="Organização Demo" />



              </label>



              <label>



                Domínio



                <input type="text" placeholder="demo.local" />



              </label>



              <button type="button" className="secondary-button">



                Salvar



              </button>



            </div>



          )}







          {activeSection === "permissions" && (



            <div className="settings-form">



              <h3>Permissões e papéis</h3>



              <p className="muted">Gerencie quem pode criar projetos, alterar WBS e exportar dados.</p>



              <table className="settings-table">



                <thead>



                  <tr>



                    <th>Papel</th>



                    <th>Criar projeto</th>



                    <th>Editar WBS</th>



                    <th>Ver Relatórios</th>



                  </tr>



                </thead>



                <tbody>



                  {["OWNER", "ADMIN", "MEMBER", "VIEWER"].map((role) => (



                    <tr key={role}>



                      <td>{role}</td>



                      <td>



                        <input type="checkbox" defaultChecked={role !== "VIEWER"} />



                      </td>



                      <td>



                        <input type="checkbox" defaultChecked={role === "OWNER" || role === "ADMIN"} />



                      </td>



                      <td>



                        <input type="checkbox" defaultChecked={role !== "VIEWER"} />



                      </td>



                    </tr>



                  ))}



                </tbody>



              </table>



            </div>



          )}







          {activeSection === "integrations" && (



            <div className="settings-form">



              <h3>Integrações</h3>



              <div className="integrations-grid">



                {["GitHub", "Google Drive", "Slack", "Google Calendar"].map((integration) => (



                  <article key={integration}>



                    <strong>{integration}</strong>



                    <p className="muted">Sincronize dados e automatize o fluxo.</p>



                    <button type="button" className="secondary-button">



                      Conectar



                    </button>



                  </article>



                ))}



              </div>



            </div>



          )}







          {activeSection === "billing" && (



            <div className="settings-form">



              <h3>Faturamento / Plano</h3>



              <p className="muted">Plano atual: <strong>Pro · 20/50 projetos</strong></p>



              <button type="button" className="secondary-button">



                Gerenciar plano



              </button>



            </div>



          )}



        </div>



      </div>



    </section>



  );



};











export const DashboardLayout = ({

  userEmail,



  organizations,



  selectedOrganizationId,



  onOrganizationChange,



  currentOrgRole,



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

  onCreateProject,

  onUpdateProject,

}: DashboardLayoutProps) => {

  const flattenedTasks = kanbanColumns.flatMap((column) =>

    column.tasks.map((task) => ({ ...task, column: column.title }))

  );

  const myTasks = flattenedTasks.slice(0, 6);

  const projectMeta = (portfolio as PortfolioProject[]).find((project) => project.projectId === selectedProjectId) ?? null;

  const location = useLocation();

  const navigate = useNavigate();

  const { signOut } = useAuth();

  const [isProjectModalOpen, setProjectModalOpen] = useState(false);



  const [projectForm, setProjectForm] = useState(createEmptyProjectForm());



  const [projectModalError, setProjectModalError] = useState<string | null>(null);



  const [projectModalLoading, setProjectModalLoading] = useState(false);



  const [projectToast, setProjectToast] = useState<string | null>(null);





  const [projectModalMode, setProjectModalMode] = useState<"create" | "edit">("create");

  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);

  const [isTaskModalOpen, setTaskModalOpen] = useState(false);

  const [taskModalLoading, setTaskModalLoading] = useState(false);

  const [isCollapsed, setIsCollapsed] = useState(false);






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



  const currentView = (() => {

    const segment = location.pathname.split("/")[1] || "dashboard";

    return segment || "dashboard";

  })();





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



      setProjectModalError(error instanceof Error ? error.message : "Erro ao salvar projeto");



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







  const renderTeamContent = () => (



    <TeamPanel members={members} membersError={membersError} projectName={projectMeta?.projectName ?? null} />



  );







  const renderReportsContent = () => (



    <ReportsPanel metrics={reportMetrics} metricsError={reportMetricsError} metricsLoading={reportMetricsLoading} />



  );







  const outletContext: DashboardOutletContext = {

    organizations,

    selectedOrganizationId,

    onOrganizationChange,

    currentOrgRole,

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
            <img src="/logo.png" alt="G&P Gesto de Projetos" className="sidebar-logo-img" />
            {!isCollapsed && (
              <div className="sidebar-brand-text">
                <span className="brand-sigla">G&P</span>
                <span className="brand-subtitle">Gesto de Projetos</span>
              </div>
            )}
            <span className="sidebar-toggle-icon">{isCollapsed ? "" : ""}</span>
</button>
        </div>


        <nav className="sidebar-nav">

          <div className="sidebar-title"></div>

          {sidebarNavigation.map((item) => {
            const Icon = item.icon;
            const computedPath =
              item.id === "edt" && selectedOrganizationId && selectedProjectId
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
                {item.id === "atividades" ? <div className="sidebar-divider" /> : null}
              </Fragment>
            );
          })}

        </nav>

        <div className="sidebar-plan">



          <p>

            Plano Pro · <strong>20/50</strong> projetos

          </p>

        </div>



      </aside>







      <div className="app-main">







        

      <header className="dashboard-topbar topbar">
        <div className="topbar-inner">
          <div className="topbar-left">
            <div className="header-search-wrapper">
              <input className="header-search-input" type="search" placeholder="Buscar projetos, tarefas, pessoas..." />
            </div>
          </div>

          <div className="topbar-center">
            <div className="header-context">
              <div className="context-item">
                <span className="context-label">Organização</span>
                <span className="context-value">{currentOrganization?.name ?? "Nenhuma selecionada"}</span>
              </div>
              <div className="context-item">
                <span className="context-label">Projeto atual</span>
                <select
                  className="context-select"
                  value={selectedProjectId || ""}
                  onChange={(event) => {
                    const newId = event.target.value;
                    if (newId) {
                      onSelectProject(newId);
                    }
                  }}
                  disabled={!projects?.length}
                >
                  {!selectedProjectId && <option value="">Selecione um projeto</option>}
                  {(projects || []).map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
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
                Sair
              </button>
            </div>
          </div>
        </div>
      </header>






        <main className="app-content">

          <div className="page-container">

            <Outlet context={outletContext} />

          </div>

        </main>





        {isProjectModalOpen && (



          <div className="modal-overlay" role="dialog" aria-modal="true">



            <div className="modal">



              <header className="modal-header">



                <div>



                  <p className="eyebrow">{projectModalMode === "edit" ? "Editar projeto" : "Novo projeto"}</p>



                  <h3>{projectModalMode === "edit" ? "Atualize as informções principais" : "Planeje um novo trabalho"}</h3>



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



                  descrição



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



      setTemplateModalError(error instanceof Error ? error.message : "Erro ao salvar template");



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
