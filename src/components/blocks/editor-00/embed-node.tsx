"use client"

import type { JSX } from "react"
import {
  DecoratorNode,
  type DOMConversionMap,
  type DOMConversionOutput,
  type DOMExportOutput,
  type EditorConfig,
  type LexicalNode,
  type NodeKey,
  type SerializedLexicalNode,
  type Spread,
} from "lexical"

export type EmbedType = "youtube" | "twitter"

export type SerializedEmbedNode = Spread<
  { embedType: EmbedType; url: string },
  SerializedLexicalNode
>

// ─── helpers ──────────────────────────────────────────────────────────────────

export function parseYouTubeId(url: string): string | null {
  try {
    const u = new URL(url)
    if (u.hostname === "youtu.be") return u.pathname.slice(1).split("?")[0]
    if (u.hostname.includes("youtube.com")) {
      return u.searchParams.get("v") || u.pathname.split("/embed/")[1]?.split("?")[0] || null
    }
  } catch {}
  return null
}

export function parseTwitterId(url: string): string | null {
  try {
    const u = new URL(url)
    if (u.hostname === "twitter.com" || u.hostname === "x.com") {
      const m = u.pathname.match(/\/status\/(\d+)/)
      return m?.[1] ?? null
    }
  } catch {}
  return null
}

export function detectEmbedType(url: string): EmbedType | null {
  if (parseYouTubeId(url)) return "youtube"
  if (parseTwitterId(url)) return "twitter"
  return null
}

// ─── React components ──────────────────────────────────────────────────────────

function YouTubeEmbed({ url }: { url: string }) {
  const id = parseYouTubeId(url)
  if (!id) return null
  return (
    <div className="my-2 overflow-hidden rounded-lg" style={{ position: "relative", paddingBottom: "56.25%", height: 0 }}>
      <iframe
        src={`https://www.youtube.com/embed/${id}`}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: 0 }}
        title="YouTube video"
      />
    </div>
  )
}

function TwitterEmbed({ url }: { url: string }) {
  const tweetId = parseTwitterId(url)
  if (!tweetId) return null
  // canonical twitter.com URL so the widget script can resolve it
  const canonicalUrl = `https://twitter.com/i/web/status/${tweetId}`

  return (
    <div
      className="my-2"
      ref={(el) => {
        if (!el) return
        // load widget script once
        if (!(window as any).twttr) {
          const s = document.createElement("script")
          s.src = "https://platform.twitter.com/widgets.js"
          s.async = true
          s.charset = "utf-8"
          document.head.appendChild(s)
        } else {
          (window as any).twttr?.widgets?.load(el)
        }
      }}
    >
      <blockquote className="twitter-tweet" data-dnt="true">
        <a href={canonicalUrl}>{canonicalUrl}</a>
      </blockquote>
    </div>
  )
}

// ─── Lexical node ──────────────────────────────────────────────────────────────

export class EmbedNode extends DecoratorNode<JSX.Element> {
  __embedType: EmbedType
  __url: string

  static getType(): string {
    return "embed"
  }

  static clone(node: EmbedNode): EmbedNode {
    return new EmbedNode(node.__embedType, node.__url, node.__key)
  }

  constructor(embedType: EmbedType, url: string, key?: NodeKey) {
    super(key)
    this.__embedType = embedType
    this.__url = url
  }

  static importJSON(s: SerializedEmbedNode): EmbedNode {
    return $createEmbedNode(s.embedType, s.url)
  }

  exportJSON(): SerializedEmbedNode {
    return { ...super.exportJSON(), type: "embed", version: 1, embedType: this.__embedType, url: this.__url }
  }

  static importDOM(): DOMConversionMap | null {
    return {
      div: (el: HTMLElement) => {
        if (!el.hasAttribute("data-lexical-embed")) return null
        return {
          conversion: (node: HTMLElement): DOMConversionOutput | null => {
            const embedType = node.getAttribute("data-embed-type") as EmbedType | null
            const url = node.getAttribute("data-embed-url")
            if (!embedType || !url) return null
            return { node: $createEmbedNode(embedType, url) }
          },
          priority: 1,
        }
      },
    }
  }

  exportDOM(): DOMExportOutput {
    const el = document.createElement("div")
    el.setAttribute("data-lexical-embed", "true")
    el.setAttribute("data-embed-type", this.__embedType)
    el.setAttribute("data-embed-url", this.__url)
    // also render a visible fallback for HTML export
    if (this.__embedType === "youtube") {
      const id = parseYouTubeId(this.__url)
      if (id) {
        const iframe = document.createElement("iframe")
        iframe.src = `https://www.youtube.com/embed/${id}`
        iframe.width = "560"
        iframe.height = "315"
        iframe.setAttribute("frameborder", "0")
        iframe.setAttribute("allowfullscreen", "true")
        el.appendChild(iframe)
      }
    } else {
      const a = document.createElement("a")
      a.href = this.__url
      a.textContent = this.__url
      el.appendChild(a)
    }
    return { element: el }
  }

  createDOM(_config: EditorConfig): HTMLElement {
    const div = document.createElement("div")
    div.style.display = "block"
    return div
  }

  updateDOM(): false {
    return false
  }

  decorate(): JSX.Element {
    if (this.__embedType === "youtube") return <YouTubeEmbed url={this.__url} />
    return <TwitterEmbed url={this.__url} />
  }
}

export function $createEmbedNode(embedType: EmbedType, url: string): EmbedNode {
  return new EmbedNode(embedType, url)
}

export function $isEmbedNode(node: LexicalNode | null | undefined): node is EmbedNode {
  return node instanceof EmbedNode
}
