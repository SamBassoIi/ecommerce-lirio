"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useCartStore } from "@/store/useCartStore";
import { motion, AnimatePresence } from "framer-motion";

interface Product {
  id: string;
  nome: string;
  preco: number;
  descricao: string;
  imagens: string[];
  material: "Dourado" | "Prata";
  categoria: string;
}

const MATERIAL_COLOR: Record<string, string> = {
  Dourado: "#D4AF37",
  Prata: "#9EA2A2",
};

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?q=80&w=600&auto=format&fit=crop";

export default function ProdutoPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [added, setAdded] = useState(false);

  const addItem = useCartStore((s) => s.addItem);

  useEffect(() => {
    if (!id) return;
    async function fetchProduct() {
      try {
        const snap = await getDoc(doc(db, "produtos", id));
        if (snap.exists()) {
          const d = snap.data();
          setProduct({
            id: snap.id,
            nome: d.nome || "Sem nome",
            preco: d.preco || 0,
            descricao: d.descricao || "",
            imagens: d.imagens?.length > 0 ? d.imagens : [FALLBACK_IMAGE],
            material: d.material || "Dourado",
            categoria: d.categoria || "Geral",
          });
        }
      } catch {
        // Fallback silencioso
      } finally {
        setIsLoading(false);
      }
    }
    fetchProduct();
  }, [id]);

  const formattedPrice = (value: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);

  const handleAddToCart = () => {
    if (!product) return;
    addItem({
      id: product.id,
      nome: product.nome,
      preco: product.preco,
      imagem: product.imagens[0],
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  if (isLoading) {
    return (
      <div className="relative z-10 flex items-center justify-center min-h-screen">
        <p className="text-lirio-text text-lg animate-pulse font-light font-serif">
          Carregando peça...
        </p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen gap-6 px-6">
        <p className="font-cursive text-4xl text-lirio-text/50">
          Peça não encontrada
        </p>
        <Link
          href="/"
          className="font-sans text-xs uppercase tracking-widest text-lirio-text/60 hover:text-lirio-text border-b border-lirio-text/30 pb-1 transition"
        >
          Voltar ao catálogo
        </Link>
      </div>
    );
  }

  const materialColor = MATERIAL_COLOR[product.material] || "#D4AF37";

  return (
    <div className="relative z-10 pt-28 pb-20 px-6 max-w-6xl mx-auto">
      {/* Breadcrumb */}
      <nav className="mb-10 font-sans text-xs text-lirio-text/50 tracking-widest uppercase">
        <Link href="/" className="hover:text-lirio-text transition">
          Início
        </Link>
        <span className="mx-2">·</span>
        <span className="text-lirio-text/80">{product.nome}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
        {/* Galeria */}
        <div className="space-y-4">
          <motion.div
            key={activeImage}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="relative aspect-[4/5] rounded-[2rem] overflow-hidden glass-card"
          >
            <Image
              src={product.imagens[activeImage]}
              alt={product.nome}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
              priority
            />
            {/* Badge Material */}
            <div
              className="absolute top-5 left-5 px-4 py-1.5 rounded-full text-white text-[10px] font-sans font-bold tracking-widest uppercase backdrop-blur-sm shadow-sm"
              style={{ backgroundColor: materialColor }}
            >
              {product.material}
            </div>
          </motion.div>

          {/* Miniaturas */}
          {product.imagens.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {product.imagens.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImage(i)}
                  className={`relative w-20 h-20 flex-shrink-0 rounded-xl overflow-hidden border-2 transition-all ${
                    activeImage === i
                      ? "border-lirio-text/60 scale-105"
                      : "border-white/40 opacity-60 hover:opacity-100"
                  }`}
                  aria-label={`Ver imagem ${i + 1}`}
                >
                  <Image
                    src={img}
                    alt={`${product.nome} - ${i + 1}`}
                    fill
                    className="object-cover"
                    sizes="80px"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Detalhes */}
        <div className="flex flex-col justify-center py-4">
          <span
            className="font-cursive text-3xl mb-2 block"
            style={{ color: materialColor }}
          >
            {product.categoria}
          </span>

          <h1 className="font-serif text-4xl md:text-5xl font-medium text-lirio-text mb-4">
            {product.nome}
          </h1>

          <p className="font-sans text-2xl font-semibold text-lirio-text/90 mb-8 tracking-wide">
            {formattedPrice(product.preco)}
          </p>

          {product.descricao && (
            <p className="font-sans text-sm font-light text-lirio-text/70 leading-relaxed mb-10 max-w-md">
              {product.descricao}
            </p>
          )}

          {/* Informações do material */}
          <div className="glass-panel rounded-2xl p-6 mb-8 space-y-3">
            <div className="flex items-center gap-3">
              <span
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: materialColor }}
              />
              <span className="font-sans text-xs font-bold tracking-widest uppercase text-lirio-text/70">
                {product.material}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-lirio-primary/50" />
              <span className="font-sans text-xs font-bold tracking-widest uppercase text-lirio-text/70">
                {product.categoria}
              </span>
            </div>
          </div>

          {/* Botão adicionar à sacola */}
          <button
            onClick={handleAddToCart}
            className="w-full max-w-sm py-4 rounded-2xl bg-lirio-text text-lirio-light font-sans text-xs font-bold tracking-widest uppercase hover:bg-lirio-text/90 transition-all relative overflow-hidden"
          >
            {added ? "Adicionada à Sacola ✦" : "Adicionar à Sacola"}

            <AnimatePresence>
              {added && (
                <motion.span
                  initial={{ opacity: 1, scale: 0, y: 0 }}
                  animate={{ opacity: 0, scale: 1.5, y: -30 }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className="absolute inset-0 flex items-center justify-center text-lirio-primary font-serif text-2xl pointer-events-none"
                >
                  ✦
                </motion.span>
              )}
            </AnimatePresence>
          </button>

          {/* Link ver sacola */}
          {added && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4"
            >
              <Link
                href="/sacola"
                className="font-sans text-xs uppercase tracking-widest text-lirio-text/60 hover:text-lirio-text border-b border-lirio-text/30 pb-1 transition"
              >
                Ver sacola →
              </Link>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
