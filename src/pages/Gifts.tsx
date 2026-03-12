import { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { collection, onSnapshot } from 'firebase/firestore';
import { CreditCard, Minus, Plus, Send, ShoppingCart, Trash2 } from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { useNavigate } from 'react-router-dom';

type GiftItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  availableQuantity: number;
};

type CartItem = GiftItem & { quantity: number };

const PRINTED_CARD_FEE = 19.9;

const funnyFallbackGifts: GiftItem[] = [
  {
    id: 'fun-1',
    name: 'Kit Sobrevivencia ao Casamento',
    description: 'Cafe forte, chocolate e paciencia para as segundas-feiras a dois.',
    price: 89.9,
    imageUrl: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1200&q=80',
    availableQuantity: 20,
  },
  {
    id: 'fun-2',
    name: 'Vale 1 DR com final feliz',
    description: 'Contribua para um futuro com dialogo e abracos reconciliadores.',
    price: 59.9,
    imageUrl: 'https://images.unsplash.com/photo-1516589091380-5d8e87df6999?auto=format&fit=crop&w=1200&q=80',
    availableQuantity: 50,
  },
  {
    id: 'fun-3',
    name: 'Panela Anti-Miojo da Crise',
    description: 'Para incentivar jantares dignos e evitar miojo por impulso.',
    price: 149.9,
    imageUrl: 'https://images.unsplash.com/photo-1584990347449-a3e36f7e87f9?auto=format&fit=crop&w=1200&q=80',
    availableQuantity: 15,
  },
  {
    id: 'fun-4',
    name: 'Fundo Lua de Mel 2.0',
    description: 'Ajude no upgrade da viagem com sobremesa extra e passeio romântico.',
    price: 199.9,
    imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
    availableQuantity: 60,
  },
  {
    id: 'fun-5',
    name: 'Assinatura anual de Pizza em Casal',
    description: 'Porque todo casamento feliz tem pelo menos uma noite de pizza por semana.',
    price: 129.9,
    imageUrl: 'https://images.unsplash.com/photo-1604382355076-af4b0eb60143?auto=format&fit=crop&w=1200&q=80',
    availableQuantity: 30,
  },
  {
    id: 'fun-6',
    name: 'Combo Controle Remoto da Paz',
    description: 'Contribuicao para evitar disputa de serie no sofa.',
    price: 79.9,
    imageUrl: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?auto=format&fit=crop&w=1200&q=80',
    availableQuantity: 40,
  },
];

