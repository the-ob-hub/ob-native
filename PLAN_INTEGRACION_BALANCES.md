# Plan de Integración - Balances del Backend AWS

**⚠️ IMPORTANTE: Todos los cambios son SOLO en la app móvil. NO se modifica el backend.**

## 📋 Análisis de Diferencias

### Backend (Go) Devuelve:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "userId": "uuid",
      "assetCode": "USD",           // ← Campo diferente
      "availableBalance": "1250.36", // ← Decimal como string
      "pendingBalance": "0",
      "totalBalance": "1250.36",
      "assetType": "fiat",
      "accountType": "main"
      // ❌ NO tiene "availableActions"
    }
  ]
}
```

### App Móvil Espera:
```json
{
  "balances": [                    // ← Estructura diferente
    {
      "currency": "UYU",          // ← Nombre diferente
      "amount": 45000.00,         // ← Nombre diferente (number)
      "availableActions": [...]   // ← Falta en backend
    }
  ]
}
```

## 🎯 Plan de Implementación

### **PASO 1: Crear Servicio de Balance API**
**Archivo:** `src/services/api/balanceService.ts`

**Tareas:**
1. Crear `balanceService.ts` con método `getBalances(userId: string)`
2. Llamar al endpoint: `GET /api/v1/users/:userId/balances`
3. Manejar la respuesta del backend: `{ success: true, data: [...] }`
4. Transformar la respuesta al formato esperado por la app

**Transformaciones necesarias:**
- `data` → `balances`
- `assetCode` → `currency`
- `availableBalance` (decimal string) → `amount` (number)
- Agregar `availableActions` según el `assetCode`
- Ordenar: UYU → USD → USDc

---

### **PASO 2: Crear Tipos para Respuesta del Backend**
**Archivo:** `src/services/api/types.ts` (actualizar)

**Tareas:**
1. Agregar interface `BackendBalance` que refleje la estructura real del backend
2. Agregar interface `BackendBalancesResponse`
3. Mantener `BalancesResponse` existente para la app

**Tipos a crear:**
```typescript
interface BackendBalance {
  id: string;
  userId: string;
  assetCode: string;           // "USD" | "UYU" | "USDc"
  availableBalance: string;    // Decimal como string
  pendingBalance: string;
  totalBalance: string;
  assetType: string;
  accountType: string;
}

