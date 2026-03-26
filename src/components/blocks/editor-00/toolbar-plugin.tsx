"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext"
import {
  $getSelection, $isRangeSelection,
  FORMAT_TEXT_COMMAND, FORMAT_ELEMENT_COMMAND,
  SELECTION_CHANGE_COMMAND, COMMAND_PRIORITY_CRITICAL,
  CAN_UNDO_COMMAND, CAN_REDO_COMMAND, UNDO_COMMAND, REDO_COMMAND,
  $insertNodes,
} from "lexical"
import { $setBlocksType } from "@lexical/selection"
import { $createHeadingNode, $createQuoteNode, $isHeadingNode } from "@lexical/rich-text"
import { $createParagraphNode } from "lexical"
import {
  INSERT_ORDERED_LIST_COMMAND, INSERT_UNORDERED_LIST_COMMAND,
  REMOVE_LIST_COMMAND, $isListNode,
} from "@lexical/list"
import { TOGGLE_LINK_COMMAND, $isLinkNode } from "@lexical/link"
import { INSERT_HORIZONTAL_RULE_COMMAND } from "@lexical/extension"
import { mergeRegister } from "@lexical/utils"
import {
  Bold, Italic, Underline, Strikethrough,
  Heading1, Heading2, Heading3,
  List, ListOrdered, Quote,
  Undo, Redo, Link2, Link2Off,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Minus, Type, ImageIcon, Loader2, MonitorPlay,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { uploadImageAction } from "@/app/actions/upload"
import { $createImageNode } from "./image-node"
import { $createEmbedNode, detectEmbedType } from "./embed-node"

type BlockType = "paragraph" | "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "quote" | "bullet" | "number"

function ToolbarBtn({
  onClick, isActive, disabled, title, children,
}: {
  onClick: () => void; isActive?: boolean; disabled?: boolean; title: string; children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => { e.preventDefault(); onClick() }}
      disabled={disabled}
      title={title}
      className={cn(
        "flex h-8 w-8 items-center justify-center rounded text-sm transition-colors",
        isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-accent hover:text-foreground",
        disabled && "cursor-not-allowed opacity-30"
      )}
    >
      {children}
    </button>
  )
}

function Divider() {
  return <span className="mx-0.5 h-5 w-px shrink-0 bg-border" />
}

