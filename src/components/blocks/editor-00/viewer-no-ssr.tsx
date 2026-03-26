"use client"

import dynamic from "next/dynamic"
import type { SerializedEditorState } from "lexical"

const ViewerDynamic = dynamic(
  () => import("./viewer").then((m) => ({ default: m.LexicalViewer })),
  {
    ssr: false,
    loading: () => <div className="min-h-[40px] animate-pulse rounded bg-muted/30" />,
  }
)

export function LexicalViewer(props: {
  serializedState: SerializedEditorState | string
  className?: string
}) {
  return <ViewerDynamic {...props} />
}
