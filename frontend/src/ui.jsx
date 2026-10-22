import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

/* Piezas de interfaz compartidas: iconos, toasts, diálogo de confirmación,
   números animados y esqueletos de carga. */

/* --------------------------------------------------------------------------
   Iconos SVG en línea (sin emoji, según guía de estilo)
   -------------------------------------------------------------------------- */

function Svg({ tam = 18, grosor = 2.2, children }) {
  return (
    <svg width={tam} height={tam} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={grosor} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {children}
    </svg>
  );
}

export const IconoCheck = ({ tam = 18 }) => (
  <Svg tam={tam} grosor={2.4}>
    <polyline points="20 6 9 17 4 12" />
  </Svg>
);

export const IconoAlerta = () => (
  <Svg>
    <circle cx="12" cy="12" r="9" />
    <line x1="12" y1="8" x2="12" y2="13" />
    <line x1="12" y1="16.5" x2="12" y2="16.5" />
  </Svg>
);

export const IconoCandado = ({ tam = 20 }) => (
  <Svg tam={tam} grosor={2}>
    <rect x="4" y="10" width="16" height="11" rx="2" />
    <path d="M8 10V7a4 4 0 0 1 8 0v3" />
  </Svg>
);

export const IconoCalendario = ({ tam = 18 }) => (
  <Svg tam={tam}>
    <rect x="3" y="4" width="18" height="17" rx="2" />
    <line x1="3" y1="9" x2="21" y2="9" />
    <line x1="8" y1="2" x2="8" y2="5" />
    <line x1="16" y1="2" x2="16" y2="5" />
  </Svg>
);

/* Campana de servicio (cloche): marca de la pantalla pública */
export const IconoCloche = ({ tam = 30 }) => (
  <Svg tam={tam} grosor={1.8}>
    <path d="M4 17a8 8 0 0 1 16 0" />
    <line x1="2.5" y1="17" x2="21.5" y2="17" />
    <line x1="4" y1="20" x2="20" y2="20" />
    <line x1="12" y1="9" x2="12" y2="7" />
    <line x1="10.5" y1="7" x2="13.5" y2="7" />
  </Svg>
);

/* Carita sonriente: bienvenida a comensales nuevos */
export const IconoSaludo = ({ tam = 18 }) => (
  <Svg tam={tam}>
    <circle cx="12" cy="12" r="9" />
    <path d="M8.5 14a4 4 0 0 0 7 0" />
    <line x1="9" y1="9.5" x2="9" y2="9.5" />
    <line x1="15" y1="9.5" x2="15" y2="9.5" />
  </Svg>
);

export const IconoReloj =({ tam = 18 }) => (
  <Svg tam={tam}>
    <circle cx="12" cy="12" r="9" />
    <polyline points="12 7 12 12 15 14" />
  </Svg>
);

export const IconoMenu = ({ tam = 18 }) => (
  <Svg tam={tam}>
    <path d="M5 3h11a3 3 0 0 1 3 3v15H8a3 3 0 0 1-3-3z" />
    <line x1="9" y1="8" x2="15" y2="8" />
    <line x1="9" y1="12" x2="15" y2="12" />
  </Svg>
);

export const IconoLista = ({ tam = 18 }) => (
  <Svg tam={tam}>
    <line x1="9" y1="6" x2="20" y2="6" />
    <line x1="9" y1="12" x2="20" y2="12" />
    <line x1="9" y1="18" x2="20" y2="18" />
    <circle cx="4.5" cy="6" r="1" />
    <circle cx="4.5" cy="12" r="1" />
    <circle cx="4.5" cy="18" r="1" />
  </Svg>
);

export const IconoEtiqueta = ({ tam = 18 }) => (
  <Svg tam={tam}>
    <path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8z" />
    <circle cx="7.5" cy="7.5" r="1.2" />
  </Svg>
);

export const IconoMonedas = ({ tam = 18 }) => (
  <Svg tam={tam}>
    <rect x="2.5" y="6" width="19" height="12" rx="2" />
    <circle cx="12" cy="12" r="2.5" />
  </Svg>
);

export const IconoSalir = ({ tam = 18 }) => (
  <Svg tam={tam}>
    <path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3" />
    <polyline points="10 8 6 12 10 16" />
    <line x1="6" y1="12" x2="16" y2="12" />
  </Svg>
);

export const IconoCopiar = ({ tam = 18 }) => (
  <Svg tam={tam}>
    <rect x="8" y="8" width="12" height="12" rx="2" />
    <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
  </Svg>
);

/* Check grande que se dibuja solo (confirmaciones) */
export const CheckAnimado = () => (
  <svg className="check-animado" width="64" height="64" viewBox="0 0 52 52" fill="none" aria-hidden="true">
    <circle cx="26" cy="26" r="23" pathLength="1" />
    <path d="M15 27l7 7 15-16" pathLength="1" />
  </svg>
);

/* --------------------------------------------------------------------------
   Spinner dentro de botones (usa el color del texto del botón)
   -------------------------------------------------------------------------- */

export const Cargando = () => <span className="cargando" aria-hidden="true" />;

