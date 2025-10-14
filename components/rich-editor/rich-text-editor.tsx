
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
      <div className="flex flex-col h-[50vh] bg-white dark:bg-[#1A1A1A] border border-accent rounded shadow-sm rounded-lg overflow-hidden">

        {/* Toolbar */}
        <div className="sticky top-0 flex gap-2 p-1
                      bg-[#ED5E20] rounded-lg justify-center">
          {/* Font Style */}
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBold().run()}
            disabled={!editor.can().chain().focus().toggleBold().run()}
            className={`flex p-1.5 rounded transition cursor-pointer w-10 h-10 justify-center items-center
            ${editor.isActive("bold") ? "bg-orange-400  dark:[#ED5E20]/50" : "hover:bg-orange-400"}
          `}
            title="Bold (Ctrl+B)"
          >
            <Bold size={16} className="text-white" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            disabled={!editor.can().chain().focus().toggleItalic().run()}
            className={`flex p-1.5 rounded transition cursor-pointer w-10 h-10 justify-center items-center
            ${editor.isActive("italic") ? "bg-orange-400  dark:[#ED5E20]/50" : "hover:bg-orange-400"}
          `}
            title="Italic (Ctrl+I)"
          >
            <Italic size={16} className="text-white" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            disabled={!editor.can().chain().focus().toggleUnderline().run()}
            className={`flex p-1.5 rounded transition cursor-pointer w-10 h-10 justify-center items-center
            ${editor.isActive("underline") ? "bg-orange-400  dark:[#ED5E20]/50" : "hover:bg-orange-400"}
          `}
            title="Underline (Ctrl+U)"
          >
            <UnderlineIcon size={16} className="text-white" />
          </button>

          {/* Headings */}
          <button
            type="button"
            onClick={() => editor.chain().focus().setHeading({ level: 1 }).run()}
            className={`flex p-1.5 rounded transition cursor-pointer w-10 h-10 justify-center items-center
            ${editor.isActive("heading", { level: 1 }) ? "bg-orange-400  dark:[#ED5E20]/50" : "hover:bg-orange-400"}
          `}
            title="Heading 1"
          >
            <span className="text-sm font-medium text-white">H1</span>
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().setHeading({ level: 2 }).run()}
            className={`flex p-1.5 rounded transition cursor-pointer w-10 h-10 justify-center items-center
            ${editor.isActive("heading", { level: 2 }) ? "bg-orange-400  dark:[#ED5E20]/50" : "hover:bg-orange-400"}
          `}
            title="Heading 2"
          >
            <span className="text-sm font-medium text-white">H2</span>
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().setHeading({ level: 3 }).run()}
            className={`flex p-1.5 rounded transition cursor-pointer w-10 h-10 justify-center items-center
            ${editor.isActive("heading", { level: 3 }) ? "bg-orange-400  dark:[#ED5E20]/50" : "hover:bg-orange-400"}
          `}
            title="Heading 3"
          >
            <span className="text-sm font-medium text-white">H3</span>
          </button>

          {/* Lists */}
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`flex p-1.5 rounded transition cursor-pointer w-10 h-10 justify-center items-center
            ${editor.isActive("bulletList") ? "bg-orange-400  dark:[#ED5E20]/50" : "hover:bg-orange-400"}
          `}
            title="Bullet List"
          >
            <List size={16} className="text-white" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`flex p-1.5 rounded transition cursor-pointer w-10 h-10 justify-center items-center
            ${editor.isActive("orderedList") ? "bg-orange-400  dark:[#ED5E20]/50" : "hover:bg-orange-400"}
          `}
            title="Numbered List"
          >
            <ListOrdered size={16} className="text-white" />
          </button>

          {/* Alignment */}
          <button
            type="button"
            onClick={() => editor.chain().focus().setTextAlign("left").run()}
            className={`flex p-1.5 rounded transition cursor-pointer w-10 h-10 justify-center items-center
            ${editor.isActive({ textAlign: "left" }) ? "bg-orange-400  dark:[#ED5E20]/50" : "hover:bg-orange-400"}
          `}
            title="Align Left"
          >
            <AlignLeft size={16} className="text-white" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().setTextAlign("center").run()}
            className={`flex p-1.5 rounded transition cursor-pointer w-10 h-10 justify-center items-center
            ${editor.isActive({ textAlign: "center" }) ? "bg-orange-400  dark:[#ED5E20]/50" : "hover:bg-orange-400"}
          `}
            title="Align Center"
          >
            <AlignCenter size={16} className="text-white" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().setTextAlign("right").run()}
            className={`flex p-1.5 rounded transition cursor-pointer w-10 h-10 justify-center items-center
            ${editor.isActive({ textAlign: "right" }) ? "bg-orange-400  dark:[#ED5E20]/50" : "hover:bg-orange-400"}
          `}
            title="Align Right"
          >
            <AlignRight size={16} className="text-white" />
          </button>

          {/* Blockquote & Horizontal Rule */}
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={`flex p-1.5 rounded transition cursor-pointer w-10 h-10 justify-center items-center
            ${editor.isActive("blockquote") ? "bg-orange-400  dark:[#ED5E20]/50" : "hover:bg-orange-400"}
          `}
            title="Blockquote"
          >
            <Quote size={16} className="text-white" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            className="flex p-1.5 rounded transition hover:bg-[#E5E5E5] hover:bg-orange-400 cursor-pointer w-10 h-10 justify-center items-center"
            title="Horizontal Rule"
          >
            <Minus size={16} className="text-white" />
          </button>
        </div>

        {/* Scrollable Editor Content */}
        <div className="flex-1 overflow-y-auto">
          <EditorContent
            editor={editor}
            className="h-full px-3 py-2 outline-none ProseMirror
               bg-white dark:bg-[#1A1A1A] text-black dark:text-white"
          />
        </div>
      </div>
    </div>
  );
});

export default RichTextEditor;