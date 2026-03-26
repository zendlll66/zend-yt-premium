"use client"

import dynamic from "next/dynamic"
import type { EditorState, SerializedEditorState } from "lexical"

const EditorDynamic = dynamic(
  () => import("./editor").then((m) => ({ default: m.Editor })),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-[200px] animate-pulse rounded-lg border bg-muted/40" />
    ),
  }
)

export function Editor(props: {
  editorState?: EditorState
  editorSerializedState?: SerializedEditorState
  onChange?: (editorState: EditorState) => void
  onSerializedChange?: (editorSerializedState: SerializedEditorState) => void
  onHtmlChange?: (html: string) => void
  initialHtml?: string
  imageFolder?: string
  minHeight?: string
}) {
  return <EditorDynamic {...props} />
}
