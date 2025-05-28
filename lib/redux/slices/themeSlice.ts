import { createSlice, type PayloadAction } from "@reduxjs/toolkit"

type ThemeState = {
  mode: "light" | "dark" | "system"
}

const initialState: ThemeState = {
  mode: "system",
}

export const themeSlice = createSlice({
  name: "theme",
  initialState,
  reducers: {
    setTheme: (state, action: PayloadAction<"light" | "dark" | "system">) => {
      state.mode = action.payload
    },
  },
})

export const { setTheme } = themeSlice.actions
export default themeSlice.reducer
