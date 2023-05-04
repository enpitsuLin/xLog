import { useEffect, useMemo, useState } from "react"
import { create } from "zustand"
import {
  createJSONStorage,
  persist,
  subscribeWithSelector,
} from "zustand/middleware"

interface ICustomCssStore {
  css: string
  setCss: (css: string) => void
}

export const CUSTOMCSS_SESSION_KEY = "xlog-custom-css" as const

const useCustomCssStore = create<ICustomCssStore>()(
  subscribeWithSelector(
    persist(
      (set, _get) => ({
        css: "",
        setCss: (css: string) => set({ css }),
      }),
      {
        name: CUSTOMCSS_SESSION_KEY,
        storage: createJSONStorage(() => localStorage),
      },
    ),
  ),
)
/**
 * @desc use broadcastChannel to load custom css that was editing in real time, and persist it to sessionStorage
 */
export const useCustomcss = () => {
  const channel = useMemo(() => new BroadcastChannel("xlog-custom-css"), [])
  const [lastUpdate, setLastUpdate] = useState(Date.now())
  const store = useCustomCssStore()

  const upChannelMessage = (
    e: MessageEvent<Pick<ICustomCssStore, "css"> & { timestamap: number }>,
  ) => {
    if (lastUpdate !== e.data.timestamap) {
      store.setCss(e.data.css)
      setLastUpdate(e.data.timestamap)
    }
  }

  useEffect(() => {
    const cleanup = useCustomCssStore.subscribe(
      (state) => state.css,
      (css) => {
        channel.postMessage({ timestamap: Date.now(), css })
      },
    )
    channel.addEventListener("message", upChannelMessage)
    return () => {
      cleanup()
      channel.removeEventListener("message", upChannelMessage)
      channel.close()
    }
  }, [])

  return store
}
