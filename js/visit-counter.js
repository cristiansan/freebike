import { registrarVisita, obtenerNumeroVisitas } from './firebase.js';

class VisitCounter {
  constructor() {
    this.visitCountElement = null;
    this.isInitialized = false;
  }

  // Inicializar el contador de visitas
  async init() {
    console.log('🚀 Inicializando contador de visitas...');
    try {
      // Crear el elemento del contador si no existe
      this.createCounterElement();
      
      // Primero obtener el número actual (antes de registrar la nueva visita)
      console.log('📊 Obteniendo número actual de visitas...');
      const currentCount = await obtenerNumeroVisitas();
      console.log(`📈 Visitas actuales: ${currentCount}`);
      
      // Mostrar el número actual primero
      this.visitCountElement.textContent = `${currentCount.toLocaleString()} visitantes únicos`;
      
      // Registrar la visita actual
      console.log('✍️ Registrando nueva visita...');
      const registroExitoso = await registrarVisita();
      console.log(`✅ Registro de visita: ${registroExitoso ? 'exitoso' : 'falló'}`);
      
      // Obtener y mostrar el número actualizado
      console.log('🔄 Actualizando contador...');
      await this.updateVisitDisplay();
      
      this.isInitialized = true;
      console.log('✅ Contador de visitas inicializado correctamente');
    } catch (error) {
      console.error('❌ Error al inicializar contador de visitas:', error);
      console.error('📋 Detalles del error:', {
        message: error.message,
        code: error.code,
        stack: error.stack
      });
      // Mostrar contador offline si hay error
      this.showOfflineCounter();
    }
  }

  // Crear el elemento HTML del contador
  createCounterElement() {
    const footer = document.querySelector('.app-footer');
    if (!footer) {
      console.warn('⚠️ No se encontró footer (.app-footer)');
      return;
    }

    // Verificar si ya existe el contador
    const existingCounter = document.getElementById('visit-counter');
    if (existingCounter) {
      console.log('🔄 Reutilizando contador existente');
      this.visitCountElement = existingCounter.querySelector('#visit-count-text');
      return;
    }

    console.log('🏗️ Creando elemento del contador...');
    
    // Crear el elemento del contador
    const counterContainer = document.createElement('div');
    counterContainer.id = 'visit-counter';
    counterContainer.className = 'visit-counter';
    
    const counterText = document.createElement('span');
    counterText.id = 'visit-count-text';
    counterText.textContent = 'Cargando visitantes únicos...';
    
    const counterIcon = document.createElement('span');
    counterIcon.innerHTML = '👥';
    counterIcon.style.marginRight = '5px';
    
    counterContainer.appendChild(counterIcon);
    counterContainer.appendChild(counterText);
    
    // Insertar el contador en el footer
    footer.appendChild(counterContainer);
    
    this.visitCountElement = counterText;
    console.log('✅ Elemento del contador creado');
  }

  // Actualizar la visualización del contador
  async updateVisitDisplay() {
    if (!this.visitCountElement) {
      console.warn('⚠️ No hay elemento de contador para actualizar');
      return;
    }

    try {
      console.log('🔍 Obteniendo número actualizado de visitas...');
      const visitCount = await obtenerNumeroVisitas();
      console.log(`📊 Número de visitas obtenido: ${visitCount}`);
      
      const formattedCount = visitCount.toLocaleString();
      this.visitCountElement.textContent = `${formattedCount} visitantes únicos`;
      console.log(`✅ Contador actualizado a: ${formattedCount} visitantes únicos`);
    } catch (error) {
      console.error('❌ Error al actualizar visualización:', error);
      this.visitCountElement.textContent = 'Error al cargar';
    }
  }

  // Mostrar contador offline
  showOfflineCounter() {
    if (!this.visitCountElement) return;
    this.visitCountElement.textContent = 'Contador offline';
    console.log('⚠️ Mostrando contador offline');
  }

  // Método para obtener estadísticas (opcional)
  async getStats() {
    try {
      console.log('📊 Obteniendo estadísticas del contador...');
      const count = await obtenerNumeroVisitas();
      const stats = {
        totalVisits: count,
        isOnline: this.isInitialized
      };
      console.log('📈 Estadísticas:', stats);
      return stats;
    } catch (error) {
      console.error('❌ Error al obtener estadísticas:', error);
      return {
        totalVisits: 0,
        isOnline: false,
        error: error.message
      };
    }
  }

  // Método para debug - verificar estado de Firebase
  async debugFirebase() {
    console.log('🔧 DIAGNÓSTICO DE FIREBASE:');
    try {
      // Importar Firebase para verificar conexión
      const { db } = await import('./firebase.js');
      console.log('✅ Módulo Firebase importado correctamente');
      console.log('🔗 Instancia de DB:', db);
      
      // Verificar si podemos leer
      console.log('📖 Intentando leer contador...');
      const count = await obtenerNumeroVisitas();
      console.log(`📊 Lectura exitosa: ${count} visitas`);
      
      // Verificar si podemos escribir
      console.log('✍️ Intentando registrar visita...');
      const writeResult = await registrarVisita();
      console.log(`✅ Escritura: ${writeResult ? 'exitosa' : 'falló'}`);
      
    } catch (error) {
      console.error('❌ Error en diagnóstico Firebase:', error);
      console.error('📋 Detalles:', {
        message: error.message,
        code: error.code
      });
    }
  }
}

// Crear instancia global
const visitCounter = new VisitCounter();

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  console.log('🌐 DOM cargado, inicializando contador...');
  // Esperar un poco para que otros scripts se carguen
  setTimeout(() => {
    visitCounter.init();
  }, 1000);
});

// Hacer disponible para debug en consola
window.visitCounterDebug = visitCounter;

// Exportar para uso externo si es necesario
export default visitCounter; 