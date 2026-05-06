"use client";

import Link from "next/link";
import { useCartStore } from "@/store/useCartStore";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export function Header() {
  const items = useCartStore((state) => state.items);
  const totalItems = items.reduce((sum, item) => sum + item.quantidade, 0);
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);

  // Logo aparece somente após sair da seção hero (~500px)
  const [logoVisible, setLogoVisible] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    // Configura os scroll listeners
    const handleScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 50);
      setLogoVisible(y > 500);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    
    // Inicializa o tema (Dark/Light mode)
    const storedTheme = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    if (storedTheme === "dark" || (!storedTheme && prefersDark)) {
      document.documentElement.classList.add("dark");
      setIsDarkMode(true);
    }

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleTheme = () => {
    if (isDarkMode) {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
      setIsDarkMode(false);
    } else {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
      setIsDarkMode(true);
    }
  };

  if (pathname.startsWith("/admin") || pathname.startsWith("/login"))
    return null;

  // Em páginas internas (/produto, /sacola) o logo sempre é visível
  const isHomePage = pathname === "/";
  const showLogo = !isHomePage || logoVisible;

  return (
    <header
      className={`fixed top-0 w-full p-6 flex justify-between items-center z-50 transition-all duration-300 ${
        scrolled ? "bg-white/10 backdrop-blur-md shadow-sm" : ""
      }`}
    >
      {/* Logo Cursiva */}
      <Link
        href="/"
        className={`flex flex-col items-center transform -rotate-2 hover:rotate-0 transition-all duration-500 ${
          showLogo
            ? "opacity-100 translate-y-0"
            : "opacity-0 -translate-y-4 pointer-events-none"
        }`}
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        tabIndex={showLogo ? 0 : -1}
      >
        <span className="font-cursive text-4xl text-lirio-text leading-none">
          Lírio Branco
        </span>
        <span className="font-sans text-[0.55rem] font-bold tracking-[0.3em] text-lirio-text uppercase mt-1">
          Acessórios
        </span>
      </Link>

      {/* Navegação */}
      <nav className="flex gap-4">
        <button
          onClick={toggleTheme}
          className="w-10 h-10 rounded-full glass-panel flex items-center justify-center text-lirio-text hover:bg-white/40 transition hover:scale-105"
          title={isDarkMode ? "Modo Claro" : "Modo Noturno"}
          aria-label="Alternar Tema"
        >
          {isDarkMode ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="5"></circle>
              <line x1="12" y1="1" x2="12" y2="3"></line>
              <line x1="12" y1="21" x2="12" y2="23"></line>
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
              <line x1="1" y1="12" x2="3" y2="12"></line>
              <line x1="21" y1="12" x2="23" y2="12"></line>
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
            </svg>
          )}
        </button>
        <Link
          href="/sacola"
          className="w-10 h-10 rounded-full glass-panel flex items-center justify-center text-xl text-lirio-text hover:bg-white/40 transition hover:scale-105 relative"
          aria-label={`Sacola de compras, ${totalItems} ${totalItems === 1 ? "item" : "itens"}`}
          title="Sacola"
        >
          🛍
          {totalItems > 0 && (
            <span className="absolute -top-1 -right-1 bg-lirio-primary text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
              {totalItems}
            </span>
          )}
        </Link>
      </nav>
    </header>
  );
}
