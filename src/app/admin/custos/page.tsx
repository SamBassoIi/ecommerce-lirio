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

// Subcomponente isolado para garantir Auto-Save livre de render block
const CostRow = ({ produto }: { produto: Product }) => {
  const [custoLocal, setCustoLocal] = useState<string>(produto.custo?.toString() || "0");
  const [isSaving, setIsSaving] = useState(false);

  const handleBlur = async () => {
    const novoCusto = parseFloat(custoLocal);
    const atual = produto.custo || 0;
    
    // Se for vazio ou o mesmo valor, ignorar chamada a API
    if (isNaN(novoCusto) || novoCusto === atual) return;

    setIsSaving(true);
    try {
      await updateDoc(doc(db, "produtos", produto.id), {
        custo: novoCusto
      });
      // Atualizar silenciosamente na raiz local do objeto
      produto.custo = novoCusto;
    } catch (error) {
      console.error("Falha ao sincronizar custo:", error);
    } finally {
      setIsSaving(false);
    }
  };

  // Matemática em tempo real
  const customCustoCalculado = parseFloat(custoLocal) || 0;
  const precoVenda = produto.preco || 0;
  const lucroBruto = precoVenda - customCustoCalculado;
  const margemBruta = precoVenda > 0 ? (lucroBruto / precoVenda) * 100 : 0;

  const isHealthy = lucroBruto > 0;

  return (
    <tr className="hover:bg-gray-50 transition-colors">
      <td className="px-6 py-4">
        <p className="text-brand-charcoal font-medium text-sm">{produto.nome || "Sem título"}</p>
      </td>
      <td className="px-6 py-4">
        <span className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-full font-medium">
          {produto.categoria || "Geral"}
        </span>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          <span className="text-gray-400 text-sm">R$</span>
          <input
            type="number"
            step="0.01"
            value={custoLocal}
            onChange={(e) => setCustoLocal(e.target.value)}
            onBlur={handleBlur}
            className={`w-24 px-2 py-1 bg-white border rounded text-sm outline-none focus:ring-1 focus:ring-brand-rose transition-all ${isSaving ? 'border-brand-rose bg-red-50 opacity-70' : 'border-gray-200'}`}
          />
        </div>
      </td>
      <td className="px-6 py-4">
        <p className="text-sm font-semibold text-brand-charcoal">
          {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(precoVenda)}
        </p>
      </td>
      <td className="px-6 py-4">
        <p className={`text-sm font-semibold ${isHealthy ? 'text-emerald-600' : 'text-red-500'}`}>
          {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(lucroBruto)}
        </p>
      </td>
      <td className="px-6 py-4 text-right">
        <div className={`text-sm font-bold px-2 py-1 rounded inline-block ${isHealthy ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'}`}>
          {margemBruta.toFixed(1)}%
        </div>
      </td>
    </tr>
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
      if (user) {
        setIsAuthenticated(true);
        await fetchEstoque();
      } else {
        router.push("/login");
      }
    });
    return () => unsubscribe();
  }, [router]);

  if (!isAuthenticated || isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center h-full min-h-[50vh]">
        <p className="text-brand-charcoal text-lg animate-pulse font-light">Calculando balanços...</p>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 flex-1 overflow-y-auto">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-serif text-brand-charcoal mb-1">Catálogo de Custos</h1>
          <p className="text-text-muted text-sm">Controle sua margem de lucro aplicando o custo de prateleira (Auto-Save).</p>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-brand-charcoal text-white text-xs uppercase tracking-wider">
                <th className="px-6 py-4 font-semibold rounded-tl-xl">Produto</th>
                <th className="px-6 py-4 font-semibold">Categoria</th>
                <th className="px-6 py-4 font-semibold">Custo de Prateleira (R$)</th>
                <th className="px-6 py-4 font-semibold">Preço de Venda</th>
                <th className="px-6 py-4 font-semibold">Lucro Líquido</th>
                <th className="px-6 py-4 font-semibold text-right rounded-tr-xl">Margem (%)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {produtos.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-text-muted">
                    Nenhuma joia listada no catálogo de custos.
                  </td>
                </tr>
              ) : (
                produtos.map((produto) => (
                  <CostRow key={produto.id} produto={produto} />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
