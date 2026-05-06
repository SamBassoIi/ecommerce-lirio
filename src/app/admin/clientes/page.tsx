"use client";

import { useEffect, useState, useCallback } from "react";
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

interface Cliente {
  id: string;
  nome: string;
  tel: string;
  obs: string;
}

export default function ClientesPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ nome: "", tel: "", obs: "" });
  const [searchTerm, setSearchTerm] = useState("");
  const router = useRouter();

  const startListener = useCallback(() => {
    return onSnapshot(collection(db, "clientes"), (snapshot) => {
      const lista: Cliente[] = [];
      snapshot.forEach((docSnap) => {
        lista.push({ id: docSnap.id, ...docSnap.data() } as Cliente);
      });
      setClientes(lista);
      setIsLoading(false);
    });
  }, []);

  useEffect(() => {
    let unsubFirestore: (() => void) | undefined;
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        setIsAuthenticated(true);
        unsubFirestore = startListener();
      } else {
        router.push("/login");
      }
    });
    return () => {
      unsubAuth();
      unsubFirestore?.();
    };
  }, [router, startListener]);

  const openCreateModal = () => {
    setEditingId(null);
    setFormData({ nome: "", tel: "", obs: "" });
    setIsModalOpen(true);
  };

  const openEditModal = (c: Cliente) => {
    setEditingId(c.id);
    setFormData({ nome: c.nome || "", tel: c.tel || "", obs: c.obs || "" });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nome.trim()) return;
    setIsSaving(true);

    try {
      const payload = {
        nome: formData.nome.trim(),
        tel: formData.tel.trim(),
        obs: formData.obs.trim(),
      };

      if (editingId) {
        await updateDoc(doc(db, "clientes", editingId), payload);
      } else {
        await addDoc(collection(db, "clientes"), payload);
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error("Erro ao salvar cliente:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Deseja realmente excluir este cliente?")) return;
    try {
      await deleteDoc(doc(db, "clientes", id));
    } catch (error) {
      console.error("Erro ao excluir cliente:", error);
    }
  };

  const filtered = clientes.filter(
    (c) =>
      c.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.tel?.includes(searchTerm)
  );

  if (!isAuthenticated || isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center h-full min-h-[50vh]">
        <p className="text-brand-charcoal text-lg animate-pulse font-light">Carregando clientes...</p>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 flex-1 overflow-y-auto relative">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-serif text-brand-charcoal mb-1">Clientes</h1>
          <p className="text-text-muted text-sm">{clientes.length} clientes cadastrados</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar..."
              className="pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-brand-charcoal focus:outline-none focus:ring-2 focus:ring-brand-rose w-44"
            />
          </div>
          <button
            onClick={openCreateModal}
            className="bg-brand-rose text-white px-5 py-2.5 rounded-xl font-medium shadow-sm hover:bg-opacity-90 transition-opacity flex items-center gap-2 text-sm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Novo Cliente
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-xs uppercase tracking-wider text-text-muted">
                <th className="px-6 py-4 font-semibold">Nome</th>
                <th className="px-6 py-4 font-semibold">Telefone</th>
                <th className="px-6 py-4 font-semibold">Observações</th>
                <th className="px-6 py-4 font-semibold text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-text-muted">
                    {searchTerm ? "Nenhum resultado encontrado." : "Nenhum cliente cadastrado."}
                  </td>
                </tr>
              ) : (
                filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-brand-charcoal font-medium text-sm">{c.nome}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-600">{c.tel || "—"}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-500 max-w-xs truncate">{c.obs || "—"}</p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <button onClick={() => openEditModal(c)} className="text-gray-400 hover:text-brand-rose transition-colors p-1" title="Editar">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
                          </svg>
                        </button>
                        <button onClick={() => handleDelete(c.id)} className="text-gray-400 hover:text-red-500 transition-colors p-1" title="Excluir">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white p-6 md:p-8 rounded-2xl w-full max-w-md shadow-xl relative">
            <h2 className="text-2xl font-serif text-brand-charcoal mb-6">
              {editingId ? "Editar Cliente" : "Novo Cliente"}
            </h2>

            <form onSubmit={handleSave} className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-brand-charcoal mb-1">Nome</label>
                <input
                  type="text"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-100 text-brand-charcoal rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-rose"
                  placeholder="Nome completo"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-brand-charcoal mb-1">Telefone</label>
                <input
                  type="text"
                  value={formData.tel}
                  onChange={(e) => setFormData({ ...formData, tel: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-100 text-brand-charcoal rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-rose"
                  placeholder="(11) 99999-9999"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-brand-charcoal mb-1">Observações</label>
                <textarea
                  value={formData.obs}
                  onChange={(e) => setFormData({ ...formData, obs: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-100 text-brand-charcoal rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-rose resize-none"
                  rows={3}
                  placeholder="Informações adicionais..."
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
                  {isSaving ? "Salvando..." : "Salvar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
