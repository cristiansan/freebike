# Aplicación de Sensores de Ciclismo

Una aplicación web responsive que utiliza la Web Bluetooth API para conectarse a sensores de ciclismo y mostrar datos en tiempo real.

## Características

- **Interfaz responsive**: Funciona perfectamente en dispositivos móviles y computadoras
- **Conexión Bluetooth**: Se conecta a sensores de frecuencia cardíaca, cadencia y potencia
- **Visualización en tiempo real**: Muestra datos en una grilla clara y fácil de leer
- **Grabación de datos**: Permite iniciar/detener la grabación de sesiones
- **Exportación CSV**: Descarga los datos registrados en formato CSV
- **Diseño moderno**: Interfaz atractiva con animaciones y efectos visuales

## Datos Mostrados

1. **Frecuencia Cardíaca** (bpm)
2. **Potencia** (watts)
3. **Cadencia** (rpm)
4. **Distancia** (km) - calculada automáticamente
5. **Velocidad** (km/h) - calculada automáticamente
6. **Tiempo de sesión** (h:m:s)

## Requisitos

- **Navegador compatible**: Chrome, Edge u otro navegador que soporte Web Bluetooth API
- **Dispositivos Bluetooth**: Sensores de ciclismo compatibles con los protocolos estándar:
  - Heart Rate Service (0x180D)
  - Cycling Speed and Cadence Service (0x1816)
  - Cycling Power Service (0x1818)

## Uso

1. **Abrir la aplicación**: Abre `index.html` en un navegador compatible
2. **Conectar sensores**: 
   - Haz clic en "Conectar Sensores"
   - Selecciona qué tipos de sensores quieres conectar
   - Haz clic en "Buscar Dispositivos"
   - Selecciona tus sensores de la lista que aparece
3. **Iniciar grabación**:
   - Una vez conectados los sensores, haz clic en "Iniciar Grabación"
   - Los datos comenzarán a registrarse automáticamente
4. **Detener y descargar**:
   - Haz clic en "Detener Grabación" cuando termines
   - Haz clic en "Descargar CSV" para obtener los datos

## Estructura de Archivos

```
cycling-sensors-app/
├── index.html          # Archivo principal HTML
├── styles.css          # Estilos CSS responsive
├── script.js           # Lógica JavaScript y Web Bluetooth API
└── README.md           # Este archivo
```

## Funcionalidades Técnicas

### Web Bluetooth API
- Búsqueda automática de dispositivos Bluetooth LE
- Conexión a múltiples sensores simultáneamente
- Lectura de características en tiempo real
- Manejo de desconexiones automáticas

### Cálculos Automáticos
- **Velocidad**: Calculada basada en la cadencia y circunferencia de rueda (2.1m)
- **Distancia**: Acumulada durante la sesión de grabación
- **Tiempo**: Cronómetro automático durante la grabación

### Exportación de Datos
El archivo CSV incluye las siguientes columnas:
- Timestamp (ISO 8601)
- Frecuencia Cardíaca (bpm)
- Cadencia (rpm)
- Potencia (watts)
- Velocidad (km/h)
- Distancia (km)

## Compatibilidad

### Navegadores Soportados
- ✅ Chrome 56+
- ✅ Edge 79+
- ✅ Opera 43+
- ❌ Firefox (no soporta Web Bluetooth API)
- ❌ Safari (no soporta Web Bluetooth API)

### Dispositivos
- ✅ Computadoras con Bluetooth 4.0+
- ✅ Teléfonos Android con Chrome
- ❌ iPhone/iPad (Safari no soporta Web Bluetooth)

## Solución de Problemas

### "Tu navegador no soporta Web Bluetooth API"
- Usa Chrome, Edge u Opera
- Asegúrate de que el navegador esté actualizado
- En Android, usa Chrome como navegador

### No se encuentran dispositivos
- Verifica que el Bluetooth esté activado
- Asegúrate de que los sensores estén en modo de emparejamiento
- Los sensores deben estar cerca del dispositivo (< 10 metros)

### Datos no se actualizan
- Verifica la conexión Bluetooth
- Reinicia los sensores si es necesario
- Recarga la página y vuelve a conectar

## Desarrollo

La aplicación está construida con:
- **HTML5**: Estructura semántica
- **CSS3**: Diseño responsive con Flexbox y Grid
- **JavaScript ES6+**: Web Bluetooth API y manejo de datos
- **Sin dependencias externas**: Funciona completamente offline una vez cargada

## Licencia

Este proyecto es de código abierto y puede ser modificado según tus necesidades.
