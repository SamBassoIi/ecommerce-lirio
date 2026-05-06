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
      // Produtos (estoque)
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

      // Pedidos (vendas reais — campos: clienteNome, data, total, timestamp, itens[].qtdPedida)
      const pedidosSnap = await getDocs(collection(db, "pedidos"));
      const pedidos: Pedido[] = [];
      pedidosSnap.forEach((docSnap) => {
        pedidos.push({ id: docSnap.id, ...docSnap.data() } as Pedido);
      });

      const totalPedidos = pedidos.length;

      const faturamentoReal = pedidos.reduce((acc, p) => {
        if (typeof p.total === "number" && !isNaN(p.total)) return acc + p.total;
        // Fallback: soma preço * qtdPedida de cada item
        if (p.itens && Array.isArray(p.itens)) {
          return acc + p.itens.reduce((s, item) => {
            return s + ((item.preco || 0) * (item.qtdPedida || 0));
          }, 0);
        }
        return acc;
      }, 0);

      // Clientes (campos: nome, tel, obs)
      const clientesSnap = await getDocs(collection(db, "clientes"));
      const totalClientes = clientesSnap.size;

      setSalesMetrics({ totalPedidos, faturamentoReal, totalClientes, pedidosPendentes: 0 });

      // Últimos 5 pedidos (ordenados por timestamp)
      const pedidosOrdenados = [...pedidos].sort((a, b) => {
        return (b.timestamp || 0) - (a.timestamp || 0);
      });
      setPedidosRecentes(pedidosOrdenados.slice(0, 5));
    } catch (error) {
      console.error("Erro ao carregar os dados de métrica:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setIsAuthenticated(true);
        await fetchMetricas();
      } else {
        router.push("/login");
      }
    });
    return () => unsubscribe();
  }, [router]);

  if (!isAuthenticated || isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center h-full min-h-[50vh]">
        <p className="text-brand-charcoal text-lg animate-pulse font-light">Calculando indicadores da empresa...</p>
      </div>
    );
  }

  const formatBRL = (value: number) => {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
  };

  const getTotalPedido = (pedido: Pedido): number => {
    if (typeof pedido.total === "number" && !isNaN(pedido.total)) return pedido.total;
    if (pedido.itens && Array.isArray(pedido.itens)) {
      return pedido.itens.reduce((s, item) => {
        return s + ((item.preco || 0) * (item.qtdPedida || 0));
      }, 0);
    }
    return 0;
  };

  return (
    <div className="p-6 md:p-10 flex-1 overflow-y-auto bg-gray-50">
      {/* Page Header */}
      <div className="mb-10">
        <h1 className="text-3xl font-serif text-brand-charcoal mb-1">Visão Geral da Loja</h1>
        <p className="text-text-muted text-sm">Acompanhe a pulsação global financeira do portfólio da Lírio Branco.</p>
      </div>

      {/* KPIs do Estoque */}
      <h2 className="text-sm font-semibold uppercase tracking-wider text-text-muted mb-4">Estoque</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col justify-between transition-shadow hover:shadow-md">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-text-muted mb-2">Total de Peças</h3>
          <p className="text-4xl font-bold text-brand-charcoal">{metrics.totalPecas}</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col justify-between transition-shadow hover:shadow-md">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-text-muted mb-2">Custo em Estoque</h3>
          <p className="text-3xl font-bold text-gray-400">{formatBRL(metrics.custoTotal)}</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col justify-between transition-shadow hover:shadow-md">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-text-muted mb-2">Faturamento Potencial</h3>
          <p className="text-3xl font-bold text-brand-charcoal">{formatBRL(metrics.faturamentoPotencial)}</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-brand-rose/20 p-6 flex flex-col justify-between transition-shadow hover:shadow-md relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-brand-rose/5 rounded-bl-[100px]" />
          <h3 className="text-sm font-semibold uppercase tracking-wider text-brand-rose mb-2 relative z-10">Lucro Projetado Líquido</h3>
          <p className="text-4xl font-bold text-emerald-600 relative z-10">{formatBRL(metrics.lucroProjetado)}</p>
        </div>
      </div>

      {/* KPIs de Vendas */}
      <h2 className="text-sm font-semibold uppercase tracking-wider text-text-muted mb-4">Vendas</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col justify-between transition-shadow hover:shadow-md">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-text-muted mb-2">Total de Pedidos</h3>
          <p className="text-4xl font-bold text-brand-charcoal">{salesMetrics.totalPedidos}</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-emerald-100 p-6 flex flex-col justify-between transition-shadow hover:shadow-md">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-emerald-600 mb-2">Faturamento Real</h3>
          <p className="text-3xl font-bold text-emerald-600">{formatBRL(salesMetrics.faturamentoReal)}</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col justify-between transition-shadow hover:shadow-md">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-text-muted mb-2">Clientes Cadastrados</h3>
          <p className="text-4xl font-bold text-brand-charcoal">{salesMetrics.totalClientes}</p>
        </div>
      </div>

      {/* Pedidos Recentes */}
      <h2 className="text-sm font-semibold uppercase tracking-wider text-text-muted mb-4">Últimos Pedidos</h2>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-xs uppercase tracking-wider text-text-muted">
                <th className="px-6 py-4 font-semibold">Cliente</th>
                <th className="px-6 py-4 font-semibold">Data</th>
                <th className="px-6 py-4 font-semibold">Itens</th>
                <th className="px-6 py-4 font-semibold text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {pedidosRecentes.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-text-muted">
                    Nenhum pedido registrado ainda.
                  </td>
                </tr>
              ) : (
                pedidosRecentes.map((pedido) => {
                  const qtdItens = pedido.itens?.reduce((s, i) => s + (i.qtdPedida || 0), 0) || 0;
                  return (
                    <tr key={pedido.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="text-brand-charcoal font-medium text-sm">{pedido.clienteNome || "Não informado"}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-500">{pedido.data || "—"}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-600">
                          {qtdItens} {qtdItens === 1 ? "peça" : "peças"}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <p className="text-sm font-semibold text-brand-charcoal">
                          {formatBRL(getTotalPedido(pedido))}
                        </p>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
