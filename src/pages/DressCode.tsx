import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { Shirt, Sparkles, Gem, UserRound } from 'lucide-react';

export default function DressCode() {
  const [weddingInfo, setWeddingInfo] = useState<any>(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'wedding', 'info'), (entry) => {
      if (entry.exists()) setWeddingInfo(entry.data());
    });
    return () => unsubscribe();
  }, []);

  const blocks = [
    {
      title: 'Convidadas',
      icon: <Gem className="text-rose-400" size={22} />,
      text: 'Sugerimos vestidos midi ou longos, macacões e conjuntos elegantes em tons suaves.',
    },
    {
      title: 'Convidados',
      icon: <UserRound className="text-rose-400" size={22} />,
      text: 'Sugerimos camisa social com calça de alfaiataria. Blazer é bem-vindo para um visual mais clássico.',
    },
    {
      title: 'Padrinhos e Madrinhas',
      icon: <Sparkles className="text-rose-400" size={22} />,
      text: 'Para manter harmonia visual do evento, orientações específicas serão compartilhadas diretamente com vocês.',
    },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-14 md:py-20">
      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-14">
        <p className="uppercase tracking-[0.25em] text-xs text-stone-400 mb-3">Trajes</p>
        <h1 className="text-4xl md:text-5xl font-serif text-stone-800">Dress Code</h1>
        <p className="text-stone-500 mt-4 max-w-2xl mx-auto">
          Queremos que todos estejam confortáveis e elegantes para viver esse momento com a gente.
        </p>
      </motion.div>

      <div className="mb-10 rounded-3xl bg-white border border-stone-100 p-8 shadow-sm text-center">
        <Shirt className="mx-auto text-rose-400 mb-4" size={30} />
        <h2 className="text-3xl font-serif text-stone-800 mb-3">{weddingInfo?.dressCode || 'Social / Passeio Completo'}</h2>
        <p className="text-stone-600">
          A proposta do evento é clássica e romântica. Evite roupas muito casuais para manter a harmonia do grande dia.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {blocks.map((item, index) => (
          <motion.div
            key={item.title}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white border border-stone-100 rounded-3xl p-7 shadow-sm"
          >
            <div className="mb-3">{item.icon}</div>
            <h3 className="text-2xl font-serif text-stone-800 mb-2">{item.title}</h3>
            <p className="text-stone-600 leading-relaxed">{item.text}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
