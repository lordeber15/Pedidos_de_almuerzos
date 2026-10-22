import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { api } from './api.js';
import { parseMenu } from './menuParser.js';
import {
  Aviso,
  Cargando,
  DialogoConfirmar,
  Esqueleto,
  IconoAlerta,
  IconoCalendario,
  IconoCandado,
  IconoCheck,
  IconoCopiar,
  IconoEtiqueta,
  IconoLista,
  IconoMenu,
  IconoMonedas,
  IconoReloj,
  IconoSalir,
  ProveedorToasts,
  Soles,
  useToast,
} from './ui.jsx';

const PESTANAS = [
  ['menu', 'Menú del día', IconoMenu],
  ['lista', 'Pedidos del día', IconoLista],
  ['precios', 'Precios', IconoEtiqueta],
  ['horario', 'Horario', IconoReloj],
  ['cobros', 'Cobros del día', IconoMonedas],
  ['deudas', 'Deudas', IconoAlerta],
  ['password', 'Contraseña', IconoCandado],
];

export default function PanelAdmin() {
  const [autenticado, setAutenticado] = useState(
    () => !!localStorage.getItem('token_admin')
  );

  if (!autenticado) {
    return <Login onOk={() => setAutenticado(true)} />;
  }

  return (
    <ProveedorToasts>
      <Panel
        onSalir={() => {
          localStorage.removeItem('token_admin');
          setAutenticado(false);
        }}
      />
    </ProveedorToasts>
  );
}

function Panel({ onSalir }) {
  // La pestaña activa vive en el hash de la URL (#cobros) para no perderla
  // al recargar y poder compartir el enlace directo.
  const { hash } = useLocation();
  const navegar = useNavigate();
  const idHash = hash.replace('#', '');
  const pestania = PESTANAS.some(([id]) => id === idHash) ? idHash : 'menu';

  const lista = useRef(null);
  const [indicador, setIndicador] = useState(null);
  // true cuando en móvil quedan pestañas ocultas a la derecha (difumina el borde).
  const [hayMas, setHayMas] = useState(false);

  function revisarDesborde() {
    const el = lista.current;
    if (el) setHayMas(el.scrollLeft + el.clientWidth < el.scrollWidth - 2);
  }

  // Indicador deslizante bajo la pestaña activa: se mide la posición del
  // botón activo y se recalcula al cambiar de pestaña o de tamaño.
  useLayoutEffect(() => {
    function medir() {
      const boton = lista.current?.querySelector('[aria-current="page"]');
      if (!boton) return;
      setIndicador({
        left: boton.offsetLeft,
        top: boton.offsetTop,
        width: boton.offsetWidth,
        height: boton.offsetHeight,
      });
      revisarDesborde();
    }
    medir();
    // Centra la pestaña activa (solo desplaza la lista, no la página): en
    // móvil siempre asoman las pestañas vecinas a los lados.
    const el = lista.current;
    const boton = el?.querySelector('[aria-current="page"]');
    if (el && boton) {
      el.scrollTo({ left: boton.offsetLeft - (el.clientWidth - boton.offsetWidth) / 2 });
    }
    window.addEventListener('resize', medir);
    // Las fuentes web cambian el ancho de los botones al terminar de cargar.
    document.fonts?.ready.then(medir);
    return () => window.removeEventListener('resize', medir);
  }, [pestania]);

  return (
    <div className="contenedor">
      <div className="barra-superior">
        <button className="secundario sesion" onClick={onSalir}>
          <IconoSalir tam={16} />
          Cerrar sesión
        </button>
      </div>
      <header className="marca">
        <span className="marca-icono"><IconoCandado tam={30} /></span>
        <h1>Panel de administración</h1>
        <p className="marca-sub">Menú, precios y cobros del día</p>
      </header>

      <nav className="pestanas" aria-label="Secciones de administración">
        <div
          className={`pestanas-lista ${hayMas ? 'hay-mas' : ''}`}
          ref={lista}
          onScroll={revisarDesborde}
        >
          {indicador && (
            <span
              className="pestanas-indicador"
              aria-hidden="true"
              style={{
                transform: `translate(${indicador.left}px, ${indicador.top}px)`,
                width: indicador.width,
                height: indicador.height,
              }}
            />
          )}
          {PESTANAS.map(([id, etiqueta, Icono]) => (
            <button
              key={id}
              className={pestania === id ? 'activa' : ''}
              aria-current={pestania === id ? 'page' : undefined}
              onClick={() => navegar({ hash: id }, { replace: true })}
            >
              <Icono tam={16} />
              {etiqueta}
            </button>
          ))}
        </div>
      </nav>

      {/* key: al cambiar de pestaña el contenido se monta de nuevo y anima */}
      <div className="panel-pestana" key={pestania}>
        {pestania === 'menu' && <TabMenu />}
        {pestania === 'lista' && <TabLista />}
        {pestania === 'precios' && <TabPrecios />}
        {pestania === 'horario' && <TabHorario />}
        {pestania === 'cobros' && <TabCobros />}
        {pestania === 'deudas' && <TabDeudas />}
        {pestania === 'password' && <TabPassword />}
      </div>
    </div>
  );
}

