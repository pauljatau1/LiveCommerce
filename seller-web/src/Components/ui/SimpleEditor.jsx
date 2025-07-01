import { useEditor, EditorContent, BubbleMenu } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import Typography from '@tiptap/extension-typography'
import { memo, useEffect, useState, useCallback, useRef } from 'react'
import PropTypes from 'prop-types'
import { 
  Bold, 
  Italic, 
  Underline as UnderlineIcon,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Undo,
  Redo,
  AlertTriangle
} from 'lucide-react'

// Link detection regex patterns
const URL_PATTERNS = [
  // HTTP/HTTPS URLs
  /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)/gi,
  // www. URLs
  /www\.[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)/gi,
  // Domain.extension patterns
  /\b[a-zA-Z0-9][-a-zA-Z0-9]*[a-zA-Z0-9]*\.(com|org|net|edu|gov|mil|int|co|uk|ca|au|de|fr|jp|cn|in|br|ru|it|es|nl|se|no|dk|fi|pl|be|ch|at|cz|hu|ro|bg|hr|si|sk|lt|lv|ee|ie|pt|gr|is|lu|mt|cy|tr|il|za|ng|ke|gh|ug|tz|mw|zm|zw|bw|sz|ls|na|ao|mz|mg|mu|sc|km|dj|so|er|et|sd|ly|eg|ma|tn|dz|mr|ml|bf|ne|td|cf|cm|gq|ga|cg|cd|st|gw|gn|sl|lr|ci|gh|tg|bj|sn|gm|cv|mr|eh)\b/gi,
  // Email patterns (which could be used as links)
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/gi,
  // IP addresses
  /\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b/gi
]

