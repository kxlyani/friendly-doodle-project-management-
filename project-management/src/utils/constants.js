export const UserRolesEnum = {
    ADMIN: "admin",
    PROJECT_ADMIN: "project_admin",
    USER: "user",
};

export const availableUserRoles = Object.values(UserRolesEnum);

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
    // Project
    PROJECT_CREATED: "project_created",
    PROJECT_UPDATED: "project_updated",
    PROJECT_DELETED: "project_deleted",

    // Members
    MEMBER_ADDED: "member_added",
    MEMBER_REMOVED: "member_removed",
    MEMBER_ROLE_UPDATED: "member_role_updated",

    // Tasks
    TASK_CREATED: "task_created",
    TASK_UPDATED: "task_updated",
    TASK_DELETED: "task_deleted",
    TASK_ASSIGNED: "task_assigned",
    TASK_STATUS_CHANGED: "task_status_changed",

    // Subtasks
    SUBTASK_CREATED: "subtask_created",
    SUBTASK_UPDATED: "subtask_updated",
    SUBTASK_DELETED: "subtask_deleted",

    // Notes
    NOTE_CREATED: "note_created",
    NOTE_DELETED: "note_deleted",
};

export const availableActivityActions = Object.values(ActivityActionEnum);
