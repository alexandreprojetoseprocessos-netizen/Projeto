import { jsx as _jsx } from "react/jsx-runtime";
import { useEffect } from "react";
import { useOutletContext, useParams } from "react-router-dom";
import { ProjectDetailsTabs } from "../components/DashboardLayout";
export const ProjectDetailsPage = () => {
    const { id: routeProjectId } = useParams();
    const context = useOutletContext();
    const projectId = routeProjectId ?? "";
    useEffect(() => {
        if (projectId && projectId !== context.selectedProjectId) {
            context.onProjectChange(projectId);
        }
    }, [projectId, context.selectedProjectId, context.onProjectChange]);
    return (_jsx(ProjectDetailsTabs, { projectMeta: context.projectMeta, projectLoading: context.projectLoading, onEditProject: context.handleOpenEditProjectModal, onAddTask: context.handleOpenTaskModal, summary: context.summary, summaryError: context.summaryError, filters: context.filters, onRangeChange: context.onRangeChange, myTasks: context.myTasks, members: context.members, membersError: context.membersError, attachments: context.attachments, attachmentsError: context.attachmentsError, attachmentsLoading: context.attachmentsLoading, reportMetrics: context.reportMetrics, reportMetricsError: context.reportMetricsError, reportMetricsLoading: context.reportMetricsLoading, boardColumns: context.boardColumns, kanbanColumns: context.kanbanColumns, boardError: context.boardError, onCreateTask: context.onCreateTask, onReloadBoard: context.onReloadBoard, onDragTask: context.onDragTask, newTaskTitle: context.newTaskTitle, onTaskTitleChange: context.onTaskTitleChange, newTaskColumn: context.newTaskColumn, onTaskColumnChange: context.onTaskColumnChange, newTaskStartDate: context.newTaskStartDate, onTaskStartDateChange: context.onTaskStartDateChange, newTaskEndDate: context.newTaskEndDate, onTaskEndDateChange: context.onTaskEndDateChange, newTaskAssignee: context.newTaskAssignee, onTaskAssigneeChange: context.onTaskAssigneeChange, newTaskEstimateHours: context.newTaskEstimateHours, onTaskEstimateHoursChange: context.onTaskEstimateHoursChange, wbsNodes: context.wbsNodes, wbsError: context.wbsError, onMoveNode: context.onMoveNode, onUpdateNode: context.onUpdateWbsNode, selectedNodeId: context.selectedNodeId, onSelectNode: context.onSelectNode, comments: context.comments, commentsError: context.commentsError, onSubmitComment: context.onSubmitComment, commentBody: context.commentBody, onCommentBodyChange: context.onCommentBodyChange, timeEntryDate: context.timeEntryDate, timeEntryHours: context.timeEntryHours, timeEntryDescription: context.timeEntryDescription, timeEntryError: context.timeEntryError, onTimeEntryDateChange: context.onTimeEntryDateChange, onTimeEntryHoursChange: context.onTimeEntryHoursChange, onTimeEntryDescriptionChange: context.onTimeEntryDescriptionChange, onLogTime: context.onLogTime, ganttTasks: context.ganttTasks, ganttMilestones: context.ganttMilestones, ganttError: context.ganttError, onKanbanTaskClick: (task) => {
            const targetId = task?.wbsNodeId ?? task?.id;
            if (targetId) {
                context.onSelectNode(targetId);
            }
        } }));
};
