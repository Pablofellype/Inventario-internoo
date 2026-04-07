// =================================================================================
// SCRIPT DE BACKEND (SGS 3.2) - VERSÃO CORRIGIDA E FINAL
// - Protege o Cabeçalho (Nunca mais apaga a Linha 1)
// - Arquiva pedidos com mais de 7 dias exatos
// =================================================================================

var SPREADSHEET_ID = "1zLp2sxKWO9z9By3cWlHop3EyUemYep-YyPH92WIxBFQ";

function getSpreadsheet() {
  return SpreadsheetApp.openById(SPREADSHEET_ID);
}

function doPost(e) {
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName("PEDIDOS_LOG");
  
  // Tenta ler os dados enviados pelo site
  try {
    var data = JSON.parse(e.postData.contents);
  } catch (erro) {
    return ContentService.createTextOutput(JSON.stringify({"result":"error", "msg": "Dados inválidos"})).setMimeType(ContentService.MimeType.JSON);
  }
  
  // --------------------------------------------------------
  // CENÁRIO 1: ATUALIZAR STATUS (Painel Admin)
  // --------------------------------------------------------
  if (data.acao === "atualizarStatus") {
    var idProcurado = data.id;
    var novoStatus = data.status;
    var codigoSap = data.codigoSap !== undefined ? data.codigoSap : null;
    if (novoStatus === "NÃO APROVADA") {
      codigoSap = "NÃO APROVADA";
    } else if (novoStatus !== "APROVADA" && novoStatus !== "RESERVA APROVADA" && novoStatus !== "RESERVA BAIXADA") {
      codigoSap = null; // Só grava SAP quando aprovado/baixado
    }
    var valores = sheet.getDataRange().getValues();
    
    // Procura o pedido pelo ID na coluna A
    for (var i = 1; i < valores.length; i++) {
      if (valores[i][0].toString() == idProcurado.toString()) {
        sheet.getRange(i + 1, 9).setValue(novoStatus); // Atualiza Coluna I (Status)
        if (codigoSap !== null) {
          sheet.getRange(i + 1, 10).setValue(codigoSap); // Coluna J (CÓDIGO SAP)
        }
        return ContentService.createTextOutput(JSON.stringify({"result":"success", "msg": "Status Atualizado"})).setMimeType(ContentService.MimeType.JSON);
      }
    }
    return ContentService.createTextOutput(JSON.stringify({"result":"error", "msg": "ID não encontrado"})).setMimeType(ContentService.MimeType.JSON);
  }

  // --------------------------------------------------------
  // CENÁRIO 1.1: ATUALIZAR ITENS (Marcadores de Aprovação)
  // --------------------------------------------------------
  else if (data.acao === "atualizarItens") {
    var idProcurado = data.id;
    var novosItens = data.itens;
    var valores = sheet.getDataRange().getValues();
    for (var i = 1; i < valores.length; i++) {
      if (valores[i][0].toString() == idProcurado.toString()) {
        sheet.getRange(i + 1, 8).setValue(novosItens); // Coluna H (ITENS)
        return ContentService.createTextOutput(JSON.stringify({"result":"success", "msg": "Itens Atualizados"})).setMimeType(ContentService.MimeType.JSON);
      }
    }
    return ContentService.createTextOutput(JSON.stringify({"result":"error", "msg": "ID não encontrado"})).setMimeType(ContentService.MimeType.JSON);
  }

  // --------------------------------------------------------
  // CENÁRIO 2: BUSCAR HISTÓRICO UNIFICADO
  // --------------------------------------------------------
  else if (data.acao === "buscarHistorico") {
    var matriculaAlvo = data.matricula;
    var listaPedidos = [];

    function lerAba(nomeAba) {
      var aba = ss.getSheetByName(nomeAba);
      if (!aba) return;
      var linhas = aba.getDataRange().getValues();
      for (var i = 1; i < linhas.length; i++) {
        if (String(linhas[i][2]) === String(matriculaAlvo)) {
          listaPedidos.push({
            id: linhas[i][0],
            data: linhas[i][1],
            matricula: linhas[i][2],
            nome: linhas[i][3],
            equipe: linhas[i][4],
            tipo: linhas[i][5],
            local: linhas[i][6],
            itens: linhas[i][7],
            status: linhas[i][8],
            codigoSap: linhas[i][9] || ""
          });
        }
      }
    }

    // Lê histórico ativo e morto
    lerAba("PEDIDOS_LOG");
    lerAba("ARQUIVO_MORTO");

    // Ordena do mais recente para o mais antigo
    listaPedidos.sort(function(a, b) {
      return new Date(b.data) - new Date(a.data);
    });

    // Retorna apenas os 5 últimos
    var ultimosPedidos = listaPedidos.slice(0, 5);

    return ContentService.createTextOutput(JSON.stringify({
      "result": "success", 
      "historico": ultimosPedidos
    })).setMimeType(ContentService.MimeType.JSON);
  }

  // --------------------------------------------------------
  // CENÁRIO 3: BAIXA DE ESTOQUE (Contenção Lateral)
  // --------------------------------------------------------
  else if (data.acao === "baixarEstoqueLateral") {
    var sheetLateral = ss.getSheetByName("CONTENCAO_LATERAL");
    if (!sheetLateral) return ContentService.createTextOutput(JSON.stringify({"result":"error", "msg": "Aba CONTENCAO_LATERAL não existe"})).setMimeType(ContentService.MimeType.JSON);

    var materialAlvo = data.material;
    var tamanhoAlvo = data.tamanho;
    var qtdSolicitada = data.quantidade !== undefined ? parseInt(data.quantidade) : 1;

    var dados = sheetLateral.getDataRange().getValues();
    
    for (var i = 1; i < dados.length; i++) {
      if (dados[i][0] == materialAlvo && dados[i][1] == tamanhoAlvo) {
        var qtdAtual = parseInt(dados[i][3]); 
        
        if (qtdSolicitada > 0 && qtdAtual < qtdSolicitada) {
             return ContentService.createTextOutput(JSON.stringify({"result":"error", "msg": "Estoque insuficiente!"})).setMimeType(ContentService.MimeType.JSON);
        }

        var novaQtd = qtdAtual - qtdSolicitada;
        sheetLateral.getRange(i + 1, 4).setValue(novaQtd); // Atualiza qtd
        
        var alerta = novaQtd <= 2 ? true : false;
        
        return ContentService.createTextOutput(JSON.stringify({
          "result": "success", 
          "novaQtd": novaQtd,
          "alerta": alerta
        })).setMimeType(ContentService.MimeType.JSON);
      }
    }
    return ContentService.createTextOutput(JSON.stringify({"result":"error", "msg": "Item não encontrado"})).setMimeType(ContentService.MimeType.JSON);
  }

  // --------------------------------------------------------
  // CENÁRIO 4: LER DADOS DA CONTENÇÃO (Para o Site)
  // --------------------------------------------------------
  else if (data.acao === "lerContencaoLateral") {
    var sheetLateral = ss.getSheetByName("CONTENCAO_LATERAL");
    if (!sheetLateral) return ContentService.createTextOutput(JSON.stringify({"result":"empty"})).setMimeType(ContentService.MimeType.JSON);
    
    var dados = sheetLateral.getDataRange().getValues();
    var listaItens = [];
    
    for (var i = 1; i < dados.length; i++) {
      if (dados[i][0]) {
        listaItens.push({
          material: dados[i][0],
          tamanho: dados[i][1],
          foto: dados[i][2],
          qtd: dados[i][3],
          alerta: isValorVerdadeiro(dados[i][4])
        });
      }
    }
    return ContentService.createTextOutput(JSON.stringify({ "result": "success", "itens": listaItens })).setMimeType(ContentService.MimeType.JSON);
  }

  // --------------------------------------------------------
  // CENÁRIO 5: ADICIONAR OU ATUALIZAR ITEM (Contenção Lateral)
  // --------------------------------------------------------
  else if (data.acao === "adicionarOuAtualizarContencao") {
    return handleAdicionarOuAtualizarContencao(ss, data);
  }
  // --------------------------------------------------------
  // CENÁRIO 6: ATUALIZAR ALERTA DE CRÍTICO (Contenção Lateral)
  // --------------------------------------------------------
  else if (data.acao === "atualizarAlertaContencao") {
    var sheetLateral = ss.getSheetByName("CONTENCAO_LATERAL");
    if (!sheetLateral) return ContentService.createTextOutput(JSON.stringify({"result":"error", "msg": "Aba CONTENCAO_LATERAL não existe"})).setMimeType(ContentService.MimeType.JSON);

    var materialAlvo = data.material;
    var tamanhoAlvo = data.tamanho || "";
    var alerta = data.alerta === true || data.alerta === "true";

    if (!materialAlvo) {
      return ContentService.createTextOutput(JSON.stringify({"result":"error", "msg": "Material inválido"})).setMimeType(ContentService.MimeType.JSON);
    }

    var dados = sheetLateral.getDataRange().getValues();
    var materialKey = String(materialAlvo).trim().toLowerCase();
    var tamanhoKey = String(tamanhoAlvo).trim().toLowerCase();

    // Garante cabeçalho da coluna E
    var header = sheetLateral.getRange(1, 5).getValue();
    if (!header) sheetLateral.getRange(1, 5).setValue("ALERTA_CRITICO");

    for (var i = 1; i < dados.length; i++) {
      var mat = String(dados[i][0]).trim().toLowerCase();
      var tam = String(dados[i][1]).trim().toLowerCase();
      if (mat === materialKey && tam === tamanhoKey) {
        sheetLateral.getRange(i + 1, 5).setValue(alerta ? "SIM" : "");
        return ContentService.createTextOutput(JSON.stringify({"result":"success"})).setMimeType(ContentService.MimeType.JSON);
      }
    }

    return ContentService.createTextOutput(JSON.stringify({"result":"error", "msg": "Item não encontrado"})).setMimeType(ContentService.MimeType.JSON);
  }
  // Fallback: se vier sem "acao" mas com dados da contenção, trata como adicionar/atualizar
  else if (!data.acao && (data.material || data.tamanho || data.quantidade !== undefined)) {
    return handleAdicionarOuAtualizarContencao(ss, data);
  }

  // --------------------------------------------------------
  // CENÁRIO 7: AÇÃO DESCONHECIDA (PROTEÇÃO)
  // --------------------------------------------------------
  else if (data.acao) {
    return ContentService.createTextOutput(JSON.stringify({"result":"error", "msg": "Ação inválida: " + data.acao})).setMimeType(ContentService.MimeType.JSON);
  }

  // --------------------------------------------------------
  // CENÁRIO 8: RECEBER NOVO PEDIDO (Padrão)
  // --------------------------------------------------------
  else {
    if (!data.id || !data.matricula || !data.nome || !data.itens) {
      return ContentService.createTextOutput(JSON.stringify({"result":"error", "msg": "Pedido inválido"})).setMimeType(ContentService.MimeType.JSON);
    }
    var dataHora = new Date(); // Data/Hora exata do servidor Google
    garantirColunaSap(sheet);
    
    sheet.appendRow([
      data.id,          // A
      dataHora,         // B
      data.matricula,   // C
      data.nome,        // D
      data.equipe,      // E
      data.tipo,        // F
      data.local,       // G
      data.itens,       // H
      "AGUARDANDO LIDERANÇA", // I
      "" // J (CÓDIGO SAP) - preenchido somente na aprovação
    ]);
    
    return ContentService.createTextOutput(JSON.stringify({"result":"success"})).setMimeType(ContentService.MimeType.JSON);
  }
}

