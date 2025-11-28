# Cambios Necesarios en el Backend

Este documento lista las diferencias entre lo que la app nativa espera y lo que el backend actualmente proporciona, junto con los cambios necesarios para que funcionen correctamente.

## 📋 Resumen Ejecutivo

La mayoría de los endpoints están correctamente implementados, pero hay algunas diferencias en formato de datos y estructura de respuestas que la app maneja mediante transformaciones. Sin embargo, hay algunos cambios recomendados para mejorar la compatibilidad.

---

## ✅ Endpoints que Funcionan Correctamente

### 1. GET /api/v1/users/:userId/balances
- **Estado**: ✅ Funcional
- **Formato Backend**: `{ success: true, data: Balance[] }`
- **Formato App**: `{ balances: Balance[] }` (transformado en `balanceService.ts`)
- **Nota**: La app transforma correctamente la respuesta

### 2. GET /api/v1/users/:userId/movements
- **Estado**: ✅ Funcional
- **Formato Backend**: `{ success: true, data: Movement[] }`
- **Formato App**: `Movement[]` (transformado en `movementsService.ts`)
- **Nota**: La app transforma correctamente la respuesta

### 3. POST /api/v1/users/:userId/deposit
- **Estado**: ✅ Funcional
- **Nota**: La app envía los datos en el formato correcto

### 4. POST /api/v1/users/:userId/transfer
- **Estado**: ✅ Funcional
- **Nota**: La app envía los datos en el formato correcto

### 5. GET /api/v1/users/:userId
- **Estado**: ✅ Funcional
- **Nota**: La app transforma correctamente la respuesta

### 6. POST /api/v1/users
- **Estado**: ✅ Funcional
- **Nota**: La app envía los datos en el formato correcto

---

## ⚠️ Diferencias y Cambios Recomendados

### 1. Formato de User ID

**Problema Actual:**
- El backend usa **UUID** estándar (ej: `123e4567-e89b-12d3-a456-426614174000`)
- La app espera **KSUID con prefijo** (ej: `usr-35zd9Jx5qnvXYJ8mmXKk5hHLq5L`)

**Impacto:**
- La app tiene lógica para manejar ambos formatos, pero prefiere KSUID
- Los usuarios nuevos se crean con UUID y luego se espera que se conviertan a KSUID

**Cambio Recomendado:**
```go
// En lugar de usar UUID estándar, usar KSUID con prefijo "usr-"
// Ejemplo: usr-35zd9Jx5qnvXYJ8mmXKk5hHLq5L
```

**Prioridad**: 🔴 Alta (afecta la consistencia de IDs)

---

### 2. Estructura de Respuesta de Balances

**Backend Actual:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "userId": "uuid",
      "assetCode": "USD",
      "assetType": "fiat",
      "availableBalance": "1250.36",
      "pendingBalance": "0.00",
      "totalBalance": "1250.36",
      "accountType": "main",
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

**App Espera (después de transformación):**
```json
{
  "balances": [
    {
      "currency": "USD",
      "amount": 1250.36,
      "availableActions": ["agregar", "enviar", "exchange"]
    }
  ]
}
```

**Estado Actual**: ✅ La app transforma correctamente
**Cambio Recomendado**: Ninguno (la transformación funciona bien)

---

### 3. Estructura de Respuesta de Movements

**Backend Actual:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "balance_id": "uuid",
      "movement_type": "transfer_in",
      "amount": "5000.00",
      "asset_code": "UYU",
      "asset_type": "fiat",
      "direction": "in",
      "status": "completed",
      "description": "Transferencia recibida",
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

**App Espera (después de transformación):**
```json
[
  {
    "id": "uuid",
    "userId": "uuid",
    "balanceId": "uuid",
    "movementType": "transfer_in",
    "amount": 5000.00,
    "currency": "UYU",
    "direction": "in",
    "status": "completed",
    "description": "Transferencia recibida",
    "title": "Transferencia recibida",
    "date": "2024-01-01T00:00:00Z",
    "isIncome": true
  }
]
```

**Estado Actual**: ✅ La app transforma correctamente
**Cambio Recomendado**: Ninguno (la transformación funciona bien)

---

### 4. Orden de Balances

**Requisito de la App:**
Los balances DEBEN venir en este orden exacto:
1. **UYU** (Pesos Uruguayos) - Primero
2. **USD** (Dólares) - Segundo  
3. **USDc** (USD Coin) - Tercero

**Estado Actual**: ✅ La app ordena los balances después de recibirlos
**Cambio Recomendado**: El backend podría ordenar los balances antes de enviarlos para mejorar la eficiencia

**Prioridad**: 🟡 Media (la app lo maneja, pero sería mejor en el backend)

---

### 5. Manejo de Errores

**Problema Actual:**
- Cuando el backend no está disponible o hay errores de red, la app muestra errores en consola
- Los errores de "Aborted" (requests canceladas) se manejan correctamente

**Cambio Implementado en App:**
- ✅ Se agregaron try-catch adicionales en `loadBalances` y `loadMovements`
- ✅ La app ahora usa mocks cuando hay errores de red o el backend no está disponible

**Cambio Recomendado en Backend**: Ninguno (el manejo de errores es adecuado)

