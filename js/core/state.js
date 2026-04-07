// =================================================================
// ESTADO GLOBAL (A "Memória RAM" do Sistema)
// =================================================================

export const State = {
    // Navegação
    categoriaAtual: "HOME", // Qual setor está aberto (ex: 'HOME', 'DML_COMERCIAL', 'PEDIDOS_LOG')
    
    // Dados Carregados (Cache da Sessão)
    ativos: [],       // Lista de produtos carregados do CSV atual
    pedidos: [],      // Lista de pedidos carregados do CSV (para o Monitor)
    catalogoProdutos: [], // Lista agregada para busca global
    
    // Carrinho de Compras
    carrinho: [],     // Lista de itens selecionados: [{ nome, codigo, qtd... }]
    
    // Dados do Usuário e Sistema
    usuarioFirebase: null, // Objeto do usuário logado (anonimo ou email)
    notificacoes: 0,       // Número de sugestões não lidas
    listaSugestoes: [],    // Array com as sugestões carregadas do Firestore
    
    // Controle Interno
    promessaVideo: null,   // Controle do player de vídeo da intro
    timerSeguranca: null   // Timer para pular intro automaticamente se travar
};
