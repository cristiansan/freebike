// js/firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js";
import { getFirestore, collection, addDoc, serverTimestamp, doc, getDoc, setDoc, updateDoc, increment, query, orderBy, limit, getDocs } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyBzG7qc45t37BgbuRD5S-SgRpo52NpSGGA",
    authDomain: "monitor-entrenamiento-1fc15.firebaseapp.com",
    projectId: "monitor-entrenamiento-1fc15",
    storageBucket: "monitor-entrenamiento-1fc15.firebasestorage.app",
    messagingSenderId: "662506260306",
    appId: "1:662506260306:web:a970482d97005557ca5c8b"
};

console.log('🔥 Inicializando Firebase...');
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
console.log('✅ Firebase inicializado correctamente');

// Función para generar ID único de visitante
function generarVisitorId() {
  const existingId = localStorage.getItem('freebike_visitor_id');
  if (existingId) {
    return existingId;
  }
  
  // Generar nuevo ID único
  const newId = 'visitor_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  localStorage.setItem('freebike_visitor_id', newId);
  return newId;
}

// Función para verificar si es una visita nueva (visitante único)
function esVisitaNueva() {
  const visitorId = generarVisitorId();
  const lastVisitKey = 'freebike_last_visit_' + visitorId;
  const lastVisit = localStorage.getItem(lastVisitKey);
  
  if (!lastVisit) {
    // Primera visita de este visitante
    localStorage.setItem(lastVisitKey, Date.now().toString());
    console.log('👤 [esVisitaNueva] Primera visita de este visitante:', visitorId);
    return true;
  }
  
  // Verificar si ha pasado suficiente tiempo (24 horas = 86400000 ms)
  const TIEMPO_ENTRE_VISITAS = 24 * 60 * 60 * 1000; // 24 horas
  const tiempoTranscurrido = Date.now() - parseInt(lastVisit);
  
  if (tiempoTranscurrido > TIEMPO_ENTRE_VISITAS) {
    // Ha pasado más de 24 horas, contar como nueva visita
    localStorage.setItem(lastVisitKey, Date.now().toString());
    console.log('🔄 [esVisitaNueva] Nueva visita después de 24h:', visitorId);
    return true;
  }
  
  console.log('🚫 [esVisitaNueva] Visitante ya contado hoy:', visitorId, 'hace', Math.round(tiempoTranscurrido / 1000 / 60), 'minutos');
  return false;
}

// Función para obtener información del visitante
function obtenerInfoVisitante() {
  const visitorId = generarVisitorId();
  
  const info = {
    visitorId: visitorId,
    timestamp: new Date().toISOString(),
    url: window.location.href,
    referrer: document.referrer || 'Directo',
    userAgent: navigator.userAgent,
    language: navigator.language || navigator.userLanguage,
    screen: {
      width: screen.width,
      height: screen.height
    },
    viewport: {
      width: window.innerWidth,
      height: window.innerHeight
    },
    platform: navigator.platform,
    cookieEnabled: navigator.cookieEnabled,
    onLine: navigator.onLine
  };

  // Detectar dispositivo
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const isTablet = /iPad|Android(?!.*Mobile)/i.test(navigator.userAgent);
  
  if (isMobile) {
    info.deviceType = 'Móvil';
  } else if (isTablet) {
    info.deviceType = 'Tablet';
  } else {
    info.deviceType = 'Escritorio';
  }

  // Detectar navegador
  const browsers = [
    { name: 'Chrome', pattern: /Chrome\/(\d+)/ },
    { name: 'Firefox', pattern: /Firefox\/(\d+)/ },
    { name: 'Safari', pattern: /Safari\/(\d+)/ },
    { name: 'Edge', pattern: /Edg\/(\d+)/ },
    { name: 'Opera', pattern: /OPR\/(\d+)/ }
  ];

  for (const browser of browsers) {
    const match = navigator.userAgent.match(browser.pattern);
    if (match) {
      info.browser = `${browser.name} ${match[1]}`;
      break;
    }
  }

  if (!info.browser) {
    info.browser = 'Desconocido';
  }

  // Analizar referrer
  if (info.referrer && info.referrer !== 'Directo') {
    try {
      const referrerUrl = new URL(info.referrer);
      info.referrerDomain = referrerUrl.hostname;
      
      // Detectar fuentes conocidas
      const socialMedia = ['facebook.com', 'twitter.com', 'instagram.com', 'linkedin.com', 'youtube.com'];
      const searchEngines = ['google.com', 'bing.com', 'yahoo.com', 'duckduckgo.com'];
      
      if (socialMedia.some(social => referrerUrl.hostname.includes(social))) {
        info.trafficSource = 'Redes Sociales';
      } else if (searchEngines.some(search => referrerUrl.hostname.includes(search))) {
        info.trafficSource = 'Buscadores';
      } else if (referrerUrl.hostname.includes('github.com')) {
        info.trafficSource = 'GitHub';
      } else {
        info.trafficSource = 'Referral';
      }
    } catch (e) {
      info.referrerDomain = 'URL inválida';
      info.trafficSource = 'Referral';
    }
  } else {
    info.trafficSource = 'Directo';
    info.referrerDomain = 'N/A';
  }

  return info;
}

