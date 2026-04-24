export const settings = {
  // Link da Base de Dados (Google Sheets publicado como CSV)
  baseDados:
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vSP-rYDUE9PX0owu6CzD1wRKlqaZzPy_bS0JtSTGu5JtQZ_nGevcmCk4t-1fGgCHQg3BNSk-TFlERSQ/pub?output=csv",

  // URL do Script de Envio (Configuraremos no final)
  urlApiEnvio:
    "https://script.google.com/macros/s/AKfycbx4L_UuT2WFno4U42WpkgLoGjTb5RD5S1J_FzANPBQbSt9Q9SJIkMPml-ABTkC2ezQt/exec",

  // Mapeamento dos GIDs (IDs das abas)
  mapeamento: {
    DML_S: "1608587582", // Fonte única de todos os DMLs (coluna DMLS define o setor)
    EPI_UNIFORME: "894099474", // Aba SOLICITACAO_EPI_UNIFORMES (nome | foto | tamanhos | codigo em pipe)
    PEDIDOS_LOG: "1936057939",
    COLABORADORES: "1303883713",
    CONTENCAO_LATERAL: "2037674408",
  },

  admin: {
    planilha: "https://docs.google.com/spreadsheets",
    formulario: "https://docs.google.com/forms",
  },
};
