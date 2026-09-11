'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { messagesAPI, Conversation, Message, User } from '@/lib/api';
import { MessageSquare, Send, ArrowLeft, Loader2, UserCircle, Trash2, Flag, X, Shield } from 'lucide-react';

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
    <div className="bg-gradient-to-b from-slate-950 to-gray-900 h-[calc(100vh-64px)]">
      <div className="max-w-4xl mx-auto h-full px-4 py-4">
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl h-full overflow-hidden">
          <div className="flex h-full">
            {/* Список чатов */}
              <div className={`${activeChat ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-80 border-r border-white/10`}>
              <div className="p-4 border-b border-white/10 bg-white/5 flex items-center">
                <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                  <MessageSquare className="h-5 w-5 text-green-400" />
                  <span>Сообщения</span>
                </h2>
              </div>
              <div className="flex-1 overflow-y-auto">
                {conversations.length === 0 ? (
                  <div className="p-6 text-center text-slate-400">
                    <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-20" />
                    <p className="text-sm">Пока нет сообщений</p>
                    <p className="text-xs mt-1">Напишите владельцу питомца из бронирования</p>
                  </div>
                ) : (
                  conversations.map((conv) => (
                    <button
                      key={conv.user_id}
                      onClick={() => openChat(conv.user_id)}
                      className={`w-full p-4 text-left hover:bg-white/5 transition-colors border-b border-white/5 ${activeChat === conv.user_id ? 'bg-primary-500/10 border-l-4 border-l-primary-500' : ''} ${conv.is_admin_chat ? 'border-l-4 border-l-green-500 bg-green-500/5' : ''}`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${conv.is_admin_chat ? 'bg-green-500/20' : 'bg-primary-500/20'}`}>
                          {conv.is_admin_chat ? (
                            <Shield className="h-5 w-5 text-green-400" />
                          ) : (
                            <UserCircle className="h-6 w-6 text-primary-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className={`font-medium text-sm truncate ${conv.is_admin_chat ? 'text-green-400' : 'text-white'}`}>
                              {conv.is_admin_chat ? 'Поддержка' : conv.username}
                            </p>
                            {conv.unread_count > 0 && (
                              <span className="bg-green-500 text-white text-xs rounded-full px-2 py-0.5 ml-2">
                                {conv.unread_count}
                              </span>
                            )}
                          </div>
                          {conv.pet_name && (
                            <p className="text-xs text-green-400 mt-0.5">Питомец: {conv.pet_name}</p>
                          )}
                          <p className="text-xs text-slate-400 truncate mt-0.5">
                            {conv.is_admin_chat && !conv.last_message ? 'Напишите нам' : conv.last_message}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Окно чата */}
            <div className={`${activeChat ? 'flex' : 'hidden md:flex'} flex-col flex-1`}>
              {activeChat ? (
                <>
                  <div className="p-4 border-b border-white/10 bg-white/5 flex items-center space-x-3">
                    <button
                      onClick={() => setActiveChat(null)}
                      className="md:hidden h-11 w-11 -ml-2 flex items-center justify-center rounded-lg text-slate-400 hover:text-white transition-colors"
                    >
                      <ArrowLeft className="h-5 w-5" />
                    </button>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${conversations.find(c => c.user_id === activeChat)?.is_admin_chat ? 'bg-green-500/20' : 'bg-primary-500/20'}`}>
                      {conversations.find(c => c.user_id === activeChat)?.is_admin_chat ? (
                        <Shield className="h-5 w-5 text-green-400" />
                      ) : (
                        <UserCircle className="h-5 w-5 text-primary-400" />
                      )}
                    </div>
                    <div>
                      <p className={`font-medium text-sm ${conversations.find(c => c.user_id === activeChat)?.is_admin_chat ? 'text-green-400' : 'text-white'}`}>
                        {conversations.find(c => c.user_id === activeChat)?.is_admin_chat
                          ? 'Поддержка'
                          : conversations.find(c => c.user_id === activeChat)?.username || 'Чат'}
                      </p>
                      {conversations.find(c => c.user_id === activeChat)?.pet_name && (
                        <p className="text-xs text-green-400">
                          {conversations.find(c => c.user_id === activeChat)?.pet_name}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex group ${msg.sender_id === user.id ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[85%] sm:max-w-xs lg:max-w-md ${msg.sender_id === user.id ? 'items-end' : 'items-start'} flex flex-col`}>
                          <div
                            className={`px-4 py-2 rounded-2xl ${
                              msg.sender_id === user.id
                                ? 'bg-primary-600/80 text-white rounded-br-md'
                                : 'bg-white/10 text-white rounded-bl-md'
                            }`}
                          >
                            <p className="text-sm">{msg.text}</p>
                            <p className={`text-xs mt-1 ${msg.sender_id === user.id ? 'text-primary-200' : 'text-slate-400'}`}>
                              {new Date(msg.created_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>

                          <div className={`mt-1 flex ${msg.sender_id === user.id ? 'justify-end' : 'justify-start'} opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity`}>
                            {msg.sender_id === user.id ? (
                              <button
                                onClick={() => setDeleteModal(msg.id)}
                                className="flex items-center space-x-1 px-3 py-2 rounded-lg text-xs text-red-400 hover:text-red-300 hover:bg-white/5 transition-colors"
                              >
                                <Trash2 className="h-4 w-4" />
                                <span>Удалить</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => setReportModal(msg.id)}
                                className="flex items-center space-x-1 px-3 py-2 rounded-lg text-xs text-slate-400 hover:text-red-400 hover:bg-white/5 transition-colors"
                              >
                                <Flag className="h-4 w-4" />
                                <span>Пожаловаться</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>

                  <form onSubmit={handleSend} className="p-4 border-t border-white/10 bg-white/5">
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        className="flex-1 px-4 py-2.5 bg-white/5 border border-white/10 rounded-full focus:outline-none focus:border-primary-400 focus:shadow-[0_0_15px_rgba(139,92,246,0.3)] transition-all text-sm text-white placeholder-slate-500"
                        placeholder="Введите сообщение..."
                      />
                      <button
                        type="submit"
                        disabled={!newMessage.trim() || sending}
                        className="w-11 h-11 bg-green-600 text-white rounded-full flex items-center justify-center hover:bg-green-500 transition-colors disabled:opacity-50"
                      >
                        {sending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </form>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-slate-400">
                  <div className="text-center">
                    <MessageSquare className="h-16 w-16 mx-auto mb-4 opacity-20" />
                    <p>Выберите чат или начните новый</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Модалка подтверждения удаления */}
      {deleteModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-xl w-full max-w-sm">
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <h3 className="font-bold text-white">Удалить сообщение?</h3>
              <button
                onClick={() => setDeleteModal(null)}
                className="h-11 w-11 flex items-center justify-center rounded-lg text-slate-400 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4">
              <p className="text-sm text-slate-300">Сообщение будет скрыто от вас и другого пользователя.</p>
            </div>
            <div className="flex justify-end space-x-2 p-4 border-t border-white/10">
              <button
                onClick={() => setDeleteModal(null)}
                className="px-4 py-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg text-sm transition-colors"
              >
                Отмена
              </button>
              <button
                onClick={() => handleDelete(deleteModal)}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-sm transition-colors"
              >
                Удалить
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модалка жалобы */}
      {reportModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-xl w-full max-w-sm">
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <h3 className="font-bold text-white">Пожаловаться</h3>
              <button
                onClick={() => { setReportModal(null); setReportReason(''); setReportComment(''); }}
                className="h-11 w-11 flex items-center justify-center rounded-lg text-slate-400 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4 space-y-3">
              <div className="space-y-2">
                {REPORT_REASONS.map((r) => (
                  <label key={r} className="flex items-center space-x-2 cursor-pointer py-2">
                    <input
                      type="radio"
                      name="reason"
                      value={r}
                      checked={reportReason === r}
                      onChange={(e) => setReportReason(e.target.value)}
                      className="h-4 w-4 text-primary-400 focus:ring-primary-400"
                    />
                    <span className="text-sm text-slate-300">{r}</span>
                  </label>
                ))}
              </div>
              <textarea
                value={reportComment}
                onChange={(e) => setReportComment(e.target.value)}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-slate-500 resize-none focus:outline-none focus:border-primary-400 focus:shadow-[0_0_15px_rgba(139,92,246,0.3)] transition-all"
                rows={2}
                placeholder="Комментарий (необязательно)"
              />
            </div>
            <div className="flex justify-end space-x-2 p-4 border-t border-white/10">
              <button
                onClick={() => { setReportModal(null); setReportReason(''); setReportComment(''); }}
                className="px-4 py-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg text-sm transition-colors"
              >
                Отмена
              </button>
              <button
                onClick={handleReport}
                disabled={!reportReason}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-sm transition-colors disabled:opacity-50"
              >
                Отправить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-[calc(100vh-64px)] bg-gradient-to-b from-slate-950 to-gray-900">
          <Loader2 className="h-10 w-10 text-primary-400 animate-spin" />
        </div>
      }
    >
      <ChatContent />
    </Suspense>
  );
}
