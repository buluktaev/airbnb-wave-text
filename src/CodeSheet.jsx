import React, { useEffect, useState } from 'react';
import { Drawer } from 'vaul';
import { highlight } from './highlight.js';

// Bottom sheet на vaul (тот же движок, что у iconiqui drawer): drag-to-dismiss,
// backdrop-клик и Esc закрывают штатно. Внутри — наш вьюер кода с подсветкой.
export default function CodeSheet({ open, code, onClose }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => { if (!open) setCopied(false); }, [open]);

  const copy = () => {
    navigator.clipboard.writeText(code).then(
      () => { setCopied(true); setTimeout(() => setCopied(false), 1600); },
      () => {},
    );
  };

  return (
    <Drawer.Root open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <Drawer.Portal>
        <Drawer.Overlay className="sheet-backdrop" />
        <Drawer.Content className="sheet">
          <div className="sheet-handle" />
          <div className="sheet-header">
            <Drawer.Title className="sheet-title">Код</Drawer.Title>
            <span className="sheet-file">wave-text.html</span>
            <button type="button" className="icon-btn sheet-copy" onClick={copy} aria-label="Скопировать код">
              {copied ? (
                <svg className="sheet-check" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
              )}
            </button>
            {/* Явное закрытие: DialKit-ShortcutListener перехватывает Escape, а фокус не уходит в шит,
                поэтому vaul-овские Esc/outside-close ненадёжны — гарантируем закрытие кнопкой. */}
            <button type="button" className="icon-btn sheet-close" onClick={onClose} aria-label="Закрыть">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
          <Drawer.Description className="sr-only">Сгенерированный self-contained код анимации</Drawer.Description>
          <pre className="code-view">
            {/* eslint-disable-next-line react/no-danger — контент экранируется в highlight() */}
            <code dangerouslySetInnerHTML={{ __html: highlight(code) }} />
          </pre>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