export function ToolbarPlugin() {
  const [editor] = useLexicalComposerContext()
  const [isBold, setIsBold] = useState(false)
  const [isItalic, setIsItalic] = useState(false)
  const [isUnderline, setIsUnderline] = useState(false)
  const [isStrikethrough, setIsStrikethrough] = useState(false)
  const [isLink, setIsLink] = useState(false)
  const [blockType, setBlockType] = useState<BlockType>("paragraph")
  const [canUndo, setCanUndo] = useState(false)
  const [canRedo, setCanRedo] = useState(false)
  const [isUploadingImage, setIsUploadingImage] = useState(false)

  // Link input state
  const [showLinkInput, setShowLinkInput] = useState(false)
  const [linkUrl, setLinkUrl] = useState("")
  const linkInputRef = useRef<HTMLInputElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)

  // Embed input state
  const [showEmbedInput, setShowEmbedInput] = useState(false)
  const [embedUrl, setEmbedUrl] = useState("")
  const [embedError, setEmbedError] = useState("")
  const embedInputRef = useRef<HTMLInputElement>(null)

  const updateToolbar = useCallback(() => {
    const selection = $getSelection()
    if (!$isRangeSelection(selection)) return

    setIsBold(selection.hasFormat("bold"))
    setIsItalic(selection.hasFormat("italic"))
    setIsUnderline(selection.hasFormat("underline"))
    setIsStrikethrough(selection.hasFormat("strikethrough"))

    const node = selection.anchor.getNode()
    const parent = node.getParent()
    setIsLink($isLinkNode(parent) || $isLinkNode(node))

    const topElement = node.getKey() === "root" ? node : node.getTopLevelElementOrThrow()

    if ($isListNode(topElement)) {
      setBlockType(topElement.getListType() === "bullet" ? "bullet" : "number")
    } else if ($isHeadingNode(topElement)) {
      setBlockType(topElement.getTag() as BlockType)
    } else {
      setBlockType(topElement.getType() as BlockType)
    }
  }, [])

  useEffect(() => {
    return mergeRegister(
      editor.registerUpdateListener(({ editorState }) => editorState.read(updateToolbar)),
      editor.registerCommand(SELECTION_CHANGE_COMMAND, () => { updateToolbar(); return false }, COMMAND_PRIORITY_CRITICAL),
      editor.registerCommand(CAN_UNDO_COMMAND, (p) => { setCanUndo(p); return false }, COMMAND_PRIORITY_CRITICAL),
      editor.registerCommand(CAN_REDO_COMMAND, (p) => { setCanRedo(p); return false }, COMMAND_PRIORITY_CRITICAL),
    )
  }, [editor, updateToolbar])

  useEffect(() => {
    if (showLinkInput) setTimeout(() => linkInputRef.current?.focus(), 50)
  }, [showLinkInput])

  const setBlock = (type: BlockType) => {
    editor.update(() => {
      const sel = $getSelection()
      if (!$isRangeSelection(sel)) return
      if (blockType === type) {
        $setBlocksType(sel, () => $createParagraphNode())
      } else if (type === "h1" || type === "h2" || type === "h3") {
        $setBlocksType(sel, () => $createHeadingNode(type))
      } else if (type === "quote") {
        $setBlocksType(sel, () => $createQuoteNode())
      }
    })
  }

  const toggleList = (listType: "bullet" | "number") => {
    if (blockType === listType) {
      editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined)
    } else if (listType === "bullet") {
      editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined)
    } else {
      editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined)
    }
  }

  const insertLink = () => {
    if (!linkUrl.trim()) {
      editor.dispatchCommand(TOGGLE_LINK_COMMAND, null)
    } else {
      const url = linkUrl.startsWith("http") ? linkUrl : `https://${linkUrl}`
      editor.dispatchCommand(TOGGLE_LINK_COMMAND, url)
    }
    setShowLinkInput(false)
    setLinkUrl("")
  }

  const removeLink = () => {
    editor.dispatchCommand(TOGGLE_LINK_COMMAND, null)
  }

  useEffect(() => {
    if (showEmbedInput) setTimeout(() => embedInputRef.current?.focus(), 50)
  }, [showEmbedInput])

  const insertEmbed = () => {
    const url = embedUrl.trim()
    if (!url) return
    const embedType = detectEmbedType(url)
    if (!embedType) {
      setEmbedError("วาง URL ของ YouTube หรือ X/Twitter")
      return
    }
    editor.update(() => {
      $insertNodes([$createEmbedNode(embedType, url)])
    })
    setShowEmbedInput(false)
    setEmbedUrl("")
    setEmbedError("")
  }

  const handleImageFile = async (file: File) => {
    if (!file.type.startsWith("image/")) return
    setIsUploadingImage(true)
    try {
      const fd = new FormData()
      fd.append("file", file)
      fd.append("folder", "announcements")
      const result = await uploadImageAction(fd)
      if (result.url) {
        editor.update(() => {
          const imageNode = $createImageNode(result.url!, file.name)
          $insertNodes([imageNode])
        })
      }
    } finally {
      setIsUploadingImage(false)
    }
  }

  return (
    <div className="border-b bg-muted/40">
      {/* Hidden file input for image upload */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleImageFile(file)
          e.target.value = ""
        }}
      />

      {/* Main toolbar row */}
      <div className="flex flex-wrap items-center gap-0.5 p-2">
        {/* Undo / Redo */}
        <ToolbarBtn onClick={() => editor.dispatchCommand(UNDO_COMMAND, undefined)} disabled={!canUndo} title="Undo (Ctrl+Z)">
          <Undo className="h-4 w-4" />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.dispatchCommand(REDO_COMMAND, undefined)} disabled={!canRedo} title="Redo (Ctrl+Y)">
          <Redo className="h-4 w-4" />
        </ToolbarBtn>
        <Divider />

        {/* Text format */}
        <ToolbarBtn onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold")} isActive={isBold} title="Bold (Ctrl+B)">
          <Bold className="h-4 w-4" />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "italic")} isActive={isItalic} title="Italic (Ctrl+I)">
          <Italic className="h-4 w-4" />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "underline")} isActive={isUnderline} title="Underline (Ctrl+U)">
          <Underline className="h-4 w-4" />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "strikethrough")} isActive={isStrikethrough} title="Strikethrough">
          <Strikethrough className="h-4 w-4" />
        </ToolbarBtn>
        <Divider />

        {/* Block type */}
        <ToolbarBtn onClick={() => setBlock("paragraph")} isActive={blockType === "paragraph"} title="Paragraph">
          <Type className="h-4 w-4" />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => setBlock("h1")} isActive={blockType === "h1"} title="Heading 1">
          <Heading1 className="h-4 w-4" />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => setBlock("h2")} isActive={blockType === "h2"} title="Heading 2">
          <Heading2 className="h-4 w-4" />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => setBlock("h3")} isActive={blockType === "h3"} title="Heading 3">
          <Heading3 className="h-4 w-4" />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => toggleList("bullet")} isActive={blockType === "bullet"} title="Bullet List">
          <List className="h-4 w-4" />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => toggleList("number")} isActive={blockType === "number"} title="Numbered List">
          <ListOrdered className="h-4 w-4" />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => setBlock("quote")} isActive={blockType === "quote"} title="Blockquote">
          <Quote className="h-4 w-4" />
        </ToolbarBtn>
        <Divider />

        {/* Link */}
        <ToolbarBtn
          onClick={() => {
            if (isLink) { removeLink() } else { setShowLinkInput((v) => !v) }
          }}
          isActive={isLink || showLinkInput}
          title={isLink ? "Remove link" : "Insert link"}
        >
          {isLink ? <Link2Off className="h-4 w-4" /> : <Link2 className="h-4 w-4" />}
        </ToolbarBtn>
        <Divider />

        {/* Image upload */}
        <ToolbarBtn
          onClick={() => imageInputRef.current?.click()}
          disabled={isUploadingImage}
          title="Insert image"
        >
          {isUploadingImage
            ? <Loader2 className="h-4 w-4 animate-spin" />
            : <ImageIcon className="h-4 w-4" />}
        </ToolbarBtn>

        {/* Embed (YouTube / X) */}
        <ToolbarBtn
          onClick={() => { setShowEmbedInput((v) => !v); setEmbedError("") }}
          isActive={showEmbedInput}
          title="Embed YouTube / X"
        >
          <MonitorPlay className="h-4 w-4" />
        </ToolbarBtn>
        <Divider />

        {/* Alignment */}
        <ToolbarBtn onClick={() => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "left")} title="Align Left">
          <AlignLeft className="h-4 w-4" />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "center")} title="Align Center">
          <AlignCenter className="h-4 w-4" />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "right")} title="Align Right">
          <AlignRight className="h-4 w-4" />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "justify")} title="Justify">
          <AlignJustify className="h-4 w-4" />
        </ToolbarBtn>
        <Divider />

        {/* Horizontal rule */}
        <ToolbarBtn onClick={() => editor.dispatchCommand(INSERT_HORIZONTAL_RULE_COMMAND, undefined)} title="Horizontal rule">
          <Minus className="h-4 w-4" />
        </ToolbarBtn>
      </div>

      {/* Embed input bar */}
      {showEmbedInput && (
        <div className="border-t px-3 py-2 space-y-1.5">
          <div className="flex items-center gap-2">
            <MonitorPlay className="h-4 w-4 shrink-0 text-muted-foreground" />
            <input
              ref={embedInputRef}
              type="url"
              value={embedUrl}
              onChange={(e) => { setEmbedUrl(e.target.value); setEmbedError("") }}
              onKeyDown={(e) => {
                if (e.key === "Enter") { e.preventDefault(); insertEmbed() }
                if (e.key === "Escape") { setShowEmbedInput(false); setEmbedUrl(""); setEmbedError("") }
              }}
              placeholder="วาง URL YouTube หรือ X/Twitter..."
              className="h-7 flex-1 rounded-md border border-input bg-background px-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            />
            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); insertEmbed() }}
              className="rounded-md bg-primary px-3 py-1 text-xs font-medium text-primary-foreground hover:bg-primary/90"
            >
              แทรก
            </button>
            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); setShowEmbedInput(false); setEmbedUrl(""); setEmbedError("") }}
              className="rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-accent"
            >
              ยกเลิก
            </button>
          </div>
          {embedError && <p className="pl-6 text-xs text-destructive">{embedError}</p>}
        </div>
      )}

      {/* Link input bar */}
      {showLinkInput && (
        <div className="flex items-center gap-2 border-t px-3 py-2">
          <Link2 className="h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            ref={linkInputRef}
            type="url"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") { e.preventDefault(); insertLink() }
              if (e.key === "Escape") { setShowLinkInput(false); setLinkUrl("") }
            }}
            placeholder="https://..."
            className="h-7 flex-1 rounded-md border border-input bg-background px-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
          />
          <button
            type="button"
            onMouseDown={(e) => { e.preventDefault(); insertLink() }}
            className="rounded-md bg-primary px-3 py-1 text-xs font-medium text-primary-foreground hover:bg-primary/90"
          >
            แทรก
          </button>
          <button
            type="button"
            onMouseDown={(e) => { e.preventDefault(); setShowLinkInput(false); setLinkUrl("") }}
            className="rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-accent"
          >
            ยกเลิก
          </button>
        </div>
      )}
    </div>
  )
}
