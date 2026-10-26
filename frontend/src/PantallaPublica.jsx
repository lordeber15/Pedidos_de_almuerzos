import { useEffect, useRef, useState } from 'react';
import { api } from './api.js';
import {
  CheckAnimado,
  Cargando,
  IconoAlerta,
  IconoCalendario,
  IconoCandado,
  IconoCloche,
  IconoReloj,
  IconoSaludo,
} from './ui.jsx';

/* Convierte una fecha YYYY-MM-DD (del endpoint, ya en la zona horaria del
   servidor) a texto largo en español sin correr el riesgo de desfases de
   zona horaria: se arma con componentes locales. */
function fechaLarga(iso) {
  if (!iso) return '';
  const [anio, mes, dia] = iso.split('-').map(Number);
  if (!anio || !mes || !dia) return '';
  const texto = new Date(anio, mes - 1, dia).toLocaleDateString('es-PE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

/* "Martes 21/10" para el detalle de una deuda. */
function fechaCorta(iso) {
  const [anio, mes, dia] = iso.split('-').map(Number);
  const nombre = new Date(anio, mes - 1, dia).toLocaleDateString('es-PE', { weekday: 'long' });
  return `${nombre.charAt(0).toUpperCase()}${nombre.slice(1)} ${String(dia).padStart(2, '0')}/${String(mes).padStart(2, '0')}`;
}

const MENSAJE_SIN_PUBLICAR =
  'Aún no se actualizó el menú. Espera un poco y regresa en un momento para hacer tu pedido.';

/* Tiempo restante (segundos) hasta la hora de cierre, derivado del `ahora`
   del servidor: compara el cierre (fecha del servidor + HH:MM) contra el
   instante `ahora` del servidor, y luego decrece con el transcurso local
   (Date.now() - recepción), de modo que un reloj de dispositivo mal
   sincronizado no afecta el countdown. Devuelve null si no hay hora. */
function restanteInicialMs(menu) {
  if (!menu || !menu.hora_cierre || !menu.fecha || !menu.ahora) return null;
  const cierre = new Date(`${menu.fecha}T${menu.hora_cierre}:00`);
  const ahoraServidor = new Date(menu.ahora);
  if (Number.isNaN(cierre.getTime()) || Number.isNaN(ahoraServidor.getTime())) {
    return null;
  }
  return cierre.getTime() - ahoraServidor.getTime();
}

/* 01:23:45 (o 00:05:09 cuando queda menos de una hora). */
function formatearRestante(segundos) {
  const s = Math.max(0, segundos);
  const hh = String(Math.floor(s / 3600)).padStart(2, '0');
  const mm = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
  const ss = String(s % 60).padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
}

// Umbrales del countdown (segundos): cambian el color y lo que se anuncia
// al lector de pantalla. La barra representa la última hora antes del cierre.
const AVISO_PRONTO = 15 * 60;
const AVISO_URGENTE = 5 * 60;
const VENTANA_BARRA = 60 * 60;

/* Texto para lectores de pantalla: solo cambia al cruzar un umbral, así no
   se anuncia cada segundo. */
function anuncioCountdown(restante, hora) {
  if (restante <= 60) return 'Queda menos de 1 minuto para pedir.';
  if (restante <= AVISO_URGENTE) return 'Quedan menos de 5 minutos para pedir.';
  if (restante <= AVISO_PRONTO) return 'Quedan menos de 15 minutos para pedir.';
  return `Los pedidos se aceptan hasta las ${hora}.`;
}

/* PIN de 4 dígitos dibujado como casillas. El input real va encima, invisible,
   así el teclado numérico, el pegado y los lectores de pantalla funcionan. */
function CampoPin({ id, valor, onChange, sacudir, onFinSacudida, autoFocus, describedBy }) {
  const actual = Math.min(valor.length, 3);
  return (
    <div
      className={`pin-cajas ${sacudir ? 'sacudir' : ''}`}
      // Solo la sacudida del contenedor; las animaciones de los puntos también burbujean.
      onAnimationEnd={(e) => e.target === e.currentTarget && onFinSacudida()}
    >
      {[0, 1, 2, 3].map((i) => (
        <span
          key={i}
          className={`pin-caja ${i < valor.length ? 'llena' : ''} ${i === actual ? 'actual' : ''}`}
          aria-hidden="true"
        />
      ))}
      <input
        id={id}
        type="password"
        inputMode="numeric"
        autoComplete="off"
        maxLength={4}
        value={valor}
        autoFocus={autoFocus}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, 4))}
        aria-describedby={describedBy}
      />
    </div>
  );
}

