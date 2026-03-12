import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { db } from '../firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { MapPin, Clock, Calendar, Shirt } from 'lucide-react';

export default function Info() {
  const [weddingInfo, setWeddingInfo] = useState<any>(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'wedding', 'info'), (doc) => {
      if (doc.exists()) {
        setWeddingInfo(doc.data());
      }
    });
    return () => unsubscribe();
  }, []);

  const dateLabel = weddingInfo?.weddingDate
    ? new Date(weddingInfo.weddingDate).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })
    : 'Em breve';
  const timeLabel = weddingInfo?.weddingDate
    ? new Date(weddingInfo.weddingDate).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    : 'Em breve';

  return (
    <div className="max-w-6xl mx-auto px-4 py-14 md:py-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-16"
      >
        <h1 className="text-4xl md:text-5xl font-serif text-stone-800 mb-4">Informações do Evento</h1>
        <p className="text-stone-500 uppercase tracking-widest text-xs">Tudo o que você precisa saber</p>
      </motion.div>

      <div className="grid md:grid-cols-3 gap-6 mb-10">
        {[
          { title: 'Data', value: dateLabel, icon: <Calendar className="text-rose-300" size={28} /> },
          { title: 'Horario', value: timeLabel, icon: <Clock className="text-rose-300" size={28} /> },
          { title: 'Traje', value: weddingInfo?.dressCode || 'Social Completo', icon: <Shirt className="text-rose-300" size={28} /> },
        ].map((item, index) => (
          <motion.div
            key={item.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white p-7 rounded-2xl shadow-sm border border-stone-100 text-center"
          >
            <div className="flex justify-center mb-4">{item.icon}</div>
            <h3 className="text-xl font-serif text-stone-800 mb-2">{item.title}</h3>
            <p className="text-stone-600 font-light">{item.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-14">
        <div className="bg-white p-8 rounded-3xl border border-stone-100 shadow-sm">
          <p className="uppercase tracking-[0.2em] text-xs text-stone-400 mb-2">Cerimonia</p>
          <h3 className="text-3xl font-serif text-stone-800 mb-3">
            {weddingInfo?.ceremonyLocationName || weddingInfo?.locationName || 'A definir'}
          </h3>
          <p className="text-stone-600">{weddingInfo?.ceremonyLocationAddress || weddingInfo?.locationAddress || ''}</p>
          <p className="text-stone-400 text-sm mt-3">Chegue com antecedencia para iniciarmos pontualmente.</p>
        </div>
        <div className="bg-white p-8 rounded-3xl border border-stone-100 shadow-sm">
          <p className="uppercase tracking-[0.2em] text-xs text-stone-400 mb-2">Recepcao</p>
          <h3 className="text-3xl font-serif text-stone-800 mb-3">{weddingInfo?.receptionLocationName || 'A definir'}</h3>
          <p className="text-stone-600">{weddingInfo?.receptionLocationAddress || 'Sao Jose do Rio Preto - SP'}</p>
          <p className="text-stone-400 text-sm mt-3">Apos a cerimonia, vamos celebrar juntos nesse local especial.</p>
        </div>
      </div>

      {weddingInfo?.locationMapUrl && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="rounded-3xl overflow-hidden shadow-lg h-[320px] md:h-[450px] border-8 border-white"
        >
          <iframe
            src={weddingInfo.locationMapUrl}
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          ></iframe>
        </motion.div>
      )}
    </div>
  );
}
