import { createSlice, type PayloadAction, createAsyncThunk } from "@reduxjs/toolkit"

type IdentityProvider = {
  id: string
  name: string
  type: "OIDC" | "SAML" | "Social" | "LDAP"
  status: "Active" | "Inactive" | "Testing"
  createdAt: string
  icon?: string
}

type IdentityProvidersState = {
  providers: IdentityProvider[]
  loading: "idle" | "pending" | "succeeded" | "failed"
  error: string | null
}

const initialState: IdentityProvidersState = {
  providers: [
    {
      id: "1",
      name: "Google",
      type: "Social",
      status: "Active",
      createdAt: "2023-01-15T10:00:00",
      icon: "Google",
    },
    {
      id: "2",
      name: "GitHub",
      type: "Social",
      status: "Active",
      createdAt: "2023-02-20T14:30:00",
      icon: "Github",
    },
    {
      id: "3",
      name: "Facebook",
      type: "Social",
      status: "Inactive",
      createdAt: "2023-03-10T09:15:00",
      icon: "Facebook",
    },
    {
      id: "4",
      name: "Corporate SAML",
      type: "SAML",
      status: "Active",
      createdAt: "2023-04-05T11:45:00",
    },
    {
      id: "5",
      name: "Azure AD",
      type: "OIDC",
      status: "Active",
      createdAt: "2023-05-01T16:20:00",
    },
    {
      id: "6",
      name: "Company LDAP",
      type: "LDAP",
      status: "Active",
      createdAt: "2023-05-15T13:10:00",
    },
  ],
  loading: "idle",
  error: null,
}

// In a real app, this would be an API call
export const fetchIdentityProviders = createAsyncThunk("identityProviders/fetchIdentityProviders", async () => {
  // Simulate API call
  return new Promise<IdentityProvider[]>((resolve) => {
    setTimeout(() => {
      resolve(initialState.providers)
    }, 500)
  })
})

export const identityProvidersSlice = createSlice({
  name: "identityProviders",
  initialState,
  reducers: {
    addIdentityProvider: (state, action: PayloadAction<Omit<IdentityProvider, "id">>) => {
      const newProvider = {
        id: (state.providers.length + 1).toString(),
        ...action.payload,
      }
      state.providers.push(newProvider)
    },
    updateIdentityProvider: (state, action: PayloadAction<{ id: string; updates: Partial<IdentityProvider> }>) => {
      const { id, updates } = action.payload
      const providerIndex = state.providers.findIndex((provider) => provider.id === id)
      if (providerIndex !== -1) {
        state.providers[providerIndex] = { ...state.providers[providerIndex], ...updates }
      }
    },
    deleteIdentityProvider: (state, action: PayloadAction<string>) => {
      state.providers = state.providers.filter((provider) => provider.id !== action.payload)
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchIdentityProviders.pending, (state) => {
        state.loading = "pending"
      })
      .addCase(fetchIdentityProviders.fulfilled, (state, action) => {
        state.loading = "succeeded"
        state.providers = action.payload
      })
      .addCase(fetchIdentityProviders.rejected, (state, action) => {
        state.loading = "failed"
        state.error = action.error.message || "Failed to fetch identity providers"
      })
  },
})

export const { addIdentityProvider, updateIdentityProvider, deleteIdentityProvider } = identityProvidersSlice.actions
export default identityProvidersSlice.reducer