// Función para registrar una visita detallada (solo si es visitante único)
async function registrarVisitaDetallada() {
  console.log('📝 [registrarVisitaDetallada] Iniciando registro detallado...');
  try {
    const infoVisitante = obtenerInfoVisitante();
    console.log('📊 [registrarVisitaDetallada] Información del visitante:', infoVisitante);

    // Registrar la visita individual (siempre, para analytics detallados)
    await addDoc(collection(db, 'visitas'), {
      ...infoVisitante,
      timestamp: serverTimestamp(),
      isUniqueVisitor: esVisitaNueva() // Marcar si es visitante único
    });
    
    console.log('✅ [registrarVisitaDetallada] Visita detallada registrada');
    return true;
  } catch (error) {
    console.error('❌ [registrarVisitaDetallada] Error:', error);
    return false;
  }
}

// Función para registrar una visita única
async function registrarVisita() {
  console.log('📝 [registrarVisita] Iniciando registro de visita...');
  
  // Verificar si es una visita nueva (visitante único)
  const esNuevaVisita = esVisitaNueva();
  
  if (!esNuevaVisita) {
    console.log('🚫 [registrarVisita] Visitante ya contado, no incrementar contador');
    // Aún así registrar la visita detallada para analytics
    await registrarVisitaDetallada();
    return true;
  }
  
  try {
    const visitCounterRef = doc(db, 'stats', 'visitCounter');
    console.log('🎯 [registrarVisita] Referencia creada:', visitCounterRef.path);
    
    // Registrar visita detallada en paralelo
    registrarVisitaDetallada();
    
    // Intentar incrementar el contador de visitantes únicos
    console.log('⬆️ [registrarVisita] Incrementando contador de visitantes únicos...');
    await updateDoc(visitCounterRef, {
      uniqueVisitors: increment(1),
      lastVisit: serverTimestamp()
    });
    
    console.log('✅ [registrarVisita] Visitante único registrado exitosamente');
    return true;
  } catch (error) {
    console.log('⚠️ [registrarVisita] Error al actualizar, verificando si documento existe...');
    console.error('📋 [registrarVisita] Detalles del error:', {
      code: error.code,
      message: error.message
    });
    
    // Si el documento no existe, crearlo
    if (error.code === 'not-found') {
      try {
        console.log('🆕 [registrarVisita] Documento no existe, creando nuevo...');
        const visitCounterRef = doc(db, 'stats', 'visitCounter');
        await setDoc(visitCounterRef, {
          uniqueVisitors: 1,
          lastVisit: serverTimestamp(),
          created: serverTimestamp()
        });
        
        // También registrar la visita detallada
        await registrarVisitaDetallada();
        
        console.log('✅ [registrarVisita] Contador de visitantes únicos inicializado con valor 1');
        return true;
      } catch (createError) {
        console.error('❌ [registrarVisita] Error al crear el contador:', createError);
        console.error('📋 [registrarVisita] Detalles del error de creación:', {
          code: createError.code,
          message: createError.message
        });
        return false;
      }
    } else {
      console.error('❌ [registrarVisita] Error no manejado:', error);
      return false;
    }
  }
}

