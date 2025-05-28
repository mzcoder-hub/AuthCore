import { createSlice, type PayloadAction, createAsyncThunk } from "@reduxjs/toolkit"

export type Application = {
  id: string
  name: string
  type: "Web" | "Mobile" | "SPA" | "Service"
  clientId: string
  clientSecret?: string
  redirectUris: string[]
  status: "Active" | "Inactive" | "Development"
  createdAt: string
  description?: string
  accessTokenLifetime?: number // in minutes
  refreshTokenLifetime?: number // in days
  allowedUsers?: string[] // IDs of users allowed to access this application
}

type ApplicationsState = {
  applications: Application[]
  loading: "idle" | "pending" | "succeeded" | "failed"
  error: string | null
}

const initialState: ApplicationsState = {
  applications: [
    {
      id: "1",
      name: "Customer Portal",
      type: "Web",
      clientId: "cust-portal-123456",
      clientSecret: "secret-123456",
      redirectUris: ["https://customer.example.com/callback"],
      status: "Active",
      createdAt: "2023-01-15T10:00:00",
      description: "Main customer portal for account management",
      accessTokenLifetime: 60,
      refreshTokenLifetime: 30,
      allowedUsers: ["1", "2", "3"],
    },
    {
      id: "2",
      name: "Mobile App",
      type: "Mobile",
      clientId: "mobile-app-789012",
      clientSecret: "secret-789012",
      redirectUris: ["com.example.app://callback"],
      status: "Active",
      createdAt: "2023-02-20T14:30:00",
      description: "Native mobile application for iOS and Android",
      accessTokenLifetime: 120,
      refreshTokenLifetime: 60,
      allowedUsers: ["2", "4"],
    },
    {
      id: "3",
      name: "Admin Dashboard",
      type: "SPA",
      clientId: "admin-dash-345678",
      clientSecret: "secret-345678",
      redirectUris: ["https://admin.example.com/auth/callback"],
      status: "Active",
      createdAt: "2023-03-10T09:15:00",
      description: "Internal admin dashboard for system management",
      accessTokenLifetime: 30,
      refreshTokenLifetime: 15,
      allowedUsers: ["1", "5"],
    },
    {
      id: "4",
      name: "API Service",
      type: "Service",
      clientId: "api-service-901234",
      clientSecret: "secret-901234",
      redirectUris: [],
      status: "Active",
      createdAt: "2023-04-05T11:45:00",
      description: "Backend API service for data processing",
      accessTokenLifetime: 240,
      refreshTokenLifetime: 0, // No refresh token for service accounts
      allowedUsers: [],
    },
    {
      id: "5",
      name: "Marketing Website",
      type: "Web",
      clientId: "marketing-567890",
      clientSecret: "secret-567890",
      redirectUris: ["https://marketing.example.com/oauth/callback"],
      status: "Development",
      createdAt: "2023-05-01T16:20:00",
      description: "Public marketing website with authenticated sections",
      accessTokenLifetime: 60,
      refreshTokenLifetime: 30,
      allowedUsers: [],
    },
  ],
  loading: "idle",
  error: null,
}

// In a real app, this would be an API call
export const fetchApplications = createAsyncThunk("applications/fetchApplications", async () => {
  // Simulate API call
  return new Promise<Application[]>((resolve) => {
    setTimeout(() => {
      resolve(initialState.applications)
    }, 500)
  })
})

export const applicationsSlice = createSlice({
  name: "applications",
  initialState,
  reducers: {
    addApplication: (state, action: PayloadAction<Omit<Application, "id" | "clientId" | "clientSecret">>) => {
      const newApplication = {
        id: (state.applications.length + 1).toString(),
        clientId: `app-${Math.random().toString(36).substring(2, 10)}`,
        clientSecret: `secret-${Math.random().toString(36).substring(2, 15)}`,
        ...action.payload,
      }
      state.applications.push(newApplication)
    },
    updateApplication: (state, action: PayloadAction<{ id: string; updates: Partial<Application> }>) => {
      const { id, updates } = action.payload
      const appIndex = state.applications.findIndex((app) => app.id === id)
      if (appIndex !== -1) {
        state.applications[appIndex] = { ...state.applications[appIndex], ...updates }
      }
    },
    deleteApplication: (state, action: PayloadAction<string>) => {
      state.applications = state.applications.filter((app) => app.id !== action.payload)
    },
    rotateClientSecret: (state, action: PayloadAction<string>) => {
      const appIndex = state.applications.findIndex((app) => app.id === action.payload)
      if (appIndex !== -1) {
        state.applications[appIndex].clientSecret = `secret-${Math.random().toString(36).substring(2, 15)}`
      }
    },
    assignUserToApplication: (state, action: PayloadAction<{ applicationId: string; userId: string }>) => {
      const { applicationId, userId } = action.payload
      const appIndex = state.applications.findIndex((app) => app.id === applicationId)
      if (appIndex !== -1) {
        if (!state.applications[appIndex].allowedUsers) {
          state.applications[appIndex].allowedUsers = []
        }
        if (!state.applications[appIndex].allowedUsers?.includes(userId)) {
          state.applications[appIndex].allowedUsers?.push(userId)
        }
      }
    },
    removeUserFromApplication: (state, action: PayloadAction<{ applicationId: string; userId: string }>) => {
      const { applicationId, userId } = action.payload
      const appIndex = state.applications.findIndex((app) => app.id === applicationId)
      if (appIndex !== -1 && state.applications[appIndex].allowedUsers) {
        state.applications[appIndex].allowedUsers = state.applications[appIndex].allowedUsers?.filter(
          (id) => id !== userId,
        )
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchApplications.pending, (state) => {
        state.loading = "pending"
      })
      .addCase(fetchApplications.fulfilled, (state, action) => {
        state.loading = "succeeded"
        state.applications = action.payload
      })
      .addCase(fetchApplications.rejected, (state, action) => {
        state.loading = "failed"
        state.error = action.error.message || "Failed to fetch applications"
      })
  },
})

export const {
  addApplication,
  updateApplication,
  deleteApplication,
  rotateClientSecret,
  assignUserToApplication,
  removeUserFromApplication,
} = applicationsSlice.actions
export default applicationsSlice.reducer
