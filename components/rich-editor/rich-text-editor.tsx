import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import BulletList from "@tiptap/extension-bullet-list";
import OrderedList from "@tiptap/extension-ordered-list";
import ListItem from "@tiptap/extension-list-item";
import './rich-text-editor.css';
import TextAlign from "@tiptap/extension-text-align";
import Placeholder from "@tiptap/extension-placeholder";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  List,
  ListOrdered,
  Quote,
  Minus,
  Type,
  AlignLeft,
  AlignCenter,
  AlignRight,
} from "lucide-react";
import React, { forwardRef, useImperativeHandle } from "react";

// Define the extensions array outside the component
const extensions = [
  StarterKit,
  BulletList,
  OrderedList,
  ListItem,
  TextAlign.configure({ types: ["heading", "paragraph"] }),
  Placeholder.configure({
    placeholder: "Type your design philosophy here...",
  }),
];

type TiptapEditorProps = {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
};

// Expose the editor instance to the parent via ref
export const RichTextEditor = forwardRef(function RichTextEditor(
  { value, onChange, disabled, className }: TiptapEditorProps,
  ref
) {
  const editor = useEditor({
    extensions,
    content: value,
    editable: !disabled,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    immediatelyRender: false,
  });

  useImperativeHandle(ref, () => editor, [editor]);

  React.useEffect(() => {
    if (editor && editor.isEditable) {
      editor.commands.focus();
    }
  }, [editor]);

  React.useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value);
    }
  }, [value, editor]);

  if (!editor) return null;

  return (
    <div className={className}>
      <div className="bg-white dark:bg-[#1A1A1A] rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex gap-1 p-1.5 flex-wrap bg-white dark:bg-[#1A1A1A] border-b border-gray-200 dark:border-gray-700">
          {/* Font Style */}
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBold().run()}
            disabled={!editor.can().chain().focus().toggleBold().run()}
            className={`p-1.5 rounded transition 
              ${editor.isActive("bold") ? "bg-[#D1D1D1] dark:bg-[#333]" : "hover:bg-[#E5E5E5] dark:hover:bg-[#222]"}
              `}
            title="Bold (Ctrl+B)"
          >
            <Bold size={16} />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            disabled={!editor.can().chain().focus().toggleItalic().run()}
            className={`p-1.5 rounded transition 
              ${editor.isActive("italic") ? "bg-[#D1D1D1] dark:bg-[#333]" : "hover:bg-[#E5E5E5] dark:hover:bg-[#222]"}
              `}
            title="Italic (Ctrl+I)"
          >
            <Italic size={16} />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            disabled={!editor.can().chain().focus().toggleUnderline().run()}
            className={`p-1.5 rounded transition 
              ${editor.isActive("underline") ? "bg-[#D1D1D1] dark:bg-[#333]" : "hover:bg-[#E5E5E5] dark:hover:bg-[#222]"}
              `}
            title="Underline (Ctrl+U)"
          >
            <UnderlineIcon size={16} />
          </button>
          {/* Headings */}
          <button
            type="button"
            onClick={() => editor.chain().focus().setHeading({ level: 1 }).run()}
            className={`p-1.5 rounded transition 
              ${editor.isActive("heading", { level: 1 }) ? "bg-[#D1D1D1] dark:bg-[#333]" : "hover:bg-[#E5E5E5] dark:hover:bg-[#222]"}
              `}
            title="Heading 1"
          >
            <Type size={16} /> <span className="ml-1 text-sm font-bold">H1</span>
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().setHeading({ level: 2 }).run()}
            className={`p-1.5 rounded transition 
              ${editor.isActive("heading", { level: 2 }) ? "bg-[#D1D1D1] dark:bg-[#333]" : "hover:bg-[#E5E5E5] dark:hover:bg-[#222]"}
              `}
            title="Heading 2"
          >
            <Type size={16} /> <span className="ml-1 text-sm font-bold">H2</span>
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().setHeading({ level: 3 }).run()}
            className={`p-1.5 rounded transition 
              ${editor.isActive("heading", { level: 3 }) ? "bg-[#D1D1D1] dark:bg-[#333]" : "hover:bg-[#E5E5E5] dark:hover:bg-[#222]"}
              `}
            title="Heading 3"
          >
            <Type size={16} /> <span className="ml-1 text-sm font-bold">H3</span>
          </button>
          {/* Lists */}
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`p-1.5 rounded transition 
              ${editor.isActive("bulletList") ? "bg-[#D1D1D1] dark:bg-[#333]" : "hover:bg-[#E5E5E5] dark:hover:bg-[#222]"}
              `}
            title="Bullet List"
          >
            <List size={16} />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`p-1.5 rounded transition 
              ${editor.isActive("orderedList") ? "bg-[#D1D1D1] dark:bg-[#333]" : "hover:bg-[#E5E5E5] dark:hover:bg-[#222]"}
              `}
            title="Numbered List"
          >
            <ListOrdered size={16} />
          </button>
          {/* Alignment */}
          <button
            type="button"
            onClick={() => editor.chain().focus().setTextAlign("left").run()}
            className={`p-1.5 rounded transition 
              ${editor.isActive({ textAlign: "left" }) ? "bg-[#D1D1D1] dark:bg-[#333]" : "hover:bg-[#E5E5E5] dark:hover:bg-[#222]"}
              `}
            title="Align Left"
          >
            <AlignLeft size={16} />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().setTextAlign("center").run()}
            className={`p-1.5 rounded transition 
              ${editor.isActive({ textAlign: "center" }) ? "bg-[#D1D1D1] dark:bg-[#333]" : "hover:bg-[#E5E5E5] dark:hover:bg-[#222]"}
              `}
            title="Align Center"
          >
            <AlignCenter size={16} />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().setTextAlign("right").run()}
            className={`p-1.5 rounded transition 
              ${editor.isActive({ textAlign: "right" }) ? "bg-[#D1D1D1] dark:bg-[#333]" : "hover:bg-[#E5E5E5] dark:hover:bg-[#222]"}
              `}
            title="Align Right"
          >
            <AlignRight size={16} />
          </button>
          {/* Blockquote & Horizontal Rule */}
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={`p-1.5 rounded transition 
              ${editor.isActive("blockquote") ? "bg-[#D1D1D1] dark:bg-[#333]" : "hover:bg-[#E5E5E5] dark:hover:bg-[#222]"}
              `}
            title="Blockquote"
          >
            <Quote size={16} />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            className="p-1.5 rounded transition hover:bg-[#E5E5E5] dark:hover:bg-[#222]"
            title="Horizontal Rule"
          >
            <Minus size={16} />
          </button>
        </div>
        {/* Editor Content */}
        <EditorContent
          editor={editor}
          className="min-h-[620px] px-3 py-2 outline-none ProseMirror bg-white dark:bg-[#1A1A1A] text-black dark:text-white"
        />
      </div>
    </div>
  );
});

export default RichTextEditor;