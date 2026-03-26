import { HeadingNode, QuoteNode } from "@lexical/rich-text"
import { ListNode, ListItemNode } from "@lexical/list"
import { LinkNode, AutoLinkNode } from "@lexical/link"
import { HorizontalRuleNode } from "@lexical/extension"
import {
  Klass,
  LexicalNode,
  LexicalNodeReplacement,
  ParagraphNode,
  TextNode,
} from "lexical"
import { ImageNode } from "./image-node"
import { EmbedNode } from "./embed-node"

export const nodes: ReadonlyArray<Klass<LexicalNode> | LexicalNodeReplacement> = [
  HeadingNode,
  ParagraphNode,
  TextNode,
  QuoteNode,
  ListNode,
  ListItemNode,
  LinkNode,
  AutoLinkNode,
  HorizontalRuleNode,
  ImageNode,
  EmbedNode,
]
