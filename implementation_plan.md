# Integração Firebase e Atualização da Vitrine

A arquitetura do projeto será atualizada para trocar os dados mockados no frontend por dados reais provenientes do Firestore.

## Arquivos que serão criados ou modificados:
- `src/lib/firebase.ts` **[NOVO]**: Arquivo responsável por inicializar o app Firebase e expor a instância do Firestore.
- `src/app/page.tsx` **[MODIFICAR]**: O componente principal da página inicial será convertido para um Client Component, onde faremos o fetch da coleção "produtos" e gerenciaremos o estado de loading.

## Plano de Ação Arquitetural:
1. **Configuração do Firebase**: Criação do cliente Firebase mantendo a separação de responsabilidades e seguindo as melhores práticas (Garantindo que o app não seja reinicializado múltiplas vezes caso ocorra *Fast Refresh*).
2. **Transformação do Componente da Vitrine**: Transformar o componente em um Client Component com a diretiva `"use client"`. O uso do side effect `useEffect` será adotado para efetuar a busca assimétrica sob a coleção `produtos` a partir do `getDocs` do Firestore.
3. **Gestão de Estado**: Vamos introduzir o estado `products` e `isLoading`. Quando a página carregar, um elegante estado (ex: skeleton ou texto minimalista) será exibido logo abaixo da Hero Section (que será mantida intacta).
4. **Mapeamento de Dados e Fallback de Imagem**: Utilizar os campos `nome`, `preco`, `material` e gerenciar um fallback para a imagem se `imagens[0]` for indefinido, prezando pelos princípios de Clean Code ao tratar potenciais `undefined`.
