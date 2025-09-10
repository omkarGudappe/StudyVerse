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
import NotesTitle from "./SmallComponents/NotesTitle";
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
  FaStickyNote,
  FaSuperscript,
  FaSubscript,
  FaStrikethrough,
  FaIndent,
  FaOutdent,
  FaColumns
} from "react-icons/fa";
import { 
  BiMath, 
  BiCollapseVertical, 
  BiExpandVertical,
  BiReset
} from "react-icons/bi";
import { 
  BsTypeH1, 
  BsTypeH2, 
  BsTypeH3, 
  BsBlockquoteLeft, 
  BsCodeSquare,
  BsCardChecklist,
  BsEmojiSmile,
  BsThreeDotsVertical,
  BsJustify
} from "react-icons/bs";
import { 
  MdOutlineTextFields, 
  MdFormatColorText, 
  MdOutlineTableChart,
  MdOutlineCheckBoxOutlineBlank,
  MdCheckBoxOutlineBlank,
  MdHorizontalRule
} from "react-icons/md";
import { 
  TbMathFunction, 
  TbLetterCaseToggle,
  // TbColumnInsert,
  // TbRowInsert,
  TbTableExport,
  TbTableImport
} from "react-icons/tb";
import { 
  RiFileWord2Line, 
  RiCharacterRecognitionLine,
  RiMarkdownLine,
  RiDeleteColumn,
  RiDeleteRow
} from "react-icons/ri";
import { 
  AiOutlineLineHeight,
  AiOutlineClear
} from "react-icons/ai";
import EmojiPicker from "emoji-picker-react";
import "katex/dist/katex.min.css";
import StoreNotes from "../../StateManagement/StoreNotes";
import { LuCaseSensitive } from "react-icons/lu";

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

// Custom LineHeight extension
const LineHeight = TextStyle.extend({
  addAttributes() {
    return {
      lineHeight: {
        default: null,
        parseHTML: (element) => element.style.lineHeight,
        renderHTML: (attributes) => {
          if (!attributes.lineHeight) return {};
          return { style: `line-height: ${attributes.lineHeight}` };
        },
      },
    };
  },
});

const lowlight = createLowlight();

// Enhanced Table extension with better styling and controls
const CustomTable = Table.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      style: {
        default: null,
        parseHTML: element => element.getAttribute('style'),
        renderHTML: attributes => {
          return {
            style: `width: 100%; border-collapse: collapse; ${attributes.style || ''}`,
            class: 'custom-table'
          };
        },
      },
    };
  },

  addCommands() {
    return {
      ...this.parent?.(),
      addColumnBefore: () => ({ chain }) => {
        return chain()
          .command(({ tr, dispatch }) => {
            const { selection } = tr;
            const { $from, $to } = selection;
            const selectedCell = $from.nodeAfter;
            
            if (selectedCell) {
              if (dispatch) {
                const pos = $from.pos;
                tr.insert(pos + 1, selectedCell.type.create(selectedCell.attrs, selectedCell.content));
              }
            }
            return true;
          })
          .run();
      },
      addColumnAfter: () => ({ chain }) => {
        return chain()
          .command(({ tr, dispatch }) => {
            const { selection } = tr;
            const { $from, $to } = selection;
            const selectedCell = $from.nodeAfter;
            
            if (selectedCell) {
              if (dispatch) {
                const pos = $to.pos;
                tr.insert(pos, selectedCell.type.create(selectedCell.attrs, selectedCell.content));
              }
            }
            return true;
          })
          .run();
      },
      deleteColumn: () => ({ chain }) => {
        return chain()
          .command(({ tr, dispatch }) => {
            const { selection } = tr;
            const { $from, $to } = selection;
            
            if (dispatch) {
              tr.delete($from.pos, $to.pos);
            }
            return true;
          })
          .run();
      },
      addRowBefore: () => ({ chain }) => {
        return chain()
          .command(({ tr, dispatch }) => {
            // Implementation for adding row before
            return true;
          })
          .run();
      },
      addRowAfter: () => ({ chain }) => {
        return chain()
          .command(({ tr, dispatch }) => {
            // Implementation for adding row after
            return true;
          })
          .run();
      },
      deleteRow: () => ({ chain }) => {
        return chain()
          .command(({ tr, dispatch }) => {
            // Implementation for deleting row
            return true;
          })
          .run();
      },
      deleteTable: () => ({ chain }) => {
        return chain()
          .command(({ tr, dispatch }) => {
            const { selection } = tr;
            const { $from } = selection;
            
            for (let depth = $from.depth; depth > 0; depth--) {
              const node = $from.node(depth);
              if (node.type.name === this.name) {
                const start = $from.before(depth);
                const end = $from.after(depth);
                if (dispatch) {
                  tr.delete(start, end);
                }
                return true;
              }
            }
            return false;
          })
          .run();
      },
    };
  },
});

