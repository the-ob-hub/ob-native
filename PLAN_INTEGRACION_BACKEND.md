# Plan de Integración Backend - Paso a Paso

## 📋 Análisis de la API

### Servidor Base
- **URL**: `https://petstore3.swagger.io/api/v3`
- **OpenAPI**: 3.0.4

### Endpoints Disponibles

#### 🔵 PET (8 endpoints)
- `PUT /pet` - Actualizar pet existente
- `POST /pet` - Crear nuevo pet
- `GET /pet/findByStatus` - Buscar pets por status (available, pending, sold)
- `GET /pet/findByTags` - Buscar pets por tags
- `GET /pet/{petId}` - Obtener pet por ID
- `POST /pet/{petId}` - Actualizar pet con form data
- `DELETE /pet/{petId}` - Eliminar pet
- `POST /pet/{petId}/uploadImage` - Subir imagen

#### 🟢 STORE (4 endpoints)
- `GET /store/inventory` - Obtener inventario (mapa de status a cantidades)
- `POST /store/order` - Crear nueva orden
- `GET /store/order/{orderId}` - Obtener orden por ID
- `DELETE /store/order/{orderId}` - Eliminar orden

#### 🟡 USER (7 endpoints)
- `POST /user` - Crear usuario
- `POST /user/createWithList` - Crear múltiples usuarios
- `GET /user/login` - Login (retorna token en headers)
- `GET /user/logout` - Logout
- `GET /user/{username}` - Obtener usuario por username
- `PUT /user/{username}` - Actualizar usuario
- `DELETE /user/{username}` - Eliminar usuario

### Modelos de Datos

#### User
```typescript
{
  id: number (int64)
  username: string
  firstName: string
  lastName: string
  email: string
  password: string
  phone: string
  userStatus: number (int32)
}
```

#### Pet
```typescript
{
  id: number (int64)
  name: string (required)
  category: Category
  photoUrls: string[] (required)
  tags: Tag[]
  status: 'available' | 'pending' | 'sold'
}
```

#### Order
```typescript
{
  id: number (int64)
  petId: number (int64)
  quantity: number (int32)
  shipDate: string (date-time)
  status: 'placed' | 'approved' | 'delivered'
  complete: boolean
}
```

### Autenticación

1. **OAuth2** (`petstore_auth`):
   - Tipo: OAuth2 Implicit Flow
   - URL: `https://petstore3.swagger.io/oauth/authorize`
   - Scopes: `write:pets`, `read:pets`

2. **API Key** (`api_key`):
   - Tipo: API Key
   - Ubicación: Header
   - Nombre: `api_key`

---

## 🎯 PLAN DE INTEGRACIÓN PASO A PASO

### **PASO 1: Setup Base (Infraestructura)**
**Objetivo**: Configurar la infraestructura básica para hacer llamadas HTTP

**Tareas**:
1. Instalar dependencias HTTP (axios o fetch nativo)
2. Crear servicio de API base (`src/services/api.ts`)
3. Configurar base URL y headers
4. Crear tipos TypeScript para los modelos

**Cómo confirmar que funciona**:
- Hacer un GET simple a `/store/inventory` (no requiere auth)
- Verificar que recibimos respuesta 200
- Mostrar el resultado en LogViewer

**Criterio de éxito**: ✅ Podemos hacer una llamada HTTP y ver la respuesta

---

### **PASO 2: Primer Endpoint - GET /store/inventory**
**Objetivo**: Integrar el endpoint más simple (sin autenticación)

**Por qué este primero**:
- ✅ No requiere autenticación
- ✅ Solo GET (más simple)
- ✅ Retorna datos simples (objeto con números)
- ✅ Perfecto para probar la conexión

**Tareas**:
1. Crear función `getInventory()` en servicio API
2. Llamar desde HomeScreen o crear pantalla de prueba
3. Mostrar resultado en LogViewer
4. Manejar errores básicos

