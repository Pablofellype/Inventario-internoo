📦 Sistema de Planeamento Administrativo & Inventário (PWA)

Este projeto é um sistema web progressivo (PWA) desenvolvido para gestão de pedidos de materiais (DML), EPIs e Uniformes. O sistema opera com uma arquitetura Serverless e Offline-First, conectando uma interface moderna diretamente ao Google Sheets (Banco de Dados) e Firebase.

🗺️ Mapa do Projeto (Estrutura de Arquivos)

Abaixo está a estrutura atualizada com os novos módulos de Solicitação Pública, Rastreamento e Lógica de EPIs.

/projeto-inventario/
│
├── index.html                # Interface Principal (Login Admin + Acesso Colaborador + Rastreio)
├── README.md                 # Documentação Técnica
│
├── assets/
│   ├── css/
│   │   └── style.css         # Estilos globais e Tailwind Customizado
│   └── video/
│       └── video_intro_site.mp4
│
└── js/                       # Arquitetura Modular (ES6)
    │
    ├── main.js               # Ponto de entrada. Controla Autenticação, Rastreio e Inicialização.
    │
    ├── config/               # Configurações do Ambiente
    │   ├── firebase.js       # Credenciais do Firebase (Auth/Firestore)
    │   └── settings.js       # IDs das abas do Google Sheets (GIDs) e URLs da API
    │
    ├── core/                 # Núcleo do Sistema
    │   ├── auth.js           # Segurança (Validação Automática via Firestore)
    │   └── state.js          # Gerenciamento de Estado (Memória RAM do app)
    │
    ├── modules/              # Componentes Visuais e Lógica de UI
    │   ├── cart.js           # Carrinho de Compras (Admin)
    │   ├── navigation.js     # Roteamento entre telas
    │   ├── public_form.js    # [NOVO] Wizard de Solicitação Pública (Gera ID Único)
    │   ├── search.js         # Busca inteligente (Spotlight)
    │   └── ui.js             # Renderização de Cards, Modais e Histórico de Rastreio
    │
    └── services/             # Comunicação de Dados
        ├── api.js            # Gerenciador de Downloads, Envio POST e Atualização de Status
        ├── cache.js          # Sistema Offline (Cloud Firestore)
        └── epi_parser.js     # [NOVO] Tradutor exclusivo para lógica de tamanhos (Pipe |)


🚀 Funcionalidades Principais

1. Módulo Administrativo (Com Senha)

Monitoramento: Acompanhamento de pedidos em tempo real via planilha PEDIDOS_LOG.

Gestão de Estoque: Visualização de materiais de limpeza (DML) e outros setores.

Carrinho Inteligente: Montagem de pedidos de reposição.

2. Módulo Colaborador (Sem Senha - NOVO)

Identificação Automática: O colaborador digita o nome e o sistema busca a matrícula automaticamente na base.

Fluxo em Etapas (Wizard): Interface simplificada (Identificação -> Equipe -> Tipo -> Seleção).

Seleção Inteligente de EPIs:

Produtos com vários tamanhos geram uma lista suspensa (Dropdown).

Produtos de tamanho único ocultam a seleção automaticamente.

⚙️ Configuração da Planilha Google (Banco de Dados)

O sistema utiliza abas específicas no Google Sheets. Para o módulo novo funcionar, siga estritamente este padrão:

Aba: SOLICITACAO_EPI_UNIFORME

Esta aba alimenta o formulário público. O sistema usa o arquivo epi_parser.js para ler esta estrutura específica.

Coluna

Cabeçalho

Regra de Preenchimento

Exemplo Real

A

NOME

Nome do material ou EPI.

BOTA DE SEGURANÇA

B

FOTO

Link direto da imagem.

https://i.imgur.com/...

C

TAMANHOS

O SEGREDO ESTÁ AQUI. 



Use a barra vertical | para separar tamanhos. 



Escreva UNICO para não mostrar opção.

37 | 38 | 39 | 40 



ou



 P | M | G 



ou



 UNICO

Nota: Se você escrever UNICO (ou ÚNICO, UNIDADE) na coluna C, o sistema esconderá a caixa de seleção no site, facilitando o clique.

Aba: COLABORADORES

Usada para validação de matrícula no login público.

Coluna

Cabeçalho

Dados

A

MATRICULA

ID do funcionário (Ex: 102030)

B

NOME

Nome completo (Usado na busca)

C

EQUIPE

Setor (Opcional, Ex: DIURNO)

🛠️ Detalhes Técnicos dos Novos Arquivos

js/services/epi_parser.js

Este é um Tradutor Especialista.

Ele foi criado para não quebrar a lógica antiga do sistema.

Ele lê exclusivamente a coluna de tamanhos com o separador |.

Ele transforma BOTA + 38|39 em um objeto único com variações, permitindo que o front-end crie o menu suspenso.

js/modules/public_form.js

Este arquivo controla a Interface do Usuário (o formulário branco passo-a-passo).

Gerencia o estado do "Carrinho Temporário" do colaborador.

Possui a lógica visual que decide: "Se tiver mais de um tamanho, mostre um <select>; se for único, esconda."

js/config/settings.js

Arquivo onde os IDs (GIDs) das abas são configurados.

Atualização Recente: Adicionado o ID da aba SOLICITACAO_EPI_UNIFORME.

📦 Instalação e Execução

Requisito: Servidor Local (Live Server no VS Code) devido aos módulos ES6.

Cache: O sistema baixa todos os dados ao iniciar (durante o vídeo de intro).

Atualização de Dados: O Google Sheets leva cerca de 3 a 5 minutos para atualizar o CSV publicado. Se mudar algo na planilha e não aparecer no site, aguarde alguns minutos e recarregue a página (CTRL + F5).