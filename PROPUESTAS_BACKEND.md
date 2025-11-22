# Propuestas de Mejoras para el Backend

**⚠️ IMPORTANTE:** Este documento contiene propuestas de mejoras para el backend. NO son requerimientos críticos, son sugerencias para mejorar la integración frontend-backend.

---

## 📋 Propuestas

### 1. **Alias y CBU/CVU en el Modelo User**

**Problema Actual:**
- El perfil del usuario muestra alias y CBU/CVU hardcodeados en el frontend
- No hay forma de obtener estos datos del backend

**Propuesta:**
Agregar campos al modelo `User` en el backend:

```go
type User struct {
    // ... campos existentes ...
    
    // Datos bancarios
    Alias *string `gorm:"type:varchar(50);uniqueIndex" json:"alias,omitempty"`
    CBU   *string `gorm:"type:varchar(22);uniqueIndex" json:"cbu,omitempty"`
    CVU   *string `gorm:"type:varchar(22);uniqueIndex" json:"cvu,omitempty"`
}
```

**Beneficios:**
- Los usuarios pueden tener sus propios alias/CBU/CVU
- Datos centralizados en el backend
- Mejor experiencia de usuario

**Prioridad:** Media

---

### 2. **Formato de Respuesta de Balances**

**Problema Actual:**
- Backend devuelve: `{ success: true, data: [...] }`
- Frontend espera: `{ balances: [...] }`
- Requiere transformación en el frontend

**Propuesta:**
Mantener formato actual (ya está funcionando con transformación en frontend).

**Alternativa (si se quiere estandarizar):**
- Opción A: Backend devuelve `{ balances: [...] }` directamente
- Opción B: Mantener formato actual y documentar bien

**Prioridad:** Baja (ya funciona con transformación)

---

### 3. **Campo `availableActions` en Balances**

**Problema Actual:**
- Backend no devuelve `availableActions`
- Frontend los calcula según `assetCode`

**Propuesta:**
Agregar campo `availableActions` al modelo `Balance`:

```go
type Balance struct {
    // ... campos existentes ...
    
    AvailableActions []string `gorm:"type:text" json:"availableActions"` // JSON array
}
```

**Beneficios:**
- Lógica centralizada en el backend
- Más flexible para cambios futuros
- Menos código en el frontend

**Prioridad:** Baja (ya funciona con cálculo en frontend)

---

### 4. **Endpoint para Obtener Datos del Usuario Actual**

**Problema Actual:**
- Necesitamos pasar `userId` como parámetro
- Sería útil tener un endpoint `/api/v1/users/me` que use el JWT

**Propuesta:**
Crear endpoint que obtiene el usuario del token JWT:

```
GET /api/v1/users/me
Authorization: Bearer <token>
```

**Beneficios:**
- Más seguro (no se puede acceder a otros usuarios)
- Más simple para el frontend
- Mejor práctica de seguridad

**Prioridad:** Media

---

### 5. **Estandarización de Respuestas de Error**

**Problema Actual:**
- Algunos endpoints devuelven `{ success: false, error: "..." }`
- Otros pueden devolver diferentes formatos

**Propuesta:**
Estandarizar formato de error en todos los endpoints:

```json
{
  "success": false,
  "error": {
    "code": "USER_NOT_FOUND",
    "message": "Usuario no encontrado",
    "details": {}
  }
}
```

**Prioridad:** Baja

---

## 📝 Notas

- Todas estas propuestas son opcionales
- La app funciona correctamente con el backend actual
- Las transformaciones en el frontend son una solución válida
- Estas mejoras simplificarían el código del frontend pero no son críticas

---

## ✅ Estado Actual

- ✅ Balances: Funcionando con transformación en frontend
- ✅ Usuario: Funcionando con transformación en frontend
- ⚠️ Alias/CBU: Hardcodeado en frontend (propuesta #1)
- ✅ JWT: Funcionando correctamente
- ✅ Autenticación: Funcionando correctamente

