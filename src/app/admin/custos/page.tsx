"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { collection, getDocs, updateDoc, doc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useRouter } from "next/navigation";

interface Product {
  id: string;
  nome: string;
  preco: number;
  categoria: string;
  custo?: number;
}

const CostRow = ({ produto }: { produto: Product }) => {
  const [custoLocal, setCustoLocal] = useState<string>(produto.custo?.toString() || "0");
  const [isSaving, setIsSaving] = useState(false);

  const handleBlur = async () => {
    const novoCusto = parseFloat(custoLocal);
    const atual = produto.custo || 0;
    if (isNaN(novoCusto) || novoCusto === atual) return;
    setIsSaving(true);
    try {
      await updateDoc(doc(db, "produtos", produto.id), { custo: novoCusto });
      produto.custo = novoCusto;
    } catch (error) {
      console.error("Falha ao sincronizar custo:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const customCustoCalculado = parseFloat(custoLocal) || 0;
  const precoVenda = produto.preco || 0;
  const lucroBruto = precoVenda - customCustoCalculado;
  const margemBruta = precoVenda > 0 ? (lucroBruto / precoVenda) * 100 : 0;
  const isHealthy = lucroBruto > 0;
  const formatBRL = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

  return (
    <>
      {/* Mobile Card */}
      <div className="md:hidden bg-white dark:bg-[#1A1A1A] rounded-xl border border-gray-100 dark:border-gray-800 p-4 shadow-sm">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="min-w-0">
            <p className="text-brand-charcoal dark:text-brand-white font-medium text-sm">{produto.nome || "Sem título"}</p>
            <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded-full mt-1 inline-block">{produto.categoria || "Geral"}</span>
          </div>
          <div className={`text-sm font-bold px-2 py-1 rounded ${isHealthy ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400' : 'bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400'}`}>
            {margemBruta.toFixed(1)}%
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3 text-center border-t border-gray-50 dark:border-gray-800 pt-3">
          <div>
            <p className="text-xs text-gray-400 mb-1">Custo</p>
            <div className="flex items-center justify-center gap-1">
              <span className="text-gray-400 text-xs">R$</span>
              <input
                type="number" step="0.01" value={custoLocal}
                onChange={(e) => setCustoLocal(e.target.value)} onBlur={handleBlur}
                className={`w-16 px-1 py-0.5 bg-white dark:bg-gray-800 border rounded text-xs text-center text-brand-charcoal dark:text-brand-white outline-none focus:ring-1 focus:ring-brand-rose ${isSaving ? 'border-brand-rose opacity-70' : 'border-gray-200 dark:border-gray-700'}`}
              />
            </div>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-1">Venda</p>
            <p className="text-xs font-semibold text-brand-charcoal dark:text-brand-white">{formatBRL(precoVenda)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-1">Lucro</p>
            <p className={`text-xs font-semibold ${isHealthy ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}>{formatBRL(lucroBruto)}</p>
          </div>
        </div>
      </div>

      {/* Desktop Row */}
      <tr className="hidden md:table-row hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
        <td className="px-6 py-4">
          <p className="text-brand-charcoal dark:text-brand-white font-medium text-sm">{produto.nome || "Sem título"}</p>
        </td>
        <td className="px-6 py-4">
          <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 px-3 py-1 rounded-full font-medium">{produto.categoria || "Geral"}</span>
        </td>
        <td className="px-6 py-4">
          <div className="flex items-center gap-2">
            <span className="text-gray-400 text-sm">R$</span>
            <input
              type="number" step="0.01" value={custoLocal}
              onChange={(e) => setCustoLocal(e.target.value)} onBlur={handleBlur}
              className={`w-24 px-2 py-1 bg-white dark:bg-gray-800 border rounded text-sm text-brand-charcoal dark:text-brand-white outline-none focus:ring-1 focus:ring-brand-rose transition-all ${isSaving ? 'border-brand-rose bg-red-50 dark:bg-red-900/20 opacity-70' : 'border-gray-200 dark:border-gray-700'}`}
            />
          </div>
        </td>
        <td className="px-6 py-4">
          <p className="text-sm font-semibold text-brand-charcoal dark:text-brand-white">{formatBRL(precoVenda)}</p>
        </td>
        <td className="px-6 py-4">
          <p className={`text-sm font-semibold ${isHealthy ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}>{formatBRL(lucroBruto)}</p>
        </td>
        <td className="px-6 py-4 text-right">
          <div className={`text-sm font-bold px-2 py-1 rounded inline-block ${isHealthy ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400' : 'bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400'}`}>
            {margemBruta.toFixed(1)}%
          </div>
        </td>
      </tr>
    </>
  );
};

export default function CatalogCostsPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [produtos, setProdutos] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const fetchEstoque = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "produtos"));
      const lista: Product[] = [];
      querySnapshot.forEach((docSnap) => {
        lista.push({ id: docSnap.id, ...docSnap.data() } as Product);
      });
      setProdutos(lista);
    } catch (error) {
      console.error("Erro ao carregar estoque:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) { setIsAuthenticated(true); await fetchEstoque(); } else { router.push("/login"); }
    });
    return () => unsubscribe();
  }, [router]);

  if (!isAuthenticated || isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center h-full min-h-[50vh]">
        <p className="text-brand-charcoal dark:text-brand-white text-lg animate-pulse font-light">Calculando balanços...</p>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 flex-1 overflow-y-auto">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-serif text-brand-charcoal dark:text-brand-white mb-1">Catálogo de Custos</h1>
          <p className="text-text-muted text-sm">Controle sua margem de lucro aplicando o custo de prateleira (Auto-Save).</p>
        </div>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {produtos.length === 0 ? (
          <div className="bg-white dark:bg-[#1A1A1A] rounded-xl border border-gray-100 dark:border-gray-800 p-8 text-center text-text-muted">Nenhuma joia listada no catálogo de custos.</div>
        ) : (
          produtos.map((produto) => <CostRow key={produto.id} produto={produto} />)
        )}
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block bg-white dark:bg-[#1A1A1A] rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800 text-xs uppercase tracking-wider text-text-muted dark:text-gray-400">
              <th className="px-6 py-4 font-semibold">Produto</th>
              <th className="px-6 py-4 font-semibold">Categoria</th>
              <th className="px-6 py-4 font-semibold">Custo de Prateleira (R$)</th>
              <th className="px-6 py-4 font-semibold">Preço de Venda</th>
              <th className="px-6 py-4 font-semibold">Lucro Líquido</th>
              <th className="px-6 py-4 font-semibold text-right">Margem (%)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {produtos.length === 0 ? (
              <tr><td colSpan={6} className="px-6 py-12 text-center text-text-muted">Nenhuma joia listada no catálogo de custos.</td></tr>
            ) : (
              produtos.map((produto) => <CostRow key={produto.id} produto={produto} />)
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
