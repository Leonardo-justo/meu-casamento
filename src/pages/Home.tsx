import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { Heart } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Home() {
  const [weddingInfo, setWeddingInfo] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'wedding', 'info'), (doc) => {
      if (doc.exists()) {
        setWeddingInfo(doc.data());
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'wedding/info');
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const defaultDate = '2026-11-07T18:00:00-03:00';
    const targetDate = weddingInfo?.weddingDate || defaultDate;
    const target = new Date(targetDate).getTime();

    const updateTimer = () => {
      const now = new Date().getTime();
      const distance = target - now;

      if (distance < 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      setTimeLeft({
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000),
      });
    };

    updateTimer(); // Run once immediately
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [weddingInfo]);

  return (
    <div className="relative">
      {/* Hero Section */}
      <section className="h-[90vh] relative flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src={weddingInfo?.homeImageUrl || "https://images.unsplash.com/photo-1519741497674-611481863552?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80"}
            alt="Wedding Background"
            className="w-full h-full object-cover opacity-60"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#fdfaf6]"></div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="z-10 text-center px-4"
        >
          <span className="text-stone-500 uppercase tracking-[0.3em] text-sm mb-4 block">Save the Date</span>
          <h1 className="text-6xl md:text-8xl font-serif text-stone-800 mb-6">
            {weddingInfo?.coupleNames || "Bruna e Leonardo"}
          </h1>
          <div className="flex items-center justify-center space-x-4 text-stone-600 mb-8">
            <div className="h-px w-12 bg-stone-300"></div>
            <span className="text-xl font-serif italic">
              {weddingInfo?.weddingDate ? new Date(weddingInfo.weddingDate).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' }) : "07 de novembro de 2026"}
            </span>
            <div className="h-px w-12 bg-stone-300"></div>
          </div>
          
          {/* Countdown */}
          <div className="grid grid-cols-4 gap-4 max-w-md mx-auto">
            {[
              { label: 'Dias', value: timeLeft.days },
              { label: 'Horas', value: timeLeft.hours },
              { label: 'Minutos', value: timeLeft.minutes },
              { label: 'Segundos', value: timeLeft.seconds },
            ].map((item) => (
              <div key={item.label} className="flex flex-col items-center">
                <span className="text-3xl md:text-4xl font-serif text-stone-800">{item.value}</span>
                <span className="text-[10px] uppercase tracking-widest text-stone-400 mt-1">{item.label}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Welcome Section */}
      <section className="py-24 px-4 max-w-4xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="space-y-8"
        >
          <Heart className="mx-auto text-rose-200 fill-rose-200" size={32} />
          <h2 className="text-4xl font-serif text-stone-800">Sejam bem-vindos!</h2>
          <p className="text-stone-600 leading-relaxed text-lg font-light">
            Estamos muito felizes em compartilhar este momento tão especial com vocês. 
            Aqui vocês encontrarão todas as informações sobre o nosso grande dia, 
            poderão confirmar sua presença e nos ajudar a construir nosso novo lar 
            através da nossa lista de presentes.
          </p>
          <div className="pt-8 flex gap-3 justify-center flex-wrap">
            <Link
              to="/rsvp"
              className="px-8 py-3 border border-stone-800 text-stone-800 uppercase tracking-widest text-xs hover:bg-stone-800 hover:text-white transition-all"
            >
              Confirmar Presença
            </Link>
            <Link
              to="/messages"
              className="px-8 py-3 border border-rose-300 text-rose-500 uppercase tracking-widest text-xs hover:bg-rose-50 transition-all"
            >
              Enviar Recado
            </Link>
          </div>
        </motion.div>
      </section>

      <section className="max-w-6xl mx-auto px-4 pb-24">
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              title: 'Cerimônia',
              desc: weddingInfo?.ceremonyLocationName || weddingInfo?.locationName || 'Igreja',
              sub: weddingInfo?.ceremonyLocationAddress || weddingInfo?.locationAddress || 'São José do Rio Preto - SP',
              link: '/info',
              cta: 'Ver detalhes',
            },
            {
              title: 'Lista de Presentes',
              desc: 'Escolha um presente com carinho e ajude a construir nosso novo lar.',
              sub: 'Pagamento e mensagem para os noivos',
              link: '/gifts',
              cta: 'Presentear',
            },
            {
              title: 'Recados',
              desc: 'Deixe uma mensagem para guardar esse momento para sempre.',
              sub: 'Mural de mensagens dos convidados',
              link: '/messages',
              cta: 'Enviar recado',
            },
          ].map((item) => (
            <div key={item.title} className="bg-white border border-stone-100 rounded-3xl p-7 shadow-sm">
              <h3 className="text-2xl font-serif text-stone-800">{item.title}</h3>
              <p className="text-stone-600 mt-2">{item.desc}</p>
              <p className="text-xs text-stone-400 mt-2">{item.sub}</p>
              <Link to={item.link} className="inline-block mt-5 text-sm uppercase tracking-widest text-rose-500 hover:text-rose-600">
                {item.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
