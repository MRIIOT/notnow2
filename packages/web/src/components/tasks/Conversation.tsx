'use client';

import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';
import { api } from '@/lib/api';
import { MessageBody } from './MessageBody';
import type { Task, TeamMember } from '@/types';

interface Message {
  _id: string;
  body: string;
  userId: { _id: string; username: string; displayName: string };
  createdAt: string;
}

interface ConversationProps {
  taskId: string;
  members?: TeamMember[];
}

function timeAgo(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

function UserInitial({ username }: { username: string }) {
  // Generate a consistent color from username
  const colors = ['bg-blue', 'bg-green', 'bg-accent', 'bg-orange', 'bg-red'];
  const idx = username.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % colors.length;
  return (
    <div className={`w-6 h-6 md:w-5 md:h-5 rounded-full ${colors[idx]} flex items-center justify-center text-[10px] font-mono font-bold text-bg shrink-0`}>
      {username[0].toUpperCase()}
    </div>
  );
}

export function Conversation({ taskId, members }: ConversationProps) {
  const teamId = useAuthStore((s) => s.activeTeamId);
  const currentUserId = useAuthStore((s) => s.user?.id);
  const selectTask = useUIStore((s) => s.selectTask);
  const qc = useQueryClient();
  const [body, setBody] = useState('');
  const [showMentions, setShowMentions] = useState(false);
  const [mentionFilter, setMentionFilter] = useState('');
  const [showTaskRef, setShowTaskRef] = useState(false);
  const [taskFilter, setTaskFilter] = useState('');
  const [taskSuggestions, setTaskSuggestions] = useState<Task[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const { data: messages = [] } = useQuery({
    queryKey: ['messages', teamId, taskId],
    queryFn: () =>
      api<{ messages: Message[] }>(`/teams/${teamId}/tasks/${taskId}/messages`).then((d) => d.messages),
    enabled: !!teamId && !!taskId,
    refetchInterval: 30000,
    refetchOnWindowFocus: true,
  });

  const sendMessage = useMutation({
    mutationFn: (msgBody: string) =>
      api(`/teams/${teamId}/tasks/${taskId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ body: msgBody }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['messages', teamId, taskId] });
      qc.invalidateQueries({ queryKey: ['message-counts', teamId] });
    },
  });

  const deleteMessage = useMutation({
    mutationFn: (messageId: string) =>
      api(`/teams/${teamId}/tasks/${taskId}/messages/${messageId}`, { method: 'DELETE' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['messages', teamId, taskId] });
      qc.invalidateQueries({ queryKey: ['message-counts', teamId] });
    },
  });

  // Scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim()) return;
    sendMessage.mutate(body.trim());
    setBody('');
  };

  // Search tasks when # filter changes
  useEffect(() => {
    if (!showTaskRef || !taskFilter || !teamId) {
      setTaskSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const data = await api<{ tasks: Task[] }>(`/teams/${teamId}/tasks?q=${encodeURIComponent(taskFilter)}`);
        setTaskSuggestions(data.tasks.filter((t) => t._id !== taskId)); // exclude current task
      } catch {
        setTaskSuggestions([]);
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [showTaskRef, taskFilter, teamId, taskId]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit(e);
      return;
    }

    if (e.key === '@') {
      setShowMentions(true);
      setMentionFilter('');
      setShowTaskRef(false);
    }
  };

  const handleInput = (val: string) => {
    setBody(val);

    // Detect # trigger
    const lastHash = val.lastIndexOf('#');
    if (lastHash >= 0) {
      const after = val.slice(lastHash + 1);
      const spaceIdx = after.indexOf(' ');
      const newlineIdx = after.indexOf('\n');
      const endIdx = Math.min(
        spaceIdx === -1 ? Infinity : spaceIdx,
        newlineIdx === -1 ? Infinity : newlineIdx
      );
      if (endIdx === Infinity && after.length > 0) {
        setShowTaskRef(true);
        setTaskFilter(after);
        setShowMentions(false);
      } else if (after.length === 0) {
        setShowTaskRef(true);
        setTaskFilter('');
      } else {
        setShowTaskRef(false);
      }
    } else {
      setShowTaskRef(false);
    }

    // Track mention filter
    if (showMentions) {
      const lastAt = val.lastIndexOf('@');
      if (lastAt >= 0) {
        const after = val.slice(lastAt + 1);
        const spaceIdx = after.indexOf(' ');
        if (spaceIdx === -1) {
          setMentionFilter(after.toLowerCase());
        } else {
          setShowMentions(false);
        }
      } else {
        setShowMentions(false);
      }
    }
  };

  const insertMention = (username: string) => {
    const lastAt = body.lastIndexOf('@');
    const newBody = body.slice(0, lastAt) + `@${username} `;
    setBody(newBody);
    setShowMentions(false);
    inputRef.current?.focus();
  };

  const insertTaskRef = (task: Task) => {
    const lastHash = body.lastIndexOf('#');
    const newBody = body.slice(0, lastHash) + `${task.title} (#${task._id}) `;
    setBody(newBody);
    setShowTaskRef(false);
    setTaskSuggestions([]);
    inputRef.current?.focus();
  };

  const filteredMembers = members?.filter((m) =>
    !mentionFilter || m.username.toLowerCase().startsWith(mentionFilter)
  ) || [];

  return (
    <div className="mt-4 border-t border-border pt-3">
      <div className="font-mono text-[10px] uppercase tracking-wider text-text-tertiary mb-2 flex items-center gap-2">
        Conversation
        {messages.length > 0 && <span className="font-normal opacity-60">{messages.length}</span>}
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="max-h-[300px] overflow-y-auto space-y-3 mb-3">
        {messages.map((msg) => (
          <div key={msg._id} className="flex gap-2 group/msg">
            <UserInitial username={msg.userId.username} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="font-mono text-[11px] text-blue font-medium">@{msg.userId.username}</span>
                <span className="font-mono text-[9px] text-text-tertiary">{timeAgo(msg.createdAt)}</span>
                {msg.userId._id === currentUserId && (
                  <button
                    onClick={() => deleteMessage.mutate(msg._id)}
                    className="font-mono text-[9px] text-text-tertiary opacity-0 group-hover/msg:opacity-50 hover:!opacity-100 hover:!text-red transition-all"
                  >
                    delete
                  </button>
                )}
              </div>
              <MessageBody body={msg.body} onTaskClick={(id) => selectTask(id)} />
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="relative">
        {showMentions && filteredMembers.length > 0 && (
          <div className="absolute bottom-full mb-1 left-0 right-0 bg-bg-raised border border-border rounded-lg shadow-xl z-10 max-h-[150px] overflow-y-auto">
            {filteredMembers.map((m) => (
              <button
                key={m.userId}
                type="button"
                onClick={() => insertMention(m.username)}
                className="w-full text-left px-3 py-1.5 font-mono text-[11px] text-text-secondary hover:bg-bg-hover hover:text-text transition-all"
              >
                @{m.username}
              </button>
            ))}
          </div>
        )}
        {showTaskRef && taskSuggestions.length > 0 && (
          <div className="absolute bottom-full mb-1 left-0 right-0 bg-bg-raised border border-border rounded-lg shadow-xl z-10 max-h-[150px] overflow-y-auto">
            {taskSuggestions.map((t) => (
              <button
                key={t._id}
                type="button"
                onClick={() => insertTaskRef(t)}
                className="w-full text-left px-3 py-1.5 text-[11px] hover:bg-bg-hover hover:text-text transition-all flex items-center gap-2"
              >
                <span className="font-mono text-accent">#{t._id.slice(-6)}</span>
                <span className="text-text-secondary truncate">{t.title}</span>
              </button>
            ))}
          </div>
        )}
        <div className="flex gap-2">
          <textarea
            ref={inputRef}
            value={body}
            onChange={(e) => handleInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message... (Ctrl+Enter to send)"
            rows={2}
            className="flex-1 bg-bg border border-border rounded px-3 py-2 text-[13px] md:text-[12px] text-text outline-none focus:border-accent resize-none font-body"
          />
          <button
            type="submit"
            disabled={!body.trim() || sendMessage.isPending}
            className="font-mono text-[11px] bg-accent text-bg px-3 rounded hover:bg-accent-hover transition-colors disabled:opacity-50 self-end pb-2"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}
