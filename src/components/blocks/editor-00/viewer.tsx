"use client"

import { LexicalComposer } from "@lexical/react/LexicalComposer"
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin"
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary"
import { ContentEditable } from "@lexical/react/LexicalContentEditable"
import { ListPlugin } from "@lexical/react/LexicalListPlugin"
import { CheckListPlugin } from "@lexical/react/LexicalCheckListPlugin"
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin"
import { HorizontalRulePlugin } from "@lexical/react/LexicalHorizontalRulePlugin"
import { TablePlugin } from "@lexical/react/LexicalTablePlugin"
import type { SerializedEditorState } from "lexical"

import { editorTheme } from "@/components/editor/themes/editor-theme"
import "@/components/editor/themes/editor-theme.css"
import { nodes } from "@/components/blocks/editor-x/nodes"

export function LexicalViewer({
  serializedState,
  className = "",
}: {
  serializedState: SerializedEditorState | string
  className?: string
}) {
  const stateStr =
    typeof serializedState === "string"
      ? serializedState
      : JSON.stringify(serializedState)

  return (
    <LexicalComposer
      initialConfig={{
        namespace: "Viewer",
        theme: editorTheme,
        nodes,
        editable: false,
        editorState: stateStr,
        onError: (e) => console.error("LexicalViewer:", e),
      }}
    >
      <div className={className}>
        <RichTextPlugin
          contentEditable={
            <ContentEditable
              className="outline-none [&_img]:max-w-full [&_img]:rounded"
              aria-readonly="true"
              aria-label="content"
            />
          }
          ErrorBoundary={LexicalErrorBoundary}
        />
        <ListPlugin />
        <CheckListPlugin />
        <LinkPlugin />
        <HorizontalRulePlugin />
        <TablePlugin />
      </div>
    </LexicalComposer>
  )
}
