import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../../firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { motion } from 'motion/react';
import { Heart, Lock, Mail } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/admin');
    } catch (err: any) {
      console.error('Login error:', err);
      setError('E-mail ou senha inválidos.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 bg-[#fdfaf6]">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white p-10 rounded-3xl shadow-sm border border-stone-100"
      >
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-rose-50 rounded-full mb-4">
            <Heart className="text-rose-400 fill-rose-400" size={32} />
          </div>
          <h1 className="text-3xl font-serif text-stone-800">Área do Casal</h1>
          <p className="text-stone-400 text-sm mt-2 uppercase tracking-widest">Painel Administrativo</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-widest text-stone-500 font-bold flex items-center gap-2">
              <Mail size={14} /> E-mail
            </label>
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-stone-50 border border-stone-100 rounded-xl focus:outline-none focus:border-rose-200"
              placeholder="seu@email.com"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs uppercase tracking-widest text-stone-500 font-bold flex items-center gap-2">
              <Lock size={14} /> Senha
            </label>
            <input
              required
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-stone-50 border border-stone-100 rounded-xl focus:outline-none focus:border-rose-200"
              placeholder="••••••••"
            />
          </div>

          {error && <p className="text-rose-500 text-sm text-center">{error}</p>}

          <button
            disabled={loading}
            className="w-full py-4 bg-stone-800 text-white uppercase tracking-widest text-sm font-bold rounded-xl hover:bg-stone-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
