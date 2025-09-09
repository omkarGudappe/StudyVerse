import React, { useState, useEffect, useRef } from "react";
import { Node, mergeAttributes } from "@tiptap/core";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Highlight from "@tiptap/extension-highlight";
import { TextStyle } from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import TextAlign from "@tiptap/extension-text-align";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { createLowlight } from 'lowlight';
import Mathematics from "@tiptap/extension-mathematics";
import Placeholder from "@tiptap/extension-placeholder";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import {Table} from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableHeader from "@tiptap/extension-table-header";
import TableCell from "@tiptap/extension-table-cell";
import { ReactRenderer } from "@tiptap/react";
import tippy from "tippy.js";
import Suggestion from "@tiptap/suggestion";
import {
  FaBold,
  FaItalic,
  FaUnderline,
  FaHighlighter,
  FaHeading,
  FaListUl,
  FaListOl,
  FaAlignLeft,
  FaAlignCenter,
  FaAlignRight,
  FaQuoteRight,
  FaCode,
  FaUndo,
  FaRedo,
  FaTasks,
  FaCaretSquareDown,
  FaLink,
  FaImage,
  FaTable,
  FaSmile,
  FaSearch,
  FaSave,
  FaFileExport,
  FaPrint,
  FaEllipsisH,
  FaPlus,
  FaPalette,
  FaFont,
  FaTextHeight,
  FaStickyNote
} from "react-icons/fa";
import { 
  BiMath, 
  BiCollapseVertical, 
  BiExpandVertical 
} from "react-icons/bi";
import { 
  BsTypeH1, 
  BsTypeH2, 
  BsTypeH3, 
  BsBlockquoteLeft, 
  BsCodeSquare,
  BsCardChecklist,
  BsEmojiSmile,
  BsThreeDotsVertical
} from "react-icons/bs";
import { 
  MdOutlineTextFields, 
  MdFormatColorText, 
  MdOutlineTableChart,
  MdOutlineCheckBoxOutlineBlank,
  MdCheckBoxOutlineBlank
} from "react-icons/md";
import { 
  TbMathFunction, 
  TbLetterCaseToggle 
} from "react-icons/tb";
import { 
  RiFileWord2Line, 
  RiCharacterRecognitionLine,
  RiMarkdownLine
} from "react-icons/ri";
import EmojiPicker from "emoji-picker-react";
import "katex/dist/katex.min.css";

// Custom Mention extension for @mentions
const Mention = Node.create({
  name: 'mention',
  inline: true,
  group: 'inline',
  selectable: false,
  atom: true,

  addAttributes() {
    return {
      id: {
        default: null,
      },
      label: {
        default: null,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-type="mention"]',
      },
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    return [
      'span',
      mergeAttributes({ 'data-type': 'mention' }, HTMLAttributes),
      `@${node.attrs.label}`,
    ];
  },

  addCommands() {
    return {
      insertMention: (attributes) => ({ chain }) => {
        return chain()
          .insertContent({
            type: this.name,
            attrs: attributes,
          })
          .run();
      },
    };
  },
});

// Custom Collapsible extension
const Collapsible = Node.create({
  name: "collapsible",
  group: "block",
  content: "block+",
  defining: true,

  addAttributes() {
    return {
      collapsed: {
        default: false,
      },
      summary: {
        default: "Details",
      },
    };
  },

  parseHTML() {
    return [{ tag: "details" }];
  },

  renderHTML({ HTMLAttributes }) {
    const attrs = mergeAttributes(HTMLAttributes);
    return [
      "details",
      attrs,
      ["summary", 0],
      ["div", 0],
    ];
  },

  addCommands() {
    return {
      toggleCollapsible:
        () =>
        ({ tr, state, dispatch, commands }) => {
          const { selection } = state;
          const { $from } = selection;
          for (let depth = $from.depth; depth > 0; depth--) {
            const node = $from.node(depth);
            if (node.type.name === this.name) {
              const pos = $from.before(depth);
              const newAttrs = { ...node.attrs, collapsed: !node.attrs.collapsed };
              tr.setNodeMarkup(pos, node.type, newAttrs);
              if (dispatch) dispatch(tr);
              return true;
            }
          }
          return commands.wrapIn(this.name);
        },
    };
  },

  addNodeView() {
    return ({ node, getPos, editor }) => {
      const dom = document.createElement("details");
      const summary = document.createElement("summary");
      const contentWrapper = document.createElement("div");

      if (!node.attrs.collapsed) dom.setAttribute("open", "");
      summary.textContent = node.attrs.summary || "Details";

      dom.appendChild(summary);
      dom.appendChild(contentWrapper);

      return {
        dom,
        contentDOM: contentWrapper,
        update(updatedNode) {
          if (updatedNode.attrs.collapsed) dom.removeAttribute("open");
          else dom.setAttribute("open", "");

          if (updatedNode.attrs.summary !== summary.textContent) {
            summary.textContent = updatedNode.attrs.summary || "Details";
          }
          return true;
        },
        destroy() {
          // cleanup if needed
        },
      };
    };
  },
});

