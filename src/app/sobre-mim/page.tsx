import Image from "next/image";
import Link from "next/link";

export default function SobreMim() {
  return (
    <div className="relative z-10 pt-32 pb-20 px-6 max-w-4xl mx-auto space-y-24 min-h-screen">
      {/* Header da Página */}
      <section className="text-center space-y-8">
        <h1 className="font-serif text-5xl md:text-7xl text-lirio-text font-light tracking-tight">
          Quem faz a Lírio
        </h1>
        <p className="font-cursive text-3xl md:text-4xl text-lirio-text/80">
          A alma criativa por trás da marca.
        </p>
      </section>

      {/* Conteúdo Principal */}
      <section className="glass-card rounded-[2rem] p-8 md:p-12 relative overflow-hidden flex flex-col md:flex-row gap-12 items-center md:items-start">
        <div className="absolute top-0 right-0 w-1 h-full bg-gradient-to-b from-transparent via-lirio-text/20 to-transparent"></div>
        
        {/* Espaço para foto da namorada */}
        <div className="w-48 h-48 md:w-64 md:h-64 rounded-full bg-white/30 flex-shrink-0 relative overflow-hidden border-4 border-white/50 shadow-xl mt-4">
          <Image
            src="/SophiaAnjos.png"
            alt="Retrato"
            fill
            className="object-cover"
            style={{ objectPosition: "40% center" }}
            sizes="(max-width: 768px) 12rem, 16rem"
          />
        </div>

        {/* Textos sobre ela */}
        <div className="space-y-6 font-sans font-light text-lirio-text/80 leading-relaxed text-lg text-center md:text-left">
          <p>
            Olá! Eu me chamo <strong>Sophia Anjos</strong>, sou a artista por trás da Lírio Branco.
          </p>
          <p>
            Sempre fui apaixonada por pequenos detalhes e como às vezes um acessório simples, uma maquiagem simples... podem transformar não apenas o nosso visual, mas como nos sentimos por dentro. A Lírio Branco nasce do meu próprio coração: é um outro espaço onde posso compartilhar com vocês a minha visão de beleza, rotina e moda.
          </p>
          <p>
            Cada escolha no nosso catálogo tem o meu toque pessoal e a minha realização como uma poeta e atriz sonhadora de compartilhar com todos a minha arte!
          </p>
          <p>
            Espero que com a Lírio Branco, você possa fazer parte do meu propósito.
          </p>
          <p className="font-cursive text-3xl pt-6 text-lirio-text">
            Com muito amor, <br/> Sophia Anjos
          </p>
        </div>
      </section>

      {/* Botão de Retorno */}
      <div className="text-center pb-12">
        <Link
          href="/"
          className="font-sans text-xs uppercase tracking-widest text-lirio-text/60 hover:text-lirio-text border-b border-lirio-text/30 hover:border-lirio-text pb-1 transition-all inline-block"
        >
          Voltar ao início
        </Link>
      </div>
    </div>
  );
}