interface BackendBalancesResponse {
  success: boolean;
  data: BackendBalance[];
}
```

---

### **PASO 3: Función de Transformación**
**Archivo:** `src/services/api/balanceService.ts`

**Tareas:**
1. Crear función `transformBackendBalance()` que:
   - Convierte `assetCode` → `currency`
   - Convierte `availableBalance` (string) → `amount` (number)
   - Agrega `availableActions` según la moneda
   - Maneja el orden correcto (UYU → USD → USDc)

**Lógica de `availableActions`:**
- **UYU**: `["agregar", "pagar", "exchange"]`
- **USD**: `["agregar", "enviar", "exchange"]`
- **USDc**: `["agregar", "enviar", "exchange", "pagar"]`

**Orden de balances:**
1. UYU primero
2. USD segundo
3. USDc tercero

---

### **PASO 4: Obtener userId Correcto**
**Archivo:** `src/screens/HomeScreen.tsx`

**Problema:**
- Backend espera `userId` como UUID
- App actualmente usa `email` como `userId`
- Necesitamos obtener el UUID real del usuario del backend

**Solución:**
1. Opción A: Usar el `sub` de Cognito (UUID del usuario)
2. Opción B: Llamar a `GET /api/v1/users/:userId` primero para obtener el UUID
3. Opción C: Guardar el UUID del backend después del login/registro

**Recomendación:** Usar `sub` de Cognito (ya está disponible en los atributos)

---

### **PASO 5: Integrar en HomeScreen**
**Archivo:** `src/screens/HomeScreen.tsx`

**Tareas:**
1. Importar `balanceService`
2. Obtener `userId` (UUID) de AsyncStorage o Cognito
3. Reemplazar `getMockBalances()` con llamada real al backend
4. Manejar estados de carga y error
5. Mantener fallback a mock si falla

**Cambios en `loadBalances()`:**
```typescript
const loadBalances = async () => {
  try {
    setIsLoading(true);
    
    // Obtener userId (UUID)
    const userId = await getUserId(); // UUID del usuario
    
    // Llamar al backend
    const balancesData = await balanceService.getBalances(userId);
    setBalances(balancesData.balances);
    
  } catch (error) {
    console.error('❌ Error cargando balances:', error);
    // Fallback a mock
    setBalances(getMockBalances());
  } finally {
    setIsLoading(false);
  }
};
```

---

### **PASO 6: Manejo de Errores**
**Archivo:** `src/services/api/balanceService.ts`

**Errores a manejar:**
1. **401 Unauthorized**: JWT inválido o expirado
2. **404 Not Found**: Usuario no existe en backend
3. **500 Internal Server Error**: Error del servidor
4. **Network Error**: Sin conexión

**Estrategia:**
- Loggear errores detallados
- Mostrar mensaje al usuario si es crítico
- Fallback a datos mock si es posible
- Reintentar si es error de red

---

### **PASO 7: Verificar BASE_URL**
**Archivo:** `src/services/api/base.ts`

**Tareas:**
1. Verificar que BASE_URL apunte al backend correcto
2. El backend puede estar en puerto 80 o 3000 (según configuración)
3. Si es necesario, actualizar solo la URL en la app

**URL Actual en app:**
```
http://ec2-34-224-57-79.compute-1.amazonaws.com:3000
```

**Nota:** Si el backend cambió a puerto 80, solo actualizar la URL aquí. NO modificar backend.

---

### **PASO 8: Testing y Validación**
**Tareas:**
1. Probar con usuario real que tiene balances en el backend
2. Verificar que los balances se muestran correctamente
3. Verificar el orden (UYU → USD → USDc)
4. Verificar que `availableActions` están correctos
5. Probar con usuario sin balances (debe retornar array vacío)
6. Probar manejo de errores

---

## 📝 Archivos a Crear/Modificar

### Nuevos Archivos:
1. ✅ `src/services/api/balanceService.ts` - Servicio de balance

### Archivos a Modificar:
1. ✅ `src/services/api/types.ts` - Agregar tipos del backend
2. ✅ `src/screens/HomeScreen.tsx` - Integrar llamada al backend
3. ✅ `src/services/api/base.ts` - Verificar/actualizar BASE_URL
4. ✅ `App.tsx` - Guardar UUID del usuario después del login

---

## 🔄 Flujo Completo

```
1. Usuario hace login
   ↓
2. Cognito retorna tokens + atributos (incluye 'sub' UUID)
   ↓
3. Guardar 'sub' como userId en AsyncStorage
   ↓
4. HomeScreen carga
   ↓
5. loadBalances() obtiene userId (UUID) de AsyncStorage
   ↓
6. balanceService.getBalances(userId) llama al backend
   ↓
7. Backend retorna { success: true, data: [...] }
   ↓
8. balanceService transforma respuesta:
   - data → balances
   - assetCode → currency
   - availableBalance → amount
   - Agrega availableActions
   - Ordena: UYU → USD → USDc
   ↓
9. HomeScreen muestra balances reales
```

---

## ⚠️ Consideraciones Importantes

1. **userId debe ser UUID**: El backend espera UUID, no email
2. **Orden de balances**: Crítico para la UX del swipe
3. **availableActions**: Debe calcularse según assetCode
4. **Manejo de decimales**: Backend usa strings, app necesita numbers
5. **Fallback**: Siempre tener fallback a mock si falla
6. **Loading states**: Mostrar indicador mientras carga
7. **Error handling**: Manejar todos los casos de error

---

## ✅ Criterios de Éxito

1. ✅ Los balances se obtienen del backend AWS
2. ✅ Se muestran en el orden correcto (UYU → USD → USDc)
3. ✅ Los montos son correctos
4. ✅ Las acciones disponibles son correctas según la moneda
5. ✅ Manejo de errores funciona correctamente
6. ✅ Fallback a mock si falla la conexión
7. ✅ Loading states funcionan correctamente

---

## 🚀 Próximos Pasos

1. Crear `balanceService.ts`
2. Crear función de transformación
3. Obtener userId (UUID) correcto
4. Integrar en HomeScreen
5. Probar con datos reales
6. Manejar errores
7. Validar funcionamiento completo

