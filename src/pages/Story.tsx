import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { db } from '../firebase';
import { doc, onSnapshot } from 'firebase/firestore';

export default function Story() {
  const [weddingInfo, setWeddingInfo] = useState<any>(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'wedding', 'info'), (doc) => {
      if (doc.exists()) {
        setWeddingInfo(doc.data());
      }
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 py-14 md:py-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-16"
      >
        <h1 className="text-4xl md:text-5xl font-serif text-stone-800 mb-4">Nossa História</h1>
        <div className="h-px w-24 bg-rose-200 mx-auto"></div>
      </motion.div>

      <div className="grid md:grid-cols-2 gap-12 items-center mb-14">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <img
            src="https://images.unsplash.com/photo-1511285560929-80b456fea0bc?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
            alt="Couple"
            className="rounded-2xl shadow-xl grayscale hover:grayscale-0 transition-all duration-700"
            referrerPolicy="no-referrer"
          />
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="space-y-6"
        >
          <p className="text-stone-600 leading-relaxed font-light text-lg italic">
            {weddingInfo?.story || "Era uma vez... Nossa história começou de um jeito inesperado e desde então cada dia tem sido uma nova aventura. Compartilhamos sonhos, risadas e agora estamos prontos para dizer o 'sim' mais importante de nossas vidas."}
          </p>
          <p className="text-stone-600 leading-relaxed font-light">
            Ao longo desses anos, aprendemos que o amor está nos pequenos detalhes, no apoio mútuo e na vontade de construir um futuro juntos. Estamos ansiosos para celebrar o início deste novo capítulo com todos vocês.
          </p>
        </motion.div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {[
          { title: 'Primeiro encontro', text: 'Um dia simples, uma conversa leve e a certeza de que algo especial estava comecando.' },
          { title: 'Nossa caminhada', text: 'Entre planos, desafios e conquistas, aprendemos a escolher um ao outro todos os dias.' },
          { title: 'O grande sim', text: 'Agora chegou a hora de celebrar esse novo capitulo com quem amamos.' },
        ].map((item) => (
          <div key={item.title} className="bg-white border border-stone-100 rounded-2xl p-5 shadow-sm">
            <h3 className="text-2xl font-serif text-stone-800 mb-2">{item.title}</h3>
            <p className="text-stone-600 text-sm leading-relaxed">{item.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
