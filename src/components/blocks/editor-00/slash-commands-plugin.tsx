"use client"

import { useCallback, useMemo, useState } from "react"
import { createPortal } from "react-dom"
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext"
import {
  LexicalTypeaheadMenuPlugin,
  MenuOption,
  useBasicTypeaheadTriggerMatch,
} from "@lexical/react/LexicalTypeaheadMenuPlugin"
import { $getSelection, $isRangeSelection, TextNode } from "lexical"
import { $setBlocksType } from "@lexical/selection"
import { $createHeadingNode, $createQuoteNode } from "@lexical/rich-text"
import { $createParagraphNode } from "lexical"
import {
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
} from "@lexical/list"
import {
  Type, Heading1, Heading2, Heading3,
  List, ListOrdered, Quote,
} from "lucide-react"

class SlashOption extends MenuOption {
  title: string
  icon: React.ReactNode
  keywords: string[]
  onSelect: () => void

  constructor(
    title: string,
    opts: { icon: React.ReactNode; keywords?: string[]; onSelect: () => void }
  ) {
    super(title)
    this.title = title
    this.icon = opts.icon
    this.keywords = opts.keywords ?? []
    this.onSelect = opts.onSelect
  }
}

function SlashMenuItem({
  isSelected,
  onClick,
  onMouseEnter,
  option,
}: {
  isSelected: boolean
  onClick: () => void
  onMouseEnter: () => void
  option: SlashOption
}) {
  return (
    <li
      ref={option.setRefElement}
      role="option"
      aria-selected={isSelected}
      className={`flex cursor-pointer items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
        isSelected ? "bg-accent text-accent-foreground" : "text-popover-foreground hover:bg-accent/60"
      }`}
      onMouseEnter={onMouseEnter}
      onClick={onClick}
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded border bg-background text-muted-foreground">
        {option.icon}
      </span>
      <span className="font-medium">{option.title}</span>
    </li>
  )
}

export function SlashCommandsPlugin() {
  const [editor] = useLexicalComposerContext()
  const [queryString, setQueryString] = useState<string | null>(null)

  const triggerFn = useBasicTypeaheadTriggerMatch("/", { minLength: 0 })

  const options: SlashOption[] = useMemo(() => {
    const all: SlashOption[] = [
      new SlashOption("ข้อความปกติ", {
        icon: <Type className="h-4 w-4" />,
        keywords: ["p", "paragraph", "text", "ข้อความ"],
        onSelect: () =>
          editor.update(() => {
            const sel = $getSelection()
            if ($isRangeSelection(sel)) $setBlocksType(sel, () => $createParagraphNode())
          }),
      }),
      new SlashOption("Heading 1", {
        icon: <Heading1 className="h-4 w-4" />,
        keywords: ["h1", "heading", "หัวข้อ"],
        onSelect: () =>
          editor.update(() => {
            const sel = $getSelection()
            if ($isRangeSelection(sel)) $setBlocksType(sel, () => $createHeadingNode("h1"))
          }),
      }),
      new SlashOption("Heading 2", {
        icon: <Heading2 className="h-4 w-4" />,
        keywords: ["h2", "heading", "หัวข้อ"],
        onSelect: () =>
          editor.update(() => {
            const sel = $getSelection()
            if ($isRangeSelection(sel)) $setBlocksType(sel, () => $createHeadingNode("h2"))
          }),
      }),
      new SlashOption("Heading 3", {
        icon: <Heading3 className="h-4 w-4" />,
        keywords: ["h3", "heading", "หัวข้อ"],
        onSelect: () =>
          editor.update(() => {
            const sel = $getSelection()
            if ($isRangeSelection(sel)) $setBlocksType(sel, () => $createHeadingNode("h3"))
          }),
      }),
      new SlashOption("Bullet List", {
        icon: <List className="h-4 w-4" />,
        keywords: ["ul", "bullet", "list", "รายการ"],
        onSelect: () => editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined),
      }),
      new SlashOption("Numbered List", {
        icon: <ListOrdered className="h-4 w-4" />,
        keywords: ["ol", "ordered", "numbered", "list", "ลำดับ"],
        onSelect: () => editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined),
      }),
      new SlashOption("Quote", {
        icon: <Quote className="h-4 w-4" />,
        keywords: ["quote", "blockquote", "อ้างอิง"],
        onSelect: () =>
          editor.update(() => {
            const sel = $getSelection()
            if ($isRangeSelection(sel)) $setBlocksType(sel, () => $createQuoteNode())
          }),
      }),
    ]

    if (!queryString) return all
    const q = queryString.toLowerCase()
    return all.filter(
      (o) =>
        o.title.toLowerCase().includes(q) ||
        o.keywords.some((k) => k.includes(q))
    )
  }, [editor, queryString])

  const onSelectOption = useCallback(
    (
      selected: SlashOption,
      nodeToRemove: TextNode | null,
      closeMenu: () => void
    ) => {
      editor.update(() => {
        nodeToRemove?.remove()
        selected.onSelect()
        closeMenu()
      })
    },
    [editor]
  )

  return (
    <LexicalTypeaheadMenuPlugin<SlashOption>
      onQueryChange={setQueryString}
      onSelectOption={onSelectOption}
      triggerFn={triggerFn}
      options={options}
      menuRenderFn={(anchorElementRef, { selectedIndex, selectOptionAndCleanUp, setHighlightedIndex }) => {
        if (!anchorElementRef.current || options.length === 0) return null
        return createPortal(
          <div className="z-50 min-w-[220px] overflow-hidden rounded-lg border bg-popover p-1 shadow-lg">
            <p className="px-2 py-1 text-xs font-medium text-muted-foreground">รูปแบบเนื้อหา</p>
            <ul role="listbox">
              {options.map((option, i) => (
                <SlashMenuItem
                  key={option.key}
                  isSelected={selectedIndex === i}
                  onClick={() => {
                    setHighlightedIndex(i)
                    selectOptionAndCleanUp(option)
                  }}
                  onMouseEnter={() => setHighlightedIndex(i)}
                  option={option}
                />
              ))}
            </ul>
          </div>,
          anchorElementRef.current
        )
      }}
    />
  )
}
