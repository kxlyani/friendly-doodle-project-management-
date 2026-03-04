import axiosInstance from './axios'

export const projectApi = {
  // Projects
  getProjects: () => axiosInstance.get('/projects/'),

  createProject: (data) => axiosInstance.post('/projects/', data),

  getProject: (projectId) => axiosInstance.get(`/projects/${projectId}`),

  updateProject: (projectId, data) =>
    axiosInstance.put(`/projects/${projectId}`, data),

  deleteProject: (projectId) =>
    axiosInstance.delete(`/projects/${projectId}`),

  // Members
  getMembers: (projectId) =>
    axiosInstance.get(`/projects/${projectId}/members`),

  addMember: (projectId, data) =>
    axiosInstance.post(`/projects/${projectId}/members`, data),

  updateMemberRole: (projectId, userId, data) =>
    axiosInstance.put(`/projects/${projectId}/members/${userId}`, data),

  removeMember: (projectId, userId) =>
    axiosInstance.delete(`/projects/${projectId}/members/${userId}`),
}

/**
 * The GET /projects endpoint returns an aggregation shaped as:
 *   [{ project: { _id, name, description, members (count), ... }, role }, ...]
 *
 * normaliseProjects flattens each entry so the rest of the UI can work with
 * plain project objects that also carry the current user's `role`.
 */
export const normaliseProjects = (rawList) => {
  if (!Array.isArray(rawList)) return []
  return rawList.map((item) => {
    // Already a flat project (e.g. freshly created project returned by createProject)
    if (item._id || item.id) return item
    // Aggregation shape: { project: {...}, role: '...' }
    if (item.project) {
      return { ...item.project, currentUserRole: item.role }
    }
    return item
  })
}

/** Extract the MongoDB _id string from a project object. */
export const getProjectId = (project) => {
  if (!project) return null
  return project._id || project.id || null
}