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

  const infoItems = [
    {
      icon: <Calendar className="text-rose-300" size={32} />,
      title: 'Data',
      content: weddingInfo?.weddingDate ? new Date(weddingInfo.weddingDate).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Em breve',
    },
    {
      icon: <Clock className="text-rose-300" size={32} />,
      title: 'Horário',
      content: weddingInfo?.weddingDate ? new Date(weddingInfo.weddingDate).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : 'Em breve',
    },
    {
      icon: <MapPin className="text-rose-300" size={32} />,
      title: 'Local',
      content: weddingInfo?.ceremonyLocationName || weddingInfo?.locationName || 'A definir',
      subContent: weddingInfo?.ceremonyLocationAddress || weddingInfo?.locationAddress || '',
    },
    {
      icon: <MapPin className="text-rose-300" size={32} />,
      title: 'Recepção',
      content: weddingInfo?.receptionLocationName || 'A definir',
      subContent: weddingInfo?.receptionLocationAddress || '',
    },
    {
      icon: <MapPin className="text-rose-300" size={32} />,
      title: 'Cidade',
      content: 'São José do Rio Preto - SP',
    },
    {
      icon: <Shirt className="text-rose-300" size={32} />,
      title: 'Traje',
      content: weddingInfo?.dressCode || 'Social Completo',
    },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-16"
      >
        <h1 className="text-5xl font-serif text-stone-800 mb-4">Informações do Evento</h1>
        <p className="text-stone-500 uppercase tracking-widest text-xs">Tudo o que você precisa saber</p>
      </motion.div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-20">
        {infoItems.map((item, index) => (
          <motion.div
            key={item.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white p-8 rounded-2xl shadow-sm border border-stone-100 text-center hover:shadow-md transition-shadow"
          >
            <div className="flex justify-center mb-6">{item.icon}</div>
            <h3 className="text-xl font-serif text-stone-800 mb-2">{item.title}</h3>
            <p className="text-stone-600 font-light">{item.content}</p>
            {item.subContent && <p className="text-stone-400 text-sm mt-2">{item.subContent}</p>}
          </motion.div>
        ))}
      </div>

      {weddingInfo?.locationMapUrl && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="rounded-3xl overflow-hidden shadow-lg h-[450px] border-8 border-white"
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