function handleAdicionarOuAtualizarContencao(ss, data) {
  var sheetLateral = ss.getSheetByName("CONTENCAO_LATERAL");
  if (!sheetLateral) return ContentService.createTextOutput(JSON.stringify({"result":"error", "msg": "Aba CONTENCAO_LATERAL não existe"})).setMimeType(ContentService.MimeType.JSON);

  var materialNovo = data.material;
  var tamanhoNovo = data.tamanho || "";
  var fotoNova = data.foto || "";
  var qtdAdicionar = data.quantidade !== undefined ? parseInt(data.quantidade, 10) : 0;

  if (!materialNovo || isNaN(qtdAdicionar) || qtdAdicionar <= 0) {
    return ContentService.createTextOutput(JSON.stringify({"result":"error", "msg": "Dados inválidos"})).setMimeType(ContentService.MimeType.JSON);
  }

  var dados = sheetLateral.getDataRange().getValues();
  var materialKey = String(materialNovo).trim().toLowerCase();
  var tamanhoKey = String(tamanhoNovo).trim().toLowerCase();

  for (var i = 1; i < dados.length; i++) {
    var mat = String(dados[i][0]).trim().toLowerCase();
    var tam = String(dados[i][1]).trim().toLowerCase();

    if (mat === materialKey && tam === tamanhoKey) {
      var qtdAtual = parseInt(dados[i][3], 10);
      if (isNaN(qtdAtual)) qtdAtual = 0;
      var novaQtd = qtdAtual + qtdAdicionar;

      sheetLateral.getRange(i + 1, 4).setValue(novaQtd);
      if (fotoNova) sheetLateral.getRange(i + 1, 3).setValue(fotoNova);

      return ContentService.createTextOutput(JSON.stringify({
        "result":"success",
        "action":"updated",
        "novaQtd": novaQtd
      })).setMimeType(ContentService.MimeType.JSON);
    }
  }

  if (data.forcarExistente === true) {
    return ContentService.createTextOutput(JSON.stringify({
      "result":"error",
      "msg":"Produto nao encontrado para somar quantidade."
    })).setMimeType(ContentService.MimeType.JSON);
  }

  sheetLateral.appendRow([materialNovo, tamanhoNovo, fotoNova, qtdAdicionar, ""]);
  return ContentService.createTextOutput(JSON.stringify({
    "result":"success",
    "action":"created",
    "novaQtd": qtdAdicionar
  })).setMimeType(ContentService.MimeType.JSON);
}

