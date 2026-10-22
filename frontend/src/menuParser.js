// Copia de backend/src/logic/menuParser.js para la vista previa del menú en
// el panel de admin. El backend sigue siendo la fuente de verdad al publicar:
// si se cambia la regla allá, actualizar también este archivo.

// Parser del texto del dia que pega el administrador.
// Regla: entradas entre la marca ENTRADAS y la marca FONDOS;
// fondos entre la marca FONDOS y la marca REFRESCO (o hasta el final).

export class MenuFormatError extends Error {
  constructor(message) {
    super(message);
    this.name = 'MenuFormatError';
    this.statusCode = 422;
  }
}

// Detecta el indice de la linea que contiene la marca (ej: "*ENTRADAS*", "ENTRADAS:").
function indiceMarca(lineas, marca) {
  const re = new RegExp(`\\*{0,2}\\b${marca}\\b\\*{0,2}`, 'i');
  return lineas.findIndex((l) => re.test(l));
}

// Extrae los platos de un rango de lineas, descartando lineas vacias,
// encabezados de seccion y notas (lineas que empiezan con # o *).
function extraerPlatos(lineas) {
  return lineas
    .map((l) => l.trim())
    .filter(Boolean)
    .filter((l) => !/^#{1,6}\s/.test(l))       // titulos markdown
    .filter((l) => !/^\*{1,2}[^*]+\*{1,2}$/.test(l)) // lineas que son solo una marca en negrita
    .filter((l) => !/^!/.test(l))               // notas tipo "!Buenos dias"
    .map((l) => l.replace(/^\*\s*/, '').replace(/\*+$/, '').trim()) // quita viñeta y negritas sobrantes
    .filter(Boolean);
}

export function parseMenu(texto) {
  if (typeof texto !== 'string' || !texto.trim()) {
    throw new MenuFormatError('El texto del menu esta vacio.');
  }

  const lineas = texto.split(/\r?\n/);

  const iEntradas = indiceMarca(lineas, 'ENTRADAS');
  const iFondos = indiceMarca(lineas, 'FONDOS');

  if (iEntradas === -1) {
    throw new MenuFormatError('No se encontro la marca ENTRADAS en el texto.');
  }
  if (iFondos === -1) {
    throw new MenuFormatError('No se encontro la marca FONDOS en el texto.');
  }
  if (iFondos <= iEntradas) {
    throw new MenuFormatError('La marca FONDOS debe aparecer despues de ENTRADAS.');
  }

  const entradas = extraerPlatos(lineas.slice(iEntradas + 1, iFondos));

  // REFRESCO es opcional: si no esta, los fondos van hasta el final del texto.
  const iRefresco = indiceMarca(lineas, 'REFRESCO');
  const finFondos = iRefresco !== -1 ? iRefresco : lineas.length;
  const fondos = extraerPlatos(lineas.slice(iFondos + 1, finFondos));

  if (entradas.length === 0) {
    throw new MenuFormatError('La seccion ENTRADAS no contiene platos.');
  }
  if (fondos.length === 0) {
    throw new MenuFormatError('La seccion FONDOS no contiene platos.');
  }

  return { entradas, fondos };
}
