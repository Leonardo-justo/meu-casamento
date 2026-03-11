import React, { useState } from 'react';
import { motion } from 'motion/react';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';
import { CheckCircle, Send } from 'lucide-react';

export default function RSVP() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    adults: 1,
    children: 0,
    dietaryRestrictions: '',
    message: '',
  });
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('submitting');

    try {
      await addDoc(collection(db, 'guests'), {
        ...formData,
        confirmedAt: new Date().toISOString(),
      });
      setStatus('success');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'guests');
    }
  };

  if (status === 'success') {
    return (
      <div className="max-w-2xl mx-auto px-4 py-32 text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white p-12 rounded-3xl shadow-sm border border-stone-100"
        >
          <CheckCircle className="mx-auto text-emerald-400 mb-6" size={64} />
          <h2 className="text-4xl font-serif text-stone-800 mb-4">Presença Confirmada!</h2>
          <p className="text-stone-600 mb-8">
            Obrigado por confirmar sua presença. Mal podemos esperar para celebrar com você!
          </p>
          <button
            onClick={() => setStatus('idle')}
            className="text-stone-400 hover:text-stone-800 text-sm uppercase tracking-widest font-bold"
          >
            Voltar
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-16"
      >
        <h1 className="text-5xl font-serif text-stone-800 mb-4">Confirmação de Presença</h1>
        <p className="text-stone-500 uppercase tracking-widest text-xs">Por favor, confirme até 30 dias antes do evento</p>
      </motion.div>

      <motion.form
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        onSubmit={handleSubmit}
        className="bg-white p-8 md:p-12 rounded-3xl shadow-sm border border-stone-100 space-y-6"
      >
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-widest text-stone-500 font-bold">Nome Completo</label>
            <input
              required
              type="text"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              className="w-full px-4 py-3 bg-stone-50 border border-stone-100 rounded-xl focus:outline-none focus:border-rose-200 transition-colors"
              placeholder="Como está no convite"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-widest text-stone-500 font-bold">E-mail</label>
            <input
              required
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-3 bg-stone-50 border border-stone-100 rounded-xl focus:outline-none focus:border-rose-200 transition-colors"
              placeholder="seu@email.com"
            />
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-widest text-stone-500 font-bold">Telefone</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-4 py-3 bg-stone-50 border border-stone-100 rounded-xl focus:outline-none focus:border-rose-200 transition-colors"
              placeholder="(00) 00000-0000"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-widest text-stone-500 font-bold">Adultos</label>
            <input
              required
              type="number"
              min="1"
              value={formData.adults}
              onChange={(e) => setFormData({ ...formData, adults: parseInt(e.target.value) })}
              className="w-full px-4 py-3 bg-stone-50 border border-stone-100 rounded-xl focus:outline-none focus:border-rose-200 transition-colors"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-widest text-stone-500 font-bold">Crianças</label>
            <input
              type="number"
              min="0"
              value={formData.children}
              onChange={(e) => setFormData({ ...formData, children: parseInt(e.target.value) })}
              className="w-full px-4 py-3 bg-stone-50 border border-stone-100 rounded-xl focus:outline-none focus:border-rose-200 transition-colors"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs uppercase tracking-widest text-stone-500 font-bold">Restrições Alimentares</label>
          <textarea
            value={formData.dietaryRestrictions}
            onChange={(e) => setFormData({ ...formData, dietaryRestrictions: e.target.value })}
            className="w-full px-4 py-3 bg-stone-50 border border-stone-100 rounded-xl focus:outline-none focus:border-rose-200 transition-colors h-24"
            placeholder="Ex: Vegano, Alérgico a glúten..."
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs uppercase tracking-widest text-stone-500 font-bold">Mensagem para o Casal</label>
          <textarea
            value={formData.message}
            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
            className="w-full px-4 py-3 bg-stone-50 border border-stone-100 rounded-xl focus:outline-none focus:border-rose-200 transition-colors h-32"
            placeholder="Deixe um recadinho carinhoso..."
          />
        </div>

        <button
          disabled={status === 'submitting'}
          className="w-full py-4 bg-stone-800 text-white uppercase tracking-[0.2em] text-sm font-bold rounded-xl hover:bg-stone-700 transition-colors flex items-center justify-center space-x-2 disabled:opacity-50"
        >
          {status === 'submitting' ? 'Enviando...' : (
            <>
              <span>Confirmar Presença</span>
              <Send size={18} />
            </>
          )}
        </button>
        
        {status === 'error' && (
          <p className="text-rose-500 text-center text-sm">Ocorreu um erro ao enviar. Tente novamente.</p>
        )}
      </motion.form>
    </div>
  );
}