// =========================
// UTILIDADES CÓDIGO SAP
// =========================
function garantirColunaSap(aba) {
  var lastCol = Math.max(10, aba.getLastColumn());
  var header = aba.getRange(1, 1, 1, lastCol).getValues()[0];
  if (!header[9] || String(header[9]).trim() === "") {
    aba.getRange(1, 10).setValue("CODIGO SAP");
  }
}

// montarCodigosSap removido — CODIGO SAP é preenchido somente pelo admin na aprovação

function normalizar(v) {
  return String(v || "")
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizarNome(v) {
  return String(v || "")
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\[\]\(\)]/g, " ")
    .replace(/[-_/]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function parseSubCodigos(valor) {
  if (!valor) return [];
  return String(valor)
    .split("|")
    .map(function(s){ return s.trim(); })
    .filter(Boolean)
    .map(function(s){
      var label = s;
      var code = "";
      if (s.indexOf(":") >= 0) {
        var parts = s.split(":");
        label = parts[0].trim();
        code = parts.slice(1).join(":").trim();
      } else if (s.indexOf("-") >= 0) {
        var parts2 = s.split("-");
        label = parts2[0].trim();
        code = parts2.slice(1).join("-").trim();
      } else if (s.indexOf("=") >= 0) {
        var parts3 = s.split("=");
        label = parts3[0].trim();
        code = parts3.slice(1).join("=").trim();
      }
      return { label: label, code: code };
    });
}

function isValorVerdadeiro(valor) {
  if (valor === true) return true;
  var v = String(valor || "").trim().toLowerCase();
  return v === "sim" || v === "1" || v === "true" || v === "x";
}


// =================================================================================
// FUNÇÃO DE ARQUIVAMENTO CORRIGIDA (PARA O GATILHO/RELÓGIO)
// NUNCA MAIS VAI APAGAR O CABEÇALHO DA PLANILHA
// =================================================================================

function arquivarPedidosAntigos() {
  var ss = getSpreadsheet();
  var abaOrigem = ss.getSheetByName("PEDIDOS_LOG");
  var abaDestino = ss.getSheetByName("ARQUIVO_MORTO");
  
  // CONFIGURAÇÃO: 7 Dias exatos
  // Se quiser que o "Dia 1" suma no "Dia 7" (6 dias de intervalo), mude para 6.
  // Se quiser "Uma Semana" completa (Dia 1 -> Dia 8), deixe 7.
  var diasParaManter = 7; 
  
  if (!abaDestino) {
    Logger.log("ERRO: Crie a aba 'ARQUIVO_MORTO' para funcionar.");
    return;
  }

  var dataLimite = new Date();
  dataLimite.setDate(dataLimite.getDate() - diasParaManter);
  
  var range = abaOrigem.getDataRange();
  if (range.getNumRows() <= 1) {
    Logger.log("Aba vazia ou só com cabeçalho. Nada a fazer.");
    return;
  }
  
  var valores = range.getValues();
  // PROTEÇÃO: Separa o cabeçalho (linha 0) dos dados (linha 1 em diante)
  var cabecalho = valores[0]; 
  var dados = valores.slice(1); 
  
  var linhasParaManter = [];
  var linhasParaArquivar = [];
  
  // Filtra linha por linha
  for (var i = 0; i < dados.length; i++) {
    var linha = dados[i];
    var dataPedido = new Date(linha[1]); // Coluna B tem a data
    
    // Se a data do pedido for menor que a data limite (mais velho que 7 dias)
    if (dataPedido < dataLimite && !isNaN(dataPedido.getTime())) {
      linhasParaArquivar.push(linha);
    } else {
      linhasParaManter.push(linha);
    }
  }
  
  // Executa as mudanças
  if (linhasParaArquivar.length > 0) {
    // 1. Grava no Arquivo Morto (no final da lista)
    var ultimaLinhaDestino = abaDestino.getLastRow();
    abaDestino.getRange(ultimaLinhaDestino + 1, 1, linhasParaArquivar.length, linhasParaArquivar[0].length)
              .setValues(linhasParaArquivar);
    
    // 2. Limpa APENAS OS DADOS da aba original (Mantendo a Linha 1 intacta)
    // Limpa da linha 2 até o fim
    abaOrigem.getRange(2, 1, dados.length, dados[0].length).clearContent();
    
    // 3. Cola de volta os pedidos recentes (que não foram arquivados)
    if (linhasParaManter.length > 0) {
      abaOrigem.getRange(2, 1, linhasParaManter.length, linhasParaManter[0].length)
               .setValues(linhasParaManter);
    }
    
    Logger.log("Sucesso: " + linhasParaArquivar.length + " pedidos movidos. Cabeçalho protegido.");
  } else {
    Logger.log("Nenhum pedido antigo para arquivar hoje.");
  }
}

// Função extra só pra você testar manualmente se quiser
function testarArquivamentoManual() {
  arquivarPedidosAntigos();
}
