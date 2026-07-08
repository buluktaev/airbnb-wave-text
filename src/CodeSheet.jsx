import React, { useEffect, useState } from 'react';
import { Drawer } from 'vaul';
import { highlight } from './highlight.js';

// Bottom sheet on vaul (same engine as the iconiqui drawer): drag-to-dismiss,
// backdrop click and Esc close it natively. Inside — our syntax-highlighted code viewer.
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
            <Drawer.Title className="sheet-title">Code</Drawer.Title>
            <span className="sheet-file">wave-text.html</span>
            <button type="button" className="icon-btn sheet-copy" onClick={copy} aria-label="Copy code">
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
            {/* Explicit close: DialKit's ShortcutListener intercepts Escape and focus never
                moves into the sheet, so vaul's Esc/outside-close aren't reliable here — a
                dedicated button guarantees closing works. */}
            <button type="button" className="icon-btn sheet-close" onClick={onClose} aria-label="Close">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
          <Drawer.Description className="sr-only">Generated self-contained animation code</Drawer.Description>
          <pre className="code-view">
            {/* eslint-disable-next-line react/no-danger — content is escaped in highlight() */}
            <code dangerouslySetInnerHTML={{ __html: highlight(code) }} />
          </pre>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
