import { motion } from 'motion/react';
import { Heart } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Farewell() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-14 md:py-24 text-center">
      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="bg-white border border-stone-100 rounded-3xl p-7 md:p-10 shadow-sm">
        <Heart className="mx-auto text-rose-300 fill-rose-300 mb-5" size={34} />
        <h1 className="text-4xl md:text-5xl font-serif text-stone-800 mb-5">Nos vemos no grande dia</h1>
        <p className="text-stone-600 leading-relaxed mb-4">
          Chegar até aqui já é motivo de gratidão. Cada confirmação, cada mensagem e cada gesto de carinho faz esse
          momento ser ainda mais especial para nós.
        </p>
        <p className="text-stone-600 leading-relaxed mb-10">
          Obrigado por fazer parte da nossa história. Estamos contando os dias para celebrar com vocês.
        </p>

        <div className="flex gap-3 justify-center flex-wrap">
          <Link to="/rsvp" className="px-6 py-3 rounded-xl bg-stone-800 text-white uppercase tracking-widest text-xs hover:bg-stone-700 transition-colors">
            Confirmar presença
          </Link>
          <Link to="/messages" className="px-6 py-3 rounded-xl border border-rose-300 text-rose-500 uppercase tracking-widest text-xs hover:bg-rose-50 transition-colors">
            Deixar recado
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