function PantallaCargando() {
  return (
    <div className="contenedor">
      <header className="marca">
        <span className="marca-icono"><IconoCloche /></span>
        <h1>Almuerzo de la Oficina</h1>
        <p className="marca-sub">Elige tu entrada y fondo del día</p>
      </header>
      <section className="tarjeta" role="status" aria-label="Cargando menú">
        <span className="esqueleto esqueleto-titulo" />
        <div className="lista radio">
          {Array.from({ length: 4 }, (_, i) => (
            <span key={i} className="esqueleto esqueleto-opcion" />
          ))}
        </div>
        <span className="esqueleto esqueleto-boton" />
      </section>
    </div>
  );
}

export default function PantallaPublica() {
  const [menu, setMenu] = useState(null);
  const [cargandoMenu, setCargandoMenu] = useState(true);
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  const [comensal, setComensal] = useState(null);
  const [pin, setPin] = useState('');
  const [nombre, setNombre] = useState('');
  const [modoRegistro, setModoRegistro] = useState(false);
  const [mensajeId, setMensajeId] = useState('');
  // Dispara la animación de "sacudida" del PIN cuando es rechazado.
  const [sacudirPin, setSacudirPin] = useState(false);

  const [entrada, setEntrada] = useState('');
  const [fondo, setFondo] = useState('');
  const [soloEntrada, setSoloEntrada] = useState(false);
  // Instrucciones adicionales opcionales del pedido (ej. "sin cebolla").
  const [instrucciones, setInstrucciones] = useState('');
  // Error al confirmar el pedido: se muestra junto al botón, no arriba.
  const [errorPedido, setErrorPedido] = useState('');
  // Pedido ya registrado hoy por este comensal: solo se puede pedir un
  // menú por día, así que en ese caso no se vuelve a mostrar el formulario.
  const [pedidoHoy, setPedidoHoy] = useState(null);
  // true si el pedido se registró en esta sesión (vs. venir ya registrado
  // al identificarse por PIN), para usar el mensaje correcto.
  const [recienRegistrado, setRecienRegistrado] = useState(false);
  // Deuda de días anteriores ({ total, detalle } o null). Sin excepción de
  // hoy, bloquea el formulario hasta que el administrador registre el pago.
  const [deuda, setDeuda] = useState(null);
  const [excepcionHoy, setExcepcionHoy] = useState(false);
  const [verificando, setVerificando] = useState(false);
  // PIN con el que se identificó, solo en memoria: permite volver a
  // verificar la deuda ("Ya pagué") sin pedirle el PIN otra vez.
  const pinIdentificado = useRef('');

  useEffect(() => {
    api
      .menuVigente()
      .then(setMenu)
      .catch((e) => setError(e.message))
      .finally(() => setCargandoMenu(false));
  }, []);

  // Segundos restantes hasta la hora de cierre (null = sin countdown).
  const [restante, setRestante] = useState(null);

  // Countdown: se recalcula cuando cambia el menú (carga inicial o
  // resincronización) y baja de a un segundo localmente hasta llegar a 0.
  useEffect(() => {
    const ms = restanteInicialMs(menu);
    if (ms === null) {
      setRestante(null);
      return undefined;
    }
    const base = { ms, en: Date.now() };
    const actualizar = () => {
      const restanteMs = base.ms - (Date.now() - base.en);
      setRestante(Math.max(0, Math.floor(restanteMs / 1000)));
    };
    actualizar();
    if (ms <= 0) return undefined; // la hora ya pasó: sin tick
    const id = setInterval(actualizar, 1000);
    return () => clearInterval(id);
  }, [menu]);

  // Al volver la pestaña a estar visible se resincroniza con el servidor
  // (hora actual y estado del corte, por si cambió la hora de cierre).
  useEffect(() => {
    function reanudar() {
      if (document.visibilityState !== 'visible') return;
      api
        .menuVigente()
        .then((m) => {
          // Sin platos = el menú se retiró (día cerrado) o aún no se publica.
          setMenu((actual) => (m?.entradas && actual?.entradas ? { ...actual, ...m } : m));
        })
        .catch(() => {
          // Sin conexión se conserva el último menú y su countdown.
        });
    }
    document.addEventListener('visibilitychange', reanudar);
    return () => document.removeEventListener('visibilitychange', reanudar);
  }, []);

  // Al completar los 4 dígitos se entra solo, sin tener que pulsar "Entrar".
  useEffect(() => {
    if (!comensal && !modoRegistro && pin.length === 4) identificar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pin]);

  function rechazarPin() {
    setSacudirPin(true);
    setPin('');
  }

  function aplicarIdentificacion(datos) {
    setComensal(datos);
    setPedidoHoy(datos.pedido_hoy || null);
    setDeuda(datos.deuda_pendiente || null);
    setExcepcionHoy(Boolean(datos.excepcion_hoy));
  }

  // "Ya pagué" / "Volver a revisar": vuelve a consultar la deuda del
  // comensal y el menú (por si ya se publicó o se registró el pago).
  async function actualizarEstado() {
    setVerificando(true);
    setError('');
    try {
      const [datos, m] = await Promise.all([
        api.identificarPorPin(pinIdentificado.current),
        api.menuVigente(),
      ]);
      aplicarIdentificacion(datos);
      setMenu(m);
    } catch (err) {
      setError(err.message);
    } finally {
      setVerificando(false);
    }
  }

  async function identificar(e) {
    e?.preventDefault();
    if (enviando) return;
    setError('');
    setMensajeId('');
    setEnviando(true);
    try {
      const datos = await api.identificarPorPin(pin);
      pinIdentificado.current = pin;
      aplicarIdentificacion(datos);
      setRecienRegistrado(false);
      setPin('');
    } catch (err) {
      // El backend consultó la base y confirmó que el PIN no existe: no es
      // un error, es alguien nuevo. Se ofrece el registro con ese mismo PIN.
      // Cualquier otro fallo (incluido un 404 sin este código) se muestra
      // como error.
      if (err.codigo === 'PIN_NO_REGISTRADO') {
        setModoRegistro(true);
        setMensajeId('¡Te damos la bienvenida! Es tu primera vez por aquí: dinos tu nombre y listo.');
      } else {
        setError(err.message);
        rechazarPin();
      }
    } finally {
      setEnviando(false);
    }
  }

  async function registrar(e) {
    e.preventDefault();
    setError('');
    setEnviando(true);
    try {
      const datos = await api.registrarComensal(nombre, pin);
      pinIdentificado.current = pin;
      setComensal(datos);
      // Recién registrado: aún no tiene pedido de hoy ni deudas.
      setPedidoHoy(null);
      setDeuda(null);
      setExcepcionHoy(false);
      setRecienRegistrado(false);
      setModoRegistro(false);
      // Se retira el aviso de bienvenida.
      setMensajeId('');
      setNombre('');
      setPin('');
    } catch (err) {
      setError(err.message);
      setSacudirPin(true);
    } finally {
      setEnviando(false);
    }
  }

  function volverAPin() {
    setModoRegistro(false);
    setMensajeId('');
    setError('');
    setPin('');
    setNombre('');
  }

  async function confirmarPedido(e) {
    e.preventDefault();
    setErrorPedido('');
    if (!entrada) {
      setErrorPedido('Selecciona una entrada.');
      return;
    }
    if (!soloEntrada && !fondo) {
      setErrorPedido('Selecciona un fondo o marca "Solo entradas".');
      return;
    }
    setEnviando(true);
    try {
      const pedido = await api.crearPedido(
        comensal.id,
        entrada,
        soloEntrada ? null : fondo,
        instrucciones.trim() || null
      );
      setPedidoHoy(pedido);
      setRecienRegistrado(true);
      setEntrada('');
      setFondo('');
      setSoloEntrada(false);
      setInstrucciones('');
    } catch (err) {
      // La deuda apareció (o se retiró la excepción) mientras elegía: se
      // reemplaza el formulario por el aviso de deuda.
      if (err.codigo === 'DEUDA_PENDIENTE') {
        setDeuda(err.datos.deuda);
        setExcepcionHoy(false);
      } else {
        setErrorPedido(err.message);
      }
    } finally {
      setEnviando(false);
    }
  }

  function cambiarComensal() {
    pinIdentificado.current = '';
    setComensal(null);
    setPedidoHoy(null);
    setDeuda(null);
    setExcepcionHoy(false);
    setRecienRegistrado(false);
    setMensajeId('');
    setError('');
    setErrorPedido('');
    setEntrada('');
    setFondo('');
    setSoloEntrada(false);
    setInstrucciones('');
  }

  if (cargandoMenu) return <PantallaCargando />;

  // El día sigue aceptando pedidos si el servidor lo dice y el countdown
  // local no llegó a cero (la hora de cierre ya pasó en esta pantalla).
  const pedidosAbiertos =
    Boolean(menu?.pedidos_abiertos) && !(restante !== null && restante <= 0);
  // Sin platos el menú de hoy aún no se publica o el día ya se cerró.
  const hayMenu = Boolean(menu?.entradas);
  const sinPublicar = menu?.estado === 'sin_publicar';
  const bloqueadoPorDeuda = Boolean(deuda) && !excepcionHoy;
  const mostrarCountdown =
    Boolean(menu?.hora_cierre) && pedidosAbiertos && restante !== null && restante > 0;
  const mensajeCierre = menu?.dia_cerrado
    ? 'El día ya fue cerrado. Ya no se aceptan más pedidos.'
    : `Los pedidos de hoy están cerrados${
        menu?.hora_cierre ? ` (cierre a ${menu.hora_cierre})` : ''
      }. Ya no se aceptan más pedidos.`;

  const nivelCountdown =
    restante !== null && restante <= AVISO_URGENTE
      ? 'urgente'
      : restante !== null && restante <= AVISO_PRONTO
        ? 'pronto'
        : '';
  const fraccionBarra =
    restante !== null ? Math.min(1, restante / VENTANA_BARRA) : 0;

  // Pasos del pedido: el "actual" es el primero sin completar.
  const pasoEntrada = Boolean(entrada);
  const pasoFondo = soloEntrada || Boolean(fondo);
  const pasos = [
    ['Entrada', pasoEntrada],
    ['Fondo', pasoFondo],
    ['Confirmar', false],
  ];
  const indiceActual = pasos.findIndex(([, hecho]) => !hecho);
  const resumenEleccion = [entrada, soloEntrada ? 'solo entrada' : fondo]
    .filter(Boolean)
    .join(' + ');

  // Clave del paso: al cambiar, la tarjeta se monta de nuevo y anima su entrada.
  const pasoTarjeta = comensal ? 'pedido' : modoRegistro ? 'registro' : 'pin';

  return (
    <div className="contenedor">
      <header className="marca">
        <span className="marca-icono"><IconoCloche /></span>
        <h1>Almuerzo de la Oficina</h1>
        <p className="marca-sub">Elige tu entrada y fondo del día</p>
      </header>

      {error && (
        <div className="aviso" role="alert">
          <IconoAlerta /> {error}
        </div>
      )}
      {mensajeId && (
        <div className="aviso bienvenida" role="status">
          <IconoSaludo /> {mensajeId}
        </div>
      )}

      {mostrarCountdown && (
        <div className={`countdown ${nivelCountdown}`}>
          <span className="countdown-texto">
            <IconoReloj /> Tiempo restante para pedir · cierre a {menu.hora_cierre}
          </span>
          <span className="countdown-tiempo" aria-hidden="true">
            {formatearRestante(restante)}
          </span>
          <span className="countdown-barra" aria-hidden="true">
            <span style={{ transform: `scaleX(${fraccionBarra})` }} />
          </span>
          <span className="solo-lectura" role="status" aria-live="polite">
            {anuncioCountdown(restante, menu.hora_cierre)}
          </span>
        </div>
      )}

      {/* Menú de hoy aún sin publicar: se avisa desde la entrada y no hay
          countdown. */}
      {!comensal && sinPublicar && (
        <div className="aviso info" role="status">
          <IconoCalendario />
          <span>{MENSAJE_SIN_PUBLICAR}</span>
        </div>
      )}

      {/* Aviso de cierre visible también antes de identificarse: cuando el
          countdown llega a cero la pantalla informa que ya no se pide. */}
      {!comensal && menu && !sinPublicar && !pedidosAbiertos && (
        <div className="aviso info" role="status">
          <IconoCandado />
          <span>{mensajeCierre}</span>
        </div>
      )}

      {!comensal && (
        <section className="tarjeta" key={pasoTarjeta}>
          {!modoRegistro ? (
            <form onSubmit={identificar}>
              <h2>Identifícate con tu PIN</h2>
              <div className="campo">
                <label className="campo-label campo-label-centro" htmlFor="pin">
                  PIN de 4 dígitos
                </label>
                <CampoPin
                  id="pin"
                  valor={pin}
                  onChange={setPin}
                  sacudir={sacudirPin}
                  onFinSacudida={() => setSacudirPin(false)}
                  autoFocus
                  describedBy="pin-ayuda"
                />
                <span className="campo-ayuda campo-ayuda-centro" id="pin-ayuda">
                  ¿Nuevo por aquí? Ingresa tu PIN y te pediremos tu nombre.
                </span>
              </div>
              <button type="submit" className="ancho" disabled={pin.length !== 4 || enviando}>
                {enviando && <Cargando />}
                {enviando ? 'Verificando…' : 'Entrar'}
              </button>
            </form>
          ) : (
            <form onSubmit={registrar}>
              <h2>Regístrate</h2>
              <div className="campo">
                <label className="campo-label" htmlFor="nombre">Tu nombre</label>
                <input
                  id="nombre"
                  type="text"
                  autoComplete="name"
                  placeholder="Ej. María"
                  autoFocus
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                />
              </div>
              <div className="campo">
                <label className="campo-label campo-label-centro" htmlFor="pin-registro">
                  PIN de 4 dígitos
                </label>
                <CampoPin
                  id="pin-registro"
                  valor={pin}
                  onChange={setPin}
                  sacudir={sacudirPin}
                  onFinSacudida={() => setSacudirPin(false)}
                  describedBy="pin-registro-ayuda"
                />
                <span className="campo-ayuda campo-ayuda-centro" id="pin-registro-ayuda">
                  Lo usarás para identificarte la próxima vez. Debe ser único.
                </span>
              </div>
              <button
                type="submit"
                className="ancho"
                disabled={!nombre.trim() || pin.length !== 4 || enviando}
              >
                {enviando && <Cargando />}
                Registrarme
              </button>
              <button type="button" className="secundario ancho espacio-arriba" onClick={volverAPin}>
                Volver
              </button>
            </form>
          )}
        </section>
      )}

      {comensal && (
        <section className="tarjeta" key={pasoTarjeta}>
          <p className="saludo">
            <span>
              ¡Hola, <strong>{comensal.nombre}</strong>!
            </span>
            {menu?.fecha && (
              <span className="saludo-fecha" aria-label="Fecha del menú">
                {fechaLarga(menu.fecha)}
              </span>
            )}
          </p>

          {pedidoHoy && (
            <div className="ticket" role="status">
              <CheckAnimado />
              <h3>{recienRegistrado ? '¡Pedido confirmado!' : 'Tu pedido de hoy'}</h3>
              <p className="ticket-platos">
                <strong>{pedidoHoy.entrada}</strong>
                {pedidoHoy.fondo ? (
                  <>
                    <span className="ticket-mas" aria-hidden="true">+</span>
                    <span className="solo-lectura"> con </span>
                    <strong>{pedidoHoy.fondo}</strong>
                  </>
                ) : (
                  <span className="ticket-nota"> (solo entrada)</span>
                )}
              </p>
              {pedidoHoy.instrucciones && (
                <p className="ticket-nota">“{pedidoHoy.instrucciones}”</p>
              )}
              {recienRegistrado && <p className="ticket-saludo">¡Buen provecho!</p>}
            </div>
          )}

          {/* Monto a pagar: el backend lo envía solo cuando el día cerró
              (corte horario o cierre manual); antes no hay precio. */}
          {pedidoHoy && pedidoHoy.monto != null && (
            <div className="monto-pagar" role="status">
              <span className="monto-etiqueta">Total a pagar</span>
              <span className="monto-valor">S/{Number(pedidoHoy.monto).toFixed(2)}</span>
              <span className="monto-detalle">
                Menú S/{(Number(pedidoHoy.monto) - Number(pedidoHoy.delivery)).toFixed(2)}
                {' + delivery S/'}
                {Number(pedidoHoy.delivery).toFixed(2)}
              </span>
            </div>
          )}

          {pedidoHoy && (
            <p className="nota">
              Cada persona puede pedir un solo menú al día. Si necesitas
              cambiar tu pedido, pídele ayuda al administrador.
            </p>
          )}

          {/* Deuda de días anteriores sin excepción: va antes que cualquier
              otro aviso, así se entera aunque el menú aún no se publique. */}
          {!pedidoHoy && bloqueadoPorDeuda && (
            <>
              <div className="deuda" role="alert">
                <span className="deuda-titulo">
                  <IconoAlerta /> Tienes una deuda pendiente
                </span>
                <span className="monto-valor">S/{deuda.total.toFixed(2)}</span>
                <ul className="deuda-lista">
                  {deuda.detalle.map((d) => (
                    <li key={d.id}>
                      <span>
                        {fechaCorta(d.fecha)} · {d.entrada}
                        {d.fondo ? ` + ${d.fondo}` : ' (solo entrada)'}
                      </span>
                      <strong>S/{d.monto.toFixed(2)}</strong>
                    </li>
                  ))}
                </ul>
                <p className="deuda-texto">
                  Para hacer tu pedido de hoy debes cancelarla con el administrador.
                </p>
              </div>
              <button className="ancho" onClick={actualizarEstado} disabled={verificando}>
                {verificando && <Cargando />}
                {verificando ? 'Verificando…' : 'Ya pagué, verificar de nuevo'}
              </button>
            </>
          )}

          {!pedidoHoy && !bloqueadoPorDeuda && sinPublicar && (
            <>
              <div className="aviso info" role="status">
                <IconoCalendario />
                <span>{MENSAJE_SIN_PUBLICAR}</span>
              </div>
              <button className="ancho" onClick={actualizarEstado} disabled={verificando}>
                {verificando && <Cargando />}
                {verificando ? 'Revisando…' : 'Volver a revisar'}
              </button>
            </>
          )}

          {!pedidoHoy && !bloqueadoPorDeuda && menu && !sinPublicar && !pedidosAbiertos && (
            <div className="aviso info" role="status">
              <IconoCandado />
              <span>{mensajeCierre}</span>
            </div>
          )}

          {!pedidoHoy && !bloqueadoPorDeuda && hayMenu && pedidosAbiertos && deuda && (
            <div className="aviso info" role="status">
              <IconoAlerta />
              <span>
                Tienes una deuda acumulada de S/{deuda.total.toFixed(2)}. El
                administrador te autorizó a pedir hasta que pagues; este pedido
                se sumará a lo que debes.
              </span>
            </div>
          )}

          {!pedidoHoy && !bloqueadoPorDeuda && hayMenu && pedidosAbiertos && (
            <form onSubmit={confirmarPedido}>
              <ol className="pasos" aria-label="Pasos del pedido">
                {pasos.map(([etiqueta, hecho], i) => (
                  <li
                    key={etiqueta}
                    className={`paso ${hecho ? 'hecho' : ''} ${i === indiceActual ? 'actual' : ''}`}
                    aria-current={i === indiceActual ? 'step' : undefined}
                  >
                    <span className="paso-num" aria-hidden="true">
                      {hecho ? '✓' : i + 1}
                    </span>
                    <span>{etiqueta}</span>
                    {hecho && <span className="solo-lectura"> (listo)</span>}
                  </li>
                ))}
              </ol>

              <fieldset className="grupo-platos">
                <legend>Elige tu entrada</legend>
                <div className="lista radio">
                  {menu.entradas.map((op, i) => (
                    <label key={op} className="opcion" style={{ '--i': i }}>
                      <input
                        type="radio"
                        name="entrada"
                        checked={entrada === op}
                        onChange={() => setEntrada(op)}
                      />
                      {op}
                    </label>
                  ))}
                </div>
              </fieldset>

              <label className="opcion sola">
                <input
                  type="checkbox"
                  checked={soloEntrada}
                  onChange={(e) => {
                    setSoloEntrada(e.target.checked);
                    if (e.target.checked) setFondo('');
                  }}
                />
                Solo entradas (sin fondo)
              </label>

              {/* El bloque de fondos se pliega con animación en vez de
                  desaparecer; plegado queda inerte para teclado y lectores. */}
              <div
                className={`plegable ${soloEntrada ? 'cerrado' : ''}`}
                {...(soloEntrada ? { inert: '', 'aria-hidden': true } : {})}
              >
                <div>
                  <fieldset className="grupo-platos">
                    <legend>Elige tu fondo</legend>
                    <div className="lista radio">
                      {menu.fondos.map((op, i) => (
                        <label key={op} className="opcion" style={{ '--i': i }}>
                          <input
                            type="radio"
                            name="fondo"
                            checked={fondo === op}
                            onChange={() => setFondo(op)}
                          />
                          {op}
                        </label>
                      ))}
                    </div>
                  </fieldset>
                </div>
              </div>

              <div className="campo">
                <label className="campo-label" htmlFor="instrucciones">
                  Instrucciones adicionales (opcional)
                </label>
                <textarea
                  id="instrucciones"
                  className="texto-normal"
                  rows={2}
                  maxLength={300}
                  placeholder="Ej. sin cebolla, poco picante…"
                  value={instrucciones}
                  onChange={(e) => setInstrucciones(e.target.value)}
                  aria-describedby="instrucciones-ayuda"
                />
                <span className="campo-ayuda" id="instrucciones-ayuda">
                  Se verá junto a tu pedido en la lista del día.
                </span>
              </div>

              <div className="cta-fija">
                {errorPedido && (
                  <div className="aviso" role="alert">
                    <IconoAlerta /> {errorPedido}
                  </div>
                )}
                <p className="cta-resumen" aria-live="polite">
                  {resumenEleccion ? (
                    <>Tu elección: <strong>{resumenEleccion}</strong></>
                  ) : (
                    'Elige tu entrada para empezar'
                  )}
                </p>
                <button
                  type="submit"
                  className="ancho"
                  disabled={!entrada || (!soloEntrada && !fondo) || enviando}
                >
                  {enviando && <Cargando />}
                  {enviando ? 'Enviando…' : 'Confirmar pedido'}
                </button>
              </div>
            </form>
          )}

          <button className="secundario ancho espacio-arriba" onClick={cambiarComensal}>
            Cambiar de comensal
          </button>
        </section>
      )}
    </div>
  );
}
