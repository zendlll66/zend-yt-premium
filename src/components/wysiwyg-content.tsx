"use client"

import dynamic from "next/dynamic"

const LexicalViewer = dynamic(
  () => import("@/components/blocks/editor-00/viewer").then((m) => ({ default: m.LexicalViewer })),
  { ssr: false, loading: () => <div className="min-h-[40px] animate-pulse rounded bg-muted/30" /> }
)

function isLexicalJson(s: string): boolean {
  try {
    const p = JSON.parse(s)
    return p && typeof p === "object" && "root" in p
  } catch {
    return false
  }
}

interface Props {
  html: string   // accepts either Lexical JSON string or raw HTML
  className?: string
}

export function WysiwygContent({ html, className = "" }: Props) {
  if (isLexicalJson(html)) {
    return <LexicalViewer serializedState={html} className={className} />
  }

  // Legacy HTML fallback (old records)
  return <HtmlContent html={html} className={className} />
}

// ── Legacy HTML renderer (kept for backwards-compat) ──────────────────────────
import { useEffect, useRef } from "react"
import "@/components/editor/themes/editor-theme.css"

function HtmlContent({ html, className = "" }: Props) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    el.querySelectorAll<HTMLIFrameElement>("iframe[data-lexical-youtube]").forEach((iframe) => {
      if (iframe.parentElement?.classList.contains("wysiwyg-yt-wrap")) return
      const wrap = document.createElement("div")
      wrap.style.cssText =
        "position:relative;padding-bottom:56.25%;height:0;overflow:hidden;border-radius:8px;margin:12px 0"
      iframe.style.cssText = "position:absolute;top:0;left:0;width:100%;height:100%;border:0"
      iframe.setAttribute("allowfullscreen", "true")
      iframe.parentNode!.insertBefore(wrap, iframe)
      wrap.appendChild(iframe)
    })

    el.querySelectorAll<HTMLDivElement>("div[data-lexical-tweet-id]").forEach((div) => {
      const tweetId = div.getAttribute("data-lexical-tweet-id")
      if (!tweetId) return
      const blockquote = document.createElement("blockquote")
      blockquote.className = "twitter-tweet"
      blockquote.setAttribute("data-dnt", "true")
      const a = document.createElement("a")
      a.href = `https://twitter.com/i/web/status/${tweetId}`
      a.textContent = `https://twitter.com/i/web/status/${tweetId}`
      blockquote.appendChild(a)
      div.replaceWith(blockquote)
    })

    const tw = (window as any).twttr
    if (tw?.widgets) {
      tw.widgets.load(el)
    } else if (!document.getElementById("twitter-widget-js")) {
      const s = document.createElement("script")
      s.id = "twitter-widget-js"
      s.src = "https://platform.twitter.com/widgets.js"
      s.async = true
      s.charset = "utf-8"
      document.head.appendChild(s)
      s.onload = () => (window as any).twttr?.widgets?.load(el)
    }
  }, [html])

  return (
    <div
      ref={ref}
      className={["[&_img]:max-w-full", className].filter(Boolean).join(" ")}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
