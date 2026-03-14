"use client";

import * as React from "react";
import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import { Button } from "@/components/ui/button";
import { uploadImageAction } from "@/app/actions/upload";
import { cn } from "@/lib/utils";

const R2_IMAGE_FOLDER = "stock-types";

export type RichTextEditorProps = {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  minHeight?: string;
};

function Toolbar({ editor, onInsertImage, disabled }: { editor: Editor | null; onInsertImage: () => void; disabled?: boolean }) {
  if (!editor) return null;
  return (
    <div className="flex flex-wrap items-center gap-1 border-b border-input bg-muted/40 p-1">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-8 w-8 p-0"
        onClick={() => editor.chain().focus().toggleBold().run()}
        disabled={disabled || !editor.can().chain().focus().toggleBold().run()}
      >
        <span className="font-bold text-sm">B</span>
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-8 w-8 p-0 italic"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        disabled={disabled || !editor.can().chain().focus().toggleItalic().run()}
      >
        I
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-8 w-8 p-0"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        disabled={disabled || !editor.can().chain().focus().toggleBulletList().run()}
      >
        •
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-8 w-8 p-0"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        disabled={disabled || !editor.can().chain().focus().toggleOrderedList().run()}
      >
        1.
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-8 px-2"
        onClick={onInsertImage}
        disabled={disabled}
      >
        รูปภาพ
      </Button>
    </div>
  );
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = "เขียนคำอธิบาย...",
  disabled,
  className,
  minHeight = "120px",
}: RichTextEditorProps) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = React.useState(false);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Image.configure({
        inline: false,
        allowBase64: false,
      }),
    ],
    content: value,
    editable: !disabled,
    editorProps: {
      attributes: {
        class: "prose prose-sm max-w-none min-h-[80px] px-3 py-2 focus:outline-none",
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  React.useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    if (value !== current) {
      editor.commands.setContent(value, { emitUpdate: false });
    }
  }, [value, editor]);

  React.useEffect(() => {
    if (editor) {
      editor.setEditable(!disabled);
    }
  }, [disabled, editor]);

  const handleInsertImage = React.useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = React.useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !editor) return;
      setUploading(true);
      try {
        const formData = new FormData();
        formData.set("file", file);
        formData.set("folder", R2_IMAGE_FOLDER);
        const result = await uploadImageAction(formData);
        if (result.key) {
          const src = `/api/r2-url?key=${encodeURIComponent(result.key)}`;
          editor.chain().focus().setImage({ src }).run();
          onChange(editor.getHTML());
        }
      } finally {
        setUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    },
    [editor, onChange]
  );

  return (
    <div className={cn("rounded-md border border-input bg-background", className)}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
        disabled={uploading || disabled}
      />
      <Toolbar editor={editor} onInsertImage={handleInsertImage} disabled={disabled || uploading} />
      <EditorContent
        editor={editor}
        style={{ minHeight }}
        className={cn(disabled && "opacity-60 pointer-events-none")}
      />
    </div>
  );
}
