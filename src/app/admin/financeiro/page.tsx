"use client";

import { useEffect, useState, useCallback } from "react";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  onSnapshot,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useRouter } from "next/navigation";

interface Pedido {
  id: string;
  clienteNome: string;
  data: string;
  total: number;
  timestamp: number;
}

interface Despesa {
  id: string;
  data: string;
  desc: string;
  valor: number;
  timestamp: number;
}

const formatBRL = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

export default function FinanceiroPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [despesas, setDespesas] = useState<Despesa[]>([]);

  // Modal de despesa
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({ desc: "", valor: "" });

  const router = useRouter();

  const startListeners = useCallback(() => {
    const unsubs: (() => void)[] = [];

    unsubs.push(
      onSnapshot(collection(db, "pedidos"), (snap) => {
        const list: Pedido[] = [];
        snap.forEach((d) => list.push({ id: d.id, ...d.data() } as Pedido));
        setPedidos(list);
        setIsLoading(false);
      })
    );

    unsubs.push(
      onSnapshot(collection(db, "despesas"), (snap) => {
        const list: Despesa[] = [];
        snap.forEach((d) => list.push({ id: d.id, ...d.data() } as Despesa));
        list.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        setDespesas(list);
      })
    );

    return () => unsubs.forEach((u) => u());
  }, []);

  useEffect(() => {
    let unsubFirestore: (() => void) | undefined;
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        setIsAuthenticated(true);
        unsubFirestore = startListeners();
      } else {
        router.push("/login");
      }
    });
    return () => {
      unsubAuth();
      unsubFirestore?.();
    };
  }, [router, startListeners]);

  // === KPIs ===
  const totalReceitas = pedidos.reduce((acc, p) => {
    const val = typeof p.total === "number" && !isNaN(p.total) ? p.total : 0;
    return acc + val;
  }, 0);

  const totalDespesas = despesas.reduce((acc, d) => {
    const val = typeof d.valor === "number" && !isNaN(d.valor) ? d.valor : 0;
    return acc + val;
  }, 0);

  const lucro = totalReceitas - totalDespesas;

  // === CRUD Despesas ===
  const handleSaveDespesa = async (e: React.FormEvent) => {
    e.preventDefault();
    const desc = formData.desc.trim();
    const valor = parseFloat(formData.valor);
    if (!desc || isNaN(valor) || valor <= 0) return;

    setIsSaving(true);
    try {
      await addDoc(collection(db, "despesas"), {
        data: new Date().toLocaleDateString("pt-BR"),
        desc,
        valor,
        timestamp: Date.now(),
      });
      setIsModalOpen(false);
      setFormData({ desc: "", valor: "" });
    } catch (error) {
      console.error("Erro ao salvar despesa:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteDespesa = async (id: string) => {
    if (!window.confirm("Excluir este custo?")) return;
    try {
      await deleteDoc(doc(db, "despesas", id));
    } catch (error) {
      console.error("Erro ao excluir despesa:", error);
    }
  };

  // === Export Excel ===
  const exportarExcel = async () => {
    if (pedidos.length === 0 && despesas.length === 0) {
      alert("Nenhum dado financeiro para exportar.");
      return;
    }

    const XLSX = await import("xlsx");
    const wb = XLSX.utils.book_new();

    // Aba Vendas
    const vendasData = [
      ["Data", "Cliente", "Total da Venda (R$)"],
      ...pedidos.map((p) => [p.data || "", p.clienteNome || "", p.total || 0]),
    ];
    const wsVendas = XLSX.utils.aoa_to_sheet(vendasData);
    XLSX.utils.book_append_sheet(wb, wsVendas, "Entradas (Vendas)");

    // Aba Custos
    const custosData = [
      ["Data", "Descrição", "Valor do Custo (R$)"],
      ...despesas.map((d) => [d.data || "", d.desc || "", d.valor || 0]),
    ];
    const wsCustos = XLSX.utils.aoa_to_sheet(custosData);
    XLSX.utils.book_append_sheet(wb, wsCustos, "Saídas (Custos)");

    XLSX.writeFile(wb, "LirioBranco_PrestacaoDeContas.xlsx");
  };

  if (!isAuthenticated || isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center h-full min-h-[50vh]">
        <p className="text-brand-charcoal text-lg animate-pulse font-light">
          Carregando financeiro...
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 flex-1 overflow-y-auto relative">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-serif text-brand-charcoal mb-1">
            Prestação de Contas
          </h1>
          <p className="text-text-muted text-sm">
            Visão de lucros e despesas operacionais
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={exportarExcel}
            className="px-4 py-2.5 rounded-xl font-medium text-sm text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            Exportar Excel
          </button>
          <button
            onClick={() => {
              setFormData({ desc: "", valor: "" });
              setIsModalOpen(true);
            }}
            className="bg-brand-rose text-white px-5 py-2.5 rounded-xl font-medium shadow-sm hover:bg-opacity-90 transition-opacity flex items-center gap-2 text-sm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Novo Custo
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-white rounded-xl shadow-sm border border-emerald-100 p-6">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-emerald-600 mb-2">
            Entradas (Vendas)
          </h3>
          <p className="text-3xl font-bold text-emerald-600">
            {formatBRL(totalReceitas)}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {pedidos.length} vendas
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-red-100 p-6">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-red-500 mb-2">
            Saídas (Custos)
          </h3>
          <p className="text-3xl font-bold text-red-500">
            {formatBRL(totalDespesas)}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {despesas.length} registros
          </p>
        </div>

        <div
          className={`bg-white rounded-xl shadow-sm border p-6 ${
            lucro >= 0 ? "border-emerald-100" : "border-red-100"
          }`}
        >
          <h3
            className={`text-sm font-semibold uppercase tracking-wider mb-2 ${
              lucro >= 0 ? "text-emerald-600" : "text-red-500"
            }`}
          >
            Lucro Atual
          </h3>
          <p
            className={`text-3xl font-bold ${
              lucro >= 0 ? "text-emerald-600" : "text-red-500"
            }`}
          >
            {formatBRL(lucro)}
          </p>
        </div>
      </div>

      {/* Tabela de Despesas */}
      <h2 className="text-sm font-semibold uppercase tracking-wider text-text-muted mb-4">
        Histórico de Custos
      </h2>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-xs uppercase tracking-wider text-text-muted">
                <th className="px-6 py-4 font-semibold">Data</th>
                <th className="px-6 py-4 font-semibold">Descrição</th>
                <th className="px-6 py-4 font-semibold text-right">
                  Valor
                </th>
                <th className="px-6 py-4 font-semibold text-right">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {despesas.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-12 text-center text-text-muted"
                  >
                    Nenhum custo registrado.
                  </td>
                </tr>
              ) : (
                despesas.map((d) => (
                  <tr
                    key={d.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-600">
                        {d.data}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-brand-charcoal">
                        {d.desc}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <p className="text-sm font-semibold text-red-500">
                        {formatBRL(d.valor || 0)}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleDeleteDespesa(d.id)}
                        className="text-gray-400 hover:text-red-500 transition-colors p-1"
                        title="Excluir"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Despesa */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white p-6 md:p-8 rounded-2xl w-full max-w-md shadow-xl relative">
            <h2 className="text-2xl font-serif text-brand-charcoal mb-6">
              Registrar Custo
            </h2>

            <form
              onSubmit={handleSaveDespesa}
              className="flex flex-col gap-4"
            >
              <div>
                <label className="block text-sm font-medium text-brand-charcoal mb-1">
                  Descrição
                </label>
                <input
                  type="text"
                  value={formData.desc}
                  onChange={(e) =>
                    setFormData({ ...formData, desc: e.target.value })
                  }
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-100 text-brand-charcoal rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-rose"
                  placeholder="Ex: Fornecedor, Embalagens, Frete..."
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-brand-charcoal mb-1">
                  Valor Gasto (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={formData.valor}
                  onChange={(e) =>
                    setFormData({ ...formData, valor: e.target.value })
                  }
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-100 text-brand-charcoal rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-rose"
                  placeholder="0.00"
                  required
                />
              </div>
              <div className="flex items-center gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-3 text-text-muted font-medium hover:bg-gray-50 rounded-lg transition-colors border border-transparent hover:border-gray-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 bg-brand-rose text-white px-4 py-3 rounded-lg font-medium shadow-sm hover:bg-opacity-90 transition-opacity disabled:opacity-50"
                >
                  {isSaving ? "Salvando..." : "Salvar Custo"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
