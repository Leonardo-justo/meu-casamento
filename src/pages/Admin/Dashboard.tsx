import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { auth, db } from '../../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, onSnapshot, query, where, getDocs } from 'firebase/firestore';
import { motion } from 'motion/react';
import { Users, Gift, Image as ImageIcon, TrendingUp, DollarSign, Calendar } from 'lucide-react';

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState({
    rsvps: 0,
    giftsSold: 0,
    totalAmount: 0,
    pendingPayments: 0
  });
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        navigate('/admin/login');
      } else {
        setUser(user);
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (!user) return;

    // Fetch RSVPs count
    const unsubscribeRSVPs = onSnapshot(collection(db, 'guests'), (snapshot) => {
      setStats(prev => ({ ...prev, rsvps: snapshot.size }));
    });

    // Fetch Orders stats
    const unsubscribeOrders = onSnapshot(collection(db, 'orders'), (snapshot) => {
      let total = 0;
      let sold = 0;
      let pending = 0;
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.status === 'paid') {
          total += data.totalAmount;
          sold += data.quantity;
        } else if (data.status === 'pending' || data.status === 'awaiting_payment') {
          pending++;
        }
      });
      setStats(prev => ({ 
        ...prev, 
        totalAmount: total, 
        giftsSold: sold,
        pendingPayments: pending
      }));
    });

    return () => {
      unsubscribeRSVPs();
      unsubscribeOrders();
    };
  }, [user]);

  if (!user) return null;

  const statCards = [
    { label: 'Confirmações', value: stats.rsvps, icon: <Users className="text-blue-400" />, color: 'bg-blue-50' },
    { label: 'Presentes Ganhos', value: stats.giftsSold, icon: <Gift className="text-rose-400" />, color: 'bg-rose-50' },
    { label: 'Total Arrecadado', value: `R$ ${stats.totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, icon: <DollarSign className="text-emerald-400" />, color: 'bg-emerald-50' },
    { label: 'Pagamentos Pendentes', value: stats.pendingPayments, icon: <TrendingUp className="text-amber-400" />, color: 'bg-amber-50' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <header className="mb-12">
        <h1 className="text-4xl font-serif text-stone-800">Olá, {user.email?.split('@')[0]}</h1>
        <p className="text-stone-500 mt-2">Aqui está o resumo do seu casamento.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white p-8 rounded-3xl shadow-sm border border-stone-100"
          >
            <div className={`w-12 h-12 ${stat.color} rounded-2xl flex items-center justify-center mb-6`}>
              {stat.icon}
            </div>
            <p className="text-stone-400 text-xs uppercase tracking-widest font-bold mb-1">{stat.label}</p>
            <h3 className="text-2xl font-serif font-bold text-stone-800">{stat.value}</h3>
          </motion.div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-stone-100">
          <h3 className="text-xl font-serif text-stone-800 mb-6 flex items-center gap-2">
            <Calendar size={20} className="text-stone-400" /> Ações Rápidas
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <Link to="/admin/content" className="p-4 bg-stone-50 rounded-2xl hover:bg-stone-100 transition-colors text-center">
              <ImageIcon className="mx-auto mb-2 text-stone-400" />
              <span className="text-sm font-medium text-stone-600">Editar Conteúdo</span>
            </Link>
            <Link to="/admin/gifts" className="p-4 bg-stone-50 rounded-2xl hover:bg-stone-100 transition-colors text-center">
              <Gift className="mx-auto mb-2 text-stone-400" />
              <span className="text-sm font-medium text-stone-600">Gerenciar Presentes</span>
            </Link>
            <Link to="/admin/gallery" className="p-4 bg-stone-50 rounded-2xl hover:bg-stone-100 transition-colors text-center">
              <ImageIcon className="mx-auto mb-2 text-stone-400" />
              <span className="text-sm font-medium text-stone-600">Gerenciar Galeria</span>
            </Link>
            <Link to="/admin/rsvps" className="p-4 bg-stone-50 rounded-2xl hover:bg-stone-100 transition-colors text-center">
              <Users className="mx-auto mb-2 text-stone-400" />
              <span className="text-sm font-medium text-stone-600">Ver Convidados</span>
            </Link>
            <div className="p-4 bg-stone-50 rounded-2xl opacity-50 cursor-not-allowed text-center">
              <TrendingUp className="mx-auto mb-2 text-stone-400" />
              <span className="text-sm font-medium text-stone-600">Configurações</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl shadow-sm border border-stone-100">
          <h3 className="text-xl font-serif text-stone-800 mb-6">Últimas Confirmações</h3>
          {/* This would be a small list of recent RSVPs */}
          <p className="text-stone-400 text-sm italic">Acesse a página de RSVPs para ver a lista completa.</p>
        </div>
      </div>
    </div>
  );
}
