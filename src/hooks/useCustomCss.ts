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
  const [externalUpdate, setExternalUpdate] = useState(false)

  const onChannelMessage = (
    e: MessageEvent<Pick<ICustomCssStore, "css"> & { timestamp: number }>,
  ) => {
    if (typeof e.data === "undefined") {
      channel.postMessage({ timestamp: lastUpdate, css: store.css })
      return
    }
    if (e.data.timestamp <= lastUpdate) return

    setExternalUpdate(true)
    useCustomCssStore.setState({ css: e.data.css })
    setLastUpdate(e.data.timestamp)
  }

  useEffect(() => {
    const cleanup = useCustomCssStore.subscribe(
      (state) => state.css,
      (css) => {
        if (!externalUpdate) {
          const timestamp = Date.now()
          channel.postMessage({ timestamp, css })
        }
        setExternalUpdate(false)
      },
    )
    channel.addEventListener("message", onChannelMessage)
    return () => {
      cleanup()
      channel.removeEventListener("message", onChannelMessage)
      channel.close()
    }
  }, [])

  return store
}
