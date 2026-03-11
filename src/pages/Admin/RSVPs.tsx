import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { motion } from 'motion/react';
import { Download, Search, Users, Mail, Phone, MessageSquare } from 'lucide-react';

export default function AdminRSVPs() {
  const [user, setUser] = useState<any>(null);
  const [guests, setGuests] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [messageFilter, setMessageFilter] = useState<'all' | 'with' | 'without'>('all');
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (!user) navigate('/admin/login');
      else setUser(user);
    });

    const q = query(collection(db, 'guests'), orderBy('confirmedAt', 'desc'));
    const unsubscribeGuests = onSnapshot(q, (snapshot) => {
      setGuests(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubscribeAuth();
      unsubscribeGuests();
    };
  }, [navigate]);

  const filteredGuests = guests.filter((guest) => {
    const fullName = (guest.fullName || '').toLowerCase();
    const email = (guest.email || '').toLowerCase();
    const hasMessage = Boolean((guest.message || '').trim());

    const matchSearch = fullName.includes(searchTerm.toLowerCase()) || email.includes(searchTerm.toLowerCase());
    if (!matchSearch) return false;
    if (messageFilter === 'with') return hasMessage;
    if (messageFilter === 'without') return !hasMessage;
    return true;
  });

  const escapeCsv = (value: unknown) => {
    const text = String(value ?? '');
    return `"${text.replace(/"/g, '""')}"`;
  };

  const exportToCSV = () => {
    const headers = ['Nome', 'Email', 'Telefone', 'Adultos', 'Crianças', 'Restrições', 'Mensagem', 'Data'];
    const rows = guests.map(g => [
      g.fullName,
      g.email,
      g.phone,
      g.adults,
      g.children,
      g.dietaryRestrictions,
      g.message,
      new Date(g.confirmedAt).toLocaleString('pt-BR')
    ]);

    const csvContent = [headers, ...rows]
      .map((line) => line.map((value) => escapeCsv(value)).join(','))
      .join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "lista_convidados.csv");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!user) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <header className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="text-4xl font-serif text-stone-800">Confirmações de Presença</h1>
          <p className="text-stone-500 mt-2">
            Total de {guests.length} confirmações recebidas ({filteredGuests.length} exibidas).
          </p>
        </div>
        <div className="flex w-full md:w-auto gap-4 flex-wrap">
          <div className="relative flex-grow md:w-64">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
            <input
              type="text"
              placeholder="Buscar convidado..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border border-stone-100 rounded-xl focus:outline-none focus:border-rose-200 shadow-sm"
            />
          </div>
          <select
            value={messageFilter}
            onChange={(e) => setMessageFilter(e.target.value as 'all' | 'with' | 'without')}
            className="px-4 py-3 bg-white border border-stone-100 rounded-xl text-sm text-stone-600 focus:outline-none focus:border-rose-200 shadow-sm"
          >
            <option value="all">Todas mensagens</option>
            <option value="with">Com mensagem</option>
            <option value="without">Sem mensagem</option>
          </select>
          <button
            onClick={exportToCSV}
            className="px-6 py-3 bg-white border border-stone-100 text-stone-600 uppercase tracking-widest text-xs font-bold rounded-xl hover:bg-stone-50 transition-colors flex items-center gap-2 shadow-sm"
          >
            <Download size={16} />
            Exportar CSV
          </button>
        </div>
      </header>

      <div className="bg-white rounded-3xl shadow-sm border border-stone-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-100">
                <th className="px-8 py-4 text-xs uppercase tracking-widest text-stone-400 font-bold">Convidado</th>
                <th className="px-8 py-4 text-xs uppercase tracking-widest text-stone-400 font-bold">Acompanhantes</th>
                <th className="px-8 py-4 text-xs uppercase tracking-widest text-stone-400 font-bold">Contato</th>
                <th className="px-8 py-4 text-xs uppercase tracking-widest text-stone-400 font-bold">Mensagem</th>
                <th className="px-8 py-4 text-xs uppercase tracking-widest text-stone-400 font-bold">Data</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-50">
              {filteredGuests.map((guest) => (
                <tr key={guest.id} className="hover:bg-stone-50/50 transition-colors">
                  <td className="px-8 py-6">
                    <div className="font-serif text-lg text-stone-800">{guest.fullName}</div>
                    {guest.dietaryRestrictions && (
                      <div className="text-xs text-rose-400 mt-1">🍴 {guest.dietaryRestrictions}</div>
                    )}
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2 text-stone-600">
                      <Users size={16} className="text-stone-300" />
                      <span>{guest.adults} Adultos</span>
                      {guest.children > 0 && <span>, {guest.children} Crianças</span>}
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-stone-500 text-sm">
                        <Mail size={14} className="text-stone-300" /> {guest.email}
                      </div>
                      {guest.phone && (
                        <div className="flex items-center gap-2 text-stone-500 text-sm">
                          <Phone size={14} className="text-stone-300" /> {guest.phone}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-8 py-6 align-top">
                    {guest.message ? (
                      <div className="max-w-xs">
                        <div className="flex items-center gap-2 text-stone-500 mb-1">
                          <MessageSquare size={16} className="text-stone-300" />
                          <span className="text-xs uppercase tracking-wide">Mensagem</span>
                        </div>
                        <p className="text-sm text-stone-600 line-clamp-3 whitespace-pre-wrap">{guest.message}</p>
                      </div>
                    ) : (
                      <span className="text-stone-200">-</span>
                    )}
                  </td>
                  <td className="px-8 py-6 text-stone-400 text-sm">
                    {new Date(guest.confirmedAt).toLocaleDateString('pt-BR')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredGuests.length === 0 && (
          <div className="p-20 text-center text-stone-400 font-serif">
            Nenhuma confirmação encontrada.
          </div>
        )}
      </div>
    </div>
  );
}