const NotesEditor = () => {
  const [color, setColor] = useState("#ffffff");
  const [bgColor, setBgColor] = useState("#fffd88");
  const [fontSize, setFontSize] = useState("16px");
  const [fontFamily, setFontFamily] = useState("Segoe UI");
  const [lineHeight, setLineHeight] = useState("1.5");
  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [savedStatus, setSavedStatus] = useState("saved");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkText, setLinkText] = useState("");
  const [showImageModal, setShowImageModal] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [imageAlt, setImageAlt] = useState("");
  const [showMathModal, setShowMathModal] = useState(false);
  const [mathLatex, setMathLatex] = useState("");
  const [showTableModal, setShowTableModal] = useState(false);
  const [tableRows, setTableRows] = useState(3);
  const [tableCols, setTableCols] = useState(3);
  const [tableHeader, setTableHeader] = useState(true);
  const [showTableControls, setShowTableControls] = useState(false);
  const emojiPickerRef = useRef(null);
  const editorRef = useRef(null);
  const { notes, isLoading } = StoreNotes();
  const [OpenNotesTitleModel, setOpenNotesTitleModel] = useState(false);
  
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

  // Custom Image extension with resizing
const ResizableImage = Image.extend({
  name: 'resizableImage',
  
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: '100%',
        parseHTML: element => {
          const width = element.getAttribute('width') || element.style.width;
          return width || '100%';
        },
        renderHTML: attributes => {
          return {
            width: attributes.width,
            style: `width: ${attributes.width}; max-width: 100%; height: auto;`,
          };
        },
      },
      height: {
        default: 'auto',
        parseHTML: element => {
          const height = element.getAttribute('height') || element.style.height;
          return height || 'auto';
        },
        renderHTML: attributes => {
          return {
            height: attributes.height,
            style: `height: ${attributes.height};`,
          };
        },
      },
      style: {
        default: null,
        parseHTML: element => element.getAttribute('style'),
        renderHTML: attributes => {
          return attributes.style ? { style: attributes.style } : {};
        },
      },
    };
  },

  addNodeView() {
    return ({ node, getPos, editor }) => {
      const dom = document.createElement('div');
      dom.className = 'image-resize-container';
      
      const img = document.createElement('img');
      img.src = node.attrs.src;
      img.alt = node.attrs.alt || '';
      img.style.width = node.attrs.width || '100%';
      img.style.height = node.attrs.height || 'auto';
      img.style.maxWidth = '100%';
      img.className = 'resizable-image';
      
      // Add resize handles
      const resizeHandle = document.createElement('div');
      resizeHandle.className = 'image-resize-handle';
      resizeHandle.innerHTML = '↔';
      resizeHandle.style.position = 'absolute';
      resizeHandle.style.right = '0';
      resizeHandle.style.bottom = '0';
      resizeHandle.style.background = '#9333ea';
      resizeHandle.style.color = 'white';
      resizeHandle.style.width = '16px';
      resizeHandle.style.height = '16px';
      resizeHandle.style.borderRadius = '4px';
      resizeHandle.style.cursor = 'nwse-resize';
      resizeHandle.style.display = 'flex';
      resizeHandle.style.alignItems = 'center';
      resizeHandle.style.justifyContent = 'center';
      resizeHandle.style.fontSize = '12px';
      
      dom.appendChild(img);
      dom.appendChild(resizeHandle);
      dom.style.position = 'relative';
      dom.style.display = 'inline-block';
      dom.style.maxWidth = '100%';
      
      // Resize functionality
      let startX, startWidth, startHeight;
      
      const onMouseMove = (e) => {
        const dx = e.clientX - startX;
        const newWidth = Math.max(50, startWidth + dx);
        img.style.width = `${newWidth}px`;
        img.style.height = 'auto';
      };
      
      const onMouseUp = () => {
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
        
        // Update the node attributes
        if (typeof getPos === 'function') {
          const transaction = editor.view.state.tr.setNodeMarkup(getPos(), undefined, {
            ...node.attrs,
            width: img.style.width,
            height: img.style.height,
          });
          editor.view.dispatch(transaction);
        }
      };
      
      resizeHandle.addEventListener('mousedown', (e) => {
        e.preventDefault();
        startX = e.clientX;
        startWidth = parseInt(img.style.width) || img.offsetWidth;
        startHeight = parseInt(img.style.height) || img.offsetHeight;
        
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
      });
      
      return {
        dom,
        contentDOM: img,
        update: (updatedNode) => {
          if (updatedNode.attrs.src !== node.attrs.src) {
            img.src = updatedNode.attrs.src;
          }
          if (updatedNode.attrs.alt !== node.attrs.alt) {
            img.alt = updatedNode.attrs.alt || '';
          }
          return true;
        },
      };
    };
  },
});

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
      LineHeight,
      Collapsible,
      TextAlign.configure({
        types: ["heading", "paragraph", "image"],
        alignments: ['left', 'center', 'right', 'justify'],
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
        // Add evaluation options if needed
        evaluation: true,
        addPasteHandler: true,
      }),
      Placeholder.configure({
        placeholder: "Start writing your notes here...",
      }),
      Link.configure({
        openOnClick: true,
        HTMLAttributes: {
          class: "text-purple-400 underline cursor-pointer",
        },
      }),
      ResizableImage.configure({
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
      
      // Check if cursor is in a table
      const { selection } = editor.state;
      const { $from } = selection;
      let inTable = false;
      for (let i = $from.depth; i > 0; i--) {
        if ($from.node(i).type.name === 'table') {
          inTable = true;
          break;
        }
      }
      setShowTableControls(inTable);
      
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
        style: `font-family: ${fontFamily}; font-size: ${fontSize}; line-height: ${lineHeight}`,
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

  // Add link with text support
  const addLink = () => {
    if (linkUrl) {
      if (linkText) {
        editor.chain().focus().setLink({ href: linkUrl }).insertContent(linkText).run();
      } else {
        editor.chain().focus().extendMarkRange('link').setLink({ href: linkUrl }).run();
      }
      setShowLinkModal(false);
      setLinkUrl("");
      setLinkText("");
    }
  };

 const addImage = () => {
  if (imageUrl) {
    editor.chain().focus().setImage({ 
      src: imageUrl, 
      alt: imageAlt,
      width: '100%',
      height: 'auto'
    }).run();
    setShowImageModal(false);
    setImageUrl("");
    setImageAlt("");
  }
};

  // Add math equation
  const addMathEquation = () => {
    if (mathLatex) {
      editor.chain().focus().insertContent({ 
        type: "math", 
        attrs: { latex: mathLatex } 
      }).run();
      setShowMathModal(false);
      setMathLatex("");
    }
  };

  // Add table with custom dimensions
  const addTable = () => {
    if (tableRows > 0 && tableCols > 0) {
      editor.chain().focus().insertTable({ 
        rows: tableRows, 
        cols: tableCols, 
        withHeaderRow: tableHeader 
      }).run();
      setShowTableModal(false);
    }
  };

  const onEmojiClick = (emojiData) => {
    editor.chain().focus().insertContent(emojiData.emoji).run();
    setShowEmojiPicker(false);
  };

  const exportAsMarkdown = () => {
    const content = editor.getHTML();
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
      <div className="bg-gradient-to-r from-purple-900 to-indigo-900 border-b border-purple-700 px-6 py-3 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <FaStickyNote className="text-yellow-300" /> StudyVerse Notes
          </h1>
          <p className="text-purple-200 text-sm">Your personal digital notebook</p>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-purple-200">
            {currentDate.toLocaleDateString()} {currentDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
          <div className="flex gap-2">
            <button 
              onClick={toggleFullscreen}
              className="p-2 rounded-lg bg-purple-700 hover:bg-purple-600 transition-colors text-white"
              title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
            >
              {isFullscreen ? <BiCollapseVertical /> : <BiExpandVertical />}
            </button>
            <button 
              onClick={()=> setOpenNotesTitleModel(!OpenNotesTitleModel) }
              className="p-2 rounded-lg flex justify-center items-center gap-2 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 transition-colors text-white"
              title="Save"
            >
              <FaSave />
              Save
            </button>
          </div>
        </div>
      </div>

      {/* Main Toolbar */}
      <div className="bg-neutral-800 border-b border-purple-700 px-4 py-2 sticky top-0 z-10">
        <div className="flex flex-wrap items-center gap-2">
          {/* Document Actions */}
          <div className="flex items-center gap-2 mr-2 ">
            <ToolbarButton title="Save" onClick={() => setSavedStatus("saving")}>
              <FaSave />
            </ToolbarButton>
            <div className="relative group">
              <ToolbarButton title="Export">
                <FaFileExport />
              </ToolbarButton>
              <div className="absolute left-0 mt-1 w-48 bg-neutral-800 border border-purple-600 rounded-lg shadow-lg z-20 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                <button 
                  onClick={exportAsMarkdown}
                  className="block w-full text-left px-4 py-2 hover:bg-purple-700 flex items-center gap-2"
                >
                  <RiMarkdownLine /> Export as Markdown
                </button>
                <button 
                  onClick={exportAsHTML}
                  className="block w-full text-left px-4 py-2 hover:bg-purple-700 flex items-center gap-2"
                >
                  <RiFileWord2Line /> Export as HTML
                </button>
                <button 
                  onClick={printDocument}
                  className="block w-full text-left px-4 py-2 hover:bg-purple-700 flex items-center gap-2"
                >
                  <FaPrint /> Print Document
                </button>
              </div>
            </div>
          </div>

          <ToolbarDivider />

          {/* Font Family */}
          <div className="flex items-center gap-2 bg-purple-700 rounded-lg px-2">
            <FaFont className="text-purple-200" />
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
              <option value="Montserrat">Montserrat</option>
              <option value="Roboto">Roboto</option>
            </select>
          </div>

          {/* Font Size */}
          <div className="flex items-center gap-2 bg-purple-700 rounded-lg px-2">
            <FaTextHeight className="text-purple-200" />
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
              <option value="48px">48</option>
            </select>
          </div>

          {/* Line Height */}
          <div className="flex items-center gap-2 bg-purple-700 rounded-lg px-2">
            <AiOutlineLineHeight className="text-purple-200" />
            <select
              value={lineHeight}
              onChange={(e) => {
                setLineHeight(e.target.value);
                editor.chain().focus().setLineHeight(e.target.value).run();
              }}
              className="bg-transparent border-0 text-white px-2 py-1 text-sm focus:outline-none"
            >
              <option value="1">1.0</option>
              <option value="1.2">1.2</option>
              <option value="1.5">1.5</option>
              <option value="1.8">1.8</option>
              <option value="2">2.0</option>
              <option value="2.5">2.5</option>
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
            onClick={() => editor.chain().focus().toggleStrike().run()}
            active={editor.isActive("strike")}
            title="Strikethrough"
          >
            <FaStrikethrough />
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHighlight().run()}
            active={editor.isActive("highlight")}
            title="Highlight"
          >
            <FaHighlighter />
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleSuperscript().run()}
            active={editor.isActive("superscript")}
            title="Superscript"
          >
            <FaSuperscript />
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleSubscript().run()}
            active={editor.isActive("subscript")}
            title="Subscript"
          >
            <FaSubscript />
          </ToolbarButton>

          <ToolbarDivider />

          <div className="relative group">
            <ToolbarButton title="Text Case">
              <TbLetterCaseToggle />
            </ToolbarButton>
            <div className="absolute left-0 mt-1 w-48 bg-neutral-800 border border-purple-600 rounded-lg shadow-lg z-20 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
              <button 
                onClick={() => editor.chain().focus().setTextCase("uppercase").run()}
                className="block w-full text-left px-4 py-2 hover:bg-purple-700 flex items-center gap-2"
              >
                <LuCaseSensitive /> UPPERCASE
              </button>
              <button 
                onClick={() => editor.chain().focus().setTextCase("lowercase").run()}
                className="block w-full text-left px-4 py-2 hover:bg-purple-700 flex items-center gap-2"
              >
                <LuCaseSensitive /> lowercase
              </button>
              <button 
                onClick={() => editor.chain().focus().setTextCase("capitalize").run()}
                className="block w-full text-left px-4 py-2 hover:bg-purple-700 flex items-center gap-2"
              >
                <LuCaseSensitive /> Capitalize
              </button>
              <button 
                onClick={() => editor.chain().focus().unsetTextCase().run()}
                className="block w-full text-left px-4 py-2 hover:bg-purple-700 flex items-center gap-2"
              >
                <BiReset /> Normal Case
              </button>
            </div>
          </div>

          {/* Color Picker */}
          <div className="flex items-center gap-2 bg-purple-700 rounded-lg px-2 py-1">
            <label className="text-sm text-purple-200 flex items-center gap-1">
              <MdFormatColorText /> Text:
            </label>
            <input
              type="color"
              value={color}
              onChange={(e) => {
                setColor(e.target.value);
                editor.chain().focus().setColor(e.target.value).run();
              }}
              className="w-6 h-6 border border-purple-600 rounded cursor-pointer bg-transparent"
              title="Text Color"
            />
          </div>

          <div className="flex items-center gap-2 bg-purple-700 rounded-lg px-2 py-1">
            <label className="text-sm text-purple-200 flex items-center gap-1">
              <FaPalette /> Bg:
            </label>
            <input
              type="color"
              value={bgColor}
              onChange={(e) => {
                setBgColor(e.target.value);
                editor.chain().focus().toggleHighlight({ color: e.target.value }).run();
              }}
              className="w-6 h-6 border border-purple-600 rounded cursor-pointer bg-transparent"
              title="Background Color"
            />
          </div>

          <ToolbarDivider />

          {/* Headings */}
          <div className="flex items-center gap-1">
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
              active={editor.isActive("heading", { level: 1 })}
              title="Heading 1"
            >
              <BsTypeH1 />
            </ToolbarButton>

            <ToolbarButton
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              active={editor.isActive("heading", { level: 2 })}
              title="Heading 2"
            >
              <BsTypeH2 />
            </ToolbarButton>

            <ToolbarButton
              onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
              active={editor.isActive("heading", { level: 3 })}
              title="Heading 3"
            >
              <BsTypeH3 />
            </ToolbarButton>
          </div>

          <ToolbarDivider />

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

          <ToolbarButton
            onClick={() => editor.chain().focus().sinkListItem("listItem").run()}
            disabled={!editor.can().sinkListItem("listItem")}
            title="Indent List Item"
          >
            <FaIndent />
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().liftListItem("listItem").run()}
            disabled={!editor.can().liftListItem("listItem")}
            title="Outdent List Item"
          >
            <FaOutdent />
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

          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign("justify").run()}
            active={editor.isActive({ textAlign: "justify" })}
            title="Justify"
          >
            <BsJustify />
          </ToolbarButton>

          <ToolbarDivider />

          {/* Block Elements */}
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            active={editor.isActive("blockquote")}
            title="Blockquote"
          >
            <BsBlockquoteLeft />
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            active={editor.isActive("codeBlock")}
            title="Code Block"
          >
            <BsCodeSquare />
          </ToolbarButton>

          <ToolbarButton
            onClick={() => setShowMathModal(true)}
            title="Insert Math Equation"
          >
            <TbMathFunction />
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            title="Insert Horizontal Line"
          >
            <MdHorizontalRule />
          </ToolbarButton>

          <ToolbarDivider />

          {/* Insert Elements */}
          <ToolbarButton
            onClick={() => setShowLinkModal(true)}
            title="Insert Link"
          >
            <FaLink />
          </ToolbarButton>

          <ToolbarButton
            onClick={() => setShowImageModal(true)}
            title="Insert Image"
          >
            <FaImage />
          </ToolbarButton>

          <ToolbarButton
            onClick={() => setShowTableModal(true)}
            title="Insert Table"
          >
            <FaTable />
          </ToolbarButton>

          <div className="relative" ref={emojiPickerRef}>
            <ToolbarButton
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              title="Insert Emoji"
            >
              <BsEmojiSmile />
            </ToolbarButton>
            {showEmojiPicker && (
              <div className="absolute left-0 z-50 mt-1">
                <EmojiPicker onEmojiClick={onEmojiClick} />
              </div>
            )}
          </div>

          <ToolbarDivider />

          {/* Undo/Redo */}
          <ToolbarButton
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            title="Undo"
          >
            <FaUndo />
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            title="Redo"
          >
            <FaRedo />
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}
            title="Clear Formatting"
          >
            <AiOutlineClear />
          </ToolbarButton>

          {/* More Options */}
          <div className="relative group">
            <ToolbarButton
              onClick={() => setShowMoreOptions(!showMoreOptions)}
              title="More Options"
            >
              <BsThreeDotsVertical />
            </ToolbarButton>
            {showMoreOptions && (
              <div className="absolute left-0 mt-1 w-48 bg-neutral-800 border border-purple-600 rounded-lg shadow-lg z-20">
                <button 
                  onClick={() => editor.chain().focus().toggleCollapsible().run()}
                  className="block w-full text-left px-4 py-2 hover:bg-purple-700 flex items-center gap-2"
                >
                  <FaCaretSquareDown /> Collapsible Section
                </button>
                <button 
                  onClick={() => editor.chain().focus().insertContent("@").run()}
                  className="block w-full text-left px-4 py-2 hover:bg-purple-700 flex items-center gap-2"
                >
                  <RiCharacterRecognitionLine /> Mention
                </button>
                <button 
                  onClick={() => editor.chain().focus().setHardBreak().run()}
                  className="block w-full text-left px-4 py-2 hover:bg-purple-700 flex items-center gap-2"
                >
                  <BiCollapseVertical /> Line Break
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Table Controls (shown when inside a table) */}
        {showTableControls && (
          <div className="flex items-center gap-2 mt-2 pt-2 border-t border-purple-700">
            <span className="text-sm text-purple-200">Table Tools:</span>
            <ToolbarButton
              onClick={() => editor.chain().focus().addColumnBefore().run()}
              title="Add Column Before"
            >
              {/* <TbColumnInsert /> */}
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().addColumnAfter().run()}
              title="Add Column After"
            >
              {/* <TbColumnInsert className="rotate-180" /> */}
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().deleteColumn().run()}
              title="Delete Column"
            >
              <RiDeleteColumn />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().addRowBefore().run()}
              title="Add Row Before"
            >
              {/* <TbRowInsert /> */}
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().addRowAfter().run()}
              title="Add Row After"
            >
              {/* <TbRowInsert className="rotate-180" /> */}
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().deleteRow().run()}
              title="Delete Row"
            >
              <RiDeleteRow />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().deleteTable().run()}
              title="Delete Table"
            >
              <TbTableExport />
            </ToolbarButton>
          </div>
        )}
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6">
        <EditorContent editor={editor} className="min-h-[70vh]" />
      </div>

      {showLinkModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-neutral-800 p-6 rounded-lg w-96 border border-purple-600">
            <h3 className="text-xl font-bold mb-4 text-white">Insert Link</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-purple-200 mb-1">URL</label>
                <input
                  type="url"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="w-full p-2 bg-neutral-700 border border-purple-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm text-purple-200 mb-1">Text (optional)</label>
                <input
                  type="text"
                  value={linkText}
                  onChange={(e) => setLinkText(e.target.value)}
                  placeholder="Link text"
                  className="w-full p-2 bg-neutral-700 border border-purple-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowLinkModal(false)}
                  className="px-4 py-2 bg-neutral-700 text-white rounded hover:bg-neutral-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={addLink}
                  className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-500 transition-colors"
                >
                  Insert Link
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Image Modal */}
      {showImageModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-neutral-800 p-6 rounded-lg w-96 border border-purple-600">
            <h3 className="text-xl font-bold mb-4 text-white">Insert Image</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-purple-200 mb-1">Image URL</label>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  className="w-full p-2 bg-neutral-700 border border-purple-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm text-purple-200 mb-1">Alt Text</label>
                <input
                  type="text"
                  value={imageAlt}
                  onChange={(e) => setImageAlt(e.target.value)}
                  placeholder="Description of the image"
                  className="w-full p-2 bg-neutral-700 border border-purple-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowImageModal(false)}
                  className="px-4 py-2 bg-neutral-700 text-white rounded hover:bg-neutral-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={addImage}
                  className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-500 transition-colors"
                >
                  Insert Image
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Math Modal */}
      {showMathModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-neutral-800 p-6 rounded-lg w-96 border border-purple-600">
            <h3 className="text-xl font-bold mb-4 text-white">Insert Math Equation</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-purple-200 mb-1">LaTeX Equation</label>
                <textarea
                  value={mathLatex}
                  onChange={(e) => setMathLatex(e.target.value)}
                  placeholder="E = mc^2"
                  rows={3}
                  className="w-full p-2 bg-neutral-700 border border-purple-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowMathModal(false)}
                  className="px-4 py-2 bg-neutral-700 text-white rounded hover:bg-neutral-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={addMathEquation}
                  className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-500 transition-colors"
                >
                  Insert Equation
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Table Modal */}
      {showTableModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-neutral-800 p-6 rounded-lg w-96 border border-purple-600">
            <h3 className="text-xl font-bold mb-4 text-white">Insert Table</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-purple-200 mb-1">Rows</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={tableRows}
                    onChange={(e) => setTableRows(parseInt(e.target.value))}
                    className="w-full p-2 bg-neutral-700 border border-purple-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-purple-200 mb-1">Columns</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={tableCols}
                    onChange={(e) => setTableCols(parseInt(e.target.value))}
                    className="w-full p-2 bg-neutral-700 border border-purple-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="tableHeader"
                  checked={tableHeader}
                  onChange={(e) => setTableHeader(e.target.checked)}
                  className="w-4 h-4 text-purple-600 bg-neutral-700 border-purple-600 rounded focus:ring-purple-500"
                />
                <label htmlFor="tableHeader" className="text-sm text-purple-200">
                  Include header row
                </label>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowTableModal(false)}
                  className="px-4 py-2 bg-neutral-700 text-white rounded hover:bg-neutral-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={addTable}
                  className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-500 transition-colors"
                >
                  Insert Table
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notes Title Modal */}
      {OpenNotesTitleModel && (
        <NotesTitle  open={setOpenNotesTitleModel} onClose={() => setOpenNotesTitleModel(!OpenNotesTitleModel)} editor={editor} />
      )}
    </div>
  );
};

export default NotesEditor;