**Cómo confirmar que funciona**:
- Ver en LogViewer: `GET /store/inventory - 200 OK`
- Ver respuesta: `{ "available": 123, "pending": 45, "sold": 67 }`
- Mostrar en pantalla o console

**Criterio de éxito**: ✅ Vemos el inventario en la app

---

### **PASO 3: Segundo Endpoint - GET /user/{username}**
**Objetivo**: Probar endpoint con parámetros en path

**Por qué este segundo**:
- ✅ No requiere autenticación (según swagger)
- ✅ GET simple con parámetro
- ✅ Retorna objeto User completo
- ✅ Útil para probar parámetros dinámicos

**Tareas**:
1. Crear función `getUserByUsername(username: string)`
2. Probar con username conocido (ej: "user1")
3. Mostrar datos del usuario en pantalla
4. Manejar error 404 si no existe

**Cómo confirmar que funciona**:
- Ver en LogViewer: `GET /user/user1 - 200 OK`
- Ver respuesta con datos del usuario
- Mostrar nombre, email, etc. en pantalla

**Criterio de éxito**: ✅ Podemos obtener datos de usuario por username

---

### **PASO 4: Tercer Endpoint - GET /user/login**
**Objetivo**: Implementar login y obtener token

**Por qué este tercero**:
- ✅ Necesario para endpoints protegidos
- ✅ GET con query parameters
- ✅ Retorna token en headers (X-Rate-Limit, X-Expires-After)
- ✅ Base para autenticación

**Tareas**:
1. Crear función `loginUser(username: string, password: string)`
2. Guardar token en AsyncStorage
3. Extraer headers de respuesta
4. Mostrar token en LogViewer

**Cómo confirmar que funciona**:
- Ver en LogViewer: `GET /user/login?username=test&password=test - 200 OK`
- Ver headers: `X-Rate-Limit`, `X-Expires-After`
- Ver token en respuesta
- Guardar en AsyncStorage y verificar

**Criterio de éxito**: ✅ Podemos hacer login y obtener token

---

### **PASO 5: Cuarto Endpoint - POST /user**
**Objetivo**: Crear usuario (POST con body)

**Por qué este cuarto**:
- ✅ POST con JSON body
- ✅ No requiere autenticación
- ✅ Útil para registro
- ✅ Prueba de escritura de datos

**Tareas**:
1. Crear función `createUser(user: User)`
2. Enviar datos del usuario en body
3. Manejar respuesta 200
4. Mostrar usuario creado

**Cómo confirmar que funciona**:
- Ver en LogViewer: `POST /user - 200 OK`
- Ver request body enviado
- Ver respuesta con usuario creado
- Verificar que se creó correctamente

**Criterio de éxito**: ✅ Podemos crear usuarios nuevos

---

### **PASO 6: Quinto Endpoint - GET /pet/findByStatus**
**Objetivo**: Obtener lista de pets (con autenticación opcional)

**Por qué este quinto**:
- ✅ GET con query parameters
- ✅ Retorna array de objetos
- ✅ Puede requerir auth (petstore_auth)
- ✅ Útil para listar datos

**Tareas**:
1. Crear función `findPetsByStatus(status: 'available' | 'pending' | 'sold')`
2. Manejar autenticación si es necesaria
3. Mostrar lista de pets
4. Manejar array vacío

**Cómo confirmar que funciona**:
- Ver en LogViewer: `GET /pet/findByStatus?status=available - 200 OK`
- Ver array de pets en respuesta
- Mostrar lista en pantalla

**Criterio de éxito**: ✅ Podemos obtener lista de pets

---

### **PASO 7: Sexto Endpoint - POST /pet**
**Objetivo**: Crear pet (POST con objeto complejo)

**Por qué este sexto**:
- ✅ POST con objeto complejo (Pet con Category, Tags)
- ✅ Requiere autenticación OAuth2
- ✅ Prueba de objetos anidados
- ✅ Validación de campos requeridos

