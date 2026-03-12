import { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { addDoc, collection, limit, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { MessageSquareHeart, Send } from 'lucide-react';

type MessageItem = {
  id: string;
  name: string;
  email: string;
  text: string;
  createdAt: string;
};

export default function Messages() {
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '',
    email: '',
    text: '',
  });

  useEffect(() => {
    const q = query(collection(db, 'messages'), orderBy('createdAt', 'desc'), limit(50));
    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((entry) => ({ id: entry.id, ...(entry.data() as any) })) as MessageItem[];
        setMessages(data);
      },
      (error) => handleFirestoreError(error, OperationType.LIST, 'messages')
    );
    return () => unsub();
  }, []);

  const remaining = useMemo(() => Math.max(0, 400 - form.text.length), [form.text.length]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);

    if (!form.name.trim() || !form.email.trim() || !form.text.trim()) {
      setStatus('Preencha nome, e-mail e recado.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setStatus('Informe um e-mail válido.');
      return;
    }
    if (form.text.length > 400) {
      setStatus('Seu recado passou do limite de 400 caracteres.');
      return;
    }

    setSending(true);
    try {
      await addDoc(collection(db, 'messages'), {
        name: form.name.trim(),
        email: form.email.trim(),
        text: form.text.trim(),
        createdAt: new Date().toISOString(),
      });
      setForm({ name: '', email: '', text: '' });
      setStatus('Recado enviado com sucesso. Obrigado pelo carinho!');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'messages');
      setStatus('Não foi possível enviar o recado agora.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-20">
      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
        <h1 className="text-5xl font-serif text-stone-800 mb-3">Recados</h1>
        <p className="text-stone-500 max-w-2xl mx-auto">
          Se quiserem nos deixar uma mensagem, ficaremos muito felizes em ler.
        </p>
      </motion.div>

      <div className="grid lg:grid-cols-2 gap-8">
        <motion.form
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={submit}
          className="bg-white border border-stone-100 rounded-3xl p-8 shadow-sm space-y-4"
        >
          <h2 className="text-2xl font-serif text-stone-800 flex items-center gap-2">
            <MessageSquareHeart className="text-rose-400" size={24} />
            Enviar recado
          </h2>
          <input
            type="text"
            placeholder="Seu nome"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full px-4 py-3 bg-stone-50 border border-stone-100 rounded-xl focus:outline-none focus:border-rose-200"
          />
          <input
            type="email"
            placeholder="Seu e-mail"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full px-4 py-3 bg-stone-50 border border-stone-100 rounded-xl focus:outline-none focus:border-rose-200"
          />
          <textarea
            placeholder="Deixe uma mensagem de carinho..."
            value={form.text}
            maxLength={400}
            onChange={(e) => setForm({ ...form, text: e.target.value })}
            className="w-full h-36 px-4 py-3 bg-stone-50 border border-stone-100 rounded-xl focus:outline-none focus:border-rose-200"
          />
          <div className="text-xs text-stone-400">{remaining} caracteres restantes</div>
          <button
            disabled={sending}
            className="w-full py-3 bg-stone-800 text-white uppercase tracking-widest text-xs font-bold rounded-xl hover:bg-stone-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
          >
            <Send size={16} />
            {sending ? 'Enviando...' : 'Enviar recado'}
          </button>
          {status && <p className="text-sm text-stone-600">{status}</p>}
        </motion.form>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-stone-100 rounded-3xl p-6 shadow-sm space-y-4 max-h-[36rem] overflow-auto"
        >
          <h2 className="text-2xl font-serif text-stone-800">Mensagens recebidas</h2>
          {messages.length === 0 && <p className="text-stone-400">Seja o primeiro a enviar um recado.</p>}
          {messages.map((message) => (
            <div key={message.id} className="border-b border-stone-100 pb-4">
              <p className="font-serif text-stone-800">{message.name}</p>
              <p className="text-xs text-stone-400 mb-2">
                {message.createdAt ? new Date(message.createdAt).toLocaleString('pt-BR') : ''}
              </p>
              <p className="text-stone-600 whitespace-pre-wrap">{message.text}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
