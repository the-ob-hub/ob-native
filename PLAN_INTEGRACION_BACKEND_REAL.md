# Plan de Integración Backend Real - Paso a Paso

## 📋 Información del Backend Real

### Servidor Base
- **URL**: `http://ec2-34-224-57-79.compute-1.amazonaws.com:3000`
- **Infraestructura**: AWS EC2 + RDS PostgreSQL
- **Estado**: ✅ Funcionando

### Endpoints Disponibles

#### 🏥 HEALTH (1 endpoint)
- `GET /health` ✅
  - Verifica DB + servicio
  - Retorna status del sistema

#### 📝 ONBOARDING (1 endpoint)
- `POST /api/v1/onboarding/submit` ✅
  - Crea usuario + validaciones (biometric, OCR, PEP, AML)
  - Validaciones de input activas
  - Campos requeridos según el request

#### 👥 USERS (2 endpoints)
- `GET /api/v1/users/pending-review` ✅
  - Retorna usuarios pendientes de revisión (5 usuarios disponibles)
  
- `GET /api/v1/users/:userId` ✅
  - Obtiene detalles de un usuario específico

---

## 🎯 PLAN DE INTEGRACIÓN PASO A PASO

### **PASO 1: Health Check (GET /health)**
**Objetivo**: Verificar conexión con el backend

**Por qué este primero**:
- ✅ Endpoint más simple
- ✅ No requiere autenticación
- ✅ Verifica que el backend esté funcionando
- ✅ Perfecto para probar la conexión

**Tareas**:
1. ✅ Actualizar BASE_URL en `base.ts`
2. ✅ Crear `healthService.ts`
3. ✅ Integrar en HomeScreen con botón de prueba
4. ✅ Mostrar respuesta en pantalla y LogViewer

**Cómo confirmar que funciona**:
- Ver en LogViewer: `GET /health - 200 OK`
- Ver respuesta: `{ "status": "ok", "database": "connected", "service": "running" }`
- Mostrar en pantalla

**Criterio de éxito**: ✅ Podemos hacer una llamada HTTP y ver la respuesta del health check

---

### **PASO 2: Obtener Usuarios Pendientes (GET /api/v1/users/pending-review)**
**Objetivo**: Listar usuarios pendientes de revisión

**Por qué este segundo**:
- ✅ GET simple con respuesta de array
- ✅ No requiere parámetros
- ✅ Útil para ver datos reales
- ✅ Prueba de endpoints con prefijo `/api/v1`

**Tareas**:
1. Crear función `getPendingReviewUsers()` en `userService.ts`
2. Llamar desde HomeScreen o crear pantalla de prueba
3. Mostrar lista de usuarios
4. Manejar array vacío o errores

**Cómo confirmar que funciona**:
- Ver en LogViewer: `GET /api/v1/users/pending-review - 200 OK`
- Ver array con 5 usuarios
- Mostrar lista en pantalla

**Criterio de éxito**: ✅ Podemos obtener y mostrar la lista de usuarios pendientes

---

### **PASO 3: Obtener Usuario por ID (GET /api/v1/users/:userId)**
**Objetivo**: Obtener detalles de un usuario específico

**Por qué este tercero**:
- ✅ GET con parámetro en path
- ✅ Retorna objeto completo del usuario
- ✅ Útil para ver detalles
- ✅ Prueba de parámetros dinámicos

**Tareas**:
1. Crear función `getUserById(userId: string)`
2. Probar con un ID de los usuarios pendientes
3. Mostrar datos del usuario en pantalla
4. Manejar error 404 si no existe

**Cómo confirmar que funciona**:
- Ver en LogViewer: `GET /api/v1/users/{userId} - 200 OK`
- Ver respuesta con datos completos del usuario
- Mostrar nombre, email, etc. en pantalla

**Criterio de éxito**: ✅ Podemos obtener datos de usuario por ID

---

### **PASO 4: Enviar Onboarding (POST /api/v1/onboarding/submit)**
**Objetivo**: Crear usuario mediante onboarding

**Por qué este cuarto**:
- ✅ POST con JSON body completo
- ✅ Validaciones de input activas
- ✅ Crea usuario + validaciones automáticas
- ✅ Prueba de escritura de datos

**Tareas**:
1. Crear función `submitOnboarding(data)` en `onboardingService.ts`
2. Preparar datos del formulario de onboarding
3. Enviar request con todos los campos requeridos
4. Manejar errores de validación (400, 422)
5. Mostrar respuesta con userId creado

**Cómo confirmar que funciona**:
- Ver en LogViewer: `POST /api/v1/onboarding/submit - 200 OK`
- Ver request body enviado
- Ver respuesta con userId y status
- Verificar que se creó correctamente

**Criterio de éxito**: ✅ Podemos crear usuarios mediante onboarding

---

## 📝 ESTRUCTURA DE ARCHIVOS

```
src/
  services/
    api/
      base.ts              # Configuración base (BASE_URL actualizada)
      types.ts             # Tipos TypeScript (si es necesario)
      healthService.ts     # ✅ Health check
      userService.ts       # ✅ Endpoints de usuarios
      onboardingService.ts # ✅ Endpoint de onboarding
```

---

## 🔍 CÓMO CONFIRMAR QUE CADA PASO FUNCIONA

1. **LogViewer**: Todos los requests/responses aparecen en tiempo real
2. **Console logs**: Verificar en terminal de Metro
3. **Pantalla de prueba**: Mostrar datos en UI
4. **Errores**: Manejar y mostrar errores claramente

---

## ⚠️ NOTAS IMPORTANTES

- **Base URL**: `http://ec2-34-224-57-79.compute-1.amazonaws.com:3000`
- **Prefijo API**: `/api/v1` para usuarios y onboarding
- **Health**: Sin prefijo, directamente `/health`
- **Testing**: Cada paso debe probarse antes de pasar al siguiente
- **Errores**: Manejar todos los códigos de error posibles (400, 404, 500, etc.)
- **Versión**: Incrementar 0.1 por cada paso completado

---

## 🚀 PRÓXIMOS PASOS INMEDIATOS

1. ✅ Actualizar BASE_URL
2. ✅ Crear healthService
3. ✅ Integrar en HomeScreen
4. 🔄 Probar GET /health
5. Continuar con siguiente paso

