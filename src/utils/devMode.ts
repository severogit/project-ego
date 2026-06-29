const devToolsFlag = import.meta.env?.VITE_DEV_TOOLS
const isLocalRuntime =
  typeof window !== 'undefined' &&
  ['localhost', '127.0.0.1', ''].includes(window.location.hostname)

export const DEV_MODE =
  devToolsFlag === 'true' ||
  Boolean(
    devToolsFlag !== 'false' && (import.meta.env?.DEV || isLocalRuntime),
  )

if (typeof window !== 'undefined') {
  Object.assign(window, {
    __PROJECT_EGO_DEV_MODE: DEV_MODE,
    __PROJECT_EGO_DEV_MODE_SOURCE: {
      devToolsFlag,
      viteDev: Boolean(import.meta.env?.DEV),
      isLocalRuntime,
    },
  })
}