// Función para obtener el número de visitantes únicos
async function obtenerNumeroVisitas() {
  console.log('📊 [obtenerNumeroVisitas] Obteniendo número de visitantes únicos...');
  try {
    const visitCounterRef = doc(db, 'stats', 'visitCounter');
    console.log('🎯 [obtenerNumeroVisitas] Referencia creada:', visitCounterRef.path);
    
    console.log('🔍 [obtenerNumeroVisitas] Ejecutando getDoc...');
    const docSnap = await getDoc(visitCounterRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      console.log('📄 [obtenerNumeroVisitas] Documento encontrado:', data);
      const count = data.uniqueVisitors || data.count || 0; // Compatibilidad con versión anterior
      console.log(`✅ [obtenerNumeroVisitas] Número de visitantes únicos: ${count}`);
      return count;
    } else {
      console.log('📭 [obtenerNumeroVisitas] Documento no existe, retornando 0');
      return 0;
    }
  } catch (error) {
    console.error('❌ [obtenerNumeroVisitas] Error al obtener número de visitantes:', error);
    console.error('📋 [obtenerNumeroVisitas] Detalles del error:', {
      code: error.code,
      message: error.message
    });
    return 0;
  }
}

// Función para obtener estadísticas de visitas
async function obtenerEstadisticasVisitas(limite = 100) {
  console.log('📈 [obtenerEstadisticasVisitas] Obteniendo estadísticas...');
  try {
    const q = query(
      collection(db, 'visitas'),
      orderBy('timestamp', 'desc'),
      limit(limite)
    );
    
    const snapshot = await getDocs(q);
    const visitas = [];
    
    snapshot.forEach((doc) => {
      visitas.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    console.log(`📊 [obtenerEstadisticasVisitas] ${visitas.length} visitas obtenidas`);
    return visitas;
  } catch (error) {
    console.error('❌ [obtenerEstadisticasVisitas] Error:', error);
    return [];
  }
}

// Función para obtener resumen de tráfico (solo visitantes únicos)
async function obtenerResumenTrafico() {
  try {
    const visitas = await obtenerEstadisticasVisitas(1000); // Últimas 1000 visitas
    
    // Filtrar solo visitantes únicos para el resumen principal
    const visitantesUnicos = visitas.filter(visita => visita.isUniqueVisitor !== false);
    
    const resumen = {
      total: visitantesUnicos.length,
      totalPageViews: visitas.length, // Total de page views para referencia
      porFuente: {},
      porDispositivo: {},
      porNavegador: {},
      porPagina: {},
      porDia: {}
    };
    
    visitantesUnicos.forEach(visita => {
      // Por fuente de tráfico
      const fuente = visita.trafficSource || 'Desconocido';
      resumen.porFuente[fuente] = (resumen.porFuente[fuente] || 0) + 1;
      
      // Por tipo de dispositivo
      const dispositivo = visita.deviceType || 'Desconocido';
      resumen.porDispositivo[dispositivo] = (resumen.porDispositivo[dispositivo] || 0) + 1;
      
      // Por navegador
      const navegador = visita.browser || 'Desconocido';
      resumen.porNavegador[navegador] = (resumen.porNavegador[navegador] || 0) + 1;
      
      // Por página
      const pagina = visita.url ? new URL(visita.url).pathname : 'Desconocida';
      resumen.porPagina[pagina] = (resumen.porPagina[pagina] || 0) + 1;
      
      // Por día (últimos 7 días)
      if (visita.timestamp) {
        let fecha;
        if (visita.timestamp.toDate) {
          fecha = visita.timestamp.toDate();
        } else {
          fecha = new Date(visita.timestamp);
        }
        const dia = fecha.toISOString().split('T')[0];
        resumen.porDia[dia] = (resumen.porDia[dia] || 0) + 1;
      }
    });
    
    return resumen;
  } catch (error) {
    console.error('❌ [obtenerResumenTrafico] Error:', error);
    return null;
  }
}

// Función para registrar un dispositivo de fitness
async function registrarDispositivo(dispositivo) {
  console.log('📱 [registrarDispositivo] Registrando dispositivo:', dispositivo);
  try {
    const deviceId = generarDeviceId(dispositivo);
    const deviceRef = doc(db, 'dispositivos', deviceId);
    
    // Verificar si el dispositivo ya existe
    const docSnap = await getDoc(deviceRef);
    
    if (docSnap.exists()) {
      // Actualizar última conexión
      await updateDoc(deviceRef, {
        ultimaConexion: serverTimestamp(),
        contadorConexiones: increment(1)
      });
      console.log('✅ [registrarDispositivo] Dispositivo actualizado:', deviceId);
    } else {
      // Crear nuevo registro de dispositivo
      await setDoc(deviceRef, {
        marca: dispositivo.marca || 'Desconocida',
        modelo: dispositivo.modelo || 'Desconocido',
        tipo: dispositivo.tipo || 'Sensor',
        identificador: deviceId,
        visitorId: generarVisitorId(),
        primeraConexion: serverTimestamp(),
        ultimaConexion: serverTimestamp(),
        contadorConexiones: 1,
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        fechaRegistro: new Date().toISOString().split('T')[0]
      });
      console.log('✅ [registrarDispositivo] Nuevo dispositivo creado:', deviceId);
    }
    
    return deviceId;
  } catch (error) {
    console.error('❌ [registrarDispositivo] Error:', error);
    return null;
  }
}

// Función para obtener lista de dispositivos registrados
async function obtenerDispositivos() {
  console.log('📱 [obtenerDispositivos] Obteniendo lista de dispositivos...');
  try {
    const dispositivosRef = collection(db, 'dispositivos');
    const q = query(dispositivosRef, orderBy('ultimaConexion', 'desc'));
    const querySnapshot = await getDocs(q);
    
    const dispositivos = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      dispositivos.push({
        id: doc.id,
        ...data,
        primeraConexion: data.primeraConexion?.toDate() || new Date(),
        ultimaConexion: data.ultimaConexion?.toDate() || new Date()
      });
    });

    // Procesar para evitar duplicados y numerar dispositivos similares
    const dispositivosProcesados = procesarDispositivos(dispositivos);
    
    console.log(`✅ [obtenerDispositivos] ${dispositivosProcesados.length} dispositivos obtenidos`);
    return dispositivosProcesados;
  } catch (error) {
    console.error('❌ [obtenerDispositivos] Error:', error);
    return [];
  }
}

