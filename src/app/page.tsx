"use client";

import { useEffect, useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useCartStore } from "@/store/useCartStore";
import { motion, AnimatePresence } from "framer-motion";

interface Product {
  id: string;
  nome: string;
  preco: number;
  imagem: string;
  material: "Dourado" | "Prata";
  categoria: string;
}

// Cores visuais por material no design system
const MATERIAL_COLOR: Record<string, string> = {
  Dourado: "#D4AF37",
  Prata: "#9EA2A2",
};

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [busca, setBusca] = useState("");
  const [filtroMaterial, setFiltroMaterial] = useState("Todos");
  const [filtroCategoria, setFiltroCategoria] = useState("Todas");

  // Busca produtos do Firestore
  useEffect(() => {
    async function fetchProducts() {
      try {
        const snap = await getDocs(collection(db, "produtos"));
        const data: Product[] = [];
        snap.forEach((doc) => {
          const d = doc.data();
          data.push({
            id: doc.id,
            nome: d.nome || "Sem nome",
            preco: d.preco || 0,
            imagem:
              d.imagens?.length > 0
                ? d.imagens[0]
                : "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?q=80&w=600&auto=format&fit=crop",
            material: d.material || "Dourado",
            categoria: d.categoria || "Geral",
          });
        });
        setProducts(data);
      } catch {
        // UI não quebra — lista vazia como fallback
      } finally {
        setIsLoading(false);
      }
    }
    fetchProducts();
  }, []);

  // Categorias únicas extraídas do banco
  const categoriasDisponiveis = useMemo(() => {
    const cats = new Set(products.map((p) => p.categoria));
    return ["Todas", ...Array.from(cats).sort()];
  }, [products]);

  // Materiais fixos (Dourado e Prata são os únicos no negócio)
  const materiaisDisponiveis = ["Todos", "Dourado", "Prata"];

  // Filtragem combinada
  const produtosFiltrados = useMemo(() => {
    return products.filter((p) => {
      const matchBusca =
        p.nome.toLowerCase().includes(busca.toLowerCase()) ||
        p.categoria.toLowerCase().includes(busca.toLowerCase()) ||
        p.material.toLowerCase().includes(busca.toLowerCase());
      const matchMaterial =
        filtroMaterial === "Todos" || p.material === filtroMaterial;
      const matchCategoria =
        filtroCategoria === "Todas" || p.categoria === filtroCategoria;
      return matchBusca && matchMaterial && matchCategoria;
    });
  }, [products, busca, filtroMaterial, filtroCategoria]);

  const formattedPrice = (value: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);

  return (
    <div className="relative z-10 pt-32 pb-20 px-6 max-w-7xl mx-auto space-y-24">
      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="min-h-[70vh] flex items-center justify-center relative mt-4">
        {/* Flor — aparece primeiro (Esquerda) */}
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.8, ease: [0.16, 1, 0.3, 1] }}
          className="absolute left-[-30vw] md:-left-[15vw] lg:-left-[10vw] top-[65%] -translate-y-1/2 w-[80vw] md:w-[45vw] lg:w-[35vw] max-w-[800px] aspect-square pointer-events-none select-none z-0"
        >
          <Image
            src="/lirio-flower.png"
            alt=""
            fill
            className="object-contain object-left opacity-60 md:opacity-70 mix-blend-multiply"
            sizes="(max-width: 768px) 80vw, 50vw"
            priority
          />
        </motion.div>

        {/* Flor 2 — (Direita) */}
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.8, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
          className="absolute right-[-100vw] md:-right-[80vw] lg:-right-[70vw] top-[-5%] -translate-y-1/2 w-[240vw] md:w-[180vw] lg:w-[160vw] max-w-[3000px] aspect-square pointer-events-none select-none z-0"
        >
          <Image
            src="/lirio-flower2.png"
            alt=""
            fill
            className="object-contain object-right opacity-60 md:opacity-70 mix-blend-multiply"
            sizes="(max-width: 768px) 240vw, 180vw"
            priority
          />
        </motion.div>

        {/* Flor 3 — (Inferior Direita) */}
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.8, ease: [0.16, 1, 0.3, 1], delay: 0.6 }}
          className="absolute right-[-150vw] md:-right-[110vw] lg:-right-[88vw] top-[95%] -translate-y-1/2 w-[310vw] md:w-[230vw] lg:w-[200vw] max-w-[3200px] aspect-square pointer-events-none select-none z-0"
        >
          <Image
            src="/lirio-flower3.png"
            alt=""
            fill
            className="object-contain object-right opacity-60 md:opacity-70 mix-blend-multiply"
            sizes="(max-width: 768px) 310vw, 230vw"
            priority
          />
        </motion.div>

        {/* Conteúdo — aparece depois */}
        <div className="relative z-10 max-w-3xl p-10 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 0.9, y: 0 }}
            transition={{ duration: 1, delay: 1.2, ease: "easeOut" }}
            className="font-serif text-6xl md:text-8xl lg:text-9xl text-lirio-text font-light tracking-tight mb-2"
          >
            Lírio Branco
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.6, ease: "easeOut" }}
            className="font-cursive text-4xl md:text-5xl text-lirio-text/80 mb-10"
          >
            A poesia que você veste.
          </motion.p>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 2.0, ease: "easeOut" }}
            className="font-sans text-sm font-light text-lirio-text/80 leading-relaxed max-w-xl mx-auto mb-10"
          >
            Nascida das palavras não ditas, a Lírio Branco transforma poesia em
            matéria. Explore nosso catálogo e encontre a joia que traduz a sua
            essência.
          </motion.p>

          {/* Botões Sobre */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 2.3, ease: "easeOut" }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8"
          >
            <Link
              href="/sobre-a-lirio"
              className="px-8 py-3 rounded-full border border-lirio-text text-lirio-text font-sans text-xs tracking-widest uppercase hover:bg-lirio-text hover:text-lirio-light transition-colors w-full sm:w-auto"
            >
              Sobre a Lírio
            </Link>
            <Link
              href="/sobre-mim"
              className="px-8 py-3 rounded-full border border-lirio-text/30 text-lirio-text font-sans text-xs tracking-widest uppercase hover:border-lirio-text transition-colors w-full sm:w-auto"
            >
              Sobre a Sophia Anjos
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ── CATÁLOGO ─────────────────────────────────────────────────────── */}
      <section id="vitrine-section" className="scroll-mt-24">
        {/* Header + Filtros */}
        <div className="mb-10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 border-b border-lirio-text/10 pb-4">
            <div className="max-w-xl">
              <h2 className="font-serif text-4xl text-lirio-text mb-2">
                Catálogo
              </h2>
              <p className="font-sans text-sm font-light text-lirio-text/80 leading-relaxed">
                Explore nossas peças e encontre a joia perfeita. Use os filtros
                para refinar por material e tipo de acessório.
              </p>
            </div>
          </div>

          {/* Busca no Catálogo */}
          <div className="mb-8">
            <div className="glass-panel w-full max-w-md rounded-full flex items-center px-5 py-3 transition-all hover:bg-white/30 focus-within:bg-white/40 shadow-sm border border-white/40">
              <span className="text-lirio-text/60 mr-3 text-lg rotate-90">
                ⚲
              </span>
              <input
                type="text"
                placeholder="Busque por nome, material ou tipo..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="bg-transparent border-none outline-none w-full font-sans text-sm font-light text-lirio-text placeholder:text-lirio-text/50"
              />
            </div>
          </div>

          {/* Filtro: Material */}
          <div className="mb-4">
            <span className="font-sans text-[10px] font-bold tracking-widest uppercase text-lirio-text/60 mb-2 block">
              Material
            </span>
            <div className="flex flex-wrap gap-2">
              {materiaisDisponiveis.map((mat) => (
                <button
                  key={mat}
                  onClick={() => setFiltroMaterial(mat)}
                  className={`font-sans text-xs font-semibold tracking-widest uppercase px-5 py-2 rounded-full border transition-all ${
                    filtroMaterial === mat
                      ? "bg-lirio-text text-lirio-light border-lirio-text"
                      : "glass-panel border-white/50 text-lirio-text hover:bg-white/40"
                  }`}
                >
                  {mat}
                </button>
              ))}
            </div>
          </div>

          {/* Filtro: Categoria */}
          <div>
            <span className="font-sans text-[10px] font-bold tracking-widest uppercase text-lirio-text/60 mb-2 block">
              Tipo de Acessório
            </span>
            <div className="flex flex-wrap gap-2">
              {categoriasDisponiveis.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setFiltroCategoria(cat)}
                  className={`font-sans text-xs font-semibold tracking-widest uppercase px-5 py-2 rounded-full border transition-all ${
                    filtroCategoria === cat
                      ? "bg-lirio-text text-lirio-light border-lirio-text"
                      : "glass-panel border-white/50 text-lirio-text hover:bg-white/40"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Grid de Produtos */}
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <p className="text-lirio-text text-lg animate-pulse font-light font-serif">
              Preparando a vitrine...
            </p>
          </div>
        ) : produtosFiltrados.length === 0 ? (
          <div className="text-center py-20">
            <p className="font-cursive text-4xl text-lirio-text/40 mb-4">
              Nenhuma joia encontrada.
            </p>
            <button
              onClick={() => {
                setBusca("");
                setFiltroMaterial("Todos");
                setFiltroCategoria("Todas");
              }}
              className="font-sans text-xs uppercase tracking-widest text-lirio-text/60 hover:text-lirio-text border-b border-lirio-text/30 pb-1 transition"
            >
              Limpar filtros
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3 md:gap-8">
            <AnimatePresence mode="popLayout">
              {produtosFiltrados.map((product, index) => {
                const translation =
                  index % 3 === 1 ? "lg:translate-y-6 md:lg:translate-y-12" : "";
                const materialColor =
                  MATERIAL_COLOR[product.material] || "#D4AF37";

                return (
                  <motion.div
                    key={product.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{
                      duration: 0.5,
                      delay: (index % 6) * 0.08,
                      ease: "easeOut",
                    }}
                    className={`glass-card rounded-2xl md:rounded-[2rem] p-2 md:p-4 flex flex-col group ${translation}`}
                  >
                    <Link
                      href={`/produto/${product.id}`}
                      className="flex flex-col flex-grow"
                    >
                      {/* Imagem */}
                      <div className="relative aspect-[3/4] md:h-72 md:aspect-auto rounded-xl md:rounded-3xl overflow-hidden mb-3 md:mb-6 bg-white/40">
                        <Image
                          src={product.imagem}
                          alt={product.nome}
                          fill
                          className="object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                          sizes="33vw"
                        />

                        {/* Badge Material */}
                        <div
                          className="absolute top-2 left-2 md:top-4 md:left-4 px-2 py-0.5 md:px-3 md:py-1 rounded-full text-white text-[8px] md:text-[10px] font-sans font-bold tracking-widest uppercase backdrop-blur-sm shadow-sm"
                          style={{ backgroundColor: materialColor }}
                        >
                          {product.material}
                        </div>

                        {/* Favorito removido */}
                      </div>

                      {/* Info */}
                      <div className="px-1 pb-2 md:px-4 md:pb-4 text-center flex-grow flex flex-col justify-between">
                        <div>
                          <span
                            className="font-cursive text-sm md:text-2xl block mb-0.5 md:mb-1"
                            style={{ color: materialColor }}
                          >
                            {product.categoria}
                          </span>
                          <h3 className="font-serif text-sm md:text-2xl font-medium text-lirio-text mb-1 md:mb-2 line-clamp-2 leading-tight">
                            {product.nome}
                          </h3>
                        </div>
                        <p className="font-sans text-xs md:text-sm text-lirio-text/80 tracking-wide font-semibold mt-1">
                          {formattedPrice(product.preco)}
                        </p>
                      </div>
                    </Link>

                    {/* Botão Adicionar */}
                    <AddToCartButton product={product} />
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────────── */}
      <footer className="mt-20 pt-16 px-6 pb-12 glass-panel rounded-t-[3rem] border-b-0 border-x-0 relative z-10 max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center md:items-start gap-12 text-center md:text-left px-8">
          <div className="max-w-sm">
            <h4 className="font-cursive text-5xl text-lirio-text mb-4">
              Lírio Branco
            </h4>
            <p className="font-serif text-lg text-lirio-text/80 leading-relaxed italic">
              &ldquo;Nascida das palavras não ditas, a Lírio Branco transforma
              poesia em matéria. Feita para mulheres que encontram a beleza no
              cuidado com a própria alma.&rdquo;
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-12 w-full md:w-auto mt-12 md:mt-0">
            <div>
              <h5 className="font-sans text-xs font-bold tracking-widest uppercase text-lirio-text mb-6">
                A Marca
              </h5>
              <ul className="space-y-3 font-sans text-sm text-lirio-text/70">
                <li>
                  <Link href="/sobre-a-lirio" className="hover:text-lirio-primary transition">
                    Sobre a Lírio Branco
                  </Link>
                </li>
                <li>
                  <Link href="/sobre-mim" className="hover:text-lirio-primary transition">
                    Sobre a Sophia Anjos
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h5 className="font-sans text-xs font-bold tracking-widest uppercase text-lirio-text mb-6">
                Redes Sociais
              </h5>
              <ul className="space-y-3 font-sans text-sm text-lirio-text/70">
                <li>
                  <a href="https://instagram.com/liriobrancooficial" target="_blank" rel="noopener noreferrer" className="hover:text-lirio-primary transition">
                    @liriobrancooficial
                  </a>
                </li>
                <li>
                  <a href="https://instagram.com/sosoanjos" target="_blank" rel="noopener noreferrer" className="hover:text-lirio-primary transition">
                    @sosoanjos
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h5 className="font-sans text-xs font-bold tracking-widest uppercase text-lirio-text mb-6">
                Navegação
              </h5>
              <ul className="space-y-3 font-sans text-sm text-lirio-text/70">
                <li>
                  <button
                    onClick={() =>
                      window.scrollTo({ top: 0, behavior: "smooth" })
                    }
                    className="hover:text-lirio-primary transition"
                  >
                    Voltar ao Topo
                  </button>
                </li>
                <li>
                  <a
                    href="#vitrine-section"
                    className="hover:text-lirio-primary transition"
                  >
                    Explorar Catálogo
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-white/30 text-center flex flex-col items-center">
          <span className="text-lirio-text text-xl opacity-50 mb-4">♡</span>
          <p className="font-sans text-xs text-lirio-text/50 uppercase tracking-[0.2em]">
            © 2026 Lírio Branco.
          </p>
        </div>
      </footer>
    </div>
  );
}

// Componente isolado — evita re-render do grid inteiro ao clicar
function AddToCartButton({ product }: { product: Product }) {
  const addItem = useCartStore((s) => s.addItem);
  const [clicked, setClicked] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    addItem({
      id: product.id,
      nome: product.nome,
      preco: product.preco,
      imagem: product.imagem,
    });
    setClicked(true);
    setTimeout(() => setClicked(false), 1200);
  };

  return (
    <div className="px-1 pb-1 pt-1 md:px-4 md:pb-4 md:pt-2">
      <button
        onClick={handleClick}
        className="w-full py-1.5 md:py-3 rounded-lg md:rounded-xl border border-lirio-text/20 text-lirio-text font-sans text-[8px] md:text-xs font-bold tracking-widest uppercase hover:bg-white/40 hover:border-lirio-text/40 transition relative overflow-hidden"
      >
        <span className="hidden md:inline">{clicked ? "Adicionada ✦" : "Adicionar à Sacola"}</span>
        <span className="md:hidden">{clicked ? "Adicionada ✦" : "Adicionar"}</span>

        <AnimatePresence>
          {clicked && (
            <motion.span
              initial={{ opacity: 1, scale: 0, y: 0 }}
              animate={{ opacity: 0, scale: 1.5, y: -30 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="absolute inset-0 flex items-center justify-center text-lirio-primary font-serif text-lg md:text-2xl pointer-events-none"
            >
              ✦
            </motion.span>
          )}
        </AnimatePresence>
      </button>
    </div>
  );
}
