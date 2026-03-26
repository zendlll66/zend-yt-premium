"use client"

import { useEffect } from "react"
import {
  InitialConfigType,
  LexicalComposer,
} from "@lexical/react/LexicalComposer"
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin"
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext"
import { EditorState, SerializedEditorState } from "lexical"
import { $generateHtmlFromNodes, $generateNodesFromDOM } from "@lexical/html"
import { $getRoot, $insertNodes } from "lexical"

import { editorTheme } from "@/components/editor/themes/editor-theme"
import { TooltipProvider } from "@/components/ui/tooltip"

import { nodes } from "./nodes"
import { Plugins } from "./plugins"

function HtmlExportPlugin({ onHtmlChange }: { onHtmlChange: (html: string) => void }) {
  const [editor] = useLexicalComposerContext()
  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const html = $generateHtmlFromNodes(editor, null)
        onHtmlChange(html)
      })
    })
  }, [editor, onHtmlChange])
  return null
}

export function Editor({
  editorState,
  editorSerializedState,
  onChange,
  onSerializedChange,
  onHtmlChange,
  initialHtml,
}: {
  editorState?: EditorState
  editorSerializedState?: SerializedEditorState
  onChange?: (editorState: EditorState) => void
  onSerializedChange?: (editorSerializedState: SerializedEditorState) => void
  onHtmlChange?: (html: string) => void
  initialHtml?: string
}) {
  const editorConfig: InitialConfigType = {
    namespace: "Editor",
    theme: editorTheme,
    nodes,
    onError: (error: Error) => {
      console.error(error)
    },
    ...(initialHtml
      ? {
          editorState: (editor) => {
            const parser = new DOMParser()
            const dom = parser.parseFromString(initialHtml, "text/html")
            const parsed = $generateNodesFromDOM(editor, dom)
            $getRoot().select()
            $insertNodes(parsed)
          },
        }
      : {}),
    ...(editorState ? { editorState } : {}),
    ...(editorSerializedState
      ? { editorState: JSON.stringify(editorSerializedState) }
      : {}),
  }

  return (
    <div className="bg-background overflow-hidden rounded-lg border shadow-sm">
      <LexicalComposer initialConfig={editorConfig}>
        <TooltipProvider>
          <Plugins />

          <OnChangePlugin
            ignoreSelectionChange={true}
            onChange={(editorState) => {
              onChange?.(editorState)
              onSerializedChange?.(editorState.toJSON())
            }}
          />

          {onHtmlChange && <HtmlExportPlugin onHtmlChange={onHtmlChange} />}
        </TooltipProvider>
      </LexicalComposer>
    </div>
  )
}