const SimpleEditor = memo(({ value, onChange, placeholder, className, onLinkDetected }) => {
  const [linkWarning, setLinkWarning] = useState(false)
  const [detectedLinks, setDetectedLinks] = useState([])

  // Keep stable refs for callback props to avoid effect re-runs on every render
  const onChangeRef = useRef(onChange)
  const onLinkDetectedRef = useRef(onLinkDetected)

  // Update refs when callbacks change
  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  useEffect(() => {
    onLinkDetectedRef.current = onLinkDetected
  }, [onLinkDetected])

  // Function to detect links in text
  const detectLinks = useCallback((text) => {
    if (!text) return { hasLinks: false, links: [] }
    
    // Remove HTML tags to check plain text
    const plainText = text.replace(/<[^>]*>/g, ' ')
    const foundLinks = []
    
    URL_PATTERNS.forEach(pattern => {
      const matches = plainText.match(pattern)
      if (matches) {
        foundLinks.push(...matches)
      }
    })
    
    return {
      hasLinks: foundLinks.length > 0,
      links: [...new Set(foundLinks)] // Remove duplicates
    }
  }, [])

  // Function to remove links from content
  const removeLinkFromContent = useCallback((content, linkToRemove) => {
    let cleanContent = content
    URL_PATTERNS.forEach(pattern => {
      cleanContent = cleanContent.replace(pattern, (match) => {
        if (match === linkToRemove) {
          return '[LINK REMOVED]'
        }
        return match
      })
    })
    return cleanContent
  }, []);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
        bulletList: {
          keepMarks: true,
          keepAttributes: false,
          HTMLAttributes: {
            class: 'list-disc list-outside',
          },
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: false,
          HTMLAttributes: {
            class: 'list-decimal list-outside',
          },
        },
        listItem: {
          HTMLAttributes: {
            class: 'my-1',
          },
        },
      }),
      Placeholder.configure({
        placeholder: placeholder || 'Write something amazing...',
      }),
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Typography,
    ],
    content: value || '',
    onUpdate: ({ editor }) => {
      const html = editor.getHTML()
      const content = html === '<p></p>' ? '' : html
      
      // Detect links in the content
      const linkCheck = detectLinks(content)
      
      if (linkCheck.hasLinks) {
        setLinkWarning(true)
        setDetectedLinks(linkCheck.links)
        
        // Call parent callback if provided
        if (onLinkDetectedRef.current) {
          onLinkDetectedRef.current(true, linkCheck.links)
        }
        
        // Auto-remove links after a short delay to allow user to see the warning
        setTimeout(() => {
          let cleanContent = content
          linkCheck.links.forEach(link => {
            cleanContent = removeLinkFromContent(cleanContent, link)
          })
          
          if (cleanContent !== content) {
            editor.commands.setContent(cleanContent)
            if (onChangeRef.current) {
              onChangeRef.current(cleanContent)
            }
          }
        }, 2000) // 2 second delay to show warning
        
      } else {
        setLinkWarning(false)
        setDetectedLinks([])
        
        if (onLinkDetectedRef.current) {
          onLinkDetectedRef.current(false, [])
        }
      }
      
      if (onChangeRef.current) {
        onChangeRef.current(content)
      }
    },
    editorProps: {
      attributes: {
        class: 'focus:outline-none min-h-[200px] p-4',
      },
      handlePaste: (view, event) => {
        const clipboardData = event.clipboardData || window.clipboardData
        const pastedData = clipboardData.getData('text/plain')
        
        // Check if pasted content contains links
        const linkCheck = detectLinks(pastedData)
        if (linkCheck.hasLinks) {
          event.preventDefault()
          setLinkWarning(true)
          setDetectedLinks(linkCheck.links)
          
          // Show warning for longer on paste
          setTimeout(() => {
            setLinkWarning(false)
            setDetectedLinks([])
          }, 5000)
          
          return true // Prevent default paste behavior
        }
        
        return false // Allow normal paste
      },
    },
  })

  // Update editor content when value prop changes
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value || '')
      
      // Also check for links in the incoming value
      if (value) {
        const linkCheck = detectLinks(value)
        if (linkCheck.hasLinks) {
          setLinkWarning(true)
          setDetectedLinks(linkCheck.links)
          
          // Call parent callback immediately to prevent submission
          if (onLinkDetectedRef.current) {
            onLinkDetectedRef.current(true, linkCheck.links)
          }
          
          // Auto-remove links after showing warning, but keep the parent notified
          setTimeout(() => {
            let cleanContent = value
            linkCheck.links.forEach(link => {
              cleanContent = removeLinkFromContent(cleanContent, link)
            })
            
            if (cleanContent !== value) {
              editor.commands.setContent(cleanContent)
              if (onChangeRef.current) {
                onChangeRef.current(cleanContent)
              }
              
              // Re-check for any remaining links after cleanup
              const recheckLinks = detectLinks(cleanContent)
              if (onLinkDetectedRef.current) {
                onLinkDetectedRef.current(recheckLinks.hasLinks, recheckLinks.links)
              }
            }
          }, 5000) // 5 second delay for initial load to ensure user sees warning
          
        } else {
          setLinkWarning(false)
          setDetectedLinks([])
          
          if (onLinkDetectedRef.current) {
            onLinkDetectedRef.current(false, [])
          }
        }
      }
    }
  }, [editor, value, detectLinks, removeLinkFromContent])

  // Auto-hide warning after 5 seconds
  useEffect(() => {
    if (linkWarning) {
      const timer = setTimeout(() => {
        setLinkWarning(false)
        setDetectedLinks([])
      }, 5000)
      
      return () => clearTimeout(timer)
    }
  }, [linkWarning])

  if (!editor) {
    return (
      <div className={`border border-gray-300 rounded-lg ${className || ''}`}>
        <div className="animate-pulse bg-gray-100 h-[200px] rounded-lg" />
      </div>
    )
  }

  return (
    <div className={`border border-gray-300 rounded-lg overflow-hidden ${className || ''}`}>
      {/* Link Warning Banner */}
      {linkWarning && (
        <div className="bg-red-50 border-b border-red-200 p-3">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h4 className="text-sm font-medium text-red-800">Links Not Allowed</h4>
              <p className="text-sm text-red-700 mt-1">
                Links are not permitted in product descriptions for security reasons. 
                {detectedLinks.length > 0 && (
                  <>
                    <br />
                    <span className="font-medium">Detected: </span>
                    {detectedLinks.join(', ')}
                  </>
                )}
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-2 border-b border-gray-200 bg-gray-50">
        {/* Text Formatting */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`p-2 rounded hover:bg-gray-200 ${
              editor.isActive('bold') ? 'bg-gray-300' : ''
            }`}
            type="button"
          >
            <Bold size={16} />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`p-2 rounded hover:bg-gray-200 ${
              editor.isActive('italic') ? 'bg-gray-300' : ''
            }`}
            type="button"
          >
            <Italic size={16} />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={`p-2 rounded hover:bg-gray-200 ${
              editor.isActive('underline') ? 'bg-gray-300' : ''
            }`}
            type="button"
          >
            <UnderlineIcon size={16} />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={`p-2 rounded hover:bg-gray-200 ${
              editor.isActive('strike') ? 'bg-gray-300' : ''
            }`}
            type="button"
          >
            <Strikethrough size={16} />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleCode().run()}
            className={`p-2 rounded hover:bg-gray-200 ${
              editor.isActive('code') ? 'bg-gray-300' : ''
            }`}
            type="button"
          >
            <Code size={16} />
          </button>
        </div>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        {/* Headings */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => editor.chain().focus().clearNodes().run()}
            className={`p-2 rounded hover:bg-gray-200 ${
              !editor.isActive('heading') ? 'bg-gray-300' : ''
            }`}
            type="button"
            title="Paragraph"
          >
            P
          </button>
          <button
            onClick={() => {
              if (editor.isActive('heading', { level: 1 })) {
                editor.chain().focus().clearNodes().run()
              } else {
                editor.chain().focus().setHeading({ level: 1 }).run()
              }
            }}
            className={`p-2 rounded hover:bg-gray-200 ${
              editor.isActive('heading', { level: 1 }) ? 'bg-gray-300' : ''
            }`}
            type="button"
          >
            <Heading1 size={16} />
          </button>
          <button
            onClick={() => {
              if (editor.isActive('heading', { level: 2 })) {
                editor.chain().focus().clearNodes().run()
              } else {
                editor.chain().focus().setHeading({ level: 2 }).run()
              }
            }}
            className={`p-2 rounded hover:bg-gray-200 ${
              editor.isActive('heading', { level: 2 }) ? 'bg-gray-300' : ''
            }`}
            type="button"
          >
            <Heading2 size={16} />
          </button>
          <button
            onClick={() => {
              if (editor.isActive('heading', { level: 3 })) {
                editor.chain().focus().clearNodes().run()
              } else {
                editor.chain().focus().setHeading({ level: 3 }).run()
              }
            }}
            className={`p-2 rounded hover:bg-gray-200 ${
              editor.isActive('heading', { level: 3 }) ? 'bg-gray-300' : ''
            }`}
            type="button"
          >
            <Heading3 size={16} />
          </button>
        </div>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        {/* Text Alignment */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
            className={`p-2 rounded hover:bg-gray-200 ${
              editor.isActive({ textAlign: 'left' }) ? 'bg-gray-300' : ''
            }`}
            type="button"
          >
            <AlignLeft size={16} />
          </button>
          <button
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
            className={`p-2 rounded hover:bg-gray-200 ${
              editor.isActive({ textAlign: 'center' }) ? 'bg-gray-300' : ''
            }`}
            type="button"
          >
            <AlignCenter size={16} />
          </button>
          <button
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
            className={`p-2 rounded hover:bg-gray-200 ${
              editor.isActive({ textAlign: 'right' }) ? 'bg-gray-300' : ''
            }`}
            type="button"
          >
            <AlignRight size={16} />
          </button>
          <button
            onClick={() => editor.chain().focus().setTextAlign('justify').run()}
            className={`p-2 rounded hover:bg-gray-200 ${
              editor.isActive({ textAlign: 'justify' }) ? 'bg-gray-300' : ''
            }`}
            type="button"
          >
            <AlignJustify size={16} />
          </button>
        </div>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        {/* Lists */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`p-2 rounded hover:bg-gray-200 ${
              editor.isActive('bulletList') ? 'bg-gray-300' : ''
            }`}
            type="button"
          >
            <List size={16} />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`p-2 rounded hover:bg-gray-200 ${
              editor.isActive('orderedList') ? 'bg-gray-300' : ''
            }`}
            type="button"
          >
            <ListOrdered size={16} />
          </button>
        </div>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        {/* Undo/Redo */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().chain().focus().undo().run()}
            className="p-2 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
            type="button"
          >
            <Undo size={16} />
          </button>
          <button
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().chain().focus().redo().run()}
            className="p-2 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
            type="button"
          >
            <Redo size={16} />
          </button>
        </div>
      </div>

      {/* Editor Content */}
      <div className="relative">
        <EditorContent editor={editor} />
        
        {/* Custom CSS for TipTap editor content */}
        <style dangerouslySetInnerHTML={{
          __html: `
            .ProseMirror {
              outline: none !important;
            }
            .ProseMirror h1 {
              font-size: 2rem !important;
              font-weight: 700 !important;
              line-height: 1.25 !important;
              margin: 1rem 0 0.5rem 0 !important;
            }
            .ProseMirror h2 {
              font-size: 1.5rem !important;
              font-weight: 600 !important;
              line-height: 1.3 !important;
              margin: 0.75rem 0 0.5rem 0 !important;
            }
            .ProseMirror h3 {
              font-size: 1.25rem !important;
              font-weight: 600 !important;
              line-height: 1.4 !important;
              margin: 0.5rem 0 0.25rem 0 !important;
            }
            .ProseMirror p {
              margin: 0.5rem 0 !important;
              line-height: 1.6 !important;
            }
                         .ProseMirror ul {
               list-style-type: disc !important;
               list-style-position: outside !important;
               margin: 0.5rem 0 !important;
               padding-left: 1.5rem !important;
             }
             .ProseMirror ol {
               list-style-type: decimal !important;
               list-style-position: outside !important;
               margin: 0.5rem 0 !important;
               padding-left: 1.5rem !important;
             }
             .ProseMirror li {
               margin: 0.25rem 0 !important;
               line-height: 1.5 !important;
               display: list-item !important;
             }
            
            .ProseMirror blockquote {
              border-left: 4px solid #e5e7eb !important;
              padding-left: 1rem !important;
              margin: 1rem 0 !important;
              font-style: italic !important;
              color: #6b7280 !important;
            }
            .ProseMirror code {
              background-color: #f3f4f6 !important;
              padding: 0.125rem 0.25rem !important;
              border-radius: 0.25rem !important;
              font-family: monospace !important;
              font-size: 0.875rem !important;
            }
            .ProseMirror strong {
              font-weight: 700 !important;
            }
            .ProseMirror em {
              font-style: italic !important;
            }
            .ProseMirror u {
              text-decoration: underline !important;
            }
            .ProseMirror s {
              text-decoration: line-through !important;
            }
            .ProseMirror hr {
              border: none !important;
              border-top: 2px solid #e5e7eb !important;
              margin: 1.5rem 0 !important;
            }
          `
        }} />
        
        {/* Bubble Menu */}
        <BubbleMenu 
          editor={editor} 
          tippyOptions={{ duration: 100 }}
          className="flex items-center gap-1 p-2 bg-black text-white rounded-lg shadow-lg"
        >
          <button
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`p-1 rounded hover:bg-gray-700 ${
              editor.isActive('bold') ? 'bg-gray-600' : ''
            }`}
            type="button"
          >
            <Bold size={14} />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`p-1 rounded hover:bg-gray-700 ${
              editor.isActive('italic') ? 'bg-gray-600' : ''
            }`}
            type="button"
          >
            <Italic size={14} />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={`p-1 rounded hover:bg-gray-700 ${
              editor.isActive('underline') ? 'bg-gray-600' : ''
            }`}
            type="button"
          >
            <UnderlineIcon size={14} />
          </button>
        </BubbleMenu>
      </div>
    </div>
  )
})

SimpleEditor.displayName = 'SimpleEditor'

SimpleEditor.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  className: PropTypes.string,
  onLinkDetected: PropTypes.func,
}

export default SimpleEditor 