# 📊 Análisis: Envío de Dinero a Contactos

## 🔍 Estado Actual de las APIs

### ✅ APIs Disponibles para Verificación de Usuarios

#### 1. `userService.getUserByPhone(phone: string)`
- **Endpoint**: `GET /api/v1/users/pending-review` (filtra por teléfono)
- **Uso**: Buscar usuario por número de teléfono
- **Retorna**: `User | null`
- **Limitación**: Solo busca en usuarios "pending-review", puede no encontrar usuarios activos

#### 2. `userService.getUserByEmail(email: string)`
- **Endpoint**: `GET /api/v1/users/pending-review` (filtra por email)
- **Uso**: Buscar usuario por email
- **Retorna**: `User | null`
- **Limitación**: Solo busca en usuarios "pending-review", puede no encontrar usuarios activos

#### 3. `userService.getUserById(userId: string)`
- **Endpoint**: `GET /api/v1/users/:userId`
- **Uso**: Obtener usuario completo por ID (UUID o KSUID)
- **Retorna**: `User`
- **Ventaja**: Funciona con cualquier usuario activo
- **Limitación**: Necesitas conocer el ID exacto

#### 4. `transferService.transfer(userId, input)`
- **Endpoint**: `POST /api/v1/users/:userId/transfer`
- **Uso**: Realizar transferencia
- **Acepta**:
  - `destinationUserId`: ID del usuario destino (KSUID con prefijo `usr-`)
  - `destinationCvu`: CVU del destinatario
- **Validación**: El backend valida que el usuario destino exista

---

## 🎯 Opciones para Verificar Usuario Antes de Enviar

### Opción 1: Verificación por Teléfono (Recomendada) ⭐

**Flujo:**
1. Usuario selecciona contacto o ingresa teléfono
2. Llamar a `userService.getUserByPhone(phone)`
3. Si encuentra usuario:
   - Mostrar nombre completo del usuario
   - Usar `user.id` como `destinationUserId`
   - Proceder con transferencia
4. Si NO encuentra usuario:
   - Mostrar opción de enviar por CVU (si el contacto tiene CVU)
   - O mostrar mensaje: "Usuario no encontrado en la app"

**Ventajas:**
- ✅ Teléfono es el identificador más común en contactos
- ✅ Ya existe la función `getUserByPhone()`
- ✅ Permite verificar antes de enviar

**Desventajas:**
- ⚠️ Solo busca en usuarios "pending-review" (limitación del endpoint actual)
- ⚠️ Puede no encontrar usuarios activos

**Código de ejemplo:**
```typescript
// En TransferContent o HomeScreen
const verifyContactBeforeTransfer = async (contact: UserContact) => {
  if (contact.contactId) {
    // Ya tiene ID, verificar que existe
    try {
      const user = await userService.getUserById(contact.contactId);
      return { exists: true, user, verifiedId: user.id };
    } catch (error) {
      return { exists: false, error: 'Usuario no encontrado' };
    }
  } else if (contact.phone) {
    // Buscar por teléfono
    const user = await userService.getUserByPhone(contact.phone);
    if (user) {
      return { exists: true, user, verifiedId: user.id };
    }
    // Si no encuentra, intentar con CVU si existe
    if (contact.cvu) {
      return { exists: false, canUseCvu: true, cvu: contact.cvu };
    }
    return { exists: false, error: 'Usuario no encontrado' };
  } else if (contact.cvu) {
    // Solo tiene CVU, no podemos verificar si existe usuario
    return { exists: false, canUseCvu: true, cvu: contact.cvu };
  }
  
  return { exists: false, error: 'No hay información suficiente' };
};
```

---

### Opción 2: Verificación por ID de Usuario

**Flujo:**
1. Si el contacto tiene `contactId`:
   - Llamar a `userService.getUserById(contactId)`
   - Si existe, proceder con transferencia
   - Si no existe, mostrar error

**Ventajas:**
- ✅ Verificación directa y confiable
- ✅ Funciona con cualquier usuario activo

**Desventajas:**
- ⚠️ Requiere que el contacto tenga `contactId`
- ⚠️ No funciona si solo tienes teléfono o CVU

**Código de ejemplo:**
```typescript
const verifyByUserId = async (contactId: string) => {
  try {
    const user = await userService.getUserById(contactId);
    return { exists: true, user };
  } catch (error) {
    return { exists: false, error: 'Usuario no encontrado' };
  }
};
```

---

### Opción 3: Verificación Combinada (Teléfono + ID + CVU)

**Flujo:**
1. Intentar verificar por `contactId` (si existe)
2. Si no, intentar por `phone` (si existe)
3. Si no, usar `cvu` directamente (sin verificación de usuario)

**Ventajas:**
- ✅ Máxima flexibilidad
- ✅ Cubre todos los casos posibles

**Desventajas:**
- ⚠️ Más complejo de implementar
- ⚠️ Puede hacer múltiples llamadas al backend

**Código de ejemplo:**
```typescript
const verifyContact = async (contact: UserContact) => {
  // Prioridad 1: Verificar por ID si existe
  if (contact.contactId) {
    try {
      const user = await userService.getUserById(contact.contactId);
      return {
        verified: true,
        method: 'userId',
        userId: user.id,
        fullName: user.fullName,
      };
    } catch (error) {
      // ID no válido, continuar con otros métodos
    }
  }
  
  // Prioridad 2: Verificar por teléfono
  if (contact.phone) {
    const user = await userService.getUserByPhone(contact.phone);
    if (user) {
      return {
        verified: true,
        method: 'phone',
        userId: user.id,
        fullName: user.fullName,
      };
    }
  }
  
  // Prioridad 3: Usar CVU directamente (transferencia externa)
  if (contact.cvu) {
    return {
      verified: false,
      method: 'cvu',
      cvu: contact.cvu,
      fullName: contact.fullName,
      note: 'Transferencia a cuenta externa',
    };
  }
  
  return {
    verified: false,
    error: 'No se puede verificar el contacto',
  };
};
```