// Custom FontFamily extension
const FontFamily = TextStyle.extend({
  addAttributes() {
    return {
      fontFamily: {
        default: null,
        parseHTML: (element) => element.style.fontFamily?.replace(/['"]/g, ''),
        renderHTML: (attributes) => {
          if (!attributes.fontFamily) return {};
          return { style: `font-family: ${attributes.fontFamily}` };
        },
      },
    };
  },
});

// Custom FontSize extension
const FontSize = TextStyle.extend({
  addAttributes() {
    return {
      fontSize: {
        default: null,
        parseHTML: (element) => element.style.fontSize,
        renderHTML: (attributes) => {
          if (!attributes.fontSize) return {};
          return { style: `font-size: ${attributes.fontSize}` };
        },
      },
    };
  },
});

// Custom TextCase extension for uppercase/lowercase
const TextCase = TextStyle.extend({
  addAttributes() {
    return {
      textCase: {
        default: null,
        parseHTML: (element) => element.style.textTransform,
        renderHTML: (attributes) => {
          if (!attributes.textCase) return {};
          return { style: `text-transform: ${attributes.textCase}` };
        },
      },
    };
  },
});

const lowlight = createLowlight();

// Custom Table extension with better styling
const CustomTable = Table.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      style: {
        default: null,
        parseHTML: element => element.getAttribute('style'),
        renderHTML: attributes => {
          return {
            style: `width: 100%; border-collapse: collapse; ${attributes.style || ''}`
          };
        },
      },
    };
  },
});

