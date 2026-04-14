// System-level roles (app-wide)
export const SystemRolesEnum = {
    SYSTEM_ADMIN: "system_admin",
    USER: "user",
};

export const availableSystemRoles = Object.values(SystemRolesEnum);

// Project-level roles (per-project membership)
// NOTE: values keep backwards compatibility with existing persisted roles.
export const ProjectRolesEnum = {
    // Highest permission inside a project (historically "admin")
    PROJECT_OWNER: "admin",
    // Can manage tasks/members inside a project (historically "project_admin")
    PROJECT_MANAGER: "project_admin",
    // Default membership (historically "user")
    MEMBER: "user",
};

export const availableProjectRoles = Object.values(ProjectRolesEnum);

export const TaskStatusEnum = {
    TO_DO: "to_do",
    IN_PROGRESS: "in_progress",
    DONE: "done",
};

export const availableTaskStatuses = Object.values(TaskStatusEnum);

export const TaskPriorityEnum = {
    LOW: "low",
    MEDIUM: "medium",
    HIGH: "high",
    URGENT: "urgent",
};

export const availableTaskPriorities = Object.values(TaskPriorityEnum);

export const ActivityActionEnum = {
    PROJECT_CREATED:     "project_created",
    PROJECT_UPDATED:     "project_updated",
    PROJECT_DELETED:     "project_deleted",
    MEMBER_ADDED:        "member_added",
    MEMBER_REMOVED:      "member_removed",
    MEMBER_ROLE_UPDATED: "member_role_updated",
    TASK_CREATED:        "task_created",
    TASK_UPDATED:        "task_updated",
    TASK_DELETED:        "task_deleted",
    TASK_ASSIGNED:       "task_assigned",
    TASK_STATUS_CHANGED: "task_status_changed",
    SUBTASK_CREATED:     "subtask_created",
    SUBTASK_UPDATED:     "subtask_updated",
    SUBTASK_DELETED:     "subtask_deleted",
    NOTE_CREATED:        "note_created",
    NOTE_DELETED:        "note_deleted",
};

export const availableActivityActions = Object.values(ActivityActionEnum);

export const NotificationTypeEnum = {
    TASK_ASSIGNED:       "task_assigned",
    TASK_UNASSIGNED:     "task_unassigned",
    TASK_STATUS_CHANGED: "task_status_changed",
    MENTION:             "mention",
    ADDED_TO_PROJECT:    "added_to_project",
};

export const availableNotificationTypes = Object.values(NotificationTypeEnum);