**Tareas**:
1. Crear función `createPet(pet: Pet)`
2. Manejar autenticación OAuth2
3. Validar campos requeridos (name, photoUrls)
4. Enviar objeto completo

**Cómo confirmar que funciona**:
- Ver en LogViewer: `POST /pet - 200 OK`
- Ver pet creado con ID
- Verificar que todos los campos se enviaron

**Criterio de éxito**: ✅ Podemos crear pets completos

---

### **PASO 8: Séptimo Endpoint - POST /store/order**
**Objetivo**: Crear orden (POST con validación)

**Por qué este séptimo**:
- ✅ POST con objeto Order
- ✅ No requiere autenticación
- ✅ Validación de datos
- ✅ Relación con Pet

**Tareas**:
1. Crear función `placeOrder(order: Order)`
2. Validar datos antes de enviar
3. Manejar errores 400, 422
4. Mostrar orden creada

**Cómo confirmar que funciona**:
- Ver en LogViewer: `POST /store/order - 200 OK`
- Ver orden creada con ID
- Verificar status y datos

**Criterio de éxito**: ✅ Podemos crear órdenes

---

### **PASO 9: Octavo Endpoint - POST /pet/{petId}/uploadImage**
**Objetivo**: Subir imagen (multipart/form-data)

**Por qué este octavo**:
- ✅ POST con archivo binario
- ✅ Multipart/form-data
- ✅ Prueba de upload de archivos
- ✅ Requiere autenticación

**Tareas**:
1. Crear función `uploadPetImage(petId: number, imageUri: string)`
2. Convertir imagen a FormData
3. Enviar como binary
4. Manejar respuesta ApiResponse

**Cómo confirmar que funciona**:
- Ver en LogViewer: `POST /pet/1/uploadImage - 200 OK`
- Ver respuesta con código y mensaje
- Verificar que la imagen se subió

**Criterio de éxito**: ✅ Podemos subir imágenes

---

### **PASO 10: Autenticación Completa**
**Objetivo**: Implementar OAuth2 y API Key para todos los endpoints protegidos

**Tareas**:
1. Implementar OAuth2 flow completo
2. Guardar tokens en AsyncStorage
3. Interceptor para agregar headers automáticamente
4. Refresh token si es necesario

**Cómo confirmar que funciona**:
- Todos los endpoints protegidos funcionan
- Tokens se renuevan automáticamente
- No hay errores 401/403

**Criterio de éxito**: ✅ Autenticación funcionando en todos los endpoints

---

## 📝 ESTRUCTURA DE ARCHIVOS A CREAR

```
src/
  services/
    api/
      base.ts          # Configuración base (baseURL, headers)
      types.ts         # Tipos TypeScript (User, Pet, Order, etc.)
      userService.ts   # Endpoints de usuario
      petService.ts    # Endpoints de pets
      storeService.ts  # Endpoints de store
      authService.ts   # Autenticación (OAuth2, API Key)
  utils/
    storage.ts         # AsyncStorage helpers para tokens
```

---

## 🔍 CÓMO CONFIRMAR QUE CADA PASO FUNCIONA

1. **LogViewer**: Todos los requests/responses aparecen en tiempo real
2. **Console logs**: Verificar en terminal de Metro
3. **Pantalla de prueba**: Mostrar datos en UI
4. **Errores**: Manejar y mostrar errores claramente

---

## ⚠️ NOTAS IMPORTANTES

- **Firebase**: Se integrará DESPUÉS de completar todos los pasos del backend
- **Testing**: Cada paso debe probarse antes de pasar al siguiente
- **Errores**: Manejar todos los códigos de error posibles (400, 401, 404, 422, etc.)
- **Versión**: Incrementar 0.1 por cada paso completado

---

## 🚀 PRÓXIMOS PASOS INMEDIATOS

1. Crear estructura de servicios API
2. Implementar Paso 1 (Setup Base)
3. Implementar Paso 2 (GET /store/inventory)
4. Probar y confirmar funcionamiento
5. Continuar con siguiente paso

