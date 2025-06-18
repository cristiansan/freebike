# 🔧 Solución de Problemas - FreeBike

## Problema: stats.html no muestra datos

### Pasos para diagnosticar:

1. **Verificar conexión a Firebase**
   - Abre `test-firebase.html` en tu navegador
   - Haz clic en "🔗 Probar conexión"
   - Si hay errores, verifica tu conexión a internet

2. **Verificar reglas de Firebase**
   - Ve a la consola de Firebase (https://console.firebase.google.com)
   - Selecciona tu proyecto "monitor-entrenamiento-1fc15"
   - Ve a Firestore Database > Rules
   - Asegúrate de que las reglas permitan lectura y escritura:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;  // Para desarrollo
    }
  }
}
```

3. **Verificar datos en Firebase**
   - En la consola de Firebase, ve a Firestore Database
   - Busca la colección "sesiones"
   - Verifica que haya documentos con datos

4. **Verificar consola del navegador**
   - Abre las herramientas de desarrollador (F12)
   - Ve a la pestaña Console
   - Busca errores relacionados con Firebase

### Problemas comunes:

#### 1. Error de CORS
```
Access to fetch at 'https://firestore.googleapis.com/...' from origin '...' has been blocked by CORS policy
```
**Solución**: Verifica que estés usando HTTPS o localhost

#### 2. Error de autenticación
```
FirebaseError: Missing or insufficient permissions
```
**Solución**: Verifica las reglas de Firestore

#### 3. Error de red
```
FirebaseError: Failed to fetch
```
**Solución**: Verifica tu conexión a internet

#### 4. No hay datos
```
No se encontraron sesiones registradas
```
**Solución**: 
- Completa una sesión de entrenamiento primero
- Verifica que los datos se guarden correctamente
- Espera unos segundos y recarga la página

### Comandos útiles:

1. **Limpiar caché del navegador**: Ctrl+Shift+R (Windows/Linux) o Cmd+Shift+R (Mac)

2. **Verificar en modo incógnito**: Abre una ventana de incógnito y prueba

3. **Verificar en diferentes navegadores**: Chrome, Firefox, Safari

### Archivos importantes:

- `js/firebase.js` - Configuración de Firebase
- `js/stats.js` - Lógica para cargar estadísticas
- `js/main.js` - Lógica para guardar sesiones
- `test-firebase.html` - Herramienta de diagnóstico

### Contacto:

Si el problema persiste, verifica:
1. La consola del navegador para errores específicos
2. Los logs en `test-firebase.html`
3. Las reglas de Firestore en la consola de Firebase 