import { fetchWithAuth } from "@/lib/api"
import { createSlice, type PayloadAction, createAsyncThunk } from "@reduxjs/toolkit"

export type UserRole = "Admin" | "User" | "Manager" | "ReadOnly"

export type User = {
  id: string
  name: string
  email: string
  status: "Active" | "Inactive" | "Locked" | "Pending"
  source: "Local"
  roles: UserRole[]
  applications: string[] // IDs of applications the user has access to
  createdAt: string
  lastLogin?: string
  passwordLastChanged?: string
}

type UsersState = {
  users: User[]
  loading: "idle" | "pending" | "succeeded" | "failed"
  error: string | null
}

const initialState: UsersState = {
  users: [
    {
      id: "1",
      name: "John Doe",
      email: "john.doe@example.com",
      status: "Active",
      source: "Local",
      roles: ["Admin"],
      applications: ["1", "3"],
      createdAt: "2023-01-15T10:00:00",
      lastLogin: "2023-05-08T14:30:00",
      passwordLastChanged: "2023-04-10T09:15:00",
    },
    {
      id: "2",
      name: "Jane Smith",
      email: "jane.smith@example.com",
      status: "Active",
      source: "Local",
      roles: ["Manager"],
      applications: ["1", "2"],
      createdAt: "2023-02-20T14:30:00",
      lastLogin: "2023-05-09T09:15:00",
      passwordLastChanged: "2023-03-15T11:30:00",
    },
    {
      id: "3",
      name: "Robert Johnson",
      email: "robert.johnson@example.com",
      status: "Inactive",
      source: "Local",
      roles: ["User"],
      applications: ["1"],
      createdAt: "2023-03-10T09:15:00",
      lastLogin: "2023-04-28T11:45:00",
      passwordLastChanged: "2023-02-22T14:20:00",
    },
    {
      id: "4",
      name: "Emily Davis",
      email: "emily.davis@example.com",
      status: "Active",
      source: "Local",
      roles: ["User"],
      applications: ["2"],
      createdAt: "2023-04-05T11:45:00",
      lastLogin: "2023-05-08T16:20:00",
      passwordLastChanged: "2023-04-01T10:05:00",
    },
    {
      id: "5",
      name: "Michael Wilson",
      email: "michael.wilson@example.com",
      status: "Locked",
      source: "Local",
      roles: ["ReadOnly"],
      applications: ["3"],
      createdAt: "2023-05-01T16:20:00",
      lastLogin: "2023-05-05T08:30:00",
      passwordLastChanged: "2023-04-25T13:45:00",
    },
    {
      id: "6",
      name: "Sarah Brown",
      email: "sarah.brown@example.com",
      status: "Pending",
      source: "Local",
      roles: ["User"],
      applications: [],
      createdAt: "2023-05-08T13:10:00",
    },
  ],
  loading: "idle",
  error: null,
}

export const fetchUsers = createAsyncThunk("users/fetchUsers", async () => {
  const data = await fetchWithAuth("users");
  return data; // must be: User[]
});

export const createUser = createAsyncThunk("users/createUser", async (payload: Partial<User>) => {
  const data = await fetchWithAuth("users", "POST", payload);
  return data;
});

export const updateUserAsync = createAsyncThunk(
  "users/updateUserAsync",
  async ({ id, updates }: { id: string; updates: Partial<User> }) => {
    const data = await fetchWithAuth(`users/${id}`, "PATCH", updates);
    return { id, updates: data };
  }
);

export const deleteUserAsync = createAsyncThunk("users/deleteUserAsync", async (id: string) => {
  await fetchWithAuth(`users/${id}`, "DELETE");
  return id;
});



export const usersSlice = createSlice({
  name: "users",
  initialState,
  reducers: {
    addUser: (state, action: PayloadAction<Omit<User, "id">>) => {
      const newUser = {
        id: (state.users.length + 1).toString(),
        ...action.payload,
      }
      state.users.push(newUser)
    },
    updateUser: (state, action: PayloadAction<{ id: string; updates: Partial<User> }>) => {
      const { id, updates } = action.payload
      const userIndex = state.users.findIndex((user) => user.id === id)
      if (userIndex !== -1) {
        state.users[userIndex] = { ...state.users[userIndex], ...updates }
      }
    },
    deleteUser: (state, action: PayloadAction<string>) => {
      state.users = state.users.filter((user) => user.id !== action.payload)
    },
    resetPassword: (state, action: PayloadAction<string>) => {
      const userIndex = state.users.findIndex((user) => user.id === action.payload)
      if (userIndex !== -1) {
        state.users[userIndex].passwordLastChanged = new Date().toISOString()
      }
    },
    assignApplicationToUser: (state, action: PayloadAction<{ userId: string; applicationId: string }>) => {
      const { userId, applicationId } = action.payload
      const userIndex = state.users.findIndex((user) => user.id === userId)
      if (userIndex !== -1 && !state.users[userIndex].applications.includes(applicationId)) {
        state.users[userIndex].applications.push(applicationId)
      }
    },
    removeApplicationFromUser: (state, action: PayloadAction<{ userId: string; applicationId: string }>) => {
      const { userId, applicationId } = action.payload
      const userIndex = state.users.findIndex((user) => user.id === userId)
      if (userIndex !== -1) {
        state.users[userIndex].applications = state.users[userIndex].applications.filter(
          (appId) => appId !== applicationId,
        )
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUsers.pending, (state) => {
        state.loading = "pending"
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.loading = "succeeded"
        state.users = action.payload
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.loading = "failed"
        state.error = action.error.message || "Failed to fetch users"
      })  .addCase(createUser.fulfilled, (state, action) => {
        state.users.push(action.payload);
      })
      .addCase(updateUserAsync.fulfilled, (state, action) => {
        const index = state.users.findIndex((u) => u.id === action.payload.id);
        if (index !== -1) {
          state.users[index] = { ...state.users[index], ...action.payload.updates };
        }
      })
      .addCase(deleteUserAsync.fulfilled, (state, action) => {
        state.users = state.users.filter((u) => u.id !== action.payload);
      });
  },
})

export const { addUser, updateUser, deleteUser, resetPassword, assignApplicationToUser, removeApplicationFromUser } =
  usersSlice.actions
export default usersSlice.reducer
