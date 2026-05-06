"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { auth, db, storage } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import Image from "next/image";

interface Product {
  id: string;
  nome: string;
  preco: number;
  qtd: number;
  imagens: string[];
  material: string;
  categoria: string;
}

export default function AdminStockPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [produtos, setProdutos] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Modal de Criação e Estados do Form
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [existingImageUrl, setExistingImageUrl] = useState<string>("");
  const [formData, setFormData] = useState({
    nome: "",
    preco: "",
    qtd: "1",
    categoria: "Geral",
    material: "Dourado"
  });

  const router = useRouter();

  const handleDeleteProduct = async (id: string) => {
    if (!window.confirm("Deseja realmente excluir esta joia?")) return;
    try {
      await deleteDoc(doc(db, "produtos", id));
      await fetchEstoque(); // Recarrega lista
    } catch (error) {
      console.error("Erro ao excluir produto:", error);
    }
  };

  const openEditModal = (produto: Product) => {
    setEditingId(produto.id);
    setFormData({
      nome: produto.nome || "",
      preco: produto.preco.toString() || "",
      qtd: (produto.qtd ?? 1).toString(),
      categoria: produto.categoria || "Geral",
      material: produto.material || "Dourado",
    });
    setExistingImageUrl(produto.imagens && produto.imagens.length > 0 ? produto.imagens[0] : "");
    setImageFile(null);
    setIsModalOpen(true);
  };

  const openCreateModal = () => {
    setEditingId(null);
    setFormData({ nome: "", preco: "", qtd: "1", categoria: "Geral", material: "Dourado" });
    setExistingImageUrl("");
    setImageFile(null);
    setIsModalOpen(true);
  };

  const fetchEstoque = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "produtos"));
      const lista: Product[] = [];
      querySnapshot.forEach((doc) => {
        lista.push({ id: doc.id, ...doc.data() } as Product);
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

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Na criação precisa de foto. Na edição, usa a foto antiga se imageFile for nulo.
    if (!formData.nome || !formData.preco || (!imageFile && !editingId)) return;

    setIsSaving(true);

    try {
      let finalImageUrl = existingImageUrl;

      // 1. Fazer Upload de Nova Imagem se selecionada
      if (imageFile) {
        const storageRef = ref(storage, 'produtos/' + Date.now() + '_' + imageFile.name);
        await uploadBytes(storageRef, imageFile);
        finalImageUrl = await getDownloadURL(storageRef);
      }

      // 2. Payload Final
      const payloadProduto = {
        nome: formData.nome,
        preco: Number(formData.preco),
        qtd: parseInt(formData.qtd) || 1,
        categoria: formData.categoria,
        material: formData.material,
        imagens: [finalImageUrl]
      };

      // 3. Update ou Insert logico global
      if (editingId) {
        await updateDoc(doc(db, "produtos", editingId), payloadProduto);
      } else {
        await addDoc(collection(db, "produtos"), payloadProduto);
      }
      
      // Fechando modal dinâmico e carregando tabela
      setIsModalOpen(false);
      setIsLoading(true);
      await fetchEstoque();
    } catch (error) {
      console.error("Erro ao salvar peça:", error);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isAuthenticated || isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center h-full min-h-[50vh]">
        <p className="text-brand-charcoal dark:text-brand-white text-lg animate-pulse font-light">Processando catálogo...</p>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 flex-1 overflow-y-auto relative">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-serif text-brand-charcoal dark:text-brand-white mb-1">Estoque de Joias</h1>
          <p className="text-text-muted text-sm">Gerencie suas listagens ativas no e-commerce.</p>
        </div>
        <button 
          onClick={openCreateModal}
          className="bg-brand-rose text-white px-6 py-2.5 rounded-xl font-medium shadow-sm hover:bg-opacity-90 transition-opacity flex items-center justify-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Nova Joia
        </button>
      </div>

      {/* Table Container */}
      <div className="bg-white dark:bg-[#1A1A1A] rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800 text-xs uppercase tracking-wider text-text-muted dark:text-gray-400">
                <th className="px-6 py-4 font-semibold">Imagem</th>
                <th className="px-6 py-4 font-semibold">Nome</th>
                <th className="px-6 py-4 font-semibold">Categoria</th>
                <th className="px-6 py-4 font-semibold">Material</th>
                <th className="px-6 py-4 font-semibold">Estoque</th>
                <th className="px-6 py-4 font-semibold">Preço</th>
                <th className="px-6 py-4 font-semibold text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
              {produtos.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-text-muted">
                    Nenhuma joia cadastrada.
                  </td>
                </tr>
              ) : (
                produtos.map((produto) => (
                  <tr key={produto.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-gray-100 dark:border-gray-700 bg-brand-white dark:bg-gray-800">
                        <Image 
                          src={produto.imagens && produto.imagens.length > 0 ? produto.imagens[0] : "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?q=80&w=200&auto=format&fit=crop"} 
                          alt={produto.nome || "Joia"} 
                          fill 
                          className="object-cover" 
                        />
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-brand-charcoal dark:text-brand-white font-medium text-sm">{produto.nome || "Sem título"}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 px-3 py-1 rounded-full font-medium">
                        {produto.categoria || "Geral"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                        <span className={`w-2 h-2 rounded-full ${produto.material === 'Dourado' ? 'bg-gold' : 'bg-silver'}`}></span>
                        {produto.material || "-"}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${(produto.qtd ?? 0) > 0 ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400' : 'bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400'}`}>
                        {produto.qtd ?? 0} un
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-semibold text-brand-charcoal dark:text-brand-white">
                        {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(produto.preco || 0)}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <button onClick={() => openEditModal(produto)} className="text-gray-400 hover:text-brand-rose transition-colors p-1" title="Editar">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
                          </svg>
                        </button>
                        <button onClick={() => handleDeleteProduct(produto.id)} className="text-gray-400 hover:text-red-500 transition-colors p-1" title="Excluir">
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

      {/* Modal de Criação */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1A1A1A] p-6 md:p-8 rounded-2xl w-full max-w-md shadow-xl border border-gray-100 dark:border-gray-800 relative animate-in zoom-in-95 duration-200">
            <h2 className="text-2xl font-serif text-brand-charcoal dark:text-brand-white mb-6">{editingId ? "Editar Joia" : "Cadastrar Nova Joia"}</h2>
            
            <form onSubmit={handleSaveProduct} className="flex flex-col gap-4">
              {/* Nome */}
              <div>
                <label className="block text-sm font-medium text-brand-charcoal dark:text-gray-200 mb-1">Nome da peça</label>
                <input 
                  type="text" 
                  value={formData.nome}
                  onChange={(e) => setFormData({...formData, nome: e.target.value})}
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 text-brand-charcoal dark:text-brand-white rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-rose transition-shadow"
                  placeholder="Ex: Anel Solitário Cristal"
                  required
                />
              </div>

              {/* Arquivo de Imagem */}
              <div>
                <label className="block text-sm font-medium text-brand-charcoal dark:text-gray-200 mb-1">Foto Principal da Joia</label>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setImageFile(e.target.files[0]);
                        }
                      }}
                      className="w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-gray-50 dark:file:bg-gray-800 file:text-brand-rose hover:file:bg-gray-100 dark:hover:file:bg-gray-700 transition-colors cursor-pointer"
                      required={!editingId}
                    />
                  </div>
                  {(imageFile || existingImageUrl) && (
                    <div className="shrink-0 relative w-12 h-12 rounded-lg overflow-hidden border border-gray-100 dark:border-gray-700 shadow-sm cursor-pointer" title={imageFile ? imageFile.name : "Imagem atual"}>
                      <Image 
                        src={imageFile ? URL.createObjectURL(imageFile) : existingImageUrl} 
                        alt="Preview" 
                        fill 
                        className="object-cover"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Preço, Qtd e Material */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-brand-charcoal dark:text-gray-200 mb-1">Preço (R$)</label>
                  <input 
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.preco}
                    onChange={(e) => setFormData({...formData, preco: e.target.value})}
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 text-brand-charcoal dark:text-brand-white rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-rose transition-shadow"
                    placeholder="99.90"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-brand-charcoal dark:text-gray-200 mb-1">Quantidade</label>
                  <input 
                    type="number"
                    min="0"
                    value={formData.qtd}
                    onChange={(e) => setFormData({...formData, qtd: e.target.value})}
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 text-brand-charcoal dark:text-brand-white rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-rose transition-shadow"
                    placeholder="1"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-brand-charcoal dark:text-gray-200 mb-1">Material</label>
                  <select
                    value={formData.material}
                    onChange={(e) => setFormData({...formData, material: e.target.value})}
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 text-brand-charcoal dark:text-brand-white rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-rose transition-shadow appearance-none"
                  >
                    <option value="Dourado">Dourado</option>
                    <option value="Prata">Prata</option>
                  </select>
                </div>
              </div>

              {/* Categoria */}
              <div>
                <label className="block text-sm font-medium text-brand-charcoal dark:text-gray-200 mb-1">Categoria</label>
                <select
                  value={formData.categoria}
                  onChange={(e) => setFormData({...formData, categoria: e.target.value})}
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 text-brand-charcoal dark:text-brand-white rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-rose transition-shadow appearance-none"
                >
                  <option value="Colar">Colar</option>
                  <option value="Brinco">Brinco</option>
                  <option value="Anel">Anel</option>
                  <option value="Pulseira">Pulseira</option>
                  <option value="Geral">Geral</option>
                </select>
              </div>

              {/* Ações */}
              <div className="flex items-center gap-3 mt-6">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-3 text-text-muted dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors border border-transparent hover:border-gray-100 dark:hover:border-gray-700"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 bg-brand-rose text-white px-4 py-3 rounded-lg font-medium shadow-sm hover:bg-opacity-90 transition-opacity disabled:opacity-50"
                >
                  {isSaving ? "Salvando..." : "Salvar Joia"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
