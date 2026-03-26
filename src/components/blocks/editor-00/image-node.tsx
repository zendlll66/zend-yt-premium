"use client"

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
import { Suspense } from "react"

export type SerializedImageNode = Spread<
  { src: string; altText: string; width?: number; height?: number },
  SerializedLexicalNode
>

function ImageComponent({ src, altText }: { src: string; altText: string }) {
  return (
    <img
      src={src}
      alt={altText}
      draggable={false}
      className="max-w-full rounded"
      style={{ display: "block" }}
    />
  )
}

export class ImageNode extends DecoratorNode<JSX.Element> {
  __src: string
  __altText: string

  static getType(): string {
    return "image"
  }

  static clone(node: ImageNode): ImageNode {
    return new ImageNode(node.__src, node.__altText, node.__key)
  }

  constructor(src: string, altText: string, key?: NodeKey) {
    super(key)
    this.__src = src
    this.__altText = altText
  }

  static importJSON(serializedNode: SerializedImageNode): ImageNode {
    return $createImageNode(serializedNode.src, serializedNode.altText)
  }

  exportJSON(): SerializedImageNode {
    return {
      ...super.exportJSON(),
      type: "image",
      version: 1,
      src: this.__src,
      altText: this.__altText,
    }
  }

  static importDOM(): DOMConversionMap | null {
    return {
      img: () => ({
        conversion: (element: HTMLElement): DOMConversionOutput | null => {
          const img = element as HTMLImageElement
          return { node: $createImageNode(img.src, img.alt || "") }
        },
        priority: 0,
      }),
    }
  }

  exportDOM(): DOMExportOutput {
    const element = document.createElement("img")
    element.setAttribute("src", this.__src)
    element.setAttribute("alt", this.__altText)
    return { element }
  }

  createDOM(_config: EditorConfig): HTMLElement {
    const span = document.createElement("span")
    span.style.display = "block"
    return span
  }

  updateDOM(): false {
    return false
  }

  decorate(): JSX.Element {
    return (
      <Suspense fallback={null}>
        <ImageComponent src={this.__src} altText={this.__altText} />
      </Suspense>
    )
  }
}

export function $createImageNode(src: string, altText: string): ImageNode {
  return new ImageNode(src, altText)
}

export function $isImageNode(node: LexicalNode | null | undefined): node is ImageNode {
  return node instanceof ImageNode
}
