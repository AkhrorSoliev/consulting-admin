import { useEffect } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import clsx from "clsx";

const stripHtml = (value) =>
  String(value || "")
    .replace(/<[^>]*>/g, "")
    .trim();

function ToolbarButton({ label, isActive, onClick }) {
  return (
    <button
      type="button"
      className={clsx(
        "btn btn-ghost btn-xs",
        isActive ? "btn-active text-primary" : "text-base-content/80"
      )}
      onClick={onClick}
    >
      {label}
    </button>
  );
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder = "",
  className = "",
  editorClassName = "min-h-[140px]",
}) {
  const editor = useEditor({
    extensions: [
      // Disable blockquote and add underline support
      StarterKit.configure({ blockquote: false }),
      Underline,
    ],
    content: value || "",
    onUpdate({ editor: current }) {
      const html = current.getHTML();
      const text = current.getText().trim();
      onChange?.(text ? html : "");
    },
    editorProps: {
      attributes: {
        class:
          "focus:outline-none text-sm leading-6 min-h-[120px] whitespace-pre-wrap",
      },
    },
  });

  useEffect(() => {
    if (!editor) return;
    const incoming = value || "";
    const current = editor.getHTML();
    if (incoming !== current) {
      editor.commands.setContent(incoming || "", false);
    }
  }, [value, editor]);

  if (!editor) {
    return (
      <div
        className={clsx(
          "bg-base-100 border border-base-300 rounded-lg p-3 text-sm text-base-content/60",
          className
        )}
      >
        Editor wird geladen...
      </div>
    );
  }

  const hasContent = Boolean(stripHtml(value));

  return (
    <div
      className={clsx(
        "bg-base-100 border border-base-300 rounded-lg overflow-hidden",
        className
      )}
    >
      <div className="flex flex-wrap items-center gap-1 border-b border-base-300 p-2">
        <ToolbarButton
          label="B"
          isActive={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
        />
        <ToolbarButton
          label="I"
          isActive={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        />
        <ToolbarButton
          label={<span className="underline">U</span>}
          isActive={editor.isActive("underline")}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        />
        <ToolbarButton
          label="S"
          isActive={editor.isActive("strike")}
          onClick={() => editor.chain().focus().toggleStrike().run()}
        />
        <ToolbarButton
          label="• Liste"
          isActive={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        />
        <ToolbarButton
          label="1. Liste"
          isActive={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        />
      </div>
      <div className="relative">
        <EditorContent
          editor={editor}
          className={clsx(
            "p-3 text-sm leading-6 prose-sm max-w-none",
            editorClassName
          )}
        />
        {!hasContent && placeholder ? (
          <span className="pointer-events-none absolute left-3 top-3 text-sm text-base-content/50">
            {placeholder}
          </span>
        ) : null}
      </div>
    </div>
  );
}