/* --------------------------------------------------------------------------
   Esqueleto de carga
   -------------------------------------------------------------------------- */

export function Esqueleto({ lineas = 3, etiqueta = 'Cargando…' }) {
  return (
    <div className="esqueleto-grupo" role="status" aria-label={etiqueta}>
      {Array.from({ length: lineas }, (_, i) => (
        <span
          key={i}
          className="esqueleto"
          style={{ width: `${i === lineas - 1 ? 60 : 100 - i * 8}%` }}
        />
      ))}
    </div>
  );
}

/* --------------------------------------------------------------------------
   Aviso en línea: error con role="alert", éxito con role="status"
   -------------------------------------------------------------------------- */

export function Aviso({ mensaje }) {
  if (!mensaje) return null;
  const esError = mensaje.tipo === 'error';
  return (
    <div className={`aviso ${esError ? '' : 'exito'}`} role={esError ? 'alert' : 'status'}>
      {esError ? <IconoAlerta /> : <IconoCheck />}
      <span>{mensaje.texto}</span>
    </div>
  );
}

/* --------------------------------------------------------------------------
   Toasts: mensajes de éxito que se van solos a los pocos segundos
   -------------------------------------------------------------------------- */

const DURACION_TOAST = 3200;
const SALIDA_TOAST = 220;

const ContextoToast = createContext(() => {});

export function ProveedorToasts({ children }) {
  const [toasts, setToasts] = useState([]);
  const siguienteId = useRef(0);

  const notificar = useCallback((texto) => {
    const id = ++siguienteId.current;
    setToasts((lista) => [...lista, { id, texto, saliendo: false }]);
    setTimeout(() => {
      setToasts((lista) => lista.map((t) => (t.id === id ? { ...t, saliendo: true } : t)));
      setTimeout(() => {
        setToasts((lista) => lista.filter((t) => t.id !== id));
      }, SALIDA_TOAST);
    }, DURACION_TOAST);
  }, []);

  return (
    <ContextoToast.Provider value={notificar}>
      {children}
      {/* La región viva existe siempre para que el lector de pantalla anuncie
          cada toast nuevo. */}
      <div className="toasts" role="status" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast ${t.saliendo ? 'saliendo' : ''}`}>
            <IconoCheck />
            <span>{t.texto}</span>
          </div>
        ))}
      </div>
    </ContextoToast.Provider>
  );
}

export const useToast = () => useContext(ContextoToast);

/* --------------------------------------------------------------------------
   Diálogo de confirmación (usa <dialog> nativo: foco atrapado y Esc)
   -------------------------------------------------------------------------- */

export function DialogoConfirmar({
  abierto,
  titulo,
  children,
  textoConfirmar = 'Confirmar',
  onConfirmar,
  onCancelar,
}) {
  const ref = useRef(null);

  useEffect(() => {
    const dialogo = ref.current;
    if (!dialogo) return;
    if (abierto && !dialogo.open) dialogo.showModal();
    if (!abierto && dialogo.open) dialogo.close();
  }, [abierto]);

  return (
    <dialog
      ref={ref}
      className="dialogo"
      aria-labelledby="dialogo-titulo"
      onCancel={(e) => {
        e.preventDefault();
        onCancelar();
      }}
      onClick={(e) => {
        // Clic en el fondo oscuro (fuera de la caja) = cancelar
        if (e.target === ref.current) onCancelar();
      }}
    >
      <div className="dialogo-caja">
        <h2 id="dialogo-titulo">{titulo}</h2>
        <div className="dialogo-cuerpo">{children}</div>
        <div className="dialogo-acciones">
          {/* showModal() enfoca este botón (el primero) al abrir: la opción segura */}
          <button type="button" className="secundario" onClick={onCancelar}>
            Cancelar
          </button>
          <button type="button" className="exito" onClick={onConfirmar}>
            {textoConfirmar}
          </button>
        </div>
      </div>
    </dialog>
  );
}

/* --------------------------------------------------------------------------
   Monto en soles que se anima al cambiar (count-up)
   -------------------------------------------------------------------------- */

const prefiereMenosMovimiento = () =>
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

export function Soles({ valor, duracion = 650 }) {
  const [mostrado, setMostrado] = useState(() => (prefiereMenosMovimiento() ? valor : 0));
  const actual = useRef(mostrado);

  useEffect(() => {
    const desde = actual.current;
    const hasta = Number(valor) || 0;
    if (desde === hasta || prefiereMenosMovimiento()) {
      actual.current = hasta;
      setMostrado(hasta);
      return undefined;
    }
    let cuadro;
    const inicio = performance.now();
    const paso = (ahora) => {
      const t = Math.min(1, (ahora - inicio) / duracion);
      const suave = 1 - Math.pow(1 - t, 3); // ease-out cúbico
      actual.current = desde + (hasta - desde) * suave;
      setMostrado(actual.current);
      if (t < 1) cuadro = requestAnimationFrame(paso);
    };
    cuadro = requestAnimationFrame(paso);
    return () => cancelAnimationFrame(cuadro);
  }, [valor, duracion]);

  return <>S/{mostrado.toFixed(2)}</>;
}
