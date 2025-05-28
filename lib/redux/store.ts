import { configureStore } from "@reduxjs/toolkit"

import applicationsReducer from "./slices/applicationsSlice"
import themeReducer from "./slices/themeSlice"
import usersReducer from "./slices/usersSlice"

export const store = configureStore({
  reducer: {
    applications: applicationsReducer,
    users: usersReducer,
    theme: themeReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
