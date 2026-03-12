import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import { ShoppingCart, X, CreditCard, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Gifts() {
  const navigate = useNavigate();
  const [gifts, setGifts] = useState<any[]>([]);
  const [selectedGift, setSelectedGift] = useState<any>(null);
  const [quantity, setQuantity] = useState(1);
  const [guestInfo, setGuestInfo] = useState({ name: '', email: '' });
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [redirectCountdown, setRedirectCountdown] = useState<number | null>(null);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const isGitHubPages = typeof window !== 'undefined' && window.location.hostname.endsWith('github.io');

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'gifts'),
      (snapshot) => {
        const giftsList = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setGifts(giftsList);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, 'gifts');
      }
    );
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!paymentUrl) return;

    setRedirectCountdown(2);
    const intervalId = setInterval(() => {
      setRedirectCountdown((prev) => (prev && prev > 0 ? prev - 1 : 0));
    }, 1000);
    const timeoutId = setTimeout(() => {
      window.location.assign(paymentUrl);
    }, 2200);

    return () => {
      clearInterval(intervalId);
      clearTimeout(timeoutId);
    };
  }, [paymentUrl]);

  const handleBuy = async () => {
    setErrorMessage(null);

    if (isGitHubPages) {
      setErrorMessage(
        'No GitHub Pages o pagamento não funciona (não há backend). Publique no Render/Railway para liberar checkout.'
      );
      return;
    }

    if (!guestInfo.name || !guestInfo.email) {
      setErrorMessage('Por favor, preencha seu nome e e-mail.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestInfo.email)) {
      setErrorMessage('Informe um e-mail válido.');
      return;
    }
    if (!selectedGift) {
      setErrorMessage('Selecione um presente para continuar.');
      return;
    }
    if (!Number.isInteger(quantity) || quantity <= 0) {
      setErrorMessage('Quantidade inválida.');
      return;
    }
    if (quantity > selectedGift.availableQuantity) {
      setErrorMessage('Quantidade maior que o disponível.');
      return;
    }

    setIsProcessing(true);
    try {
      const response = await fetch('/api/payments/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          giftId: selectedGift.id,
          quantity,
          guestName: guestInfo.name.trim(),
          guestEmail: guestInfo.email.trim(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Erro ao criar pagamento.');
      }

      const data = await response.json();
      if (data.paymentUrl) {
        setPaymentUrl(data.paymentUrl);
      } else if (data.orderId) {
        navigate(`/payment/${data.orderId}?result=pending`);
      } else {
        setErrorMessage('Pedido criado, mas não foi possível obter o link de pagamento.');
      }
    } catch (error) {
      console.error('Error creating payment:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Erro ao processar pagamento. Tente novamente.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-20">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-16">
        <h1 className="text-5xl font-serif text-stone-800 mb-4">Lista de Presentes</h1>
        <p className="text-stone-500 max-w-2xl mx-auto font-light">
          Sua presença é o nosso maior presente, mas se você desejar nos presentear, escolhemos algumas sugestões para
          nos ajudar a começar nossa vida juntos.
        </p>
        <p className="text-xs text-stone-400 mt-3 uppercase tracking-widest">
          Obrigado por fazer parte desse momento especial
        </p>
        {isGitHubPages && (
          <p className="mt-4 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2 inline-block">
            Modo GitHub Pages: checkout desativado. Para pagamento real, publique em hospedagem com backend.
          </p>
        )}
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {gifts.map((gift, index) => (
          <motion.div
            key={gift.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            className="bg-white rounded-3xl overflow-hidden shadow-sm border border-stone-100 group hover:shadow-xl transition-all duration-500"
          >
            <div className="h-64 overflow-hidden relative">
              <img
                src={
                  gift.imageUrl ||
                  'https://images.unsplash.com/photo-1513151233558-d860c5398176?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
                }
                alt={gift.name}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                referrerPolicy="no-referrer"
              />
              <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-4 py-1 rounded-full text-stone-800 font-serif font-bold">
                R$ {Number(gift.price || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
            </div>
            <div className="p-8">
              <h3 className="text-2xl font-serif text-stone-800 mb-2">{gift.name}</h3>
              <p className="text-stone-500 text-sm font-light mb-6 line-clamp-2">{gift.description}</p>
              <button
                onClick={() => setSelectedGift(gift)}
                disabled={gift.availableQuantity <= 0}
                className="w-full py-3 bg-stone-800 text-white uppercase tracking-widest text-xs font-bold rounded-xl hover:bg-stone-700 transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 disabled:bg-stone-300"
              >
                {gift.availableQuantity > 0 ? (
                  <>
                    <ShoppingCart size={16} />
                    <span>Presentear</span>
                  </>
                ) : (
                  <span>Esgotado</span>
                )}
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {selectedGift && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-stone-100 flex justify-between items-center">
                <h3 className="text-2xl font-serif text-stone-800">Presentear</h3>
                <button
                  onClick={() => {
                    setSelectedGift(null);
                    setPaymentUrl(null);
                    setErrorMessage(null);
                    setRedirectCountdown(null);
                  }}
                  type="button"
                  className="text-stone-400 hover:text-stone-800"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="p-8">
                {!paymentUrl ? (
                  <div className="space-y-6">
                    <div className="flex items-center space-x-4">
                      <img
                        src={selectedGift.imageUrl}
                        alt=""
                        className="w-20 h-20 object-cover rounded-xl"
                        referrerPolicy="no-referrer"
                      />
                      <div>
                        <h4 className="font-serif text-xl text-stone-800">{selectedGift.name}</h4>
                        <p className="text-stone-500">
                          R$ {Number(selectedGift.price || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-xs uppercase tracking-widest text-stone-500 font-bold">Seu Nome</label>
                        <input
                          type="text"
                          value={guestInfo.name}
                          onChange={(e) => setGuestInfo({ ...guestInfo, name: e.target.value })}
                          className="w-full px-4 py-3 bg-stone-50 border border-stone-100 rounded-xl focus:outline-none focus:border-rose-200"
                          placeholder="Nome completo"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs uppercase tracking-widest text-stone-500 font-bold">Seu E-mail</label>
                        <input
                          type="email"
                          value={guestInfo.email}
                          onChange={(e) => setGuestInfo({ ...guestInfo, email: e.target.value })}
                          className="w-full px-4 py-3 bg-stone-50 border border-stone-100 rounded-xl focus:outline-none focus:border-rose-200"
                          placeholder="seu@email.com"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs uppercase tracking-widest text-stone-500 font-bold">Quantidade</label>
                        <input
                          type="number"
                          min="1"
                          max={selectedGift.availableQuantity}
                          value={quantity}
                          onChange={(e) => {
                            const parsed = Number.parseInt(e.target.value, 10);
                            setQuantity(Number.isNaN(parsed) ? 1 : parsed);
                          }}
                          className="w-full px-4 py-3 bg-stone-50 border border-stone-100 rounded-xl focus:outline-none focus:border-rose-200"
                        />
                      </div>
                    </div>

                    {errorMessage && (
                      <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                        {errorMessage}
                      </div>
                    )}

                    <div className="pt-4 border-t border-stone-100 flex justify-between items-center">
                      <span className="text-stone-500">Total:</span>
                      <span className="text-2xl font-serif font-bold text-stone-800">
                        R${' '}
                        {(Number(selectedGift.price || 0) * quantity).toLocaleString('pt-BR', {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                    </div>

                    <button
                      onClick={handleBuy}
                      disabled={isProcessing}
                      className="w-full py-4 bg-stone-800 text-white uppercase tracking-widest text-sm font-bold rounded-xl hover:bg-stone-700 transition-colors flex items-center justify-center space-x-2 disabled:opacity-50"
                    >
                      {isProcessing ? (
                        'Processando...'
                      ) : (
                        <>
                          <CreditCard size={18} />
                          <span>Ir para pagamento</span>
                        </>
                      )}
                    </button>
                  </div>
                ) : (
                  <div className="text-center py-8 space-y-6">
                    <CheckCircle className="mx-auto text-emerald-400" size={64} />
                    <h4 className="text-2xl font-serif text-stone-800">Pedido criado!</h4>
                    <p className="text-stone-600">Você será redirecionado automaticamente para finalizar o pagamento.</p>
                    <a
                      href={paymentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block w-full py-4 bg-emerald-500 text-white uppercase tracking-widest text-sm font-bold rounded-xl hover:bg-emerald-600 transition-colors"
                    >
                      Pagar agora
                    </a>
                    {redirectCountdown !== null && (
                      <p className="text-xs text-stone-400">Redirecionando em {redirectCountdown}s...</p>
                    )}
                    <p className="text-xs text-stone-400">
                      Após o pagamento, o casal será notificado automaticamente.
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