---

## 🚀 Flujo Recomendado para Envío de Dinero

### Paso 1: Selección de Contacto
- Usuario selecciona contacto desde lista o busca por teléfono/nombre

### Paso 2: Verificación (NUEVO)
```typescript
const handleContactSelection = async (contact: UserContact) => {
  setIsVerifying(true);
  
  // Verificar que el usuario existe
  const verification = await verifyContact(contact);
  
  if (verification.verified) {
    // Usuario verificado, mostrar información
    setVerifiedContact({
      ...contact,
      verifiedUserId: verification.userId,
      verifiedFullName: verification.fullName,
    });
    // Permitir continuar con transferencia
  } else if (verification.method === 'cvu') {
    // Transferencia externa por CVU
    setVerifiedContact({
      ...contact,
      verifiedCvu: verification.cvu,
      isExternal: true,
    });
    // Permitir continuar con transferencia externa
  } else {
    // Error: no se puede verificar
    showError('Usuario no encontrado en la app');
    // No permitir continuar
  }
  
  setIsVerifying(false);
};
```

### Paso 3: Transferencia
```typescript
const handleTransfer = async (
  amount: number,
  sourceCurrency: Currency,
  contact: UserContact & { verifiedUserId?: string; verifiedCvu?: string }
) => {
  const transferInput: TransferInput = {
    assetCode: sourceCurrency,
    assetType: sourceCurrency === 'USDc' ? 'crypto' : 'fiat',
    amount: amount,
    description: `Transferencia a ${contact.fullName}`,
  };
  
  // Usar ID verificado o CVU verificado
  if (contact.verifiedUserId) {
    transferInput.destinationUserId = contact.verifiedUserId;
  } else if (contact.verifiedCvu) {
    transferInput.destinationCvu = contact.verifiedCvu;
  } else {
    throw new Error('No hay destino válido para la transferencia');
  }
  
  // Realizar transferencia
  await transferService.transfer(userId, transferInput);
};
```

---

## ⚠️ Limitaciones Actuales del Backend

### 1. Endpoint de Búsqueda Limitado
- `GET /api/v1/users/pending-review` solo retorna usuarios pendientes
- **Problema**: No encuentra usuarios activos/aprobados
- **Solución necesaria**: Endpoint específico de búsqueda:
  ```
  GET /api/v1/users/search?phone=+59812345678
  GET /api/v1/users/search?email=user@example.com
  ```

### 2. Validación en Transferencia
- El backend valida que el usuario destino exista al hacer la transferencia
- **Problema**: El error solo aparece después de intentar transferir
- **Solución actual**: Verificar antes de transferir (workaround)

---

## 📋 Recomendaciones

### Para el Backend (Mejoras Futuras)

1. **Crear endpoint de búsqueda específico:**
   ```
   GET /api/v1/users/search
   Query params:
   - phone?: string
   - email?: string
   - limit?: number
   ```
   - Debe buscar en TODOS los usuarios (no solo pending-review)
   - Retornar información básica: id, fullName, phone, email, cvu

2. **Mejorar validación en transferencia:**
   - Retornar error más descriptivo si el usuario destino no existe
   - Incluir sugerencias (ej: "Usuario no encontrado. ¿Quieres enviar por CVU?")

### Para la App (Implementación Inmediata)

1. **Implementar verificación antes de transferir:**
   - Usar `getUserById()` si hay `contactId`
   - Usar `getUserByPhone()` si hay teléfono
   - Mostrar estado de verificación al usuario

2. **Mejorar UX:**
   - Mostrar indicador de "Verificando contacto..." mientras busca
   - Mostrar nombre completo del usuario verificado
   - Permitir transferencia externa por CVU si no se encuentra usuario

3. **Manejo de errores:**
   - Si no se encuentra usuario, ofrecer opción de enviar por CVU
   - Mostrar mensaje claro: "Usuario no encontrado en la app"

---

## 🎨 Experiencia de Usuario Propuesta

### Escenario 1: Contacto con ID Verificado ✅
1. Usuario selecciona contacto
2. Se muestra: "✓ Verificado: Juan M. Alvarez"
3. Usuario ingresa monto
4. Desliza para enviar
5. Transferencia exitosa

### Escenario 2: Contacto por Teléfono 🔍
1. Usuario ingresa teléfono
2. Se muestra: "Buscando usuario..."
3. Si encuentra: "✓ Encontrado: María González"
4. Si no encuentra: "Usuario no encontrado. ¿Enviar por CVU?"
5. Usuario puede continuar con CVU o cancelar

### Escenario 3: Transferencia Externa por CVU 💳
1. Usuario ingresa CVU manualmente
2. Se muestra: "Transferencia externa"
3. Usuario confirma y envía
4. Transferencia procesada

---

## 📝 Checklist de Implementación

### Fase 1: Verificación Básica
- [ ] Crear función `verifyContact()` que combine todas las opciones
- [ ] Integrar verificación en `handleContactSelection()`
- [ ] Mostrar estado de verificación en UI

### Fase 2: Mejoras de UX
- [ ] Agregar indicador de carga durante verificación
- [ ] Mostrar nombre completo del usuario verificado
- [ ] Manejar errores de manera amigable

### Fase 3: Transferencia Externa
- [ ] Permitir transferencia por CVU si no se encuentra usuario
- [ ] Mostrar advertencia para transferencias externas
- [ ] Validar formato de CVU

---

**Última actualización**: 2025-01-XX
**Estado**: 📊 Análisis completo - Listo para implementación

