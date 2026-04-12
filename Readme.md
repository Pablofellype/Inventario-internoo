<div align="center">

# Sistema de Inventário & Solicitação

**Plataforma web para gestão de pedidos de EPIs, Uniformes e Materiais (DML)**

[![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)](https://developer.mozilla.org/pt-BR/docs/Web/HTML)
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org/pt-BR/docs/Web/JavaScript)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com/)
[![Google Sheets](https://img.shields.io/badge/Google_Sheets-34A853?style=for-the-badge&logo=google-sheets&logoColor=white)](https://www.google.com/sheets/about/)

---

</div>

## Sobre o Projeto

Sistema web moderno desenvolvido para **gestão completa de pedidos de materiais**, conectando colaboradores e administradores em uma interface intuitiva. Opera com arquitetura **Serverless**, utilizando Google Sheets como banco de dados e Firebase para autenticação e cache.

### Destaques

- **Interface moderna** com design responsivo (TailwindCSS + Space Grotesk)
- **Solicitação pública** sem necessidade de senha para colaboradores
- **Painel administrativo** com monitoramento em tempo real
- **Rastreio de pedidos** por protocolo único
- **Cache inteligente** via Cloud Firestore
- **Limite de quantidade** configurável por produto
- **Exportação visual** de pedidos para compartilhamento

---

## Funcionalidades

### Para Colaboradores (Sem Senha)

| Funcionalidade | Descrição |
|---|---|
| **Identificação automática** | Busca nome e matrícula na base de colaboradores |
| **Solicitação por etapas** | Wizard intuitivo: Identificação → Equipe → Tipo → Seleção |
| **Variações inteligentes** | Produtos com tamanhos/cores exibem seletor dinâmico |
| **Rastreio de pedido** | Acompanhamento por protocolo com histórico de status |
| **Limite por produto** | Controle de quantidade máxima configurável na planilha |

### Para Administradores (Com Senha)

| Funcionalidade | Descrição |
|---|---|
| **Dashboard** | Visão geral com cards de resumo e ações rápidas |
| **Monitoramento** | Pedidos em tempo real via planilha PEDIDOS_LOG |
| **Gestão de estoque** | Visualização de DML e outros setores |
| **Carrinho inteligente** | Montagem de pedidos de reposição |
| **Busca spotlight** | Localização rápida de produtos e pedidos |
| **Atualização de status** | Gerenciamento do ciclo de vida dos pedidos |

---

## Arquitetura

```
├── index.html                    # Interface principal (SPA)
├── manifest.json                 # Configuração PWA
│
├── assets/
│   └── css/
│       └── style.css             # Estilos globais e animações
│
├── app_script/
│   └── backend.gs                # Google Apps Script (backend)
│
└── js/
    ├── main.js                   # Inicialização e roteamento
    │
    ├── config/
    │   ├── firebase.js           # Credenciais Firebase
    │   └── settings.js           # IDs das planilhas (GIDs)
    │
    ├── core/
    │   ├── auth.js               # Autenticação via Firestore
    │   └── state.js              # Gerenciamento de estado
    │
    ├── modules/
    │   ├── cart.js               # Carrinho de compras (Admin)
    │   ├── navigation.js         # Roteamento entre telas
    │   ├── public_form.js        # Formulário de solicitação pública
    │   ├── search.js             # Busca inteligente
    │   └── ui.js                 # Componentes visuais e modais
    │
    └── services/
        ├── api.js                # Comunicação com Google Sheets
        ├── cache.js              # Cache offline (Firestore)
        └── epi_parser.js         # Parser de EPIs e tamanhos
```

---

## Configuração das Planilhas

### Aba: `SOLICITACAO_EPI_UNIFORME`

Alimenta o formulário de solicitação pública de EPIs e Uniformes.

| Coluna | Cabeçalho | Regra | Exemplo |
|:---:|---|---|---|
| A | `NOME` | Nome do material/EPI | `BOTA DE SEGURANÇA` |
| B | `FOTO` | URL direta da imagem | `https://i.imgur.com/...` |
| C | `TAMANHOS` | Separados por `\|` ou `UNICO` | `37 \| 38 \| 39 \| 40` |
| D | `CODIGO` | Código único do produto | `EPI-001` |
| E | `SUB_CODIGOS` | Código por variação `label:codigo` | `37:EPI-001-37 \| 38:EPI-001-38` |
| F | `MAXIMO` | Quantidade máxima permitida | `5` |

> **Dica:** Use `UNICO`, `ÚNICO` ou `UNIDADE` na coluna de tamanhos para ocultar o seletor de variação.

### Aba: `COLABORADORES`

Validação de identidade no acesso público.

| Coluna | Cabeçalho | Dados |
|:---:|---|---|
| A | `MATRICULA` | ID do funcionário |
| B | `NOME` | Nome completo |
| C | `EQUIPE` | Setor (ex: DIURNO) |

### Aba: `PEDIDOS_LOG`

Registro de todos os pedidos realizados (gerado automaticamente pelo sistema).

---

## Tecnologias

| Tecnologia | Uso |
|---|---|
| **HTML5 + ES6 Modules** | Estrutura e lógica modular |
| **TailwindCSS (CDN)** | Estilização responsiva |
| **Firebase Auth/Firestore** | Autenticação e cache |
| **Google Sheets + Apps Script** | Banco de dados e backend |
| **SweetAlert2** | Popups e notificações |
| **Lucide Icons** | Iconografia |
| **html2canvas** | Exportação visual de pedidos |

---

## Como Executar

1. Clone o repositório:
```bash
git clone https://github.com/Pablofellype/Inventario-internoo.git
```

2. Abra com **Live Server** (VS Code) ou qualquer servidor local — necessário para módulos ES6.

3. Configure as credenciais do Firebase em `js/config/firebase.js`.

4. Configure os IDs das planilhas em `js/config/settings.js`.

> **Nota:** O Google Sheets leva de 3 a 5 minutos para atualizar o CSV publicado. Se alterações na planilha não aparecerem, aguarde e recarregue com `Ctrl + F5`.

---

<div align="center">

Desenvolvido por **Pablo Fellype**

</div>
