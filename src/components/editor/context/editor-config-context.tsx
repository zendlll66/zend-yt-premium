"use client"

import { createContext, useContext } from "react"

const EditorConfigContext = createContext<{
  imageFolder: string
  minHeight?: string
}>({
  imageFolder: "editor-images",
  minHeight: undefined,
})

export function EditorConfigProvider({
  imageFolder = "editor-images",
  minHeight,
  children,
}: {
  imageFolder?: string
  minHeight?: string
  children: React.ReactNode
}) {
  return (
    <EditorConfigContext.Provider value={{ imageFolder, minHeight }}>
      {children}
    </EditorConfigContext.Provider>
  )
}

export function useEditorConfig() {
  return useContext(EditorConfigContext)
}