export default function Gifts() {
  const navigate = useNavigate();
  const [dbGifts, setDbGifts] = useState<GiftItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [includePrintedCard, setIncludePrintedCard] = useState(true);
  const [cardSignerName, setCardSignerName] = useState('');
  const [cardMessage, setCardMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const isGitHubPages = typeof window !== 'undefined' && window.location.hostname.endsWith('github.io');

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'gifts'),
      (snapshot) => {
        const list = snapshot.docs.map((entry) => ({ id: entry.id, ...(entry.data() as any) })) as GiftItem[];
        setDbGifts(list);
      },
      (error) => handleFirestoreError(error, OperationType.LIST, 'gifts')
    );
    return () => unsubscribe();
  }, []);

  const catalog = dbGifts.length > 0 ? dbGifts : funnyFallbackGifts;
  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const giftsSubtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const cardFee = includePrintedCard ? PRINTED_CARD_FEE : 0;
  const total = giftsSubtotal + cardFee;
  const cardCharsLeft = Math.max(0, 400 - cardMessage.length);

  const addToCart = (gift: GiftItem) => {
    setErrorMessage(null);
    setCart((prev) => {
      const existing = prev.find((item) => item.id === gift.id);
      if (existing) {
        if (existing.quantity >= Number(gift.availableQuantity || 0)) return prev;
        return prev.map((item) => (item.id === gift.id ? { ...item, quantity: item.quantity + 1 } : item));
      }
      return [...prev, { ...gift, quantity: 1 }];
    });
  };

  const updateQuantity = (giftId: string, nextQuantity: number) => {
    setCart((prev) => {
      if (nextQuantity <= 0) return prev.filter((item) => item.id !== giftId);
      return prev.map((item) => {
        if (item.id !== giftId) return item;
        const max = Math.max(1, Number(item.availableQuantity || 1));
        return { ...item, quantity: Math.min(max, nextQuantity) };
      });
    });
  };

  const clearCart = () => setCart([]);

  const canCheckout = useMemo(() => {
    if (cart.length === 0) return false;
    if (!guestName.trim() || !guestEmail.trim()) return false;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestEmail.trim())) return false;
    if (includePrintedCard && !cardMessage.trim()) return false;
    return true;
  }, [cart.length, guestName, guestEmail, includePrintedCard, cardMessage]);

  const finishPurchase = async () => {
    setErrorMessage(null);
    if (isGitHubPages) {
      setErrorMessage('No GitHub Pages o pagamento nao funciona. Para checkout real, publique com backend.');
      return;
    }
    if (!canCheckout) {
      setErrorMessage('Preencha os dados do comprador e mensagem do cartao para continuar.');
      return;
    }

    setIsProcessing(true);
    try {
      const response = await fetch('/api/payments/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guestName: guestName.trim(),
          guestEmail: guestEmail.trim(),
          cartItems: cart.map((item) => ({
            giftId: item.id,
            name: item.name,
            unitPrice: Number(item.price),
            quantity: Number(item.quantity),
          })),
          printedCard: {
            enabled: includePrintedCard,
            signerName: includePrintedCard ? (cardSignerName.trim() || guestName.trim()) : '',
            message: includePrintedCard ? cardMessage.trim() : '',
            fee: includePrintedCard ? PRINTED_CARD_FEE : 0,
          },
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || 'Nao foi possivel concluir sua compra agora.');
      }

      const data = await response.json();
      if (data.paymentUrl) {
        window.location.assign(data.paymentUrl);
        return;
      }
      if (data.orderId) {
        navigate(`/payment/${data.orderId}?result=pending`);
        return;
      }
      throw new Error('Pedido criado sem link de pagamento.');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Erro inesperado ao finalizar compra.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-14 md:py-20">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-serif text-stone-800 mb-4">Lista de Presentes</h1>
        <p className="text-stone-500 max-w-3xl mx-auto">
          Escolha ate tres presentes por compra e, se quiser, envie uma carta para ser impressa e entregue ao casal.
        </p>
        <p className="text-xs text-stone-400 mt-3 uppercase tracking-widest">Carrinho: {cartCount} item(ns)</p>
      </motion.div>

      <div className="grid lg:grid-cols-[1.5fr_1fr] gap-8">
        <div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {catalog.map((gift, index) => {
              const inCartQty = cart.find((item) => item.id === gift.id)?.quantity || 0;
              const maxReached = inCartQty >= Number(gift.availableQuantity || 0);
              return (
                <motion.div
                  key={gift.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.04 }}
                  className="bg-white rounded-3xl border border-stone-100 overflow-hidden shadow-sm"
                >
                  <img
                    src={gift.imageUrl}
                    alt={gift.name}
                    className="w-full h-56 object-cover"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      e.currentTarget.src =
                        'https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=1000&q=80';
                    }}
                  />
                  <div className="p-6">
                    <h3 className="text-2xl font-serif text-stone-800">{gift.name}</h3>
                    <p className="text-sm text-stone-500 mt-1 mb-3">{gift.description}</p>
                    <div className="flex items-center justify-between mb-4">
                      <span className="font-serif text-xl text-stone-800">
                        R$ {Number(gift.price || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                      <span className="text-xs text-stone-400">Disponivel: {gift.availableQuantity}</span>
                    </div>
                    <button
                      onClick={() => addToCart(gift)}
                      disabled={maxReached || cartCount >= 3}
                      className="w-full py-3 rounded-xl bg-stone-800 text-white uppercase tracking-widest text-xs font-bold hover:bg-stone-700 disabled:opacity-60"
                    >
                      {maxReached ? 'Limite atingido' : cartCount >= 3 ? 'Maximo de 3 itens' : 'Adicionar ao carrinho'}
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-stone-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-serif text-stone-800 flex items-center gap-2">
                <ShoppingCart size={20} className="text-stone-500" />
                Meu carrinho
              </h2>
              {cart.length > 0 && (
                <button onClick={clearCart} className="text-xs uppercase tracking-widest text-stone-400 hover:text-rose-500">
                  Limpar
                </button>
              )}
            </div>

            {cart.length === 0 ? (
              <p className="text-stone-400 text-sm">Seu carrinho esta vazio.</p>
            ) : (
              <div className="space-y-3">
                {cart.map((item) => (
                  <div key={item.id} className="border border-stone-100 rounded-2xl p-3">
                    <div className="flex justify-between gap-3">
                      <div>
                        <p className="font-serif text-stone-800">{item.name}</p>
                        <p className="text-xs text-stone-400">
                          R$ {item.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                      <button onClick={() => updateQuantity(item.id, 0)} className="text-stone-300 hover:text-rose-500">
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="w-7 h-7 rounded-lg border border-stone-200 flex items-center justify-center"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="w-8 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="w-7 h-7 rounded-lg border border-stone-200 flex items-center justify-center"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                      <p className="font-medium text-stone-700">
                        R$ {(item.quantity * item.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-3xl border border-stone-100 shadow-sm p-6 space-y-4">
            <h2 className="text-2xl font-serif text-stone-800">Resumo da compra</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-stone-600">
                <span>Valor dos presentes</span>
                <span>R$ {giftsSubtotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-stone-600">
                <span>Carta impressa</span>
                <span>{includePrintedCard ? `R$ ${cardFee.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'Removido'}</span>
              </div>
              <div className="border-t border-stone-100 pt-2 flex justify-between font-serif text-stone-800 text-xl">
                <span>Total</span>
                <span>R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs uppercase tracking-widest text-stone-500 font-bold">Nome de quem compra</label>
              <input
                type="text"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                className="w-full px-4 py-3 bg-stone-50 border border-stone-100 rounded-xl focus:outline-none focus:border-rose-200"
                placeholder="Seu nome"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-widest text-stone-500 font-bold">E-mail</label>
              <input
                type="email"
                value={guestEmail}
                onChange={(e) => setGuestEmail(e.target.value)}
                className="w-full px-4 py-3 bg-stone-50 border border-stone-100 rounded-xl focus:outline-none focus:border-rose-200"
                placeholder="seu@email.com"
              />
            </div>

            <div className="rounded-2xl border border-stone-100 p-4 space-y-3">
              <label className="flex items-center gap-2 text-sm text-stone-700">
                <input
                  type="checkbox"
                  checked={includePrintedCard}
                  onChange={(e) => setIncludePrintedCard(e.target.checked)}
                />
                Quero enviar uma carta impressa para o casal
              </label>

              {includePrintedCard && (
                <>
                  <input
                    type="text"
                    value={cardSignerName}
                    onChange={(e) => setCardSignerName(e.target.value)}
                    className="w-full px-4 py-3 bg-stone-50 border border-stone-100 rounded-xl focus:outline-none focus:border-rose-200"
                    placeholder="Nome para assinar no cartao"
                  />
                  <textarea
                    value={cardMessage}
                    onChange={(e) => setCardMessage(e.target.value)}
                    maxLength={400}
                    className="w-full h-28 px-4 py-3 bg-stone-50 border border-stone-100 rounded-xl focus:outline-none focus:border-rose-200"
                    placeholder="Escreva seu recado para ser impresso..."
                  />
                  <p className="text-xs text-stone-400">{cardCharsLeft} caracteres restantes</p>
                </>
              )}
            </div>

            {errorMessage && (
              <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{errorMessage}</p>
            )}

            <button
              onClick={finishPurchase}
              disabled={!canCheckout || isProcessing}
              className="w-full py-4 bg-stone-800 text-white uppercase tracking-widest text-sm font-bold rounded-xl hover:bg-stone-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              <CreditCard size={18} />
              {isProcessing ? 'Processando compra...' : 'Concluir compra'}
            </button>

            {isGitHubPages && (
              <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                Modo GitHub Pages: checkout desativado (sem backend).
              </p>
            )}
            <p className="text-xs text-stone-400">
              Ao concluir a compra, o pedido e a carta ficam registrados e o casal recebe no painel.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
