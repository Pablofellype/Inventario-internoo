import { auth } from '../config/firebase.js';
import { signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

const Auth = {
    usuario: null,

    init(callbackLogin) {
        onAuthStateChanged(auth, (user) => {
            if (user) {
                this.usuario = user;
                if (callbackLogin) callbackLogin(user);
            } else {
                signInAnonymously(auth).catch((error) => {
                    console.warn("Aguardando autenticação...", error);
                });
            }
        });
    },

    // ATUALIZADO: Agora aceita 'campoSenha' para validar chaves diferentes (Admin ou Abastecimento)
    async validarSenha(senhaDigitada, campoSenha = "CHAVE") {
        try {
            // 1. Garante autenticação
            if (!auth.currentUser) {
                try {
                    await signInAnonymously(auth);
                } catch (errAuth) {
                    alert("Erro: O login anônimo falhou. Ative o provedor 'Anonymous' no Firebase Console.");
                    return false;
                }
            }

            // 2. Conecta no Banco
            const db = getFirestore();
            
            // 3. BUSCA DIRETA (Tenta minúsculo primeiro conforme seu padrão atual)
            let docRef = doc(db, "configuracoes", "acesso");
            let docSnap = await getDoc(docRef);

            // 4. Fallback de segurança (Tenta Maiúsculo se não achar)
            if (!docSnap.exists()) {
                console.warn("Não achou em minúsculo, tentando MAIÚSCULO...");
                docRef = doc(db, "CONFIGURACOES", "ACESSO");
                docSnap = await getDoc(docRef);
            }

            if (docSnap.exists()) {
                const dados = docSnap.data();
                
                // LÓGICA INTELIGENTE:
                // Tenta buscar o campo solicitado (ex: "CHAVE_ABASTECIMENTO")
                // Tenta tanto em Maiúsculo quanto em Minúsculo para evitar erro de digitação no banco
                const campoLower = campoSenha.toLowerCase(); // chave_abastecimento
                const campoUpper = campoSenha.toUpperCase(); // CHAVE_ABASTECIMENTO
                
                // Se não passou campo específico, usa a lógica padrão (CHAVE/SENHA)
                let senhaDoBanco;
                
                if (campoSenha === "CHAVE") {
                     // Mantém compatibilidade com o login principal
                     senhaDoBanco = dados.chave || dados.CHAVE || dados.senha || dados.SENHA;
                } else {
                     // Busca o campo específico
                     senhaDoBanco = dados[campoLower] || dados[campoUpper];
                }

                if (!senhaDoBanco) {
                    console.warn(`Campo de senha '${campoSenha}' não encontrado no banco.`);
                    // Opcional: alert(`Erro de Configuração: Crie o campo '${campoUpper}' no Firebase.`);
                    return false;
                }

                const senhaLimpaBanco = String(senhaDoBanco).trim();
                const senhaLimpaInput = String(senhaDigitada).trim();

                if (senhaLimpaInput === senhaLimpaBanco) {
                    return true;
                } else {
                    return false;
                }
            } else {
                console.error("ERRO: Documento 'configuracoes/acesso' não encontrado.");
                alert("Erro de Configuração:\n\nNão encontrei a coleção 'configuracoes' e o documento 'acesso' no Firestore.");
                return false;
            }

        } catch (e) {
            console.error("Erro detalhado:", e);
            
            if (String(e).includes("permission-denied")) {
                alert("⚠️ ACESSO NEGADO (Permissão)!\n\nO banco de dados existe, mas foi bloqueado.\n\nVá em 'Firestore Database > Rules' e adicione:\n\nmatch /configuracoes/acesso {\n  allow read: if true;\n}");
            } else {
                alert("Erro ao conectar: " + e.message);
            }
            
            return false;
        }
    },

    async gerarHashSHA256(texto) {
        return texto; 
    }
};

export default Auth;