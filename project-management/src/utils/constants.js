export const UserRolesEnum = {
    ADMIN: 'admin',
    PROJECT_ADMIN: 'project_admin', 
    USER: 'user',
};

export const availableUserRoles = Object.values(UserRolesEnum);

export const TaskStatusEnum = {
    TO_DO: 'to_do',
    IN_PROGRESS: 'in_progress',
    DONE: 'done',
};

export const availableTaskStatuses = Object.values(TaskStatusEnum);