const NotesEditor = () => {
  const [color, setColor] = useState("#ffffff");
  const [bgColor, setBgColor] = useState("#fffd88");
  const [fontSize, setFontSize] = useState("16px");
  const [fontFamily, setFontFamily] = useState("Segoe UI");
  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [savedStatus, setSavedStatus] = useState("saved");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [showImageModal, setShowImageModal] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const emojiPickerRef = useRef(null);
  const editorRef = useRef(null);

  // Update date every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDate(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: true,
        orderedList: true,
        listItem: true,
        heading: true,
        paragraph: true,
        blockquote: true,
        codeBlock: false,
      }),
      Underline,
      Highlight.configure({ multicolor: true }),
      TextStyle,
      Color,
      FontFamily,
      FontSize,
      TextCase,
      Collapsible,
      TextAlign.configure({
        types: ["heading", "paragraph", "image"],
      }),
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      CodeBlockLowlight.configure({
        lowlight,
      }),
      Mathematics.configure({
        HTMLAttributes: {
          class: 'math-element',
        },
      }),
      Placeholder.configure({
        placeholder: "Start writing your notes here...",
      }),
      Link.configure({
        openOnClick: true,
        HTMLAttributes: {
          class: "text-purple-400 underline",
        },
      }),
      Image.configure({
        inline: true,
        allowBase64: true,
        HTMLAttributes: {
          class: 'embedded-image',
        },
      }),
      CustomTable.configure({
        resizable: true,
        HTMLAttributes: {
          class: 'custom-table',
        },
      }),
      TableRow.configure({
        HTMLAttributes: {
          class: 'table-row',
        },
      }),
      TableHeader.configure({
        HTMLAttributes: {
          class: 'table-header',
        },
      }),
      TableCell.configure({
        HTMLAttributes: {
          class: 'table-cell',
        },
      }),
      Mention.configure({
        suggestion: {
          items: ({ query }) => {
            return [
              "John Doe", "Jane Smith", "Alice Johnson", "Bob Brown", 
              "Emma Wilson", "Michael Davis", "Sarah Miller", "David Garcia"
            ].filter(item => item.toLowerCase().startsWith(query.toLowerCase()))
            .slice(0, 5);
          },
          render: () => {
            let component;
            let popup;

            return {
              onStart: (props) => {
                component = new ReactRenderer(MentionList, {
                  props,
                  editor: props.editor,
                });

                if (!props.clientRect) {
                  return;
                }

                popup = tippy("body", {
                  getReferenceClientRect: props.clientRect,
                  appendTo: () => document.body,
                  content: component.element,
                  showOnCreate: true,
                  interactive: true,
                  trigger: "manual",
                  placement: "bottom-start",
                });
              },

              onUpdate(props) {
                component.updateProps(props);

                if (!props.clientRect) {
                  return;
                }

                popup[0].setProps({
                  getReferenceClientRect: props.clientRect,
                });
              },

              onKeyDown(props) {
                if (props.event.key === "Escape") {
                  popup[0].hide();
                  return true;
                }

                return component.ref?.onKeyDown(props);
              },

              onExit() {
                popup[0].destroy();
                component.destroy();
              },
            };
          },
        },
      }),
    ],
    content: "<p>Start writing your notes here...</p>",
    onUpdate: ({ editor }) => {
      const text = editor.getText();
      setWordCount(text.split(/\s+/).filter(word => word.length > 0).length);
      setCharCount(text.length);
      setSavedStatus("unsaved");
      
      // Auto-save after 2 seconds of inactivity
      clearTimeout(window.autoSaveTimeout);
      window.autoSaveTimeout = setTimeout(() => {
        setSavedStatus("saving");
        // Simulate saving
        setTimeout(() => setSavedStatus("saved"), 500);
      }, 2000);
    },
    editorProps: {
      attributes: {
        class: 'prose prose-invert max-w-none focus:outline-none',
        style: `font-family: ${fontFamily}; font-size: ${fontSize}`,
      },
    },
  });

  // Handle fullscreen toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      editorRef.current.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  // Add link
  const addLink = () => {
    if (linkUrl) {
      editor.chain().focus().extendMarkRange('link').setLink({ href: linkUrl }).run();
      setShowLinkModal(false);
      setLinkUrl("");
    }
  };

  // Add image
  const addImage = () => {
    if (imageUrl) {
      editor.chain().focus().setImage({ src: imageUrl }).run();
      setShowImageModal(false);
      setImageUrl("");
    }
  };

  // Insert emoji
  const onEmojiClick = (emojiData) => {
    editor.chain().focus().insertContent(emojiData.emoji).run();
    setShowEmojiPicker(false);
  };

  // Export as Markdown
  const exportAsMarkdown = () => {
    const content = editor.getHTML();
    // Simple conversion to markdown (this would need a proper library for full conversion)
    const markdown = content
      .replace(/<h1>(.*?)<\/h1>/g, '# $1\n')
      .replace(/<h2>(.*?)<\/h2>/g, '## $1\n')
      .replace(/<h3>(.*?)<\/h3>/g, '### $1\n')
      .replace(/<strong>(.*?)<\/strong>/g, '**$1**')
      .replace(/<em>(.*?)<\/em>/g, '*$1*')
      .replace(/<ul>(.*?)<\/ul>/g, '$1')
      .replace(/<li>(.*?)<\/li>/g, '- $1\n')
      .replace(/<p>(.*?)<\/p>/g, '$1\n')
      .replace(/<br\s*\/?>/g, '\n')
      .replace(/<[^>]*>/g, '');
    
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'notes.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Export as HTML
  const exportAsHTML = () => {
    const content = editor.getHTML();
    const blob = new Blob([content], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'notes.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Print document
  const printDocument = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Print Document</title>
          <style>
            body { font-family: ${fontFamily}; font-size: ${fontSize}; padding: 20px; }
            .ProseMirror { all: initial; }
            table { border-collapse: collapse; width: 100%; }
            th, td { border: 1px solid #ddd; padding: 8px; }
            th { background-color: #f2f2f2; }
            .math-element { display: block; margin: 10px 0; }
            .embedded-image { max-width: 100%; height: auto; }
          </style>
        </head>
        <body>
          ${editor.getHTML()}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

  if (!editor) return null;

  const ToolbarButton = ({ onClick, active, children, title, className = "", disabled = false }) => {
    return (
      <button
        onClick={onClick}
        title={title}
        disabled={disabled}
        className={`p-2 cursor-pointer rounded-lg transition-all duration-200 hover:bg-purple-700 ${active ? "bg-purple-600 text-white" : "text-neutral-300 bg-neutral-700"} ${disabled ? "opacity-50 cursor-not-allowed" : ""} ${className}`}
      >
        {children}
      </button>
    );
  };

  const ToolbarDivider = () => <div className="w-px h-6 bg-neutral-600 mx-2" />;

  // Mention list component
  const MentionList = ({ items, command }) => {
    const [selectedIndex, setSelectedIndex] = useState(0);

    const onKeyDown = ({ event }) => {
      if (event.key === "ArrowUp") {
        setSelectedIndex((selectedIndex + items.length - 1) % items.length);
        return true;
      }

      if (event.key === "ArrowDown") {
        setSelectedIndex((selectedIndex + 1) % items.length);
        return true;
      }

      if (event.key === "Enter") {
        selectItem(selectedIndex);
        return true;
      }

      return false;
    };

    const selectItem = (index) => {
      const item = items[index];
      if (item) {
        command({ id: item, label: item });
      }
    };

    useEffect(() => setSelectedIndex(0), [items]);

    return items.length > 0 ? (
      <div className="bg-neutral-800 border border-neutral-700 rounded-lg shadow-lg overflow-hidden">
        {items.map((item, index) => (
          <button
            className={`block w-full text-left px-4 py-2 ${index === selectedIndex ? "bg-purple-600 text-white" : "text-neutral-300"}`}
            key={index}
            onClick={() => selectItem(index)}
          >
            @{item}
          </button>
        ))}
      </div>
    ) : null;
  };

  return (
    <div className={`min-h-screen overflow-x-hidden mb-15 lg:mb-0 bg-neutral-900 text-white ${isFullscreen ? "fixed inset-0 z-50" : ""}`} ref={editorRef}>
      {/* Header */}
      <div className="bg-neutral-800 border-b border-neutral-700 px-6 py-3 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-purple-400 flex items-center gap-2">
            <FaStickyNote /> StudyVerse Notes
          </h1>
          <p className="text-neutral-400 text-sm">Your personal digital notebook</p>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-neutral-400">
            {currentDate.toLocaleDateString()} {currentDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
          <div className="flex gap-2">
            <button 
              onClick={toggleFullscreen}
              className="p-2 rounded-lg bg-neutral-700 hover:bg-neutral-600 transition-colors"
              title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
            >
              {isFullscreen ? <BiCollapseVertical /> : <BiExpandVertical />}
            </button>
            <button 
              onClick={printDocument}
              className="p-2 rounded-lg bg-neutral-700 hover:bg-neutral-600 transition-colors"
              title="Print"
            >
              <FaPrint />
            </button>
          </div>
        </div>
      </div>

      {/* Main Toolbar */}
      <div className="bg-neutral-800 border-b border-neutral-700 px-4 py-2 sticky top-0 z-10">
        <div className="flex flex-wrap items-center gap-2">
          {/* Document Actions */}
          <div className="flex items-center gap-2 mr-2">
            <ToolbarButton title="Save" onClick={() => setSavedStatus("saving")}>
              <FaSave />
            </ToolbarButton>
            <div className="relative group">
              <ToolbarButton title="Export">
                <FaFileExport />
              </ToolbarButton>
              <div className="absolute left-0 mt-1 w-48 bg-neutral-800 border border-neutral-700 rounded-lg shadow-lg z-20 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                <button 
                  onClick={exportAsMarkdown}
                  className="block w-full text-left px-4 py-2 hover:bg-neutral-700 flex items-center gap-2"
                >
                  <RiMarkdownLine /> Export as Markdown
                </button>
                <button 
                  onClick={exportAsHTML}
                  className="block w-full text-left px-4 py-2 hover:bg-neutral-700 flex items-center gap-2"
                >
                  <RiFileWord2Line /> Export as HTML
                </button>
              </div>
            </div>
          </div>

          <ToolbarDivider />

          {/* Font Family */}
          <div className="flex items-center gap-2 bg-neutral-700 rounded-lg px-2">
            <FaFont className="text-neutral-400" />
            <select
              value={fontFamily}
              onChange={(e) => {
                setFontFamily(e.target.value);
                editor.chain().focus().setFontFamily(e.target.value).run();
              }}
              className="bg-transparent border-0 text-white px-2 py-1 text-sm focus:outline-none"
            >
              <option value="Segoe UI">Segoe UI</option>
              <option value="Arial">Arial</option>
              <option value="Georgia">Georgia</option>
              <option value="Courier New">Courier New</option>
              <option value="Times New Roman">Times New Roman</option>
              <option value="Comic Sans MS">Comic Sans MS</option>
              <option value="Verdana">Verdana</option>
            </select>
          </div>

          {/* Font Size */}
          <div className="flex items-center gap-2 bg-neutral-700 rounded-lg px-2">
            <FaTextHeight className="text-neutral-400" />
            <select
              value={fontSize}
              onChange={(e) => {
                setFontSize(e.target.value);
                editor.chain().focus().setFontSize(e.target.value).run();
              }}
              className="bg-transparent border-0 text-white px-2 py-1 text-sm focus:outline-none"
            >
              <option value="12px">12</option>
              <option value="14px">14</option>
              <option value="16px">16</option>
              <option value="18px">18</option>
              <option value="20px">20</option>
              <option value="24px">24</option>
              <option value="32px">32</option>
              <option value="40px">40</option>
            </select>
          </div>

          <ToolbarDivider />

          {/* Text Formatting */}
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            active={editor.isActive("bold")}
            title="Bold"
          >
            <FaBold />
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            active={editor.isActive("italic")}
            title="Italic"
          >
            <FaItalic />
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            active={editor.isActive("underline")}
            title="Underline"
          >
            <FaUnderline />
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHighlight().run()}
            active={editor.isActive("highlight")}
            title="Highlight"
          >
            <FaHighlighter />
          </ToolbarButton>

          <ToolbarDivider />

          {/* Text Case */}
          <div className="relative group">
            <ToolbarButton title="Text Case">
              <TbLetterCaseToggle />
            </ToolbarButton>
            <div className="absolute left-0 mt-1 w-40 bg-neutral-800 border border-neutral-700 rounded-lg shadow-lg z-20 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
              <button 
                onClick={() => editor.chain().focus().setTextCase("uppercase").run()}
                className="block w-full text-left px-4 py-2 hover:bg-neutral-700"
              >
                UPPERCASE
              </button>
              <button 
                onClick={() => editor.chain().focus().setTextCase("lowercase").run()}
                className="block w-full text-left px-4 py-2 hover:bg-neutral-700"
              >
                lowercase
              </button>
              <button 
                onClick={() => editor.chain().focus().setTextCase("capitalize").run()}
                className="block w-full text-left px-4 py-2 hover:bg-neutral-700"
              >
                Capitalize
              </button>
              <button 
                onClick={() => editor.chain().focus().unsetTextCase().run()}
                className="block w-full text-left px-4 py-2 hover:bg-neutral-700"
              >
                Normal Case
              </button>
            </div>
          </div>

          {/* Color Picker */}
          <div className="flex items-center gap-2 bg-neutral-700 rounded-lg px-2 py-1">
            <label className="text-sm text-neutral-400 flex items-center gap-1">
              <MdFormatColorText /> Text:
            </label>
            <input
              type="color"
              value={color}
              onChange={(e) => {
                setColor(e.target.value);
                editor.chain().focus().setColor(e.target.value).run();
              }}
              className="w-6 h-6 border border-neutral-600 rounded cursor-pointer bg-transparent"
              title="Text Color"
            />
          </div>

          <div className="flex items-center gap-2 bg-neutral-700 rounded-lg px-2 py-1">
            <label className="text-sm text-neutral-400 flex items-center gap-1">
              <FaPalette /> BG:
            </label>
            <input
              type="color"
              value={bgColor}
              onChange={(e) => {
                setBgColor(e.target.value);
                editor.chain().focus().toggleHighlight({ color: e.target.value }).run();
              }}
              className="w-6 h-6 border border-neutral-600 rounded cursor-pointer bg-transparent"
              title="Background Color"
            />
          </div>

          <ToolbarDivider />

          {/* Headings */}
          <div className="relative group">
            <ToolbarButton title="Headings">
              <FaHeading />
            </ToolbarButton>
            <div className="absolute left-0 mt-1 w-40 bg-neutral-800 border border-neutral-700 rounded-lg shadow-lg z-20 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
              <button 
                onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                className="block w-full text-left px-4 py-2 hover:bg-neutral-700 flex items-center gap-2"
              >
                <BsTypeH1 /> Heading 1
              </button>
              <button 
                onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                className="block w-full text-left px-4 py-2 hover:bg-neutral-700 flex items-center gap-2"
              >
                <BsTypeH2 /> Heading 2
              </button>
              <button 
                onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                className="block w-full text-left px-4 py-2 hover:bg-neutral-700 flex items-center gap-2"
              >
                <BsTypeH3 /> Heading 3
              </button>
              <button 
                onClick={() => editor.chain().focus().setParagraph().run()}
                className="block w-full text-left px-4 py-2 hover:bg-neutral-700 flex items-center gap-2"
              >
                <MdOutlineTextFields /> Paragraph
              </button>
            </div>
          </div>

          {/* Lists */}
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            active={editor.isActive("bulletList")}
            title="Bullet List"
          >
            <FaListUl />
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            active={editor.isActive("orderedList")}
            title="Numbered List"
          >
            <FaListOl />
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleTaskList().run()}
            active={editor.isActive("taskList")}
            title="Task List"
          >
            <FaTasks />
          </ToolbarButton>

          <ToolbarDivider />

          {/* Alignment */}
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign("left").run()}
            active={editor.isActive({ textAlign: "left" })}
            title="Align Left"
          >
            <FaAlignLeft />
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign("center").run()}
            active={editor.isActive({ textAlign: "center" })}
            title="Align Center"
          >
            <FaAlignCenter />
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign("right").run()}
            active={editor.isActive({ textAlign: "right" })}
            title="Align Right"
          >
            <FaAlignRight />
          </ToolbarButton>

          <ToolbarDivider />

          {/* Insert Options */}
          <div className="relative group">
            <ToolbarButton  title="Insert">
              <FaPlus className="group-active:visible group-active:translate-y-0 group-active:opacity-100" />
            </ToolbarButton>
            <div className="absolute left-0 mt-1 w-48 bg-neutral-800 border border-neutral-700 rounded-lg shadow-lg z-20 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
              <button 
                onClick={() => setShowLinkModal(true)}
                className="block w-full text-left px-4 py-2 hover:bg-neutral-700 flex items-center gap-2"
              >
                <FaLink /> Insert Link
              </button>
              <button 
                onClick={() => setShowImageModal(true)}
                className="block w-full text-left px-4 py-2 hover:bg-neutral-700 flex items-center gap-2"
              >
                <FaImage /> Insert Image
              </button>
              <button 
                onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
                className="block w-full text-left px-4 py-2 hover:bg-neutral-700 flex items-center gap-2"
              >
                <FaTable /> Insert Table
              </button>
              <button 
                onClick={() => editor.chain().focus().toggleBlockquote().run()}
                className="block w-full text-left px-4 py-2 hover:bg-neutral-700 flex items-center gap-2"
              >
                <FaQuoteRight /> Blockquote
              </button>
              <button 
                onClick={() => editor.chain().focus().toggleCodeBlock().run()}
                className="block w-full text-left px-4 py-2 hover:bg-neutral-700 flex items-center gap-2"
              >
                <FaCode /> Code Block
              </button>
              <button 
                onClick={() => editor.chain().focus().insertContent({ type: "math", attrs: { latex: "E = mc^2" } }).run()}
                className="block w-full text-left px-4 py-2 hover:bg-neutral-700 flex items-center gap-2"
              >
                <BiMath /> Math Equation
              </button>
              <button 
                onClick={() => editor.chain().focus().toggleCollapsible().run()}
                className="block w-full text-left px-4 py-2 hover:bg-neutral-700 flex items-center gap-2"
              >
                <FaCaretSquareDown /> Collapsible Section
              </button>
            </div>
          </div>

          {/* Emoji Picker */}
          <div className="relative" ref={emojiPickerRef}>
            <ToolbarButton
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              title="Insert Emoji"
            >
              <FaSmile />
            </ToolbarButton>
            {showEmojiPicker && (
              <div className="absolute left-0 mt-1 z-50">
                <EmojiPicker onEmojiClick={onEmojiClick} />
              </div>
            )}
          </div>

          <ToolbarDivider />

          {/* History */}
          <ToolbarButton
            // onClick={() => editor.chain().focus().undo().run()}
            title="Undo"
          >
            <FaUndo />
          </ToolbarButton>

          <ToolbarButton
            // onClick={() => editor.chain().focus().redo().run()}
            title="Redo"
          >
            <FaRedo />
          </ToolbarButton>

          {/* More Options Toggle */}
          <ToolbarButton
            onClick={() => setShowMoreOptions(!showMoreOptions)}
            active={showMoreOptions}
            title="More Options"
          >
            <BsThreeDotsVertical />
          </ToolbarButton>
        </div>

        {/* Extended Toolbar */}
        {showMoreOptions && (
          <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-neutral-700">
            <ToolbarButton
              onClick={() => editor.chain().focus().setTextAlign("justify").run()}
              active={editor.isActive({ textAlign: "justify" })}
              title="Justify"
            >
              <FaAlignLeft className="rotate-90" />
            </ToolbarButton>

            <ToolbarButton
              onClick={() => editor.chain().focus().toggleCode().run()}
              active={editor.isActive("code")}
              title="Inline Code"
            >
              <BsCodeSquare />
            </ToolbarButton>

            <ToolbarButton
              onClick={() => editor.chain().focus().unsetAllMarks().run()}
              title="Clear Formatting"
            >
              <RiCharacterRecognitionLine />
            </ToolbarButton>

            <ToolbarButton
              onClick={() => editor.chain().focus().clearNodes().run()}
              title="Clear Nodes"
            >
              <MdCheckBoxOutlineBlank />
            </ToolbarButton>

            <ToolbarDivider />

            <ToolbarButton
              onClick={() => editor.chain().focus().setHorizontalRule().run()}
              title="Horizontal Line"
            >
              <BiCollapseVertical />
            </ToolbarButton>

            <ToolbarButton
              onClick={() => editor.chain().focus().setHardBreak().run()}
              title="Hard Break"
            >
              <BiExpandVertical />
            </ToolbarButton>
          </div>
        )}
      </div>

      {/* Editor Content */}
      <div className="max-w-5xl py-6 px-4">
        <EditorContent editor={editor} className="min-h-[500px] p-6 bg-neutral-800 rounded-lg border border-neutral-700" />
      </div>

      {/* Status Bar */}
      <div className="bg-neutral-800 border-t border-neutral-700 px-6 py-2 flex justify-between items-center text-sm text-neutral-400">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span>Words: {wordCount}</span>
            <span>Characters: {charCount}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${savedStatus === "saved" ? "bg-green-500" : savedStatus === "saving" ? "bg-yellow-500" : "bg-red-500"}`}></div>
            <span>
              {savedStatus === "saved" ? "All changes saved" : savedStatus === "saving" ? "Saving..." : "Unsaved changes"}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button className="text-purple-400 hover:text-purple-300 transition-colors">
            <FaSearch /> Find
          </button>
          <button className="text-purple-400 hover:text-purple-300 transition-colors">
            <FaEllipsisH /> More
          </button>
        </div>
      </div>

      {/* Link Modal */}
      {showLinkModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-neutral-800 p-6 rounded-lg w-96">
            <h3 className="text-lg font-semibold mb-4">Insert Link</h3>
            <input
              type="text"
              placeholder="Enter URL"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              className="w-full p-2 bg-neutral-700 border border-neutral-600 rounded mb-4"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowLinkModal(false)}
                className="px-4 py-2 bg-neutral-700 hover:bg-neutral-600 rounded transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={addLink}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded transition-colors"
              >
                Insert
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Modal */}
      {showImageModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-neutral-800 p-6 rounded-lg w-96">
            <h3 className="text-lg font-semibold mb-4">Insert Image</h3>
            <input
              type="text"
              placeholder="Enter image URL"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="w-full p-2 bg-neutral-700 border border-neutral-600 rounded mb-4"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowImageModal(false)}
                className="px-4 py-2 bg-neutral-700 hover:bg-neutral-600 rounded transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={addImage}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded transition-colors"
              >
                Insert
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotesEditor;