# Project Camp Frontend

A production-ready React frontend for the Project Camp backend API.

## Tech Stack

- **React 18** + Vite
- **React Router v6** — client-side routing
- **Axios** — HTTP client with request/response interceptors and automatic token refresh
- **TailwindCSS** — utility-first styling
- **react-hot-toast** — toast notifications
- **lucide-react** — icons
- **Context API** — global auth state

## Quick Start

```bash
npm install
npm run dev
```

App runs on `http://localhost:3000` and proxies `/api` to `http://localhost:8000`.

Make sure your backend is running on port 8000.

## Project Structure

```
src/
├── api/
│   ├── axios.js          # Axios instance + interceptors + 401 refresh logic
│   ├── auth.api.js       # Auth endpoints
│   ├── project.api.js    # Project + Members endpoints
│   ├── task.api.js       # Tasks + Subtasks endpoints
│   └── note.api.js       # Notes endpoints
│
├── components/
│   ├── ui/               # Reusable UI primitives
│   │   ├── Avatar.jsx
│   │   ├── Badge.jsx
│   │   ├── ConfirmModal.jsx
│   │   ├── EmptyState.jsx
│   │   ├── Modal.jsx
│   │   └── Spinner.jsx
│   └── common/
│       ├── AppLayout.jsx # Main layout wrapper
│       └── Sidebar.jsx   # Navigation sidebar
│
├── context/
│   └── AuthContext.jsx   # Auth state + login/logout/register
│
├── hooks/
│   └── useAsync.js       # Async operation hook
│
├── pages/
│   ├── Login.jsx
│   ├── Register.jsx
│   ├── ForgotPassword.jsx
│   ├── VerifyEmail.jsx
│   ├── Dashboard.jsx
│   ├── Projects.jsx
│   ├── ProjectDetails.jsx  # Tasks + Notes + Members tabs
│   ├── MyTasks.jsx
│   ├── Notes.jsx
│   └── Settings.jsx
│
├── routes/
│   └── ProtectedRoute.jsx
│
└── App.jsx
```

## API Mapping

| Feature | Backend Route | Frontend Function |
|---------|--------------|-------------------|
| Register | POST /auth/register | `authApi.register()` |
| Login | POST /auth/login | `authApi.login()` |
| Logout | POST /auth/logout | `authApi.logout()` |
| Current User | GET /auth/current-user | `authApi.getCurrentUser()` |
| Change Password | POST /auth/change-password | `authApi.changePassword()` |
| Refresh Token | POST /auth/refresh-token | `authApi.refreshToken()` (auto on 401) |
| Verify Email | GET /auth/verify-email/:token | `authApi.verifyEmail()` |
| Forgot Password | POST /auth/forgot-password | `authApi.forgotPassword()` |
| Resend Verification | POST /auth/resend-email-verification | `authApi.resendEmailVerification()` |
| List Projects | GET /projects/ | `projectApi.getProjects()` |
| Create Project | POST /projects/ | `projectApi.createProject()` |
| Get Project | GET /projects/:id | `projectApi.getProject()` |
| Update Project | PUT /projects/:id | `projectApi.updateProject()` |
| Delete Project | DELETE /projects/:id | `projectApi.deleteProject()` |
| List Members | GET /projects/:id/members | `projectApi.getMembers()` |
| Add Member | POST /projects/:id/members | `projectApi.addMember()` |
| Update Role | PUT /projects/:id/members/:userId | `projectApi.updateMemberRole()` |
| Remove Member | DELETE /projects/:id/members/:userId | `projectApi.removeMember()` |
| List Tasks | GET /tasks/:projectId | `taskApi.getTasks()` |
| Create Task | POST /tasks/:projectId | `taskApi.createTask()` |
| Get Task | GET /tasks/:projectId/t/:taskId | `taskApi.getTask()` |
| Update Task | PUT /tasks/:projectId/t/:taskId | `taskApi.updateTask()` |
| Delete Task | DELETE /tasks/:projectId/t/:taskId | `taskApi.deleteTask()` |
| Create Subtask | POST /tasks/:projectId/t/:taskId/subtasks | `taskApi.createSubtask()` |
| Update Subtask | PUT /tasks/:projectId/st/:subTaskId | `taskApi.updateSubtask()` |
| Delete Subtask | DELETE /tasks/:projectId/st/:subTaskId | `taskApi.deleteSubtask()` |
| List Notes | GET /notes/:projectId | `noteApi.getNotes()` |
| Create Note | POST /notes/:projectId | `noteApi.createNote()` |
| Get Note | GET /notes/:projectId/n/:noteId | `noteApi.getNote()` |
| Update Note | PUT /notes/:projectId/n/:noteId | `noteApi.updateNote()` |
| Delete Note | DELETE /notes/:projectId/n/:noteId | `noteApi.deleteNote()` |

## Auth Flow

1. User logs in → cookies set by backend (httpOnly)
2. All requests include `withCredentials: true`
3. On 401 → Axios interceptor fires → calls `/auth/refresh-token`
4. If refresh succeeds → retries original request
5. If refresh fails → fires `auth:logout` event → AuthContext clears user → redirect to /login

## Role-Based Access

| Action | Admin | Project Admin | Member |
|--------|-------|---------------|--------|
| Create/Delete Project | ✓ | ✗ | ✗ |
| Manage Members | ✓ | ✗ | ✗ |
| Create/Edit/Delete Tasks | ✓ | ✓ | ✗ |
| Create/Delete Subtasks | ✓ | ✓ | ✗ |
| Toggle Subtask Complete | ✓ | ✓ | ✓ |
| Create/Edit/Delete Notes | ✓ | ✗ | ✗ |
| View Everything | ✓ | ✓ | ✓ |

## Design

Matches the provided UI mockups:
- **Background**: Soft beige `#e8e4dc`
- **Primary green**: `#1f5f45` (buttons, active states, accents)
- **Cards**: White with `border-radius: 1.5rem` and soft shadow
- **Typography**: DM Serif Display (headings) + DM Sans (body)
- **Animations**: Staggered fade-in on page load, smooth hover transitions
