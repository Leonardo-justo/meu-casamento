import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { addDoc, collection, deleteDoc, doc, onSnapshot, orderBy, query, updateDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { ImagePlus, Edit2, Trash2, Save, X } from 'lucide-react';

export default function AdminGallery() {
  const [user, setUser] = useState<any>(null);
  const [images, setImages] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingImage, setEditingImage] = useState<any>(null);
  const [formData, setFormData] = useState({
    url: '',
    caption: '',
    order: 1,
  });
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) navigate('/admin/login');
      else setUser(currentUser);
    });

    const imagesQuery = query(collection(db, 'gallery'), orderBy('order', 'asc'));
    const unsubscribeImages = onSnapshot(imagesQuery, (snapshot) => {
      setImages(snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() })));
    });

    return () => {
      unsubscribeAuth();
      unsubscribeImages();
    };
  }, [navigate]);

  const resetForm = () => {
    setEditingImage(null);
    setFormData({
      url: '',
      caption: '',
      order: images.length + 1,
    });
    setIsModalOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.url.trim()) {
      alert('Informe a URL/caminho da foto.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        url: formData.url.trim(),
        caption: formData.caption.trim(),
        order: Number.isFinite(formData.order) ? Math.max(1, Math.floor(formData.order)) : 1,
      };

      if (editingImage) {
        await updateDoc(doc(db, 'gallery', editingImage.id), payload);
      } else {
        await addDoc(collection(db, 'gallery'), payload);
      }
      resetForm();
    } catch (error) {
      console.error('Error saving gallery image:', error);
      alert('Erro ao salvar foto da galeria.');
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (image: any) => {
    setEditingImage(image);
    setFormData({
      url: image.url || '',
      caption: image.caption || '',
      order: Number(image.order || 1),
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (imageId: string) => {
    if (!window.confirm('Deseja realmente excluir esta foto da galeria?')) return;
    try {
      await deleteDoc(doc(db, 'gallery', imageId));
    } catch (error) {
      console.error('Error deleting gallery image:', error);
      alert('Não foi possível excluir a foto.');
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <header className="mb-12 flex flex-col md:flex-row justify-between md:items-end gap-5">
        <div>
          <h1 className="text-4xl font-serif text-stone-800">Gerenciar Galeria</h1>
          <p className="text-stone-500 mt-2">Você pode usar URL externa ou caminho local como `/fotos/nome.jpg`.</p>
        </div>
        <button
          onClick={() => {
            setEditingImage(null);
            setFormData({ url: '', caption: '', order: images.length + 1 });
            setIsModalOpen(true);
          }}
          className="px-8 py-3 bg-stone-800 text-white uppercase tracking-widest text-xs font-bold rounded-xl hover:bg-stone-700 transition-colors flex items-center gap-2"
        >
          <ImagePlus size={16} />
          Nova Foto
        </button>
      </header>

      <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4 text-sm text-amber-800 mb-8">
        Pasta de fotos locais disponível em <strong>`public/fotos/`</strong>. Basta colar suas imagens e usar no campo
        de URL o caminho: <strong>`/fotos/arquivo.jpg`</strong>.
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {images.map((image) => (
          <div key={image.id} className="bg-white p-4 rounded-3xl border border-stone-100 shadow-sm">
            <img src={image.url} alt={image.caption || 'Foto da galeria'} className="w-full h-52 object-cover rounded-2xl" />
            <div className="mt-4 space-y-1">
              <p className="text-stone-800 font-medium">{image.caption || 'Sem legenda'}</p>
              <p className="text-xs text-stone-400">Ordem: {image.order ?? '-'}</p>
              <p className="text-xs text-stone-400 truncate">{image.url}</p>
            </div>
            <div className="mt-4 flex gap-2">
              <button onClick={() => openEdit(image)} className="p-2 text-stone-400 hover:text-stone-800 transition-colors">
                <Edit2 size={18} />
              </button>
              <button
                onClick={() => handleDelete(image.id)}
                className="p-2 text-stone-400 hover:text-rose-500 transition-colors"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>

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
                <h3 className="text-2xl font-serif text-stone-800">
                  {editingImage ? 'Editar foto da galeria' : 'Nova foto da galeria'}
                </h3>
                <button onClick={resetForm} className="text-stone-400 hover:text-stone-800">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-widest text-stone-500 font-bold">URL/Caminho</label>
                  <input
                    required
                    type="text"
                    value={formData.url}
                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                    placeholder="/fotos/noivado-01.jpg"
                    className="w-full px-4 py-3 bg-stone-50 border border-stone-100 rounded-xl focus:outline-none focus:border-rose-200"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-widest text-stone-500 font-bold">Legenda</label>
                  <input
                    type="text"
                    value={formData.caption}
                    onChange={(e) => setFormData({ ...formData, caption: e.target.value })}
                    className="w-full px-4 py-3 bg-stone-50 border border-stone-100 rounded-xl focus:outline-none focus:border-rose-200"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-widest text-stone-500 font-bold">Ordem</label>
                  <input
                    required
                    type="number"
                    min="1"
                    value={formData.order}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        order: Number.isNaN(Number(e.target.value)) ? 1 : Number(e.target.value),
                      })
                    }
                    className="w-full px-4 py-3 bg-stone-50 border border-stone-100 rounded-xl focus:outline-none focus:border-rose-200"
                  />
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="w-full py-4 bg-stone-800 text-white uppercase tracking-widest text-sm font-bold rounded-xl hover:bg-stone-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  <Save size={18} />
                  {saving ? 'Salvando...' : 'Salvar foto'}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
