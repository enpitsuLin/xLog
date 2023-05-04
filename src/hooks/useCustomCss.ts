import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"

interface ICustomCssStore {
  css: string
  setCss: (css: string) => void
}

export const CUSTOMCSS_SESSION_KEY = "xlog-custom-css" as const

export const useCustomcss = create<ICustomCssStore>()(
  persist(
    (set, _get) => ({
      css: "",
      setCss: (css: string) => set({ css }),
    }),
    {
      name: CUSTOMCSS_SESSION_KEY,
      storage: createJSONStorage(() => sessionStorage),
    },
  ),
)