// Función para generar ID único de dispositivo
function generarDeviceId(dispositivo) {
  const baseId = `${dispositivo.marca}-${dispositivo.modelo}`.toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  
  // Agregar hash del userAgent para distinguir dispositivos similares de diferentes usuarios
  const userHash = btoa(navigator.userAgent + navigator.platform).slice(0, 8);
  
  return `${baseId}-${userHash}`;
}

// Función para procesar dispositivos y evitar duplicados visuales
function procesarDispositivos(dispositivos) {
  const agrupados = {};
  const procesados = [];
  
  // Agrupar por marca y modelo
  dispositivos.forEach(dispositivo => {
    const clave = `${dispositivo.marca}-${dispositivo.modelo}`;
    if (!agrupados[clave]) {
      agrupados[clave] = [];
    }
    agrupados[clave].push(dispositivo);
  });
  
  // Procesar cada grupo
  Object.keys(agrupados).forEach(clave => {
    const grupo = agrupados[clave];
    
    if (grupo.length === 1) {
      // Solo un dispositivo de este tipo
      procesados.push({
        ...grupo[0],
        displayName: grupo[0].modelo,
        estado: determinarEstadoDispositivo(grupo[0])
      });
    } else {
      // Múltiples dispositivos del mismo tipo
      grupo.forEach((dispositivo, index) => {
        procesados.push({
          ...dispositivo,
          displayName: `${dispositivo.modelo} #${index + 1}`,
          estado: determinarEstadoDispositivo(dispositivo)
        });
      });
    }
  });
  
  // Ordenar por última conexión
  procesados.sort((a, b) => b.ultimaConexion - a.ultimaConexion);
  
  return procesados;
}

// Función para determinar el estado de un dispositivo
function determinarEstadoDispositivo(dispositivo) {
  const ahora = new Date();
  const ultimaConexion = dispositivo.ultimaConexion;
  const diferencia = ahora - ultimaConexion;
  
  // Si la última conexión fue hace menos de 1 hora, considerarlo online
  if (diferencia < 60 * 60 * 1000) {
    return 'online';
  } else {
    return 'offline';
  }
}

