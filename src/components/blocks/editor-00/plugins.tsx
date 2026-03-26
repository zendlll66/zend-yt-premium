import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary"
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin"
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin"
import { ListPlugin } from "@lexical/react/LexicalListPlugin"
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin"
import { MarkdownShortcutPlugin } from "@lexical/react/LexicalMarkdownShortcutPlugin"
import { TRANSFORMERS, CODE } from "@lexical/markdown"

const MARKDOWN_TRANSFORMERS = TRANSFORMERS.filter((t) => t !== CODE)

import { ContentEditable } from "@/components/editor/editor-ui/content-editable"
import { ToolbarPlugin } from "./toolbar-plugin"
import { SlashCommandsPlugin } from "./slash-commands-plugin"

export function Plugins() {
  return (
    <div>
      <ToolbarPlugin />
      <div className="relative">
        <RichTextPlugin
          contentEditable={
            <div>
              <ContentEditable placeholder={"พิมพ์เนื้อหา หรือกด / เพื่อเลือกรูปแบบ..."} />
            </div>
          }
          ErrorBoundary={LexicalErrorBoundary}
        />
        <HistoryPlugin />
        <ListPlugin />
        <LinkPlugin />
        <MarkdownShortcutPlugin transformers={MARKDOWN_TRANSFORMERS} />
        <SlashCommandsPlugin />
      </div>
    </div>
  )
}