---

### 6. Validación de User ID en Endpoints

**Problema Actual:**
- El backend valida que el `userId` sea un UUID válido
- La app puede enviar KSUID con prefijo `usr-` que no pasa la validación de UUID

**Ejemplo de Error:**
```
Invalid user ID: usr-35zd9Jx5qnvXYJ8mmXKk5hHLq5L
```

**Cambio Necesario:**
```go
// En balance_handler.go, user_handler.go, etc.
// Cambiar de:
userID, err := uuid.Parse(userIDStr)

// A algo que acepte tanto UUID como KSUID:
func parseUserID(userIDStr string) (string, error) {
    // Si tiene prefijo usr-, es un KSUID válido
    if strings.HasPrefix(userIDStr, "usr-") {
        return userIDStr, nil
    }
    // Si no, intentar parsear como UUID
    _, err := uuid.Parse(userIDStr)
    if err != nil {
        return "", err
    }
    return userIDStr, nil
}
```

**Prioridad**: 🔴 Alta (afecta todos los endpoints que usan userId)

---

### 7. Creación de Balances por Defecto

**Problema Actual:**
- Cuando se crea un usuario, no se crean balances por defecto
- La app espera que existan balances para UYU, USD y USDc

**Cambio Recomendado:**
```go
// En user_service.go, después de crear un usuario:
// Crear balances por defecto
balances := []struct{
    assetCode string
    assetType string
}{
    {"UYU", "fiat"},
    {"USD", "fiat"},
    {"USDc", "crypto"},
}

for _, b := range balances {
    _, err := balanceService.GetOrCreateBalance(ctx, userID, b.assetCode, b.assetType, "main")
    if err != nil {
        // Log error pero continuar
    }
}
```

**Prioridad**: 🟡 Media (la app maneja balances vacíos, pero sería mejor tener defaults)

---

## 📝 Checklist de Cambios para el Backend

### Prioridad Alta 🔴
- [ ] **Cambiar validación de User ID** para aceptar tanto UUID como KSUID con prefijo `usr-`
- [ ] **Implementar KSUID con prefijo** en lugar de UUID estándar para nuevos usuarios

### Prioridad Media 🟡
- [ ] **Ordenar balances** antes de enviarlos (UYU → USD → USDc)
- [ ] **Crear balances por defecto** al crear un usuario nuevo (UYU, USD, USDc)

### Prioridad Baja 🟢
- [ ] Considerar cambiar formato de respuesta para que coincida exactamente con lo que la app espera (aunque la transformación funciona bien)

---

## 🔍 Endpoints que Necesitan Verificación

### 1. GET /api/v1/users/pending-review
- **Uso en App**: Se usa para buscar usuarios por teléfono o email
- **Problema Potencial**: Si hay muchos usuarios, puede ser ineficiente
- **Recomendación**: Considerar agregar query params `?phone=...` o `?email=...`

### 2. DELETE /api/v1/users
- **Uso en App**: Se usa para eliminar usuarios en desarrollo
- **Estado**: Funcional pero puede tener problemas (error 500 mencionado en código)
- **Recomendación**: Verificar y mejorar el manejo de errores

---

## 📊 Comparación de Formatos

### Balance - Backend vs App

| Campo Backend | Tipo Backend | Campo App | Tipo App | Transformación |
|--------------|--------------|-----------|----------|----------------|
| `assetCode` | string | `currency` | Currency | Mapeo directo |
| `availableBalance` | decimal.Decimal | `amount` | number | `parseFloat()` |
| N/A | N/A | `availableActions` | ActionId[] | Generado según currency |

### Movement - Backend vs App

| Campo Backend | Tipo Backend | Campo App | Tipo App | Transformación |
|--------------|--------------|-----------|----------|----------------|
| `user_id` | uuid.UUID | `userId` | string | Directo |
| `balance_id` | uuid.UUID | `balanceId` | string | Directo |
| `movement_type` | string | `movementType` | string | Directo |
| `amount` | decimal.Decimal | `amount` | number | `parseFloat()` |
| `asset_code` | string | `currency` | Currency | Mapeo |
| `direction` | string | `direction` | string | Directo |
| `status` | string | `status` | string | Directo |
| `description` | *string | `description` | string | Directo |
| N/A | N/A | `title` | string | Generado desde `movementType` |
| `created_at` | time.Time | `date` | string | ISO string |
| N/A | N/A | `isIncome` | boolean | `direction === 'in'` |

---

## 🚀 Próximos Pasos

1. **Implementar cambios de prioridad alta** (validación de User ID)
2. **Probar endpoints** con la app nativa después de los cambios
3. **Implementar cambios de prioridad media** (orden de balances, balances por defecto)
4. **Documentar** cualquier cambio adicional que surja durante las pruebas

---

## 📞 Notas Adicionales

- La app maneja correctamente los errores de red usando mocks como fallback
- Los errores de "Aborted" (requests canceladas) se manejan correctamente y no se muestran como errores
- La transformación de datos funciona bien, pero sería más eficiente si el backend enviara los datos en el formato exacto que la app espera

---

**Última actualización**: 2025-01-XX
**Versión Backend**: pr-20
**Versión App**: Actual