// Función para detectar dispositivos conectados (simulada)
function detectarDispositivosConectados() {
  // Esta función simula la detección de dispositivos
  // En una implementación real, se conectaría con la Web Bluetooth API
  // o leerían datos de sensores ANT+/Bluetooth Low Energy
  
  const dispositivosComunes = [
    { marca: 'Garmin', modelo: 'Edge 530', tipo: 'Ciclocomputador' },
    { marca: 'Wahoo', modelo: 'ELEMNT BOLT', tipo: 'Ciclocomputador' },
    { marca: 'Sigma', modelo: 'ROX 12.0', tipo: 'Ciclocomputador' },
    { marca: 'Polar', modelo: 'H10', tipo: 'Sensor de Frecuencia Cardíaca' },
    { marca: 'Garmin', modelo: 'Rally XC100', tipo: 'Potenciómetro' },
    { marca: 'Wahoo', modelo: 'TICKR', tipo: 'Sensor de Frecuencia Cardíaca' }
  ];
  
  // Por ahora, retornamos un array vacío
  // En el futuro, esta función detectaría dispositivos reales
  return [];
}

// ============================================
// FUNCIONES DE AUTENTICACIÓN
// ============================================

// Función para iniciar sesión
async function iniciarSesion(email, password) {
  console.log('🔐 [iniciarSesion] Intentando iniciar sesión...');
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    console.log('✅ [iniciarSesion] Sesión iniciada correctamente:', user.email);
    return { success: true, user: user };
  } catch (error) {
    console.error('❌ [iniciarSesion] Error:', error);
    let mensaje = 'Error desconocido';
    
    switch (error.code) {
      case 'auth/user-not-found':
        mensaje = 'Usuario no encontrado';
        break;
      case 'auth/wrong-password':
        mensaje = 'Contraseña incorrecta';
        break;
      case 'auth/invalid-email':
        mensaje = 'Email inválido';
        break;
      case 'auth/user-disabled':
        mensaje = 'Usuario deshabilitado';
        break;
      case 'auth/too-many-requests':
        mensaje = 'Demasiados intentos. Intenta más tarde';
        break;
      case 'auth/invalid-credential':
        mensaje = 'Credenciales inválidas';
        break;
      default:
        mensaje = error.message;
    }
    
    return { success: false, error: mensaje };
  }
}

// Función para cerrar sesión
async function cerrarSesion() {
  console.log('🚪 [cerrarSesion] Cerrando sesión...');
  try {
    await signOut(auth);
    console.log('✅ [cerrarSesion] Sesión cerrada correctamente');
    return { success: true };
  } catch (error) {
    console.error('❌ [cerrarSesion] Error:', error);
    return { success: false, error: error.message };
  }
}

// Función para obtener el usuario actual
function obtenerUsuarioActual() {
  return auth.currentUser;
}

// Función para verificar si el usuario está autenticado
function estaAutenticado() {
  return auth.currentUser !== null;
}

// Función para escuchar cambios en el estado de autenticación
function escucharCambiosAuth(callback) {
  return onAuthStateChanged(auth, callback);
}

// Función para crear un nuevo usuario (solo para admin)
async function crearUsuario(email, password) {
  console.log('👤 [crearUsuario] Creando nuevo usuario...');
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    console.log('✅ [crearUsuario] Usuario creado correctamente:', user.email);
    return { success: true, user: user };
  } catch (error) {
    console.error('❌ [crearUsuario] Error:', error);
    let mensaje = 'Error desconocido';
    
    switch (error.code) {
      case 'auth/email-already-in-use':
        mensaje = 'El email ya está en uso';
        break;
      case 'auth/weak-password':
        mensaje = 'La contraseña es demasiado débil';
        break;
      case 'auth/invalid-email':
        mensaje = 'Email inválido';
        break;
      default:
        mensaje = error.message;
    }
    
    return { success: false, error: mensaje };
  }
}

// Función para verificar si el usuario es administrador
async function esUsuarioAdmin(user) {
  if (!user) return false;
  
  try {
    // Verificar en la base de datos si el usuario es admin
    const adminRef = doc(db, 'admins', user.uid);
    const adminSnap = await getDoc(adminRef);
    
    return adminSnap.exists();
  } catch (error) {
    console.error('❌ [esUsuarioAdmin] Error:', error);
    return false;
  }
}

export { 
  db, 
  auth,
  registrarVisita, 
  obtenerNumeroVisitas, 
  obtenerEstadisticasVisitas, 
  obtenerResumenTrafico,
  registrarDispositivo,
  obtenerDispositivos,
  detectarDispositivosConectados,
  iniciarSesion,
  cerrarSesion,
  obtenerUsuarioActual,
  estaAutenticado,
  escucharCambiosAuth,
  crearUsuario,
  esUsuarioAdmin
};

