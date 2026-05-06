import Link from "next/link";

export default function SobreLirio() {
  return (
    <div className="relative z-10 pt-32 pb-20 px-6 max-w-4xl mx-auto space-y-24 min-h-screen">
      {/* Header da Página */}
      <section className="text-center space-y-8">
        <h1 className="font-serif text-5xl md:text-7xl text-lirio-text font-light tracking-tight">
          A Essência da Lírio
        </h1>
        <p className="font-cursive text-3xl md:text-4xl text-lirio-text/80">
          Transformando poesia em matéria.
        </p>
      </section>

      {/* Conteúdo Principal */}
      <section className="glass-card rounded-[2rem] p-8 md:p-12 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-lirio-text/20 to-transparent"></div>
        
        <div className="space-y-8 font-sans font-light text-lirio-text/80 leading-relaxed text-lg">
          <p>
            <span className="text-2xl font-serif text-lirio-text">A Lírio Branco</span> nasceu de um desejo profundo de eternizar sentimentos. Acreditamos que uma joia não é apenas um adorno, mas um pedaço de poesia que você escolhe carregar consigo todos os dias.
          </p>
          <p>
            Cada peça do nosso catálogo é curada com um olhar atento aos detalhes, buscando a harmonia perfeita entre o brilho sutil da prata e a elegância atemporal do dourado. Nossa missão é oferecer peças que ressoem com a sua própria história.
          </p>
          
          <div className="pt-8 border-t border-lirio-text/10 mt-8">
            <h3 className="font-serif text-3xl text-lirio-text mb-6">Nossos Valores</h3>
            <ul className="space-y-6">
              <li className="flex flex-col">
                <span className="font-sans font-bold tracking-widest uppercase text-lirio-text text-sm mb-1">Delicadeza</span>
                <span className="text-lirio-text/70 text-base">O belo mora nos detalhes sutis. Acreditamos no poder do minimalismo.</span>
              </li>
              <li className="flex flex-col">
                <span className="font-sans font-bold tracking-widest uppercase text-lirio-text text-sm mb-1">Autenticidade</span>
                <span className="text-lirio-text/70 text-base">Joias que expressam quem você é, sem precisar dizer uma palavra sequer.</span>
              </li>
              <li className="flex flex-col">
                <span className="font-sans font-bold tracking-widest uppercase text-lirio-text text-sm mb-1">Afeto</span>
                <span className="text-lirio-text/70 text-base">Cada pedido embalado e entregue como uma verdadeira carta de amor para você.</span>
              </li>
            </ul>
          </div>
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
