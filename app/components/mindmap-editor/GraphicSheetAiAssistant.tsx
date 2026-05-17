'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { SheetConnection, SheetItem } from '@/app/components/mindmap-editor/SheetEditorCanvas';
import type { GraphicEditorProjectFile } from '@/app/components/mindmap-editor/GraphicDiagramEditor';

export type AiChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  at: number;
};

function newId() {
  return `msg-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function IconChat({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" width="24" height="24" fill="currentColor" aria-hidden>
      <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z" />
    </svg>
  );
}

function IconClose({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path strokeLinecap="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function IconSendArrow({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14m-5-5l5 5-5 5" />
    </svg>
  );
}

function formatProjectFilesLine(files: GraphicEditorProjectFile[]): string {
  return files
    .map((f) => {
      const sizeKB = Math.round((f.size || 0) / 1024);
      return `${f.name} (${sizeKB} KB)`;
    })
    .join(', ');
}

export default function GraphicSheetAiAssistant({
  isDark,
  lang,
  t,
  onApplyMindmap,
  projectFiles = [],
  projectDocuments = [],
  isApplying = false,
}: {
  isDark: boolean;
  lang: 'ru' | 'en';
  t: (key: string) => string;
  onApplyMindmap: (
    items: SheetItem[],
    connections: SheetConnection[]
  ) => void | Promise<void>;
  projectFiles?: GraphicEditorProjectFile[];
  projectDocuments?: unknown[];
  isApplying?: boolean;
}) {
  const hasProjectFiles = projectFiles.length > 0;

  const initialMessage = useMemo(() => {
    if (hasProjectFiles) {
      const filesLine = formatProjectFilesLine(projectFiles);
      const head = t('graphicEditor.ai.fromProject.documentsProcessed');
      const tail = t('graphicEditor.ai.fromProject.enterObject');
      return `${head} ${filesLine}. ${tail}`;
    }
    return t('graphicEditor.ai.initialMessage');
  }, [hasProjectFiles, projectFiles, t]);

  const [open, setOpen] = useState(true);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState<AiChatMessage[]>(() => [
    {
      id: newId(),
      role: 'assistant',
      text: initialMessage,
      at: Date.now(),
    },
  ]);
  const listEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages((prev) => {
      if (prev.length === 0) {
        return [{ id: newId(), role: 'assistant', text: initialMessage, at: Date.now() }];
      }
      const [first, ...rest] = prev;
      if (first.role === 'assistant' && first.text === initialMessage) return prev;
      if (first.role !== 'assistant') return prev;
      return [{ ...first, text: initialMessage }, ...rest];
    });
  }, [initialMessage]);

  const formatTime = useCallback(
    (at: number) =>
      new Date(at).toLocaleString(lang === 'ru' ? 'ru-RU' : 'en-US', {
        dateStyle: 'short',
        timeStyle: 'short',
      }),
    [lang]
  );

  useEffect(() => {
    listEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  const busy = sending || isApplying;

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || sending || isApplying) return;
    const userAt = Date.now();
    setInput('');
    setMessages((m) => [...m, { id: newId(), role: 'user', text, at: userAt }]);
    setSending(true);
    try {
      const res = await fetch('/api/diagrams/sheet-canva-mindmap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          objectDescription: text,
          language: lang,
          isFromProject: hasProjectFiles,
          documents: hasProjectFiles ? projectDocuments : undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(typeof data.error === 'string' ? data.error : t('graphicEditor.ai.errorGeneric'));
      }
      const items = data.items as SheetItem[] | undefined;
      const connections = (data.connections as SheetConnection[] | undefined) ?? [];
      if (!items || !Array.isArray(items) || items.length === 0) {
        throw new Error(t('graphicEditor.ai.errorEmpty'));
      }
      await Promise.resolve(onApplyMindmap(items, connections));
      setMessages((m) => [
        ...m,
        { id: newId(), role: 'assistant', text: t('graphicEditor.ai.successReply'), at: Date.now() },
      ]);
    } catch (e) {
      const msg = e instanceof Error ? e.message : t('graphicEditor.ai.errorGeneric');
      setMessages((m) => [...m, { id: newId(), role: 'assistant', text: msg, at: Date.now() }]);
    } finally {
      setSending(false);
    }
  }, [input, sending, isApplying, lang, hasProjectFiles, projectDocuments, onApplyMindmap, t]);

  const panelBg = isDark ? 'bg-gray-900 border-gray-600' : 'bg-white border-gray-200';
  const bubbleUser = isDark ? 'bg-blue-600 text-white' : 'bg-blue-600 text-white';
  const bubbleAi = isDark ? 'bg-gray-800 text-gray-100 border border-gray-600' : 'bg-gray-50 text-gray-900 border border-gray-200';

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`mindmap-no-print fixed bottom-6 right-6 z-[300] flex h-14 w-14 items-center justify-center rounded-full border-2 shadow-lg transition-transform hover:scale-105 active:scale-95 ${
          isDark
            ? 'border-blue-400/60 bg-blue-600 text-white hover:bg-blue-500'
            : 'border-blue-500/40 bg-blue-600 text-white hover:bg-blue-500'
        }`}
        aria-label={t('graphicEditor.ai.openChat')}
      >
        <IconChat className="h-7 w-7" />
      </button>

      {open && (
        <div
          className={`mindmap-no-print fixed bottom-24 right-6 z-[310] flex max-h-[min(520px,80vh)] w-[min(22rem,calc(100vw-3rem))] flex-col overflow-hidden rounded-2xl border shadow-2xl ${panelBg}`}
          role="dialog"
          aria-modal="false"
          aria-labelledby="graphic-ai-chat-title"
        >
          <div
            className={`flex shrink-0 items-center justify-between border-b px-4 py-3 ${
              isDark ? 'border-gray-700' : 'border-gray-200'
            }`}
          >
            <h2 id="graphic-ai-chat-title" className="text-sm font-semibold" style={{ fontWeight: 600 }}>
              {t('graphicEditor.ai.title')}
            </h2>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className={`rounded-lg p-2 transition-colors ${
                isDark ? 'text-gray-400 hover:bg-gray-800 hover:text-white' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
              }`}
              aria-label={t('graphicEditor.ai.close')}
            >
              <IconClose className="h-5 w-5" />
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
            <div className="flex flex-col gap-3">
              {messages.map((m) => (
                <div key={m.id} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                  <span
                    className={`mb-1 text-[10px] tabular-nums ${isDark ? 'text-gray-500' : 'text-gray-400'}`}
                  >
                    {formatTime(m.at)}
                  </span>
                  <div
                    className={`max-w-[92%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                      m.role === 'user' ? bubbleUser : bubbleAi
                    }`}
                  >
                    {m.text}
                  </div>
                </div>
              ))}
              <div ref={listEndRef} />
            </div>
          </div>

          <div className={`shrink-0 border-t p-3 ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="flex items-end gap-2">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    void send();
                  }
                }}
                rows={2}
                disabled={busy}
                placeholder={t('graphicEditor.ai.placeholder')}
                className={`min-h-[3rem] flex-1 resize-none rounded-xl border px-3 py-2 text-sm outline-none ring-blue-500/30 focus:ring-2 ${
                  isDark
                    ? 'border-gray-600 bg-gray-950 text-gray-100 placeholder:text-gray-500'
                    : 'border-gray-300 bg-white text-gray-900 placeholder:text-gray-400'
                }`}
              />
              <button
                type="button"
                onClick={() => void send()}
                disabled={busy || !input.trim()}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600 shadow-sm transition-colors hover:bg-blue-200 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label={t('graphicEditor.ai.send')}
              >
                {busy ? (
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                ) : (
                  <IconSendArrow className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
