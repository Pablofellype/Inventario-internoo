import { db } from '../config/firebase.js';
import { doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

export const Cache = {
    
    // Salva os dados baixados da planilha no Firestore
    async salvar(categoria, dados) {
        try {
            // Cria/Atualiza um documento com o nome da categoria (ex: 'DML_COMERCIAL')
            // dentro da coleção 'cache_inventario'
            const docRef = doc(db, "cache_inventario", categoria);

            await setDoc(docRef, {
                dados: JSON.stringify(dados), // Transforma o array em texto para economizar leitura
                atualizado_em: Date.now()
            });
            
            // console.log(`Backup salvo para: ${categoria}`);
        } catch (e) {
            console.warn("Não foi possível salvar o cache (verifique permissões do Firestore):", e);
        }
    },

    // Tenta recuperar os dados se a planilha falhar
    async carregar(categoria) {
        try {
            const docRef = doc(db, "cache_inventario", categoria);
            const snap = await getDoc(docRef);

            if (snap.exists()) {
                console.log("Recuperando dados do Cache Offline...");
                const rawData = snap.data().dados;
                return JSON.parse(rawData); // Transforma texto de volta em array
            }
            return null;
        } catch (e) {
            console.warn("Erro ao ler cache ou nenhum cache disponível:", e);
            return null;
        }
    }
};