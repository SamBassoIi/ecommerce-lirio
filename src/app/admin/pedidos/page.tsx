"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { toPng } from "html-to-image";

interface Produto {
  id: string;
  nome: string;
  preco: number;
  qtd: number;
  material?: string;
}

interface Cliente {
  id: string;
  nome: string;
  tel: string;
}

interface ItemPedido {
  id: string;
  nome: string;
  preco: number;
  qtdPedida: number;
}

interface Pedido {
  id: string;
  clienteNome: string;
  data: string;
  total: number;
  timestamp: number;
  itens: ItemPedido[];
}

const formatBRL = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

export default function PedidosPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);

  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [selectedClienteId, setSelectedClienteId] = useState("");
  const [selectedProdutoId, setSelectedProdutoId] = useState("");
  const [qtdInput, setQtdInput] = useState("1");
  const [sacola, setSacola] = useState<ItemPedido[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const [reciboData, setReciboData] = useState<Pedido | null>(null);
  const reciboRef = useRef<HTMLDivElement>(null);

  const router = useRouter();

  const downloadReceipt = async () => {
    if (!reciboRef.current || !reciboData) return;
    try {
      const dataUrl = await toPng(reciboRef.current, { 
        cacheBust: true, 
        pixelRatio: 2,
        backgroundColor: '#ffffff'
      });
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `recibo-${reciboData.clienteNome.replace(/\s+/g, "_")}-${reciboData.id.slice(0, 5)}.png`;
      document.body.appendChild(link); // Required for Firefox
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Erro ao gerar imagem do recibo:", error);
      alert("Houve um erro ao gerar a imagem. Tente novamente.");
    }
  };

  const startListeners = useCallback(() => {
    const unsubs: (() => void)[] = [];
    unsubs.push(
      onSnapshot(collection(db, "pedidos"), (snap) => {
        const list: Pedido[] = [];
        snap.forEach((d) => list.push({ id: d.id, ...d.data() } as Pedido));
        list.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        setPedidos(list);
        setIsLoading(false);
      })
    );
    unsubs.push(
      onSnapshot(collection(db, "produtos"), (snap) => {
        const list: Produto[] = [];
        snap.forEach((d) => list.push({ id: d.id, ...d.data() } as Produto));
        setProdutos(list);
      })
    );
    unsubs.push(
      onSnapshot(collection(db, "clientes"), (snap) => {
        const list: Cliente[] = [];
        snap.forEach((d) => list.push({ id: d.id, ...d.data() } as Cliente));
        setClientes(list);
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
    return () => { unsubAuth(); unsubFirestore?.(); };
  }, [router, startListeners]);

  const addToSacola = () => {
    const prod = produtos.find((p) => p.id === selectedProdutoId);
    if (!prod) return;
    const qtd = parseInt(qtdInput) || 1;
    if (qtd <= 0) return;
    const jaExiste = sacola.find((i) => i.id === prod.id);
    const qtdJa = jaExiste ? jaExiste.qtdPedida : 0;
    if (qtdJa + qtd > (prod.qtd ?? 0)) {
      alert(`Estoque insuficiente. Disponível: ${prod.qtd ?? 0}`);
      return;
    }
    if (jaExiste) {
      setSacola((s) => s.map((i) => i.id === prod.id ? { ...i, qtdPedida: i.qtdPedida + qtd } : i));
    } else {
      setSacola((s) => [...s, { id: prod.id, nome: prod.nome, preco: prod.preco, qtdPedida: qtd }]);
    }
    setQtdInput("1");
  };

  const removeFromSacola = (index: number) => setSacola((s) => s.filter((_, i) => i !== index));
  const totalSacola = sacola.reduce((acc, i) => acc + i.preco * i.qtdPedida, 0);

  const finalizarPedido = async () => {
    if (sacola.length === 0 || !selectedClienteId) return;
    setIsSaving(true);
    try {
      const cliente = clientes.find((c) => c.id === selectedClienteId);
      if (!cliente) return;
      for (const item of sacola) {
        const prod = produtos.find((p) => p.id === item.id);
        if (prod) {
          await updateDoc(doc(db, "produtos", prod.id), { qtd: Math.max(0, (prod.qtd ?? 0) - item.qtdPedida) });
        }
      }
      await addDoc(collection(db, "pedidos"), {
        clienteNome: cliente.nome,
        data: new Date().toLocaleDateString("pt-BR"),
        itens: sacola.map((i) => ({ id: i.id, nome: i.nome, preco: i.preco, qtdPedida: i.qtdPedida })),
        total: totalSacola,
        timestamp: Date.now(),
      });
      setSacola([]);
      setIsOrderModalOpen(false);
    } catch (error) {
      console.error("Erro ao finalizar pedido:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const cancelarPedido = async (ped: Pedido) => {
    if (!window.confirm("Cancelar este pedido? Os itens voltarão ao estoque.")) return;
    try {
      if (ped.itens && Array.isArray(ped.itens)) {
        for (const item of ped.itens) {
          const prod = produtos.find((p) => p.id === item.id);
          if (prod) {
            await updateDoc(doc(db, "produtos", prod.id), { qtd: (prod.qtd ?? 0) + (item.qtdPedida ?? 0) });
          }
        }
      }
      await deleteDoc(doc(db, "pedidos", ped.id));
    } catch (error) {
      console.error("Erro ao cancelar pedido:", error);
    }
  };

  const openOrderModal = () => {
    if (clientes.length === 0) { alert("Cadastre pelo menos um cliente antes de criar um pedido."); return; }
    if (produtos.length === 0) { alert("Estoque vazio. Cadastre produtos primeiro."); return; }
    setSacola([]);
    setSelectedClienteId(clientes[0]?.id || "");
    setSelectedProdutoId(produtos[0]?.id || "");
    setQtdInput("1");
    setIsOrderModalOpen(true);
  };

  if (!isAuthenticated || isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center h-full min-h-[50vh]">
        <p className="text-brand-charcoal dark:text-brand-white text-lg animate-pulse font-light">Carregando pedidos...</p>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 flex-1 overflow-y-auto relative">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-serif text-brand-charcoal dark:text-brand-white mb-1">Pedidos</h1>
          <p className="text-text-muted text-sm">{pedidos.length} vendas registradas</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
            <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Buscar..." className="pl-9 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-brand-charcoal dark:text-brand-white focus:outline-none focus:ring-2 focus:ring-brand-rose w-44" />
          </div>
          <button onClick={openOrderModal} className="bg-brand-rose text-white px-5 py-2.5 rounded-xl font-medium shadow-sm hover:bg-opacity-90 transition-opacity flex items-center gap-2 text-sm">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
            Criar Pedido
          </button>
        </div>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {(() => {
          const q = searchTerm.toLowerCase();
          const filtered = pedidos.filter((p) => !q || p.clienteNome?.toLowerCase().includes(q) || p.data?.includes(q) || p.itens?.some((i) => i.nome?.toLowerCase().includes(q)));
          return filtered.length === 0 ? (
            <div className="bg-white dark:bg-[#1A1A1A] rounded-xl border border-gray-100 dark:border-gray-800 p-8 text-center text-text-muted">Nenhum pedido encontrado.</div>
          ) : (
            filtered.map((ped) => {
            const qtdItens = ped.itens?.reduce((s, i) => s + (i.qtdPedida || 0), 0) || 0;
            return (
              <div key={ped.id} className="bg-white dark:bg-[#1A1A1A] rounded-xl border border-gray-100 dark:border-gray-800 p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-brand-charcoal dark:text-brand-white font-medium text-sm">{ped.clienteNome || "—"}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{ped.data || "—"}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => setReciboData(ped)} className="text-gray-400 hover:text-brand-rose transition-colors p-1.5" title="Recibo">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
                    </button>
                    <button onClick={() => cancelarPedido(ped)} className="text-gray-400 hover:text-red-500 transition-colors p-1.5" title="Cancelar">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50 dark:border-gray-800">
                  <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 px-2.5 py-1 rounded-full font-medium">{qtdItens} {qtdItens === 1 ? "peça" : "peças"}</span>
                  <p className="text-sm font-semibold text-brand-charcoal dark:text-brand-white">{formatBRL(ped.total || 0)}</p>
                </div>
              </div>
            );
          })
          );
        })()}
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block bg-white dark:bg-[#1A1A1A] rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800 text-xs uppercase tracking-wider text-text-muted dark:text-gray-400">
              <th className="px-6 py-4 font-semibold">Data</th>
              <th className="px-6 py-4 font-semibold">Cliente</th>
              <th className="px-6 py-4 font-semibold">Itens</th>
              <th className="px-6 py-4 font-semibold">Total</th>
              <th className="px-6 py-4 font-semibold text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
            {(() => {
              const q = searchTerm.toLowerCase();
              const filtered = pedidos.filter((p) => !q || p.clienteNome?.toLowerCase().includes(q) || p.data?.includes(q) || p.itens?.some((i) => i.nome?.toLowerCase().includes(q)));
              return filtered.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-text-muted">Nenhum pedido encontrado.</td></tr>
              ) : (
                filtered.map((ped) => {
                const qtdItens = ped.itens?.reduce((s, i) => s + (i.qtdPedida || 0), 0) || 0;
                return (
                  <tr key={ped.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-6 py-4"><p className="text-sm text-gray-600 dark:text-gray-300">{ped.data || "—"}</p></td>
                    <td className="px-6 py-4"><p className="text-brand-charcoal dark:text-brand-white font-medium text-sm">{ped.clienteNome || "—"}</p></td>
                    <td className="px-6 py-4"><span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 px-2.5 py-1 rounded-full font-medium">{qtdItens} {qtdItens === 1 ? "peça" : "peças"}</span></td>
                    <td className="px-6 py-4"><p className="text-sm font-semibold text-brand-charcoal dark:text-brand-white">{formatBRL(ped.total || 0)}</p></td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => setReciboData(ped)} className="text-gray-400 hover:text-brand-rose transition-colors p-1" title="Recibo">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
                        </button>
                        <button onClick={() => cancelarPedido(ped)} className="text-gray-400 hover:text-red-500 transition-colors p-1" title="Cancelar">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
              );
            })()}
          </tbody>
        </table>
      </div>

      {/* ============ Modal de Criação de Pedido ============ */}
      {isOrderModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1A1A1A] rounded-2xl w-full max-w-2xl shadow-xl border border-gray-100 dark:border-gray-800 relative max-h-[90vh] overflow-y-auto">
            <div className="p-6 md:p-8">
              <h2 className="text-2xl font-serif text-brand-charcoal dark:text-brand-white mb-6">Novo Pedido</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-4">
                  <div>
                    <label className="block text-sm font-medium text-brand-charcoal dark:text-gray-200 mb-1">Cliente</label>
                    <select value={selectedClienteId} onChange={(e) => setSelectedClienteId(e.target.value)} className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 text-brand-charcoal dark:text-brand-white rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-rose appearance-none">
                      {clientes.map((c) => (<option key={c.id} value={c.id}>{c.nome}</option>))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-brand-charcoal dark:text-gray-200 mb-1">Produto</label>
                    <div className="flex gap-2">
                      <select value={selectedProdutoId} onChange={(e) => setSelectedProdutoId(e.target.value)} className="flex-1 px-3 py-2 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 text-brand-charcoal dark:text-brand-white rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-rose text-sm appearance-none">
                        {produtos.map((p) => (<option key={p.id} value={p.id}>{p.nome} — {p.qtd ?? 0} un</option>))}
                      </select>
                      <input type="number" min="1" value={qtdInput} onChange={(e) => setQtdInput(e.target.value)} className="w-14 px-2 py-2 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 text-brand-charcoal dark:text-brand-white rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-rose text-center" />
                      <button onClick={addToSacola} className="bg-brand-rose text-white px-4 py-2 rounded-lg font-medium hover:bg-opacity-90 transition-opacity text-sm">+</button>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800/30 rounded-xl border border-gray-100 dark:border-gray-700 p-4 flex flex-col">
                  <h3 className="text-sm font-semibold text-brand-charcoal dark:text-brand-white mb-3">Sacola</h3>
                  <div className="flex-1 min-h-[120px] space-y-2">
                    {sacola.length === 0 ? (
                      <p className="text-sm text-gray-400 italic">Adicione produtos...</p>
                    ) : (
                      sacola.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center text-sm border-b border-gray-200 dark:border-gray-700 pb-2">
                          <span className="text-brand-charcoal dark:text-brand-white">{item.qtdPedida}x {item.nome}</span>
                          <span className="flex items-center gap-2">
                            <span className="text-gray-600 dark:text-gray-300">{formatBRL(item.preco * item.qtdPedida)}</span>
                            <button onClick={() => removeFromSacola(idx)} className="text-red-400 hover:text-red-600 transition-colors">×</button>
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700 text-right">
                    <span className="text-lg font-semibold text-brand-charcoal dark:text-brand-white">Total: {formatBRL(totalSacola)}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 mt-6">
                <button type="button" onClick={() => setIsOrderModalOpen(false)} className="flex-1 px-4 py-3 text-text-muted dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors border border-transparent hover:border-gray-100 dark:hover:border-gray-700">Cancelar</button>
                <button onClick={finalizarPedido} disabled={isSaving || sacola.length === 0} className="flex-1 bg-brand-rose text-white px-4 py-3 rounded-lg font-medium shadow-sm hover:bg-opacity-90 transition-opacity disabled:opacity-50">{isSaving ? "Registrando..." : "Finalizar Venda"}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============ Modal de Recibo ============ */}
      {reciboData && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl relative overflow-hidden">
            <div className="flex justify-between items-center px-6 pt-5 pb-3 border-b border-gray-100">
              <h3 className="font-serif text-lg text-brand-charcoal">Recibo</h3>
              <div className="flex items-center gap-3">
                <button onClick={downloadReceipt} className="text-brand-rose hover:opacity-80 transition-opacity" title="Baixar PNG">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
                </button>
                <button onClick={() => setReciboData(null)} className="text-gray-400 hover:text-gray-600" title="Fechar">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            </div>
            <div ref={reciboRef} className="p-6 bg-white">
              <div className="text-center mb-5">
                <h2 className="font-serif text-2xl text-brand-charcoal">Lírio Branco</h2>
                <p className="text-xs text-gray-400 uppercase tracking-widest">Acessórios</p>
              </div>
              <div className="text-sm text-gray-600 mb-1"><strong>Data:</strong> {reciboData.data}</div>
              <div className="text-sm text-gray-600 mb-4"><strong>Cliente:</strong> {reciboData.clienteNome}</div>
              <table className="w-full text-sm border-collapse mb-4">
                <thead>
                  <tr className="border-b border-gray-200 text-xs text-gray-500 uppercase">
                    <th className="py-2 text-left">Item</th>
                    <th className="py-2 text-center">Qtd</th>
                    <th className="py-2 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {reciboData.itens?.map((item, idx) => (
                    <tr key={idx} className="border-b border-gray-50">
                      <td className="py-2 text-brand-charcoal">{item.nome}</td>
                      <td className="py-2 text-center text-gray-500">{item.qtdPedida}</td>
                      <td className="py-2 text-right text-brand-charcoal">{formatBRL((item.preco || 0) * (item.qtdPedida || 0))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="text-right text-lg font-bold text-brand-charcoal border-t border-gray-200 pt-3">TOTAL: {formatBRL(reciboData.total || 0)}</div>
              <div className="mt-5 text-center text-sm border-t border-dashed border-gray-200 pt-4">
                <p className="text-gray-600 font-semibold mb-1">Pagamento via PIX:</p>
                <p className="text-brand-rose font-bold text-lg tracking-wider">11913110931</p>
                <p className="text-xs text-gray-400">(Celular)</p>
              </div>
              <div className="mt-5 text-center text-xs text-gray-400">Obrigada pela preferência!<br />@liriobrancooficial</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
