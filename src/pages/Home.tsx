import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { Heart } from 'lucide-react';
import Story from './Story';
import Info from './Info';
import DressCode from './DressCode';
import Gifts from './Gifts';
import Messages from './Messages';
import Gallery from './Gallery';
import RSVP from './RSVP';
import Farewell from './Farewell';

export default function Home() {
  const [weddingInfo, setWeddingInfo] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const unsubscribe = onSnapshot(
      doc(db, 'wedding', 'info'),
      (entry) => {
        if (entry.exists()) {
          setWeddingInfo(entry.data());
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, 'wedding/info');
      }
    );
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

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [weddingInfo]);

  return (
    <div className="relative">
      <section id="inicio" className="scroll-mt-28 h-[90vh] relative flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src={
              weddingInfo?.homeImageUrl ||
              'https://images.unsplash.com/photo-1519741497674-611481863552?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80'
            }
            alt="Wedding Background"
            className="w-full h-full object-cover opacity-60"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#fdfaf6]" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="z-10 text-center px-4"
        >
          <span className="text-stone-500 uppercase tracking-[0.3em] text-sm mb-4 block">Save the Date</span>
          <h1 className="text-5xl md:text-8xl font-serif text-stone-800 mb-6">
            {weddingInfo?.coupleNames || 'Bruna e Leonardo'}
          </h1>
          <div className="flex items-center justify-center space-x-4 text-stone-600 mb-8">
            <div className="h-px w-12 bg-stone-300" />
            <span className="text-xl font-serif italic">
              {weddingInfo?.weddingDate
                ? new Date(weddingInfo.weddingDate).toLocaleDateString('pt-BR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })
                : '07 de novembro de 2026'}
            </span>
            <div className="h-px w-12 bg-stone-300" />
          </div>

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

      <section className="py-16 px-4 max-w-4xl mx-auto text-center">
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="space-y-8">
          <Heart className="mx-auto text-rose-200 fill-rose-200" size={32} />
          <h2 className="text-4xl font-serif text-stone-800">Sejam bem-vindos!</h2>
          <p className="text-stone-600 leading-relaxed text-lg font-light">
            Com o coracao cheio de gratidao, criamos este espacinho para compartilhar cada detalhe do nosso grande dia.
            Role a pagina para ver tudo e use o menu para ir direto ao que voce procura.
          </p>
        </motion.div>
      </section>

      <section id="historia" className="scroll-mt-28">
        <Story />
      </section>
      <section id="cerimonia" className="scroll-mt-28">
        <Info />
      </section>
      <section id="trajes" className="scroll-mt-28">
        <DressCode />
      </section>
      <section id="presentes" className="scroll-mt-28">
        <Gifts />
      </section>
      <section id="recados" className="scroll-mt-28">
        <Messages />
      </section>
      <section id="galeria" className="scroll-mt-28">
        <Gallery />
      </section>
      <section id="rsvp" className="scroll-mt-28">
        <RSVP />
      </section>
      <section id="ate-breve" className="scroll-mt-28">
        <Farewell />
      </section>
    </div>
  );
}
