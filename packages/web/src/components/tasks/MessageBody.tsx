'use client';

import { useEffect, useRef } from 'react';
import Prism from 'prismjs';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-yaml';
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-csharp';
import 'prismjs/components/prism-go';

interface MessageBodyProps {
  body: string;
  onTaskClick?: (taskId: string) => void;
}

// Parse message body into segments
type Segment =
  | { type: 'text'; content: string }
  | { type: 'mention'; username: string }
  | { type: 'taskRef'; taskId: string; label?: string }
  | { type: 'inlineCode'; content: string }
  | { type: 'codeBlock'; language: string; content: string }
  | { type: 'url'; href: string };

function parseMessage(body: string): Segment[] {
  const segments: Segment[] = [];

  // First extract fenced code blocks
  const fencedRegex = /```(\w*)\n?([\s\S]*?)```/g;
  let lastIndex = 0;
  let match;

  while ((match = fencedRegex.exec(body)) !== null) {
    if (match.index > lastIndex) {
      segments.push(...parseInline(body.slice(lastIndex, match.index)));
    }
    segments.push({
      type: 'codeBlock',
      language: match[1] || 'text',
      content: match[2].trimEnd(),
    });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < body.length) {
    segments.push(...parseInline(body.slice(lastIndex)));
  }

  return segments;
}

function parseInline(text: string): Segment[] {
  const segments: Segment[] = [];
  // Match: task ref with title "Title (#id)", bare #taskId, @username, `inline code`, URLs
  const inlineRegex = /([^\s(][^(]*?\(#([a-f0-9]{6,24})\))|(@\w+)|(#([a-f0-9]{6,24}))|(`[^`]+`)|(https?:\/\/[^\s<>]+)/g;
  let lastIndex = 0;
  let match;

  while ((match = inlineRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ type: 'text', content: text.slice(lastIndex, match.index) });
    }
    if (match[1] && match[2]) {
      // "Task title (#taskId)" — full task reference
      segments.push({ type: 'taskRef', taskId: match[2], label: match[1].trim() });
    } else if (match[3]) {
      segments.push({ type: 'mention', username: match[3].slice(1) });
    } else if (match[5]) {
      // Bare #taskId
      segments.push({ type: 'taskRef', taskId: match[5] });
    } else if (match[6]) {
      segments.push({ type: 'inlineCode', content: match[6].slice(1, -1) });
    } else if (match[7]) {
      segments.push({ type: 'url', href: match[7] });
    }
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    segments.push({ type: 'text', content: text.slice(lastIndex) });
  }

  return segments;
}

export function MessageBody({ body, onTaskClick }: MessageBodyProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) {
      Prism.highlightAllUnder(ref.current);
    }
  }, [body]);

  const segments = parseMessage(body);

  return (
    <div ref={ref} className="text-[13px] md:text-[12px] leading-relaxed whitespace-pre-wrap break-words">
      {segments.map((seg, i) => {
        switch (seg.type) {
          case 'text':
            return <span key={i}>{seg.content}</span>;
          case 'mention':
            return (
              <span key={i} className="font-mono text-blue bg-blue-dim rounded px-1 py-[1px] text-[11px]">
                @{seg.username}
              </span>
            );
          case 'taskRef':
            return (
              <button
                key={i}
                onClick={() => onTaskClick?.(seg.taskId)}
                className="text-accent hover:underline text-[11px]"
              >
                {seg.label || <span className="font-mono">#{seg.taskId.slice(-6)}</span>}
              </button>
            );
          case 'inlineCode':
            return (
              <code key={i} className="font-mono text-[11px] bg-bg-active text-accent rounded px-1.5 py-[1px]">
                {seg.content}
              </code>
            );
          case 'url':
            return (
              <a
                key={i}
                href={seg.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent hover:underline break-all"
              >
                {seg.href}
              </a>
            );
          case 'codeBlock':
            return (
              <pre key={i} className="bg-bg rounded border border-border-subtle p-3 my-2 overflow-x-auto text-[11px]">
                <code className={`language-${seg.language}`}>
                  {seg.content}
                </code>
              </pre>
            );
        }
      })}
    </div>
  );
}
