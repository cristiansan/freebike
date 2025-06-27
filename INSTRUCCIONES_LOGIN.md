# 🔐 Instrucciones para el Sistema de Login

## ⚠️ **PROBLEMA DETECTADO: Loop Infinito**

Si experimentas un loop infinito al intentar hacer login, es porque **Firebase Authentication no está configurado** en tu proyecto.

## 🛠️ **Solución: Configurar Firebase Authentication**

### 1. **Ir a la Consola de Firebase**
- Ve a: https://console.firebase.google.com/
- Selecciona tu proyecto: `monitor-entrenamiento-1fc15`

### 2. **Activar Authentication**
- En el menú lateral, haz clic en **"Authentication"**
- Ve a la pestaña **"Sign-in method"**
- Haz clic en **"Email/Password"** 
- **Activa** la opción "Email/Password"
- Guarda los cambios

### 3. **Crear tu Primera Cuenta**

#### **Opción A: Desde la Consola Firebase (Recomendado)**
- En Firebase Console → Authentication → Users
- Haz clic en **"Add user"**
- Email: `admin@freebike.com`
- Password: `freebike123`
- Haz clic en **"Add user"**

#### **Opción B: Desde la Página de Login**
1. Ve a `login.html`
2. Haz clic en **"🧪 Usar Credenciales de Prueba"**
3. Haz clic en **"👤 Crear Cuenta Admin"**
4. Después haz clic en **"🚀 Acceder al Panel"**

## 🧪 **Probar el Sistema**

### **Credenciales de Prueba:**
- **Email:** `admin@freebike.com`
- **Password:** `freebike123`

### **Pasos para Probar:**
1. Abre `login.html`
2. Verás información de debug en pantalla
3. Haz clic en **"🧪 Usar Credenciales de Prueba"**
4. Haz clic en **"🚀 Acceder al Panel"**
5. Si todo está bien, serás redirigido al Panel de Control

## 🐛 **Información de Debug**

La página ahora muestra información de debug que te ayudará a identificar problemas:

- ✅ **Verde:** Todo funciona correctamente
- ❌ **Rojo:** Hay un error
- 🔄 **Azul:** Proceso en curso

### **Mensajes Comunes:**

- `🔍 Verificando autenticación...` - Normal al cargar
- `❌ Usuario no autenticado` - Normal si no hay sesión activa
- `🔐 Intentando iniciar sesión...` - Normal al hacer login
- `✅ Login exitoso, esperando y redirigiendo...` - ¡Perfecto!
- `❌ Login fallido: Usuario no encontrado` - **Crear cuenta primero**
- `❌ Login fallido: Credenciales inválidas` - **Verificar email/password**

## 🔧 **Configuración Adicional (Opcional)**

### **Reglas de Firestore para el Panel de Control:**
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Permitir lectura/escritura en todas las colecciones
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

### **Configuraciones de Firebase:**
- **Authentication:** Email/Password activado
- **Firestore:** Modo de prueba (reglas abiertas)
- **Hosting:** Para GitHub Pages (opcional)

## 📞 **¿Necesitas Ayuda?**

Si sigues teniendo problemas:

1. **Revisa la consola del navegador** (F12 → Console)
2. **Verifica que Firebase Authentication esté activado**
3. **Asegúrate de tener conexión a internet**
4. **Prueba crear la cuenta desde Firebase Console**

## ✅ **Checklist de Verificación**

- [ ] Firebase Authentication activado
- [ ] Método Email/Password habilitado
- [ ] Usuario `admin@freebike.com` creado
- [ ] Conexión a internet estable
- [ ] JavaScript habilitado en el navegador

¡Una vez configurado, el sistema funcionará perfectamente! 