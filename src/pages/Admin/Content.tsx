import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore';
import { motion } from 'motion/react';
import { Save, Image as ImageIcon, MapPin, Calendar, Type } from 'lucide-react';

export default function AdminContent() {
  const [user, setUser] = useState<any>(null);
  const [formData, setFormData] = useState({
    coupleNames: '',
    weddingDate: '',
    story: '',
    locationName: '',
    locationAddress: '',
    locationMapUrl: '',
    dressCode: '',
    homeImageUrl: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (!user) navigate('/admin/login');
      else setUser(user);
    });

    const unsubscribeData = onSnapshot(doc(db, 'wedding', 'info'), (doc) => {
      if (doc.exists()) {
        setFormData(doc.data() as any);
      }
      setLoading(false);
    });

    return () => {
      unsubscribeAuth();
      unsubscribeData();
    };
  }, [navigate]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await setDoc(doc(db, 'wedding', 'info'), formData, { merge: true });
      alert('Conteúdo atualizado com sucesso!');
    } catch (error) {
      console.error('Error saving content:', error);
      alert('Erro ao salvar conteúdo.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-20 text-center font-serif">Carregando...</div>;

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <header className="mb-12 flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-serif text-stone-800">Editar Conteúdo</h1>
          <p className="text-stone-500 mt-2">Gerencie as informações principais do site.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-8 py-3 bg-stone-800 text-white uppercase tracking-widest text-xs font-bold rounded-xl hover:bg-stone-700 transition-colors flex items-center gap-2"
        >
          <Save size={16} />
          {saving ? 'Salvando...' : 'Salvar Alterações'}
        </button>
      </header>

      <form onSubmit={handleSave} className="grid md:grid-cols-2 gap-8">
        {/* Basic Info */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-stone-100 space-y-6">
          <h3 className="text-xl font-serif text-stone-800 flex items-center gap-2">
            <Type size={20} className="text-stone-400" /> Informações Básicas
          </h3>
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-widest text-stone-500 font-bold">Nomes do Casal</label>
            <input
              type="text"
              value={formData.coupleNames}
              onChange={(e) => setFormData({ ...formData, coupleNames: e.target.value })}
              className="w-full px-4 py-3 bg-stone-50 border border-stone-100 rounded-xl focus:outline-none focus:border-rose-200"
              placeholder="Ex: Bruna e Leonardo"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-widest text-stone-500 font-bold">Data e Hora</label>
            <input
              type="datetime-local"
              value={formData.weddingDate}
              onChange={(e) => setFormData({ ...formData, weddingDate: e.target.value })}
              className="w-full px-4 py-3 bg-stone-50 border border-stone-100 rounded-xl focus:outline-none focus:border-rose-200"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-widest text-stone-500 font-bold">Nossa História</label>
            <textarea
              value={formData.story}
              onChange={(e) => setFormData({ ...formData, story: e.target.value })}
              className="w-full px-4 py-3 bg-stone-50 border border-stone-100 rounded-xl focus:outline-none focus:border-rose-200 h-32"
            />
          </div>
        </div>

        {/* Location & Style */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-stone-100 space-y-6">
          <h3 className="text-xl font-serif text-stone-800 flex items-center gap-2">
            <MapPin size={20} className="text-stone-400" /> Local e Estilo
          </h3>
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-widest text-stone-500 font-bold">Nome do Local</label>
            <input
              type="text"
              value={formData.locationName}
              onChange={(e) => setFormData({ ...formData, locationName: e.target.value })}
              className="w-full px-4 py-3 bg-stone-50 border border-stone-100 rounded-xl focus:outline-none focus:border-rose-200"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-widest text-stone-500 font-bold">Endereço</label>
            <input
              type="text"
              value={formData.locationAddress}
              onChange={(e) => setFormData({ ...formData, locationAddress: e.target.value })}
              className="w-full px-4 py-3 bg-stone-50 border border-stone-100 rounded-xl focus:outline-none focus:border-rose-200"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-widest text-stone-500 font-bold">Google Maps Embed URL</label>
            <input
              type="text"
              value={formData.locationMapUrl}
              onChange={(e) => setFormData({ ...formData, locationMapUrl: e.target.value })}
              className="w-full px-4 py-3 bg-stone-50 border border-stone-100 rounded-xl focus:outline-none focus:border-rose-200"
              placeholder="https://www.google.com/maps/embed?..."
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-widest text-stone-500 font-bold">Traje (Dress Code)</label>
            <input
              type="text"
              value={formData.dressCode}
              onChange={(e) => setFormData({ ...formData, dressCode: e.target.value })}
              className="w-full px-4 py-3 bg-stone-50 border border-stone-100 rounded-xl focus:outline-none focus:border-rose-200"
            />
          </div>
        </div>

        {/* Images */}
        <div className="md:col-span-2 bg-white p-8 rounded-3xl shadow-sm border border-stone-100 space-y-6">
          <h3 className="text-xl font-serif text-stone-800 flex items-center gap-2">
            <ImageIcon size={20} className="text-stone-400" /> Imagem de Capa
          </h3>
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-widest text-stone-500 font-bold">URL da Imagem</label>
              <input
                type="text"
                value={formData.homeImageUrl}
                onChange={(e) => setFormData({ ...formData, homeImageUrl: e.target.value })}
                className="w-full px-4 py-3 bg-stone-50 border border-stone-100 rounded-xl focus:outline-none focus:border-rose-200"
              />
            </div>
            {formData.homeImageUrl && (
              <div className="h-40 rounded-2xl overflow-hidden border border-stone-100">
                <img src={formData.homeImageUrl} alt="Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              </div>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
