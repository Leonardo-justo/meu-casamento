import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Edit2, Trash2, X, Save, DollarSign } from 'lucide-react';

export default function AdminGifts() {
  const [user, setUser] = useState<any>(null);
  const [gifts, setGifts] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGift, setEditingGift] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: 0,
    imageUrl: '',
    totalQuantity: 1,
    availableQuantity: 1,
  });
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (!user) navigate('/admin/login');
      else setUser(user);
    });

    const unsubscribeGifts = onSnapshot(collection(db, 'gifts'), (snapshot) => {
      setGifts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubscribeAuth();
      unsubscribeGifts();
    };
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingGift) {
        await updateDoc(doc(db, 'gifts', editingGift.id), formData);
      } else {
        await addDoc(collection(db, 'gifts'), formData);
      }
      setIsModalOpen(false);
      setEditingGift(null);
      setFormData({ name: '', description: '', price: 0, imageUrl: '', totalQuantity: 1, availableQuantity: 1 });
    } catch (error) {
      console.error('Error saving gift:', error);
      alert('Erro ao salvar presente.');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este presente?')) {
      try {
        await deleteDoc(doc(db, 'gifts', id));
      } catch (error) {
        console.error('Error deleting gift:', error);
      }
    }
  };

  const openEdit = (gift: any) => {
    setEditingGift(gift);
    setFormData({
      name: gift.name,
      description: gift.description,
      price: gift.price,
      imageUrl: gift.imageUrl,
      totalQuantity: gift.totalQuantity,
      availableQuantity: gift.availableQuantity,
    });
    setIsModalOpen(true);
  };

  if (!user) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <header className="mb-12 flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-serif text-stone-800">Gerenciar Presentes</h1>
          <p className="text-stone-500 mt-2">Adicione ou edite os itens da sua lista.</p>
        </div>
        <button
          onClick={() => { setEditingGift(null); setIsModalOpen(true); }}
          className="px-8 py-3 bg-stone-800 text-white uppercase tracking-widest text-xs font-bold rounded-xl hover:bg-stone-700 transition-colors flex items-center gap-2"
        >
          <Plus size={16} />
          Novo Presente
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {gifts.map((gift) => (
          <div key={gift.id} className="bg-white p-6 rounded-3xl shadow-sm border border-stone-100 flex gap-4">
            <img src={gift.imageUrl} alt="" className="w-24 h-24 object-cover rounded-2xl" />
            <div className="flex-grow">
              <h3 className="font-serif text-lg text-stone-800">{gift.name}</h3>
              <p className="text-stone-400 text-sm">R$ {gift.price.toLocaleString('pt-BR')}</p>
              <p className="text-stone-500 text-xs mt-1">Qtd: {gift.availableQuantity}/{gift.totalQuantity}</p>
              <div className="flex gap-2 mt-4">
                <button onClick={() => openEdit(gift)} className="p-2 text-stone-400 hover:text-stone-800 transition-colors">
                  <Edit2 size={18} />
                </button>
                <button onClick={() => handleDelete(gift.id)} className="p-2 text-stone-400 hover:text-rose-500 transition-colors">
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-stone-100 flex justify-between items-center">
                <h3 className="text-2xl font-serif text-stone-800">{editingGift ? 'Editar Presente' : 'Novo Presente'}</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-stone-400 hover:text-stone-800">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-8 space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs uppercase tracking-widest text-stone-500 font-bold">Nome</label>
                    <input
                      required
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-3 bg-stone-50 border border-stone-100 rounded-xl focus:outline-none focus:border-rose-200"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs uppercase tracking-widest text-stone-500 font-bold">Preço (R$)</label>
                    <input
                      required
                      type="number"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                      className="w-full px-4 py-3 bg-stone-50 border border-stone-100 rounded-xl focus:outline-none focus:border-rose-200"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-widest text-stone-500 font-bold">Descrição</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-3 bg-stone-50 border border-stone-100 rounded-xl focus:outline-none focus:border-rose-200 h-24"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-widest text-stone-500 font-bold">URL da Imagem</label>
                  <input
                    type="text"
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                    className="w-full px-4 py-3 bg-stone-50 border border-stone-100 rounded-xl focus:outline-none focus:border-rose-200"
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs uppercase tracking-widest text-stone-500 font-bold">Quantidade Total</label>
                    <input
                      required
                      type="number"
                      value={formData.totalQuantity}
                      onChange={(e) => setFormData({ ...formData, totalQuantity: parseInt(e.target.value) })}
                      className="w-full px-4 py-3 bg-stone-50 border border-stone-100 rounded-xl focus:outline-none focus:border-rose-200"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs uppercase tracking-widest text-stone-500 font-bold">Disponível</label>
                    <input
                      required
                      type="number"
                      value={formData.availableQuantity}
                      onChange={(e) => setFormData({ ...formData, availableQuantity: parseInt(e.target.value) })}
                      className="w-full px-4 py-3 bg-stone-50 border border-stone-100 rounded-xl focus:outline-none focus:border-rose-200"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-4 bg-stone-800 text-white uppercase tracking-widest text-sm font-bold rounded-xl hover:bg-stone-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Save size={18} />
                  Salvar Presente
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
