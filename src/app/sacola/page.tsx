"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useCartStore, CartItem } from "@/store/useCartStore";
import { collection, addDoc, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { motion, AnimatePresence } from "framer-motion";

const WHATSAPP_NUMBER = "5511913110931";

export default function SacolaPage() {
  const { items, removeItem, clearCart } = useCartStore();
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [sending, setSending] = useState(false);

  const total = items.reduce(
    (sum, item) => sum + item.preco * item.quantidade,
    0
  );

  const formattedPrice = (value: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);

  const handleFinalize = async () => {
    if (!nome.trim() || !telefone.trim() || items.length === 0) return;
    setSending(true);

    try {
      const nomeCliente = nome.trim();
      const telefoneCliente = telefone.trim();

      // 1. Registra/atualiza cliente na coleção "clientes" de forma isolada
      // (compatível com regras Firestore write-only que protegem PII contra listagem pública)
      const clientesRef = collection(db, "clientes");
      try {
        const clienteQuery = query(clientesRef, where("tel", "==", telefoneCliente));
        const clienteSnap = await getDocs(clienteQuery);

        if (clienteSnap.empty) {
          await addDoc(clientesRef, {
            nome: nomeCliente,
            tel: telefoneCliente,
            obs: "",
          });
        } else {
          const { updateDoc, doc: docRef } = await import("firebase/firestore");
          const clienteDoc = clienteSnap.docs[0];
          await updateDoc(docRef(db, "clientes", clienteDoc.id), {
            nome: nomeCliente,
          });
        }
      } catch {
        try {
          await addDoc(clientesRef, {
            nome: nomeCliente,
            tel: telefoneCliente,
            obs: "",
          });
        } catch {
          // Prossegue normalmente para registrar o pedido
        }
      }

      // 2. Salva pedido com a estrutura exata que o app mobile lê
      // Campos obrigatórios: clienteNome, data (pt-BR), itens[].qtdPedida, total, timestamp
      await addDoc(collection(db, "pedidos"), {
        clienteNome: nomeCliente,
        data: new Date().toLocaleDateString("pt-BR"),
        itens: items.map((item) => ({
          id: item.id,
          nome: item.nome,
          preco: item.preco,
          qtdPedida: item.quantidade,
        })),
        total,
        timestamp: Date.now(),
      });

      // 3. Monta mensagem do WhatsApp (sem preço, conforme regra de negócio)
      const itensTexto = items
        .map((item) => `• ${item.nome} (x${item.quantidade})`)
        .join("\n");

      const mensagem = encodeURIComponent(
        `Ol\u00e1! Sou ${nomeCliente}.\n\nGostaria de finalizar meu pedido:\n\n${itensTexto}\n\nAguardo retorno!`
      );

      clearCart();
      window.open(
        `https://wa.me/${WHATSAPP_NUMBER}?text=${mensagem}`,
        "_blank"
      );
    } catch {
      // Fallback silencioso
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="relative z-10 pt-28 pb-20 px-6 max-w-4xl mx-auto">
      {/* Breadcrumb */}
      <nav className="mb-10 font-sans text-xs text-lirio-text/50 tracking-widest uppercase">
        <Link href="/" className="hover:text-lirio-text transition">
          Início
        </Link>
        <span className="mx-2">·</span>
        <span className="text-lirio-text/80">Sacola</span>
      </nav>

      <h1 className="font-serif text-4xl md:text-5xl text-lirio-text mb-2">
        Sua Sacola
      </h1>
      <p className="font-sans text-sm font-light text-lirio-text/60 mb-12">
        {items.length === 0
          ? "Sua sacola está vazia."
          : `${items.reduce((s, i) => s + i.quantidade, 0)} ${items.reduce((s, i) => s + i.quantidade, 0) === 1 ? "peça selecionada" : "peças selecionadas"}`}
      </p>

      {items.length === 0 ? (
        <div className="text-center py-20">
          <p className="font-cursive text-5xl text-lirio-text/30 mb-6">
            Nenhuma peça por aqui...
          </p>
          <Link
            href="/"
            className="font-sans text-xs uppercase tracking-widest text-lirio-text/60 hover:text-lirio-text border-b border-lirio-text/30 pb-1 transition"
          >
            Explorar catálogo
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Lista de itens */}
          <div className="lg:col-span-2 space-y-4">
            <AnimatePresence mode="popLayout">
              {items.map((item) => (
                <CartItemCard
                  key={item.id}
                  item={item}
                  onRemove={() => removeItem(item.id)}
                  formattedPrice={formattedPrice}
                />
              ))}
            </AnimatePresence>
          </div>

          {/* Resumo e dados do cliente */}
          <div className="glass-panel rounded-[2rem] p-8 h-fit space-y-8 lg:sticky lg:top-28">
            <div>
              <h3 className="font-serif text-xl text-lirio-text mb-4">
                Resumo
              </h3>
              <div className="flex justify-between items-end border-b border-white/30 pb-4 mb-4">
                <span className="font-sans text-xs text-lirio-text/60 uppercase tracking-widest">
                  Total
                </span>
                <span className="font-sans text-xl font-semibold text-lirio-text">
                  {formattedPrice(total)}
                </span>
              </div>
            </div>

            {/* Dados do cliente */}
            <div className="space-y-4">
              <h3 className="font-serif text-xl text-lirio-text">
                Seus dados
              </h3>
              <input
                type="text"
                placeholder="Seu nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="w-full bg-white/20 border border-white/40 rounded-xl px-4 py-3 font-sans text-sm text-lirio-text placeholder:text-lirio-text/40 outline-none focus:border-lirio-text/40 transition"
                id="clientName"
              />
              <input
                type="tel"
                placeholder="Seu telefone"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                className="w-full bg-white/20 border border-white/40 rounded-xl px-4 py-3 font-sans text-sm text-lirio-text placeholder:text-lirio-text/40 outline-none focus:border-lirio-text/40 transition"
                id="clientPhone"
              />
            </div>

            <button
              onClick={handleFinalize}
              disabled={!nome.trim() || !telefone.trim() || sending}
              className="w-full py-4 rounded-2xl bg-lirio-text text-lirio-light font-sans text-xs font-bold tracking-widest uppercase hover:bg-lirio-text/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {sending ? "Enviando..." : "Finalizar via WhatsApp"}
            </button>

            <p className="font-sans text-[10px] text-lirio-text/40 text-center leading-relaxed">
              Ao finalizar, seu pedido será salvo e você será redirecionada ao
              WhatsApp para confirmar.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function CartItemCard({
  item,
  onRemove,
  formattedPrice,
}: {
  item: CartItem;
  onRemove: () => void;
  formattedPrice: (v: number) => string;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20, scale: 0.95 }}
      transition={{ duration: 0.3 }}
      className="glass-card rounded-2xl p-4 flex gap-4 items-center"
    >
      <div className="relative w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-white/40">
        <Image
          src={item.imagem}
          alt={item.nome}
          fill
          className="object-cover"
          sizes="80px"
        />
      </div>

      <div className="flex-grow min-w-0">
        <h4 className="font-serif text-lg text-lirio-text truncate">
          {item.nome}
        </h4>
        <p className="font-sans text-xs text-lirio-text/60">
          Qtd: {item.quantidade}
        </p>
      </div>

      <div className="flex flex-col items-end gap-2 flex-shrink-0">
        <span className="font-sans text-sm font-semibold text-lirio-text">
          {formattedPrice(item.preco * item.quantidade)}
        </span>
        <button
          onClick={onRemove}
          className="font-sans text-[10px] uppercase tracking-widest text-lirio-text/40 hover:text-lirio-text transition"
          aria-label={`Remover ${item.nome}`}
        >
          Remover
        </button>
      </div>
    </motion.div>
  );
}
