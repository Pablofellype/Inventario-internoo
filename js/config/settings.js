export const settings = {
  // Link da Base de Dados (Google Sheets publicado como CSV)
  baseDados:
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vSP-rYDUE9PX0owu6CzD1wRKlqaZzPy_bS0JtSTGu5JtQZ_nGevcmCk4t-1fGgCHQg3BNSk-TFlERSQ/pub?output=csv",

  // URL do Script de Envio (Configuraremos no final)
  urlApiEnvio:
    "https://script.google.com/macros/s/AKfycbx4L_UuT2WFno4U42WpkgLoGjTb5RD5S1J_FzANPBQbSt9Q9SJIkMPml-ABTkC2ezQt/exec",

  // Mapeamento dos GIDs (IDs das abas)
  mapeamento: {
    DML_COMERCIAL: "0",
    DML_VESTIARIO: "280409167",
    DML_OFICINA: "1556469431",
    DML_INDUSTRIA: "201454419",
    DML_ESTOQUE: "282836290",
    DML_CCB: "757166017",
    PEDIDOS_LOG: "1936057939",
    EPI_UNIFORME: "1981222851",
    COLABORADORES: "1303883713",
    SOLICITACAO_EPI_UNIFORME: "127263952",
    CONTENCAO_LATERAL: "2037674408",
  },

  admin: {
    planilha: "https://docs.google.com/spreadsheets",
    formulario: "https://docs.google.com/forms",
  },
};
