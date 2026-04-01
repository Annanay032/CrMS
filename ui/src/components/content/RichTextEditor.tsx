import { useState, useCallback, useRef, useEffect } from 'react';
import { Button, Space, Tooltip } from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBold, faItalic, faStrikethrough, faListUl, faListOl,
  faQuoteLeft, faLink, faUndo, faRedo,
} from '@fortawesome/free-solid-svg-icons';

interface RichTextEditorProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  rows?: number;
  maxLength?: number;
  disabled?: boolean;
}

/**
 * Rich text editor for post captions.
 * Uses contentEditable for formatting support — serializes to Markdown-like syntax
 * compatible with social platforms that support rich text (Threads, Bluesky, LinkedIn).
 */
export function RichTextEditor({
  value = '',
  onChange,
  placeholder = 'Write your caption...',
  rows = 6,
  maxLength,
  disabled = false,
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [plainTextLength, setPlainTextLength] = useState(0);

  useEffect(() => {
    if (editorRef.current && !editorRef.current.innerHTML && value) {
      editorRef.current.innerHTML = markdownToHtml(value);
      setPlainTextLength(editorRef.current.innerText.length);
    }
  }, [value]);

  const handleInput = useCallback(() => {
    if (!editorRef.current) return;
    const text = editorRef.current.innerText;
    setPlainTextLength(text.length);
    const md = htmlToMarkdown(editorRef.current.innerHTML);
    onChange?.(md);
  }, [onChange]);

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    handleInput();
  };

  const insertLink = () => {
    const url = window.prompt('Enter URL:');
    if (url) {
      // Basic URL validation
      try {
        new URL(url);
        execCommand('createLink', url);
      } catch {
        // Invalid URL, ignore
      }
    }
  };

  const toolbarItems = [
    { icon: faBold, command: 'bold', tooltip: 'Bold (Ctrl+B)' },
    { icon: faItalic, command: 'italic', tooltip: 'Italic (Ctrl+I)' },
    { icon: faStrikethrough, command: 'strikeThrough', tooltip: 'Strikethrough' },
    { icon: faListUl, command: 'insertUnorderedList', tooltip: 'Bullet List' },
    { icon: faListOl, command: 'insertOrderedList', tooltip: 'Numbered List' },
    { icon: faQuoteLeft, command: 'formatBlock', tooltip: 'Quote', value: 'blockquote' },
  ];

  return (
    <div style={{
      border: '1px solid #d9d9d9',
      borderRadius: 8,
      overflow: 'hidden',
      opacity: disabled ? 0.5 : 1,
    }}>
      {/* Toolbar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        padding: '4px 8px',
        borderBottom: '1px solid #f0f0f0',
        background: '#fafafa',
      }}>
        {toolbarItems.map(({ icon, command, tooltip, value }) => (
          <Tooltip key={command} title={tooltip}>
            <Button
              type="text"
              size="small"
              disabled={disabled}
              icon={<FontAwesomeIcon icon={icon} style={{ fontSize: 12 }} />}
              onClick={() => execCommand(command, value)}
              style={{ minWidth: 28, height: 28 }}
            />
          </Tooltip>
        ))}
        <Tooltip title="Insert Link">
          <Button
            type="text"
            size="small"
            disabled={disabled}
            icon={<FontAwesomeIcon icon={faLink} style={{ fontSize: 12 }} />}
            onClick={insertLink}
            style={{ minWidth: 28, height: 28 }}
          />
        </Tooltip>

        <div style={{ flex: 1 }} />

        <Space size={2}>
          <Button
            type="text"
            size="small"
            disabled={disabled}
            icon={<FontAwesomeIcon icon={faUndo} style={{ fontSize: 12 }} />}
            onClick={() => execCommand('undo')}
          />
          <Button
            type="text"
            size="small"
            disabled={disabled}
            icon={<FontAwesomeIcon icon={faRedo} style={{ fontSize: 12 }} />}
            onClick={() => execCommand('redo')}
          />
        </Space>

        {maxLength && (
          <span style={{
            fontSize: 11,
            color: plainTextLength > maxLength ? '#ef4444' : plainTextLength > maxLength * 0.9 ? '#f59e0b' : '#94a3b8',
            marginLeft: 8,
          }}>
            {plainTextLength} / {maxLength}
          </span>
        )}
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable={!disabled}
        onInput={handleInput}
        data-placeholder={placeholder}
        style={{
          minHeight: rows * 24,
          padding: '12px 16px',
          outline: 'none',
          fontSize: 14,
          lineHeight: 1.6,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }}
        suppressContentEditableWarning
      />
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────

function markdownToHtml(md: string): string {
  return md
    .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
    .replace(/\*(.*?)\*/g, '<i>$1</i>')
    .replace(/~~(.*?)~~/g, '<s>$1</s>')
    .replace(/\n/g, '<br>');
}

function htmlToMarkdown(html: string): string {
  return html
    .replace(/<b>(.*?)<\/b>/gi, '**$1**')
    .replace(/<strong>(.*?)<\/strong>/gi, '**$1**')
    .replace(/<i>(.*?)<\/i>/gi, '*$1*')
    .replace(/<em>(.*?)<\/em>/gi, '*$1*')
    .replace(/<s>(.*?)<\/s>/gi, '~~$1~~')
    .replace(/<strike>(.*?)<\/strike>/gi, '~~$1~~')
    .replace(/<a href="(.*?)">(.*?)<\/a>/gi, '[$2]($1)')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<div>/gi, '\n')
    .replace(/<\/div>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ');
}
