"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { collection, getDocs } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useRouter } from "next/navigation";

interface Product {
  id: string;
  preco: number;
  custo?: number;
}

interface Pedido {
  id: string;
  clienteNome?: string;
  total?: number;
  data?: string;
  timestamp?: number;
  itens?: Array<{
    nome?: string;
    preco?: number;
    qtdPedida?: number;
  }>;
}

export default function VisaoGeralPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [metrics, setMetrics] = useState({
    totalPecas: 0,
    custoTotal: 0,
    faturamentoPotencial: 0,
    lucroProjetado: 0,
  });
  const [salesMetrics, setSalesMetrics] = useState({
    totalPedidos: 0,
    faturamentoReal: 0,
    totalClientes: 0,
    pedidosPendentes: 0,
  });
  const [pedidosRecentes, setPedidosRecentes] = useState<Pedido[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const fetchMetricas = async () => {
    try {
      const prodSnap = await getDocs(collection(db, "produtos"));
      const produtos: Product[] = [];
      prodSnap.forEach((docSnap) => {
        produtos.push({ id: docSnap.id, ...docSnap.data() } as Product);
      });

      const totalPecas = produtos.length;
      const custoTotal = produtos.reduce((acc, p) => acc + (p.custo || 0), 0);
      const faturamentoPotencial = produtos.reduce((acc, p) => acc + (p.preco || 0), 0);
      const lucroProjetado = faturamentoPotencial - custoTotal;
      setMetrics({ totalPecas, custoTotal, faturamentoPotencial, lucroProjetado });

      const pedidosSnap = await getDocs(collection(db, "pedidos"));
      const pedidos: Pedido[] = [];
      pedidosSnap.forEach((docSnap) => {
        pedidos.push({ id: docSnap.id, ...docSnap.data() } as Pedido);
      });

      const totalPedidos = pedidos.length;
      const faturamentoReal = pedidos.reduce((acc, p) => {
        if (typeof p.total === "number" && !isNaN(p.total)) return acc + p.total;
        if (p.itens && Array.isArray(p.itens)) {
          return acc + p.itens.reduce((s, item) => s + ((item.preco || 0) * (item.qtdPedida || 0)), 0);
        }
        return acc;
      }, 0);

      const clientesSnap = await getDocs(collection(db, "clientes"));
      const totalClientes = clientesSnap.size;
      setSalesMetrics({ totalPedidos, faturamentoReal, totalClientes, pedidosPendentes: 0 });

      const pedidosOrdenados = [...pedidos].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
      setPedidosRecentes(pedidosOrdenados.slice(0, 5));
    } catch (error) {
      console.error("Erro ao carregar os dados de métrica:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) { setIsAuthenticated(true); await fetchMetricas(); } else { router.push("/login"); }
    });
    return () => unsubscribe();
  }, [router]);

  if (!isAuthenticated || isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center h-full min-h-[50vh]">
        <p className="text-brand-charcoal dark:text-brand-white text-lg animate-pulse font-light">Calculando indicadores da empresa...</p>
      </div>
    );
  }

  const formatBRL = (value: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

  const getTotalPedido = (pedido: Pedido): number => {
    if (typeof pedido.total === "number" && !isNaN(pedido.total)) return pedido.total;
    if (pedido.itens && Array.isArray(pedido.itens)) {
      return pedido.itens.reduce((s, item) => s + ((item.preco || 0) * (item.qtdPedida || 0)), 0);
    }
    return 0;
  };

  return (
    <div className="p-6 md:p-10 flex-1 overflow-y-auto">
      {/* Page Header */}
      <div className="mb-10">
        <h1 className="text-3xl font-serif text-brand-charcoal dark:text-brand-white mb-1">Visão Geral da Loja</h1>
        <p className="text-text-muted text-sm">Acompanhe a pulsação global financeira do portfólio da Lírio Branco.</p>
      </div>

      {/* KPIs do Estoque */}
      <h2 className="text-sm font-semibold uppercase tracking-wider text-text-muted mb-4">Estoque</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-10">
        <div className="bg-white dark:bg-[#1A1A1A] rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 p-4 md:p-6 transition-shadow hover:shadow-md">
          <h3 className="text-xs md:text-sm font-semibold uppercase tracking-wider text-text-muted dark:text-gray-400 mb-2">Total de Peças</h3>
          <p className="text-2xl md:text-4xl font-bold text-brand-charcoal dark:text-brand-white">{metrics.totalPecas}</p>
        </div>
        <div className="bg-white dark:bg-[#1A1A1A] rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 p-4 md:p-6 transition-shadow hover:shadow-md">
          <h3 className="text-xs md:text-sm font-semibold uppercase tracking-wider text-text-muted dark:text-gray-400 mb-2">Custo em Estoque</h3>
          <p className="text-xl md:text-3xl font-bold text-gray-400 dark:text-gray-500">{formatBRL(metrics.custoTotal)}</p>
        </div>
        <div className="bg-white dark:bg-[#1A1A1A] rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 p-4 md:p-6 transition-shadow hover:shadow-md">
          <h3 className="text-xs md:text-sm font-semibold uppercase tracking-wider text-text-muted dark:text-gray-400 mb-2">Fat. Potencial</h3>
          <p className="text-xl md:text-3xl font-bold text-brand-charcoal dark:text-brand-white">{formatBRL(metrics.faturamentoPotencial)}</p>
        </div>
        <div className="bg-white dark:bg-[#1A1A1A] rounded-xl shadow-sm border border-brand-rose/20 dark:border-brand-rose/10 p-4 md:p-6 transition-shadow hover:shadow-md relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-brand-rose/5 rounded-bl-[100px]" />
          <h3 className="text-xs md:text-sm font-semibold uppercase tracking-wider text-brand-rose mb-2 relative z-10">Lucro Projetado</h3>
          <p className="text-2xl md:text-4xl font-bold text-emerald-600 dark:text-emerald-400 relative z-10">{formatBRL(metrics.lucroProjetado)}</p>
        </div>
      </div>

      {/* KPIs de Vendas */}
      <h2 className="text-sm font-semibold uppercase tracking-wider text-text-muted mb-4">Vendas</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-10">
        <div className="bg-white dark:bg-[#1A1A1A] rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 p-4 md:p-6 transition-shadow hover:shadow-md">
          <h3 className="text-xs md:text-sm font-semibold uppercase tracking-wider text-text-muted dark:text-gray-400 mb-2">Total de Pedidos</h3>
          <p className="text-2xl md:text-4xl font-bold text-brand-charcoal dark:text-brand-white">{salesMetrics.totalPedidos}</p>
        </div>
        <div className="bg-white dark:bg-[#1A1A1A] rounded-xl shadow-sm border border-emerald-100 dark:border-emerald-900/30 p-4 md:p-6 transition-shadow hover:shadow-md">
          <h3 className="text-xs md:text-sm font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-2">Faturamento Real</h3>
          <p className="text-xl md:text-3xl font-bold text-emerald-600 dark:text-emerald-400">{formatBRL(salesMetrics.faturamentoReal)}</p>
        </div>
        <div className="bg-white dark:bg-[#1A1A1A] rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 p-4 md:p-6 transition-shadow hover:shadow-md">
          <h3 className="text-xs md:text-sm font-semibold uppercase tracking-wider text-text-muted dark:text-gray-400 mb-2">Clientes Cadastrados</h3>
          <p className="text-2xl md:text-4xl font-bold text-brand-charcoal dark:text-brand-white">{salesMetrics.totalClientes}</p>
        </div>
      </div>

      {/* Últimos Pedidos */}
      <h2 className="text-sm font-semibold uppercase tracking-wider text-text-muted mb-4">Últimos Pedidos</h2>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {pedidosRecentes.length === 0 ? (
          <div className="bg-white dark:bg-[#1A1A1A] rounded-xl border border-gray-100 dark:border-gray-800 p-8 text-center text-text-muted">Nenhum pedido registrado ainda.</div>
        ) : (
          pedidosRecentes.map((pedido) => {
            const qtdItens = pedido.itens?.reduce((s, i) => s + (i.qtdPedida || 0), 0) || 0;
            return (
              <div key={pedido.id} className="bg-white dark:bg-[#1A1A1A] rounded-xl border border-gray-100 dark:border-gray-800 p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-brand-charcoal dark:text-brand-white font-medium text-sm">{pedido.clienteNome || "Não informado"}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{pedido.data || "—"}</p>
                  </div>
                  <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 px-2.5 py-1 rounded-full font-medium shrink-0">
                    {qtdItens} {qtdItens === 1 ? "peça" : "peças"}
                  </span>
                </div>
                <div className="mt-2 pt-2 border-t border-gray-50 dark:border-gray-800 text-right">
                  <p className="text-sm font-semibold text-brand-charcoal dark:text-brand-white">{formatBRL(getTotalPedido(pedido))}</p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block bg-white dark:bg-[#1A1A1A] rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800 text-xs uppercase tracking-wider text-text-muted dark:text-gray-400">
              <th className="px-6 py-4 font-semibold">Cliente</th>
              <th className="px-6 py-4 font-semibold">Data</th>
              <th className="px-6 py-4 font-semibold">Itens</th>
              <th className="px-6 py-4 font-semibold text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
            {pedidosRecentes.length === 0 ? (
              <tr><td colSpan={4} className="px-6 py-12 text-center text-text-muted">Nenhum pedido registrado ainda.</td></tr>
            ) : (
              pedidosRecentes.map((pedido) => {
                const qtdItens = pedido.itens?.reduce((s, i) => s + (i.qtdPedida || 0), 0) || 0;
                return (
                  <tr key={pedido.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-6 py-4"><p className="text-brand-charcoal dark:text-brand-white font-medium text-sm">{pedido.clienteNome || "Não informado"}</p></td>
                    <td className="px-6 py-4"><p className="text-sm text-gray-500 dark:text-gray-400">{pedido.data || "—"}</p></td>
                    <td className="px-6 py-4">
                      <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 px-2.5 py-1 rounded-full font-medium">{qtdItens} {qtdItens === 1 ? "peça" : "peças"}</span>
                    </td>
                    <td className="px-6 py-4 text-right"><p className="text-sm font-semibold text-brand-charcoal dark:text-brand-white">{formatBRL(getTotalPedido(pedido))}</p></td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
