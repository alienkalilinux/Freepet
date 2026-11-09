'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { messagesAPI, Conversation, Message, User } from '@/lib/api';
import { ArrowLeft, Loader2, Flag } from 'lucide-react';
import UserIcon from '@/components/UserIcon';
import { PageShell } from '@/components/ui';

const REPORT_REASONS = [
  'Спам',
  'Оскорбления',
  'Неприемлемый контент',
  'Мошенничество',
  'Другое',
];

function ChatContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user, setUser] = useState<User | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeChat, setActiveChat] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [deleteModal, setDeleteModal] = useState<number | null>(null);
  const [reportModal, setReportModal] = useState<number | null>(null);
  const [reportReason, setReportReason] = useState('');
  const [reportComment, setReportComment] = useState('');
  const prevMessagesCount = useRef(0);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (!savedUser) {
      router.push('/login');
      return;
    }
    setUser(JSON.parse(savedUser));
  }, [router]);

  useEffect(() => {
    if (!user) return;
    loadConversations();
    const interval = setInterval(loadConversations, 5000);
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    const userId = searchParams.get('user');
    if (userId) {
      setActiveChat(parseInt(userId));
    }
  }, [searchParams]);

  useEffect(() => {
    if (!activeChat || !user) return;
    loadMessages(activeChat);
    const interval = setInterval(() => loadMessages(activeChat), 3000);
    return () => clearInterval(interval);
  }, [activeChat, user]);

  useEffect(() => {
    if (messages.length > prevMessagesCount.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
    prevMessagesCount.current = messages.length;
  }, [messages]);

  const loadConversations = async () => {
    try {
      const response = await messagesAPI.getConversations();
      setConversations(response.data);
    } catch {}
  };

  const loadMessages = async (userId: number) => {
    try {
      const response = await messagesAPI.getMessages(userId);
      setMessages(response.data);
    } catch {}
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeChat) return;

    setSending(true);
    try {
      await messagesAPI.send({
        receiver_id: activeChat,
        text: newMessage.trim(),
      });
      setNewMessage('');
      await loadMessages(activeChat);
      await loadConversations();
    } catch {}
    setSending(false);
  };

  const handleDelete = async (messageId: number) => {
    try {
      await messagesAPI.delete(messageId);
      setDeleteModal(null);
      if (activeChat) await loadMessages(activeChat);
      await loadConversations();
    } catch {}
  };

  const handleReport = async () => {
    if (!reportReason || !reportModal) return;
    try {
      await messagesAPI.report({
        message_id: reportModal,
        reason: reportReason,
        comment: reportComment || undefined,
      });
      setReportModal(null);
      setReportReason('');
      setReportComment('');
    } catch {}
  };

  const openChat = (userId: number) => {
    setActiveChat(userId);
    setMessages([]);
    prevMessagesCount.current = 0;
  };

  if (!user) return null;

  return (
    <PageShell>
      <div className="mx-auto max-w-[1200px]">
        <div className="surface-card h-[calc(100vh-72px)] overflow-hidden rounded-none border-x-0 border-b-0 md:rounded-none">
          <div className="flex h-full">
            <div className={`${activeChat ? 'hidden md:flex' : 'flex'} w-full flex-col border-r border-line md:w-80`}>
              <div className="flex items-center justify-between border-b border-line px-4 py-3">
                <h1 className="text-base font-semibold text-content-primary">Сообщения</h1>
                {conversations.length > 0 && (
                  <span className="text-xs text-content-muted">{conversations.length}</span>
                )}
              </div>
              <div className="flex-1 overflow-y-auto">
                {conversations.length === 0 ? (
                  <div className="px-6 py-10 text-center">
                    <p className="text-sm font-medium text-content-secondary">Пока нет сообщений</p>
                    <p className="mt-1 text-xs text-content-muted">Напишите владельцу питомца из бронирования</p>
                  </div>
                ) : (
                  conversations.map((conv) => (
                    <button
                      key={conv.user_id}
                      onClick={() => openChat(conv.user_id)}
                      className={`w-full border-b border-line px-4 py-3 text-left transition-colors hover:bg-surface-sunken ${activeChat === conv.user_id ? 'bg-surface-sunken' : ''}`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${conv.is_admin_chat ? 'bg-success-soft' : 'bg-surface-sunken'}`}>
                          {conv.is_admin_chat ? (
                            <UserIcon name="headset" className="h-5 w-5 text-success-text" />
                          ) : (
                            <UserIcon name="user" className="h-5 w-5 text-content-muted" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between">
                            <p className="truncate text-sm font-medium text-content-primary">
                              {conv.is_admin_chat ? 'Поддержка' : conv.username}
                            </p>
                            {conv.unread_count > 0 && (
                              <span className="ml-2 rounded-full bg-accent px-2 py-0.5 text-xs font-medium text-accent-on">
                                {conv.unread_count}
                              </span>
                            )}
                          </div>
                          {conv.pet_name && (
                            <p className="mt-0.5 truncate text-xs text-content-muted">{conv.pet_name}</p>
                          )}
                          <p className="mt-0.5 truncate text-xs text-content-muted">
                            {conv.is_admin_chat && !conv.last_message ? 'Напишите нам' : conv.last_message}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>

            <div className={`${activeChat ? 'flex' : 'hidden md:flex'} flex-1 flex-col`}>
              {activeChat ? (
                <>
                  <div className="flex items-center space-x-3 border-b border-line px-4 py-3">
                    <button
                      onClick={() => setActiveChat(null)}
                      className="flex h-8 w-8 -ml-2 items-center justify-center rounded-lg text-content-muted transition-colors hover:bg-surface-sunken hover:text-content-primary md:hidden"
                      aria-label="Назад к диалогам"
                    >
                      <ArrowLeft className="h-5 w-5" />
                    </button>
                    <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full ${conversations.find(c => c.user_id === activeChat)?.is_admin_chat ? 'bg-success-soft' : 'bg-surface-sunken'}`}>
                      {conversations.find(c => c.user_id === activeChat)?.is_admin_chat ? (
                        <UserIcon name="headset" className="h-5 w-5 text-success-text" />
                      ) : (
                        <UserIcon name="user" className="h-4 w-4 text-content-muted" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-content-primary">
                        {conversations.find(c => c.user_id === activeChat)?.is_admin_chat
                          ? 'Поддержка'
                          : conversations.find(c => c.user_id === activeChat)?.username || 'Чат'}
                      </p>
                      {conversations.find(c => c.user_id === activeChat)?.pet_name && (
                        <p className="truncate text-xs text-content-muted">
                          {conversations.find(c => c.user_id === activeChat)?.pet_name}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex-1 space-y-3 overflow-y-auto bg-surface-sunken p-4 sm:p-5">
                    {messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`group flex ${msg.sender_id === user.id ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`flex max-w-[86%] flex-col sm:max-w-xs lg:max-w-md ${msg.sender_id === user.id ? 'items-end' : 'items-start'}`}>
                          <div
                            className={`px-4 py-2.5 ${
                              msg.sender_id === user.id
                                ? 'rounded-2xl rounded-br-md bg-accent text-accent-on'
                                : 'rounded-2xl rounded-bl-md border border-line bg-surface-raised text-content-primary'
                            }`}
                          >
                            <p className="text-sm leading-relaxed">{msg.text}</p>
                            <p className={`mt-1 text-[11px] ${msg.sender_id === user.id ? 'text-accent-on opacity-75' : 'text-content-faint'}`}>
                              {new Date(msg.created_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>

                          <div className={`mt-1 flex ${msg.sender_id === user.id ? 'justify-end' : 'justify-start'} opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100`}>
                            {msg.sender_id === user.id ? (
                              <button
                                onClick={() => setDeleteModal(msg.id)}
                                className="flex items-center space-x-1 rounded-lg px-2 py-1.5 text-xs text-content-muted transition-colors hover:text-danger-text"
                              >
                                <UserIcon name="trash" className="h-3.5 w-3.5" />
                                <span>Удалить</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => setReportModal(msg.id)}
                                className="flex items-center space-x-1 rounded-lg px-2 py-1.5 text-xs text-content-muted transition-colors hover:text-danger-text"
                              >
                                <Flag className="h-3.5 w-3.5" />
                                <span>Пожаловаться</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>

                  <form onSubmit={handleSend} className="border-t border-line bg-surface-raised p-3 sm:p-4">
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        className="field flex-1 text-sm"
                        placeholder="Введите сообщение…"
                      />
                      <button
                        type="submit"
                        disabled={!newMessage.trim() || sending}
                        className="btn btn-primary h-10 w-10 flex-shrink-0 !px-0"
                        aria-label="Отправить сообщение"
                      >
                        {sending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <UserIcon name="send" className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </form>
                </>
              ) : (
                <div className="flex flex-1 items-center justify-center p-8">
                  <div className="max-w-xs text-center">
                    <p className="font-medium text-content-secondary">Выберите чат</p>
                    <p className="mt-1 text-sm text-content-muted">Все договорённости остаются в одном месте.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {deleteModal && (
        <div className="modal-mask">
          <div className="modal-panel w-full max-w-sm">
            <div className="flex items-center justify-between border-b border-line p-5">
              <h3 className="heading-sub text-lg">Удалить сообщение?</h3>
              <button
                onClick={() => setDeleteModal(null)}
                className="flex h-10 w-10 items-center justify-center rounded-lg text-content-muted transition-colors hover:bg-surface-veil hover:text-content-primary"
                aria-label="Отмена удаления"
              >
                <UserIcon name="cross" className="h-5 w-5" />
              </button>
            </div>
            <div className="p-5">
              <p className="text-sm text-content-secondary">Сообщение будет скрыто от вас и другого пользователя.</p>
            </div>
            <div className="flex justify-end gap-2 border-t border-line p-5">
              <button
                onClick={() => setDeleteModal(null)}
                className="btn btn-ghost"
              >
                Отмена
              </button>
              <button
                onClick={() => handleDelete(deleteModal)}
                className="btn btn-danger"
              >
                Удалить
              </button>
            </div>
          </div>
        </div>
      )}

      {reportModal && (
        <div className="modal-mask">
          <div className="modal-panel w-full max-w-sm">
            <div className="flex items-center justify-between border-b border-line p-5">
              <h3 className="heading-sub text-lg">Пожаловаться</h3>
              <button
                onClick={() => { setReportModal(null); setReportReason(''); setReportComment(''); }}
                className="flex h-10 w-10 items-center justify-center rounded-lg text-content-muted transition-colors hover:bg-surface-veil hover:text-content-primary"
                aria-label="Закрыть жалобу"
              >
                <UserIcon name="cross" className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-3 p-5">
              <div className="space-y-1">
                {REPORT_REASONS.map((r) => (
                  <label key={r} className="flex cursor-pointer items-center space-x-2 rounded-lg px-2 py-2 transition-colors hover:bg-surface-veil">
                    <input
                      type="radio"
                      name="reason"
                      value={r}
                      checked={reportReason === r}
                      onChange={(e) => setReportReason(e.target.value)}
                      className="h-4 w-4 accent-[var(--accent)]"
                    />
                    <span className="text-sm text-content-secondary">{r}</span>
                  </label>
                ))}
              </div>
              <textarea
                value={reportComment}
                onChange={(e) => setReportComment(e.target.value)}
                className="field resize-none text-sm"
                rows={2}
                placeholder="Комментарий (необязательно)"
              />
            </div>
            <div className="flex justify-end gap-2 border-t border-line p-5">
              <button
                onClick={() => { setReportModal(null); setReportReason(''); setReportComment(''); }}
                className="btn btn-ghost"
              >
                Отмена
              </button>
              <button
                onClick={handleReport}
                disabled={!reportReason}
                className="btn btn-danger"
              >
                Отправить
              </button>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
}

export default function ChatPage() {
  return (
    <Suspense
      fallback={
        <PageShell>
          <div className="flex h-[calc(100vh-72px)] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-accent-text" />
          </div>
        </PageShell>
      }
    >
      <ChatContent />
    </Suspense>
  );
}
