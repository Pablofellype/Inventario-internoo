export const EpiParser = {
  // Parse CSV with columns like: NOME | FOTO | TAMANHOS (pipe-separated)
  // Optional columns: CODIGO, SUB_CODIGOS (pipe-separated, can include label:code)
  parse(textoCSV) {
    const lines = textoCSV.split(/\r?\n/).filter((l) => l.trim());
    if (lines.length < 2) return [];

    const sep = lines[0].includes(";") ? ";" : ",";
    const head = lines[0]
      .split(sep)
      .map((h) => normalizar(h));
    const iNome = head.findIndex((h) => h.includes("NOME"));
    const iFoto = head.findIndex((h) => h.includes("FOTO"));
    const iTam = head.findIndex((h) => h.includes("TAMAN"));
    const iSub = head.findIndex(
      (h) => h.includes("SUB") && h.includes("CODIGO")
    );
    const iCod = head.findIndex(
      (h) => h.includes("CODIGO") && !h.includes("SUB")
    );
    const iMax = head.findIndex((h) => h.includes("MAXIMO") || h.includes("MAX"));

    return lines
      .slice(1)
      .map((row) => {
        const cols = row
          .split(new RegExp(`${sep}(?=(?:(?:[^"]*"){2})*[^"]*$)`))
          .map((c) => c.replace(/^["']|["']$/g, "").trim());

        const nome = (iNome >= 0 ? cols[iNome] : cols[0]) || "";
        const foto = (iFoto >= 0 ? cols[iFoto] : cols[1]) || "";
        const tamanhosStr = (iTam >= 0 ? cols[iTam] : cols[2]) || "";
        const subCodigos = iSub >= 0 ? cols[iSub] : "";
        const codigoUnico = iCod >= 0 ? cols[iCod] : "";
        const maxQtd = iMax >= 0 ? parseInt(cols[iMax]) || 0 : 0;

        if (!nome) return null;

        const tamanhos =
          tamanhosStr && tamanhosStr.includes("|")
            ? tamanhosStr.split("|").map((t) => t.trim()).filter(Boolean)
            : [tamanhosStr ? tamanhosStr.trim() : "UNIDADE"];

        const parsedSub = parseSubCodigos(subCodigos || "");
        const labelMap = new Map();
        parsedSub.forEach((p) => {
          if (p.label && p.code) {
            labelMap.set(normalizar(p.label), p.code);
          }
        });
        const codesByIndex = parsedSub
          .map((p) => (p.code ? p.code : p.label))
          .filter(Boolean);

        const vars = tamanhos.map((tam, idx) => {
          let code = "";
          const key = normalizar(tam);
          if (labelMap.has(key)) {
            code = labelMap.get(key);
          } else if (codesByIndex.length === tamanhos.length) {
            code = codesByIndex[idx] || "";
          } else if (tamanhos.length === 1 && codigoUnico) {
            code = codigoUnico;
          }
          if (!code) {
            code = `${nome}-${tam}`.toUpperCase().replace(/\s+/g, "-");
          }
          return { label: tam, code: code };
        });

        return {
          root: nome.toUpperCase(),
          f: foto,
          vars: vars,
          max: maxQtd,
        };
      })
      .filter((item) => item !== null);
  },
};

function normalizar(v) {
  return String(v || "")
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function parseSubCodigos(valor) {
  if (!valor) return [];
  return String(valor)
    .split("|")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => {
      let label = "";
      let code = "";
      if (s.includes(":")) {
        const parts = s.split(":");
        label = parts[0].trim();
        code = parts.slice(1).join(":").trim();
      } else if (s.includes("=")) {
        const parts = s.split("=");
        label = parts[0].trim();
        code = parts.slice(1).join("=").trim();
      } else if (s.includes("-")) {
        const parts = s.split("-");
        if (parts[0].trim().match(/^\d+$/)) {
          label = parts[0].trim();
          code = parts.slice(1).join("-").trim();
        } else {
          code = s.trim();
        }
      } else {
        code = s.trim();
      }
      return { label, code };
    });
}