function Login({ onOk }) {
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [mensaje, setMensaje] = useState(null);
  const [enviando, setEnviando] = useState(false);

  async function enviar(e) {
    e.preventDefault();
    setMensaje(null);
    setEnviando(true);
    try {
      const { token } = await api.loginAdmin(usuario, password);
      localStorage.setItem('token_admin', token);
      onOk();
    } catch (err) {
      setMensaje({ tipo: 'error', texto: err.message });
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="contenedor contenedor-estrecho">
      <header className="marca">
        <span className="marca-icono"><IconoCandado tam={30} /></span>
        <h1>Administración</h1>
        <p className="marca-sub">Acceso restringido al personal a cargo</p>
      </header>
      <section className="tarjeta">
        <form onSubmit={enviar}>
          <div className="campo">
            <label className="campo-label" htmlFor="usuario">Usuario</label>
            <input
              id="usuario"
              type="text"
              autoComplete="username"
              placeholder="Tu usuario"
              autoFocus
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
            />
          </div>
          <div className="campo">
            <label className="campo-label" htmlFor="password">Contraseña</label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="Tu contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <Aviso mensaje={mensaje} />
          <button type="submit" className="ancho" disabled={enviando}>
            {enviando && <Cargando />}
            {enviando ? 'Ingresando…' : 'Ingresar'}
          </button>
        </form>
      </section>
    </div>
  );
}

/* Resultado de la vista previa: platos detectados o el motivo del error. */
function previsualizar(texto) {
  if (!texto.trim()) return null;
  try {
    return { ok: true, ...parseMenu(texto) };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

function TabMenu() {
  const notificar = useToast();
  const [texto, setTexto] = useState('');
  const [mensaje, setMensaje] = useState(null);
  const [enviando, setEnviando] = useState(false);

  const vista = useMemo(() => previsualizar(texto), [texto]);

  async function publicar(e) {
    e.preventDefault();
    setMensaje(null);
    setEnviando(true);
    try {
      const menu = await api.publicarMenu(texto);
      notificar(
        `Menú publicado: ${menu.entradas.length} entradas y ${menu.fondos.length} fondos.`
      );
    } catch (err) {
      setMensaje({ tipo: 'error', texto: err.message });
    } finally {
      setEnviando(false);
    }
  }

  return (
    <section className="tarjeta">
      <h2>Publicar menú del día</h2>
      <p className="nota">
        Pega el texto del día. El sistema toma las entradas entre las marcas
        ENTRADAS y FONDOS, y los fondos entre FONDOS y REFRESCO.
      </p>
      <form onSubmit={publicar}>
        <div className="campo">
          <label className="campo-label" htmlFor="texto-menu">Texto del menú</label>
          <textarea
            id="texto-menu"
            rows={14}
            placeholder="Pega aquí el texto del menú…"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            aria-describedby="texto-menu-ayuda"
          />
          <span className="campo-ayuda" id="texto-menu-ayuda">
            Debe contener las marcas ENTRADAS y FONDOS, en ese orden.
          </span>
        </div>

        {vista && (
          <div className="vista-previa" aria-live="polite">
            <h3 className="vista-previa-titulo">Vista previa</h3>
            {vista.ok ? (
              <div className="vista-previa-columnas">
                {[
                  ['Entradas', vista.entradas],
                  ['Fondos', vista.fondos],
                ].map(([titulo, platos]) => (
                  <div key={titulo}>
                    <span className="vista-previa-sub">
                      {titulo} <span className="contador">{platos.length}</span>
                    </span>
                    <ul>
                      {platos.map((p, i) => (
                        <li key={`${i}-${p}`} style={{ '--i': i }}>{p}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            ) : (
              <p className="vista-previa-error">{vista.error}</p>
            )}
          </div>
        )}

        <Aviso mensaje={mensaje} />
        <button type="submit" disabled={!vista?.ok || enviando}>
          {enviando && <Cargando />}
          Publicar menú
        </button>
      </form>
    </section>
  );
}

// Pestaña con los pedidos del día agrupados por comensal en texto plano,
// pensada para copiar y pegar (cocina / reparto).
function TabLista() {
  const [datos, setDatos] = useState(null);
  const [mensaje, setMensaje] = useState(null);
  const [copiado, setCopiado] = useState(false);
  const [enviando, setEnviando] = useState(false);

  async function recargar() {
    setEnviando(true);
    setCopiado(false);
    try {
      setDatos(await api.listaPedidos());
      setMensaje(null);
    } catch (err) {
      setMensaje({ tipo: 'error', texto: err.message });
    } finally {
      setEnviando(false);
    }
  }

  useEffect(() => {
    recargar();
  }, []);

  // "Copiado" vuelve solo a "Copiar lista" a los 2 segundos.
  useEffect(() => {
    if (!copiado) return undefined;
    const id = setTimeout(() => setCopiado(false), 2000);
    return () => clearTimeout(id);
  }, [copiado]);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(datos.texto);
      setCopiado(true);
    } catch {
      // Portapapeles no disponible (navegador sin permiso): dejamos que el
      // usuario seleccione el texto a mano.
      setMensaje({
        tipo: 'error',
        texto: 'No se pudo copiar automáticamente. Selecciona el texto y cópialo manualmente.',
      });
    }
  }

  return (
    <section className="tarjeta">
      <h2>Pedidos del día</h2>
      <p className="nota">
        Agrupados por comensal, listos para copiar y pegar.{' '}
        {datos ? `${datos.cantidad} pedido(s) el ${datos.fecha}` : ''}
      </p>
      <Aviso mensaje={mensaje} />
      {!datos ? (
        <Esqueleto lineas={5} etiqueta="Cargando pedidos" />
      ) : datos.cantidad === 0 ? (
        <Vacio texto="Todavía no hay pedidos hoy." />
      ) : (
        <>
          <pre className="lista-texto" aria-label="Lista de pedidos del día">
            {datos.texto}
          </pre>
          <div className="acciones-lista">
            <button
              onClick={copiar}
              disabled={enviando}
              className={copiado ? 'exito copiado' : ''}
              aria-live="polite"
            >
              {copiado ? <IconoCheck /> : <IconoCopiar />}
              {copiado ? 'Copiado' : 'Copiar lista'}
            </button>
            <button className="secundario" onClick={recargar} disabled={enviando}>
              {enviando && <Cargando />}
              Actualizar
            </button>
          </div>
        </>
      )}
    </section>
  );
}

function Vacio({ texto }) {
  return (
    <div className="vacio">
      <IconoLista tam={28} />
      <p>{texto}</p>
    </div>
  );
}

const ETIQUETAS_PRECIO = {
  entrada_fondo: 'Entrada con fondo',
  ceviche_fondo: 'Ceviche con fondo',
  solo_entrada: 'Solo entrada',
  solo_ceviche: 'Solo ceviche',
};

const preciosAObjeto = (filas) =>
  Object.fromEntries(filas.map((f) => [f.tipo, Number(f.monto)]));

function TabPrecios() {
  const notificar = useToast();
  const [precios, setPrecios] = useState(null);
  // Últimos precios guardados, para detectar cambios sin guardar.
  const [guardados, setGuardados] = useState(null);
  const [mensaje, setMensaje] = useState(null);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    // El endpoint devuelve [{ tipo, monto }, ...]; lo pasamos a objeto
    // para poder acceder precios[tipo] al renderizar.
    api
      .obtenerPrecios()
      .then((filas) => {
        const obj = preciosAObjeto(filas);
        setPrecios(obj);
        setGuardados(obj);
      })
      .catch((e) => setMensaje({ tipo: 'error', texto: e.message }));
  }, []);

  async function guardar(e) {
    e.preventDefault();
    setMensaje(null);
    setEnviando(true);
    try {
      const obj = preciosAObjeto(await api.guardarPrecios(precios));
      setPrecios(obj);
      setGuardados(obj);
      notificar('Precios guardados.');
    } catch (err) {
      setMensaje({ tipo: 'error', texto: err.message });
    } finally {
      setEnviando(false);
    }
  }

  if (!precios) {
    return (
      <section className="tarjeta">
        <Aviso mensaje={mensaje} />
        {!mensaje && <Esqueleto lineas={4} etiqueta="Cargando precios" />}
      </section>
    );
  }

  const conCambios = Object.keys(ETIQUETAS_PRECIO).some(
    (tipo) => String(precios[tipo] ?? '') !== String(guardados?.[tipo] ?? '')
  );

  return (
    <section className="tarjeta">
      <h2>Precios generales (S/)</h2>
      <p className="nota">
        Estos precios se aplican a los pedidos que se registren a partir de
        ahora.
      </p>
      <form onSubmit={guardar}>
        <div className="grid-precios">
          {Object.entries(ETIQUETAS_PRECIO).map(([tipo, etiqueta]) => {
            const cambiado = String(precios[tipo] ?? '') !== String(guardados?.[tipo] ?? '');
            return (
              <label key={tipo} className={`campo-precio ${cambiado ? 'cambiado' : ''}`}>
                <span>{etiqueta}</span>
                <div className="input-moneda">
                  <span className="prefijo" aria-hidden="true">S/</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    inputMode="decimal"
                    aria-label={`${etiqueta} en soles`}
                    value={precios[tipo] ?? ''}
                    onChange={(e) =>
                      setPrecios({
                        ...precios,
                        [tipo]: e.target.value,
                      })
                    }
                  />
                </div>
              </label>
            );
          })}
        </div>
        <Aviso mensaje={mensaje} />
        <div className="fila-acciones">
          <button type="submit" disabled={!conCambios || enviando}>
            {enviando && <Cargando />}
            Guardar precios
          </button>
          {conCambios && (
            <span className="cambios-pendientes" role="status">
              Cambios sin guardar
            </span>
          )}
        </div>
      </form>
    </section>
  );
}

// Pestaña con la hora diaria de cierre de pedidos: a esa hora el sistema
// deja de aceptar pedidos y la pantalla pública muestra el countdown.
// Sin hora configurada no hay corte automático.
function TabHorario() {
  const notificar = useToast();
  // null = aún sin cargar; '' = sin corte configurado; 'HH:MM' = corte activo.
  const [hora, setHora] = useState(null);
  const [mensaje, setMensaje] = useState(null);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    api
      .obtenerHoraCierre()
      .then(({ hora_cierre }) => setHora(hora_cierre ?? ''))
      .catch((e) => setMensaje({ tipo: 'error', texto: e.message }));
  }, []);

  async function guardar(e) {
    e.preventDefault();
    setMensaje(null);
    setEnviando(true);
    try {
      // Campo vacío = desactivar el corte (el backend acepta null).
      const { hora_cierre } = await api.guardarHoraCierre(hora || null);
      setHora(hora_cierre ?? '');
      notificar(
        hora_cierre
          ? `Hora de cierre guardada: ${hora_cierre}. Los pedidos se cortarán a esa hora.`
          : 'Corte por hora desactivado: los pedidos se aceptan hasta cerrar el día manualmente.'
      );
    } catch (err) {
      setMensaje({ tipo: 'error', texto: err.message });
    } finally {
      setEnviando(false);
    }
  }

  if (hora === null) {
    return (
      <section className="tarjeta">
        <Aviso mensaje={mensaje} />
        {!mensaje && <Esqueleto lineas={3} etiqueta="Cargando horario" />}
      </section>
    );
  }

  return (
    <section className="tarjeta">
      <h2>Hora de cierre de pedidos</h2>
      <p className="nota">
        A esta hora los pedidos del día dejan de aceptarse y los comensales
        ven un countdown con el tiempo que queda para pedir. Deja el campo
        vacío para desactivar el corte automático.
      </p>
      <form onSubmit={guardar}>
        <div className="campo">
          <label className="campo-label" htmlFor="hora-cierre">
            Hora de cierre (hora y minuto)
          </label>
          <input
            id="hora-cierre"
            type="time"
            value={hora}
            onChange={(e) => setHora(e.target.value)}
            aria-describedby="hora-cierre-ayuda"
          />
          <span className="campo-ayuda" id="hora-cierre-ayuda">
            Se aplica de inmediato, todos los días. Vacío = sin corte.
          </span>
        </div>
        <Aviso mensaje={mensaje} />
        <button type="submit" disabled={enviando}>
          {enviando && <Cargando />}
          {hora ? 'Guardar hora de cierre' : 'Desactivar corte'}
        </button>
      </form>
    </section>
  );
}

/* Aplica un cambio de estado a la copia local de los cobros (actualización
   optimista): mueve el total del pedido entre "cobrado" y "por cobrar". */
function aplicarEstado(datos, id, estado) {
  const ajustarDia = (dia) => {
    const pedido = dia.pedidos.find((p) => p.id === id);
    if (!pedido || pedido.estado === estado) return dia;
    const signo = estado === 'pagado' ? 1 : -1;
    const t = dia.totales;
    return {
      ...dia,
      pedidos: dia.pedidos.map((p) => (p.id === id ? { ...p, estado } : p)),
      totales: {
        ...t,
        total_pagado: t.total_pagado + signo * pedido.total,
        total_pendiente: t.total_pendiente - signo * pedido.total,
        cantidad_pendientes: t.cantidad_pendientes - signo,
      },
    };
  };
  return { ...ajustarDia(datos), dias_pendientes: datos.dias_pendientes.map(ajustarDia) };
}

function TabCobros() {
  const notificar = useToast();
  const [datos, setDatos] = useState(null);
  const [mensaje, setMensaje] = useState(null);
  const [enviando, setEnviando] = useState(false);
  // Ids de pedidos cuyo cambio de estado se está guardando.
  const [guardando, setGuardando] = useState(() => new Set());
  // Fecha del día a cerrar mientras el diálogo de confirmación está abierto.
  const [porCerrar, setPorCerrar] = useState(null);

  async function recargar() {
    try {
      setDatos(await api.cobrosDelDia());
      setMensaje(null);
    } catch (err) {
      setMensaje({ tipo: 'error', texto: err.message });
    }
  }

  useEffect(() => {
    recargar();
  }, []);

  async function cambiarEstado(id, estado) {
    setMensaje(null);
    setGuardando((s) => new Set(s).add(id));
    // Se refleja al instante; si el servidor falla, recargar() revierte.
    setDatos((d) => aplicarEstado(d, id, estado));
    try {
      await api.cambiarEstadoPedido(id, estado);
    } catch (err) {
      setMensaje({ tipo: 'error', texto: err.message });
    } finally {
      await recargar();
      setGuardando((s) => {
        const copia = new Set(s);
        copia.delete(id);
        return copia;
      });
    }
  }

  // Excepción de hoy para el comensal: su pedido impago no impide cerrar el
  // día y queda como deuda (también lo deja pedir hoy aunque deba).
  async function dejarComoDeuda(comensalId, nombre) {
    setMensaje(null);
    setEnviando(true);
    try {
      await api.otorgarExcepcion(comensalId);
      await recargar();
      notificar(`${nombre} tiene excepción hoy: sus pedidos impagos quedarán como deuda.`);
    } catch (err) {
      setMensaje({ tipo: 'error', texto: err.message });
    } finally {
      setEnviando(false);
    }
  }

  async function cerrarDia(fecha) {
    setPorCerrar(null);
    setMensaje(null);
    setEnviando(true);
    try {
      await api.cerrarDia(fecha);
      const fechaCierre = fecha || datos?.fecha || '';
      await recargar();
      notificar(`Día ${fechaCierre} cerrado.`);
    } catch (err) {
      setMensaje({ tipo: 'error', texto: err.message });
    } finally {
      setEnviando(false);
    }
  }

  const diaPorCerrar =
    porCerrar &&
    (porCerrar === datos?.fecha ? datos : datos?.dias_pendientes.find((d) => d.fecha === porCerrar));

  return (
    <section className="tarjeta">
      <h2>Cobros del día</h2>
      <Aviso mensaje={mensaje} />
      {!datos ? (
        !mensaje && <Esqueleto lineas={5} etiqueta="Cargando cobros" />
      ) : datos.pedidos.length === 0 && datos.dias_pendientes.length === 0 ? (
        <Vacio texto="Todavía no hay pedidos hoy." />
      ) : (
        <>
          {datos.pedidos.length > 0 && (
            <BloqueCobros
              etiqueta={`Hoy · ${datos.fecha}`}
              dia={datos}
              cerrado={datos.cerrado}
              cierre={datos.cierre}
              onCambiarEstado={cambiarEstado}
              onDejarComoDeuda={dejarComoDeuda}
              onCerrar={setPorCerrar}
              enviando={enviando}
              guardando={guardando}
            />
          )}
          {datos.dias_pendientes.length > 0 && (
            <>
              <h3>Días anteriores sin cerrar</h3>
              <p className="nota">
                Estas deudas siguen visibles hasta que cierres cada día.
              </p>
              {datos.dias_pendientes.map((d) => (
                <BloqueCobros
                  key={d.fecha}
                  etiqueta={`Día ${d.fecha}`}
                  dia={d}
                  cerrado={false}
                  onCambiarEstado={cambiarEstado}
                  onDejarComoDeuda={dejarComoDeuda}
                  onCerrar={setPorCerrar}
                  enviando={enviando}
                  guardando={guardando}
                />
              ))}
            </>
          )}
        </>
      )}

      <DialogoConfirmar
        abierto={Boolean(porCerrar)}
        titulo={`¿Cerrar el día ${porCerrar ?? ''}?`}
        textoConfirmar="Sí, cerrar el día"
        onConfirmar={() => cerrarDia(porCerrar)}
        onCancelar={() => setPorCerrar(null)}
      >
        {diaPorCerrar && (
          <p>
            Se registrará un total de{' '}
            <strong>S/{diaPorCerrar.totales.total_dia.toFixed(2)}</strong> por{' '}
            {diaPorCerrar.totales.cantidad_pedidos} pedido(s).
          </p>
        )}
        {diaPorCerrar && diaPorCerrar.totales.cantidad_pendientes > 0 && (
          <p>
            <strong>{diaPorCerrar.totales.cantidad_pendientes} pedido(s)</strong> sin
            pagar quedarán como deuda (S/
            {diaPorCerrar.totales.total_pendiente.toFixed(2)}).
          </p>
        )}
        <p className="nota">
          Después de cerrarlo solo podrás marcar como pagadas sus deudas
          (pestaña Deudas) y su menú dejará de mostrarse en la pantalla
          pública. Esta acción no se puede deshacer.
        </p>
      </DialogoConfirmar>
    </section>
  );
}

// Vista de cobros de un solo día (resumen, tabla y pie con el cierre).
// Se usa para el día de hoy y para cada día anterior sin cerrar.
function BloqueCobros({
  etiqueta,
  dia,
  cerrado,
  cierre,
  onCambiarEstado,
  onDejarComoDeuda,
  onCerrar,
  enviando,
  guardando,
}) {
  const t = dia.totales;
  // Un pedido pendiente bloquea el cierre salvo que su comensal tenga
  // excepción: en ese caso queda como deuda.
  const bloqueantes = dia.pedidos.filter((p) => p.estado !== 'pagado' && !p.excepcion).length;
  const comoDeuda = t.cantidad_pendientes - bloqueantes;
  const puedeCerrar = t.cantidad_pedidos > 0 && bloqueantes === 0;
  const pagados = t.cantidad_pedidos - t.cantidad_pendientes;
  const fraccion = t.total_dia > 0 ? t.total_pagado / t.total_dia : 0;
  return (
    <div className="dia-cobros">
      <h3>{etiqueta}</h3>
      <div className="resumen">
        <div className="dato">
          <span className="dato-etiqueta">Total del día</span>
          <span className="dato-valor"><Soles valor={t.total_dia} /></span>
          <span className="dato-sub">
            {t.cantidad_pedidos} pedido(s) · delivery S/
            {dia.por_comensal.toFixed(2)} c/u
          </span>
        </div>
        <div className="dato cobrado">
          <span className="dato-etiqueta">Cobrado</span>
          <span className="dato-valor"><Soles valor={t.total_pagado} /></span>
          <span className="dato-sub">{pagados} pagado(s)</span>
        </div>
        <div className="dato pendiente">
          <span className="dato-etiqueta">Por cobrar</span>
          <span className="dato-valor"><Soles valor={t.total_pendiente} /></span>
          <span className="dato-sub">{t.cantidad_pendientes} sin pagar</span>
        </div>
      </div>

      <div
        className="progreso"
        role="progressbar"
        aria-label="Avance de cobro"
        aria-valuemin={0}
        aria-valuemax={t.cantidad_pedidos}
        aria-valuenow={pagados}
        aria-valuetext={`${pagados} de ${t.cantidad_pedidos} pagados`}
      >
        <span className="progreso-barra" style={{ transform: `scaleX(${fraccion})` }} />
      </div>
      <p className="progreso-texto">
        {pagados} de {t.cantidad_pedidos} pagados
      </p>

      <div className="tabla-envoltura">
        <table className="tabla">
          <caption className="solo-lectura">
            Pedidos del día con su precio, delivery, total y estado de pago
          </caption>
          <thead>
            <tr>
              <th scope="col">Comensal</th>
              <th scope="col">Pedido</th>
              <th scope="col" className="num">Precio</th>
              <th scope="col" className="num">Delivery</th>
              <th scope="col" className="num">Total</th>
              <th scope="col">Estado</th>
              <th scope="col"><span className="solo-lectura">Acciones</span></th>
            </tr>
          </thead>
          <tbody>
            {dia.pedidos.map((p) => {
              const ocupado = guardando.has(p.id);
              return (
                <tr key={p.id} className={p.estado === 'pagado' ? 'fila-pagada' : ''}>
                  <td className="celda-comensal" data-label="Comensal">
                    {p.comensal}
                    {p.con_excepcion && (
                      <span className="badge excepcion" title="Pidió con deuda pendiente">
                        Con excepción
                      </span>
                    )}
                  </td>
                  <td data-label="Pedido">
                    {p.entrada}
                    {p.fondo ? ` + ${p.fondo}` : ' (solo entrada)'}
                  </td>
                  <td className="num" data-label="Precio">S/{p.precio_base.toFixed(2)}</td>
                  <td className="num" data-label="Delivery">S/{p.delivery.toFixed(2)}</td>
                  <td className="num" data-label="Total">
                    <strong>S/{p.total.toFixed(2)}</strong>
                  </td>
                  <td data-label="Estado">
                    {/* key: el badge "rebota" al cambiar de estado */}
                    <span key={p.estado} className={`badge ${p.estado}`}>
                      {p.estado}
                    </span>
                    {p.estado === 'pendiente' && p.excepcion && (
                      <span className="badge deuda">Queda como deuda</span>
                    )}
                  </td>
                  <td className="celda-accion">
                    {cerrado ? (
                      <span className="nota" aria-label="Día cerrado, sin acciones">—</span>
                    ) : p.estado === 'pendiente' ? (
                      <div className="acciones-fila">
                        <button onClick={() => onCambiarEstado(p.id, 'pagado')} disabled={ocupado}>
                          {ocupado && <Cargando />}
                          Marcar pagado
                        </button>
                        {!p.excepcion && (
                          <button
                            className="secundario"
                            onClick={() => onDejarComoDeuda(p.comensal_id, p.comensal)}
                            disabled={ocupado || enviando}
                          >
                            Dejar como deuda
                          </button>
                        )}
                      </div>
                    ) : (
                      <button
                        className="secundario"
                        onClick={() => onCambiarEstado(p.id, 'pendiente')}
                        disabled={ocupado}
                      >
                        {ocupado && <Cargando />}
                        Marcar pendiente
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="pie-cobros">
        {cerrado ? (
          <div className="aviso exito" role="status">
            <IconoCheck />
            <span>
              Día cerrado el{' '}
              {new Date(cierre.cerrado_en).toLocaleString('es-PE')} ·
              total S/{Number(cierre.total_dia).toFixed(2)}
            </span>
          </div>
        ) : (
          <>
            <div>
              <p className="nota">
                El delivery de S/
                {Number(dia.delivery_total).toFixed(2)} está repartido entre
                los {t.cantidad_pedidos} pedido(s).
              </p>
              {bloqueantes > 0 && (
                <p className="nota">
                  Para cerrar el día, marca como pagados o deja como deuda los{' '}
                  {bloqueantes} pedido(s) pendientes.
                </p>
              )}
              {comoDeuda > 0 && (
                <p className="nota">
                  {comoDeuda} pedido(s) quedarán como deuda al cerrar.
                </p>
              )}
            </div>
            <div className="acciones">
              <button
                className="exito"
                disabled={!puedeCerrar || enviando || guardando.size > 0}
                onClick={() => onCerrar(dia.fecha)}
              >
                {enviando ? <Cargando /> : <IconoCalendario />} Cerrar el día {dia.fecha}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// Pestaña con las deudas de días anteriores (cerrados o no) por comensal.
// Quien debe no puede pedir; el administrador puede cobrar la deuda o darle
// permiso para pedir hoy (excepción), todas las veces que haga falta.
function TabDeudas() {
  const notificar = useToast();
  const [datos, setDatos] = useState(null);
  const [mensaje, setMensaje] = useState(null);
  // Clave de la acción en curso (para deshabilitar y mostrar el spinner).
  const [ocupado, setOcupado] = useState(null);

  async function recargar() {
    try {
      setDatos(await api.deudas());
    } catch (err) {
      setMensaje({ tipo: 'error', texto: err.message });
    }
  }

  useEffect(() => {
    recargar();
  }, []);

  async function ejecutar(clave, accion, textoOk) {
    setOcupado(clave);
    setMensaje(null);
    try {
      await accion();
      notificar(textoOk);
    } catch (err) {
      setMensaje({ tipo: 'error', texto: err.message });
    } finally {
      await recargar();
      setOcupado(null);
    }
  }

  const cobrarTodo = (g) =>
    ejecutar(
      `todo-${g.comensal_id}`,
      async () => {
        for (const p of g.pedidos) await api.cambiarEstadoPedido(p.id, 'pagado');
      },
      `Deuda de ${g.comensal} cobrada: S/${g.total.toFixed(2)}.`
    );

  const cambiarPermiso = (g) =>
    ejecutar(
      `exc-${g.comensal_id}`,
      () =>
        g.excepcion_hoy ? api.quitarExcepcion(g.comensal_id) : api.otorgarExcepcion(g.comensal_id),
      g.excepcion_hoy
        ? `${g.comensal} ya no puede pedir hoy hasta pagar.`
        : `${g.comensal} puede pedir hoy; su pedido se sumará a la deuda.`
    );

  return (
    <section className="tarjeta">
      <h2>Deudas pendientes</h2>
      <p className="nota">
        Pedidos sin pagar de días anteriores. Quien debe no puede pedir hasta
        pagar, salvo que le permitas pedir hoy: su nuevo pedido se suma a la
        deuda.
      </p>
      <Aviso mensaje={mensaje} />
      {!datos ? (
        !mensaje && <Esqueleto lineas={4} etiqueta="Cargando deudas" />
      ) : datos.comensales.length === 0 ? (
        <Vacio texto="Nadie tiene deudas pendientes." />
      ) : (
        datos.comensales.map((g) => (
          <div className="dia-cobros" key={g.comensal_id}>
            <div className="deudor-cabecera">
              <h3>
                {g.comensal}
                {g.excepcion_hoy && <span className="badge excepcion">Puede pedir hoy</span>}
              </h3>
              <span className="deudor-total">S/{g.total.toFixed(2)}</span>
            </div>
            <div className="tabla-envoltura">
              <table className="tabla">
                <caption className="solo-lectura">Pedidos adeudados por {g.comensal}</caption>
                <thead>
                  <tr>
                    <th scope="col">Fecha</th>
                    <th scope="col">Pedido</th>
                    <th scope="col" className="num">Total</th>
                    <th scope="col"><span className="solo-lectura">Acciones</span></th>
                  </tr>
                </thead>
                <tbody>
                  {g.pedidos.map((p) => (
                    <tr key={p.id}>
                      <td data-label="Fecha">{p.fecha}</td>
                      <td data-label="Pedido">
                        {p.entrada}
                        {p.fondo ? ` + ${p.fondo}` : ' (solo entrada)'}
                      </td>
                      <td className="num" data-label="Total">
                        <strong>S/{p.monto.toFixed(2)}</strong>
                      </td>
                      <td className="celda-accion">
                        <button
                          onClick={() =>
                            ejecutar(
                              `pedido-${p.id}`,
                              () => api.cambiarEstadoPedido(p.id, 'pagado'),
                              `Pedido del ${p.fecha} de ${g.comensal} marcado como pagado.`
                            )
                          }
                          disabled={Boolean(ocupado)}
                        >
                          {ocupado === `pedido-${p.id}` && <Cargando />}
                          Marcar pagado
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="acciones acciones-deudor">
              <button
                className="secundario"
                onClick={() => cambiarPermiso(g)}
                disabled={Boolean(ocupado)}
              >
                {ocupado === `exc-${g.comensal_id}` && <Cargando />}
                {g.excepcion_hoy ? 'Quitar permiso de hoy' : 'Permitir pedir hoy'}
              </button>
              <button className="exito" onClick={() => cobrarTodo(g)} disabled={Boolean(ocupado)}>
                {ocupado === `todo-${g.comensal_id}` ? <Cargando /> : <IconoCheck />}
                Marcar todo pagado
              </button>
            </div>
          </div>
        ))
      )}
    </section>
  );
}

function TabPassword() {
  const notificar = useToast();
  const [actual, setActual] = useState('');
  const [nueva, setNueva] = useState('');
  const [mensaje, setMensaje] = useState(null);
  const [enviando, setEnviando] = useState(false);

  async function guardar(e) {
    e.preventDefault();
    setMensaje(null);
    setEnviando(true);
    try {
      await api.cambiarPassword(actual, nueva);
      notificar('Contraseña actualizada.');
      setActual('');
      setNueva('');
    } catch (err) {
      setMensaje({ tipo: 'error', texto: err.message });
    } finally {
      setEnviando(false);
    }
  }

  return (
    <section className="tarjeta">
      <h2>Cambiar contraseña</h2>
      <form onSubmit={guardar}>
        <div className="campo">
          <label className="campo-label" htmlFor="password-actual">Contraseña actual</label>
          <input
            id="password-actual"
            type="password"
            autoComplete="current-password"
            value={actual}
            onChange={(e) => setActual(e.target.value)}
          />
        </div>
        <div className="campo">
          <label className="campo-label" htmlFor="password-nueva">Nueva contraseña</label>
          <input
            id="password-nueva"
            type="password"
            autoComplete="new-password"
            value={nueva}
            onChange={(e) => setNueva(e.target.value)}
            aria-describedby="password-nueva-ayuda"
          />
          <span className="campo-ayuda" id="password-nueva-ayuda">
            Mínimo 6 caracteres. Se usará en el próximo inicio de sesión.
            {nueva.length > 0 && nueva.length < 6 && (
              <> Te faltan {6 - nueva.length}.</>
            )}
          </span>
        </div>
        <Aviso mensaje={mensaje} />
        <button type="submit" disabled={!actual || nueva.length < 6 || enviando}>
          {enviando && <Cargando />}
          Guardar contraseña
        </button>
      </form>
    </section>
  );
}
