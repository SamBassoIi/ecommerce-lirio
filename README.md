# 🛍️ Lírio Branco — E-commerce & Painel Gestor ERP Full-Stack

![Next.js](https://img.shields.io/badge/Next.js_16-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS_v4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)

Plataforma completa de **E-commerce e Backoffice Administrativo (ERP)** desenvolvida com **Next.js (App Router)**, **TypeScript**, **Tailwind CSS v4**, **Zustand**, **Framer Motion** e **Google Firebase** (*Firestore, Authentication e Cloud Storage*).

O sistema conecta a vitrine pública de semijoias e acessórios em tempo real ao painel administrativo interno de estoque, precificação, pedidos, clientes e fluxo financeiro.

![Vitrine Lírio Branco E-commerce](docs/preview.png)

---

## ✨ Principais Funcionalidades

### 🌸 Vitrine Pública (Storefront)
- **Catálogo Dinâmico em Tempo Real:** Listagem sincronizada com o Cloud Firestore, busca textual instantânea e filtragem combinada por material (*Dourado* / *Prata*) e categoria (*Conjuntos*, *Colares*, *Pulseiras*, *Brincos*, *Anéis*).
- **Página de Detalhes do Produto (`/produto/[id]`):** Galeria de fotos, especificações de banho/material e validação de disponibilidade de saldo.
- **Sacola Persistente com Zustand (`/sacola`):** Gerenciamento reativo de itens com persistência local, registro estruturado do pedido no Firestore e redirecionamento automatizado para fechamento via WhatsApp.
- **Design System Autoral & Dark Mode:** Identidade visual em estética *glassmorphism*, tipografia editorial (*Cormorant Garamond*, *Alex Brush* e *Montserrat*) e animações fluidas com **Framer Motion** e **Lottie**.

### 📊 Painel Gestor / Backoffice (`/admin/*`)
- **Autenticação Administrativa:** Rotas protegidas via **Firebase Authentication** e regras de acesso baseadas em função (`firestore.rules`).
- **Visão Geral & KPIs (`/admin/visao-geral`):** Métricas consolidadas de faturamento, ticket médio, peças em estoque e desempenho comercial.
- **Gestão de Produtos & Custos (`/admin`, `/admin/custos`):** Cadastro completo com upload de múltiplas imagens para o Firebase Storage, controle de saldo e cálculo de margem sobre custo de aquisição.
- **Gestão de Pedidos & CRM de Clientes (`/admin/pedidos`, `/admin/clientes`):** Acompanhamento de pedidos recebidos pela vitrine, baixa automática de estoque e histórico de clientes.
- **Controle Financeiro & Curadoria Social (`/admin/financeiro`, `/admin/instagram`):** Lançamento de receitas/despesas operacionais e gerenciamento dos posts em destaque do Instagram na página inicial.

---

## 🏗️ Arquitetura e Stack Tecnológica

| Camada | Tecnologias |
| :--- | :--- |
| **Framework & UI** | Next.js 16 (App Router), React 19, TypeScript 5 |
| **Estilização & Motion** | Tailwind CSS v4, Framer Motion, Lottie React |
| **Gerenciamento de Estado** | Zustand (`useCartStore`) |
| **Backend-as-a-Service** | Firebase Firestore, Firebase Auth, Firebase Storage |
| **Segurança de Dados** | Firestore Security Rules (`firestore.rules`) com RBAC Admin e isolamento de PII (LGPD) |

---

## 🚀 Como Executar Localmente

1. **Clone o repositório e instale as dependências:**
   ```bash
   git clone https://github.com/SamBassoIi/ecommerce-lirio.git
   cd ecommerce-lirio
   npm install
   ```

2. **Configure as variáveis de ambiente:**
   Copie o arquivo `.env.example` para `.env.local` e preencha com as credenciais do seu projeto Firebase:
   ```bash
   cp .env.example .env.local
   ```

3. **Inicie o servidor de desenvolvimento:**
   ```bash
   npm run dev
   ```
   Acesse `http://localhost:3000` para visualizar a vitrine e `http://localhost:3000/admin` para acessar o Painel Gestor.
