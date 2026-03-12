import { useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { CheckCircle, Clock3, AlertTriangle } from 'lucide-react';

type PaymentStatus = 'pending' | 'paid' | 'failed' | 'cancelled';

interface PaymentStatusResponse {
  orderId: string;
  status: PaymentStatus;
  giftName?: string;
  totalAmount?: number;
  paymentUrl?: string | null;
  pixCode?: string | null;
  updatedAt?: string | null;
}

export default function PaymentStatusPage() {
  const { orderId } = useParams();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<PaymentStatusResponse | null>(null);

  const initialResult = searchParams.get('result');

  useEffect(() => {
    if (!orderId) {
      setError('Pedido inválido.');
      setLoading(false);
      return;
    }

    let active = true;
    let intervalId: number | undefined;

    const fetchStatus = async () => {
      try {
        const response = await fetch(`/api/payments/status/${orderId}`);
        if (!response.ok) {
          const payload = await response.json().catch(() => ({}));
          throw new Error(payload.error || 'Não foi possível consultar o pedido.');
        }
        const payload = (await response.json()) as PaymentStatusResponse;
        if (!active) return;
        setData(payload);
        setError(null);
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : 'Erro ao consultar pedido.');
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchStatus();
    intervalId = window.setInterval(fetchStatus, 5000);

    return () => {
      active = false;
      if (intervalId) window.clearInterval(intervalId);
    };
  }, [orderId]);

  const currentStatus: PaymentStatus = useMemo(() => {
    if (data?.status) return data.status;
    if (initialResult === 'success') return 'paid';
    if (initialResult === 'cancelled') return 'cancelled';
    return 'pending';
  }, [data?.status, initialResult]);

  const statusView = {
    paid: {
      title: 'Pagamento confirmado',
      description: 'Recebemos seu presente com sucesso. Muito obrigado pelo carinho!',
      icon: <CheckCircle size={64} className="text-emerald-500 mx-auto" />,
      color: 'text-emerald-700',
      box: 'bg-emerald-50 border-emerald-200',
    },
    pending: {
      title: 'Pagamento pendente',
      description: 'Seu pedido foi criado. Assim que o pagamento for confirmado, o status será atualizado aqui.',
      icon: <Clock3 size={64} className="text-amber-500 mx-auto" />,
      color: 'text-amber-700',
      box: 'bg-amber-50 border-amber-200',
    },
    failed: {
      title: 'Pagamento não concluído',
      description: 'Não foi possível confirmar o pagamento. Você pode tentar novamente.',
      icon: <AlertTriangle size={64} className="text-rose-500 mx-auto" />,
      color: 'text-rose-700',
      box: 'bg-rose-50 border-rose-200',
    },
    cancelled: {
      title: 'Pagamento cancelado',
      description: 'O pagamento foi cancelado. Se quiser, você pode refazer o presente.',
      icon: <AlertTriangle size={64} className="text-stone-500 mx-auto" />,
      color: 'text-stone-700',
      box: 'bg-stone-100 border-stone-200',
    },
  }[currentStatus];

  if (loading) {
    return <div className="max-w-3xl mx-auto px-4 py-20 text-center font-serif text-stone-700">Consultando status...</div>;
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-20">
      <div className={`rounded-3xl border p-8 text-center ${statusView.box}`}>
        {statusView.icon}
        <h1 className={`text-4xl font-serif mt-6 ${statusView.color}`}>{statusView.title}</h1>
        <p className="mt-3 text-stone-600">{statusView.description}</p>

        {error && <p className="mt-6 text-sm text-rose-700">{error}</p>}

        {data && (
          <div className="mt-8 text-left bg-white/80 border border-white rounded-2xl p-5 space-y-2 text-stone-700">
            <p>
              <strong>Pedido:</strong> {data.orderId}
            </p>
            {data.giftName && (
              <p>
                <strong>Presente:</strong> {data.giftName}
              </p>
            )}
            {typeof data.totalAmount === 'number' && (
              <p>
                <strong>Valor:</strong> R$ {data.totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            )}
            {data.updatedAt && (
              <p>
                <strong>Atualizado em:</strong> {new Date(data.updatedAt).toLocaleString('pt-BR')}
              </p>
            )}
          </div>
        )}

        <div className="mt-8 flex justify-center gap-3">
          <Link to="/gifts" className="px-5 py-3 rounded-xl bg-stone-800 text-white hover:bg-stone-700 transition-colors">
            Voltar para presentes
          </Link>
          {data?.paymentUrl && currentStatus !== 'paid' && (
            <a
              href={data.paymentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-3 rounded-xl bg-emerald-500 text-white hover:bg-emerald-600 transition-colors"
            >
              Ir para pagamento
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
