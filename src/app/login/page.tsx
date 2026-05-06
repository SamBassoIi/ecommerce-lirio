"use client";

import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push("/admin");
    } catch (err: any) {
      setError("Credenciais inválidas. Verifique seu e-mail e senha.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-white flex items-center justify-center px-4">
      <Link href="/" className="absolute top-8 left-8 text-text-muted hover:text-brand-charcoal transition-colors text-sm font-medium">
        ← Voltar à Vitrine
      </Link>

      <div className="bg-white p-8 rounded-2xl shadow-sm border border-brand-white border-opacity-10 w-full max-w-sm relative">
        <h1 className="text-xl text-center text-brand-charcoal font-medium mb-6 mt-4">Acesso Administrativo</h1>

        {error && (
          <div className="bg-red-50 text-red-500 text-sm p-3 rounded-lg mb-4 text-center border border-red-100">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-brand-charcoal mb-1">E-mail</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 bg-gray-50 border border-gray-100 text-brand-charcoal rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-rose focus:ring-opacity-50 transition-shadow"
              placeholder="seu@email.com"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-brand-charcoal mb-1">Senha</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 bg-gray-50 border border-gray-100 text-brand-charcoal rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-rose focus:ring-opacity-50 transition-shadow"
              placeholder="••••••••"
              required
            />
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full bg-brand-rose text-white font-medium py-3 rounded-lg hover:bg-opacity-90 transition-opacity mt-4 disabled:opacity-50"
          >
            {isLoading ? "Autenticando..." : "Entrar no Sistema"}
          </button>
        </form>
      </div>
    </div>
  );
}
