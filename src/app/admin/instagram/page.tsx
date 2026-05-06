"use client";

import { useEffect, useState, useCallback } from "react";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  query,
  orderBy,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useRouter } from "next/navigation";

interface InstaPost {
  id: string;
  url: string;
  createdAt: number;
}

function extractShortcode(url: string): string | null {
  const match = url.match(/instagram\.com\/(?:p|reel)\/([A-Za-z0-9_-]+)/);
  return match ? match[1] : null;
}

export default function InstagramAdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [posts, setPosts] = useState<InstaPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newUrl, setNewUrl] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const startListener = useCallback(() => {
    const q = query(collection(db, "instagram_posts"), orderBy("createdAt", "desc"));
    return onSnapshot(q, (snapshot) => {
      const lista: InstaPost[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        lista.push({
          id: docSnap.id,
          url: data.url,
          createdAt: data.createdAt?.toMillis?.() || Date.now(),
        });
      });
      setPosts(lista);
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
    return () => { unsubAuth(); unsubFirestore?.(); };
  }, [router, startListener]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const trimmed = newUrl.trim();

    if (!extractShortcode(trimmed)) {
      setError("URL inv\u00e1lida. Cole o link de um post ou reel do Instagram.");
      return;
    }

    if (posts.some((p) => extractShortcode(p.url) === extractShortcode(trimmed))) {
      setError("Este post j\u00e1 foi adicionado.");
      return;
    }

    setIsSaving(true);
    try {
      await addDoc(collection(db, "instagram_posts"), {
        url: trimmed,
        createdAt: serverTimestamp(),
      });
      setNewUrl("");
    } catch {
      setError("Erro ao salvar. Tente novamente.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Remover este post do feed?")) return;
    try {
      await deleteDoc(doc(db, "instagram_posts", id));
    } catch {
      setError("Erro ao remover.");
    }
  };

  if (!isAuthenticated || isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center h-full min-h-[50vh]">
        <p className="text-brand-charcoal dark:text-brand-white text-lg animate-pulse font-light">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 flex-1 overflow-y-auto relative">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-serif text-brand-charcoal dark:text-brand-white mb-1">Instagram Feed</h1>
          <p className="text-text-muted text-sm">Gerencie os posts exibidos na p&aacute;gina inicial</p>
        </div>
      </div>

      {/* Formulário de Adição */}
      <form onSubmit={handleAdd} className="bg-white dark:bg-[#1A1A1A] rounded-xl border border-gray-100 dark:border-gray-800 p-5 mb-8 shadow-sm">
        <label className="block text-sm font-semibold text-brand-charcoal dark:text-brand-white mb-2">
          Adicionar Post
        </label>
        <p className="text-xs text-text-muted mb-4">
          Cole a URL de um post ou reel do Instagram (ex: https://www.instagram.com/p/ABC123/)
        </p>
        <div className="flex gap-3">
          <input
            type="url"
            value={newUrl}
            onChange={(e) => { setNewUrl(e.target.value); setError(""); }}
            placeholder="https://www.instagram.com/p/..."
            className="flex-1 px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-brand-charcoal dark:text-brand-white focus:outline-none focus:ring-2 focus:ring-brand-rose"
            required
          />
          <button
            type="submit"
            disabled={isSaving}
            className="bg-brand-rose text-white px-6 py-2.5 rounded-xl font-medium shadow-sm hover:bg-opacity-90 transition-opacity text-sm whitespace-nowrap disabled:opacity-50"
          >
            {isSaving ? "Salvando..." : "Adicionar"}
          </button>
        </div>
        {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
      </form>

      {/* Lista de Posts */}
      {posts.length === 0 ? (
        <div className="bg-white dark:bg-[#1A1A1A] rounded-xl border border-gray-100 dark:border-gray-800 p-12 text-center text-text-muted">
          Nenhum post adicionado ainda.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {posts.map((post) => {
            const shortcode = extractShortcode(post.url);
            return (
              <div key={post.id} className="bg-white dark:bg-[#1A1A1A] rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden shadow-sm group">
                {shortcode && (
                  <iframe
                    src={`https://www.instagram.com/p/${shortcode}/embed`}
                    className="w-full h-[420px] border-0"
                    loading="lazy"
                    title={`Instagram post ${shortcode}`}
                  />
                )}
                <div className="p-3 flex items-center justify-between border-t border-gray-100 dark:border-gray-800">
                  <a
                    href={post.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-brand-rose hover:underline truncate max-w-[200px]"
                  >
                    {post.url}
                  </a>
                  <button
                    onClick={() => handleDelete(post.id)}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                    title="Remover"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                    </svg>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
