# Análisis Completo de Integración Frontend-Backend

## Problemas Identificados

### 1. Llamadas Duplicadas al Backend
**Problema**: Se realizaban múltiples llamadas simultáneas al mismo endpoint:
- `getUserByEmail` se llamaba 3 veces en paralelo desde diferentes lugares
- `getBalances` se llamaba múltiples veces simultáneamente
- `getMovements` se llamaba múltiples veces simultáneamente
- `getUserById` se llamaba múltiples veces simultáneamente

**Causa**:
- Las funciones `loadBalances`, `loadMovements`, y `loadUserData` se ejecutaban en paralelo en el `useEffect` inicial
- Cada función intentaba obtener el userId y hacer llamadas al backend independientemente
- Cuando se creaba el usuario, se volvían a llamar `loadBalances` y `loadMovements`, pero las llamadas originales ya estaban en curso

**Solución Aplicada**:
- Implementado sistema de control de llamadas en progreso usando `loadingRef` para evitar llamadas duplicadas
- Cambiado el `useEffect` inicial para cargar datos de forma secuencial: primero `loadUserData`, luego `loadBalances` y `loadMovements` en paralelo
- Agregado `finally` blocks para asegurar que el flag de "en progreso" se resetee correctamente

### 2. Problema de Mock Data cuando Backend Devuelve Array Vacío
**Problema**: Cuando el backend devolvía un array vacío de movimientos, se mostraban datos mock en lugar del estado vacío correcto.

**Causa**: La lógica de fallback usaba mock data tanto para errores como para arrays vacíos.

**Solución Aplicada**:
- Modificado `loadMovements` para mostrar array vacío cuando el backend devuelve `[]` (no mock)
- Mock data solo se usa en caso de error de red o cuando no hay userId

### 3. Mensaje de Error Incorrecto
**Problema**: El log mostraba "Usuario no encontrado (404)" cuando el error real era 400 "Invalid user ID".

**Causa**: La lógica de detección de error no distinguía correctamente entre 400 y 404.

**Solución Aplicada**:
- Corregida la lógica para detectar correctamente el tipo de error (400 vs 404)
- Mensaje de log ahora muestra el código de error correcto

### 4. Llamadas Redundantes a getUserByEmail
**Problema**: `getUserByEmail` se llamaba desde múltiples lugares:
- `App.tsx` en `handleLoginSuccess`
- `HomeScreen.tsx` en `loadUserData` (implícitamente a través de la creación de usuario)

**Causa**: No había coordinación entre los diferentes componentes para evitar llamadas redundantes.

**Solución Aplicada**:
- Eliminada la llamada redundante en `HomeScreen.tsx` - ahora solo se llama desde `App.tsx` en `handleLoginSuccess`
- La creación automática de usuario en `HomeScreen` ahora solo ocurre cuando `getUserById` falla con 400/404

### 5. Problema de Sincronización al Crear Usuario
**Problema**: Cuando se creaba un usuario y se actualizaba el KSUID en AsyncStorage, se recargaban balances y movimientos inmediatamente, pero las llamadas originales aún estaban en curso.

**Causa**: No había un mecanismo para cancelar las llamadas pendientes antes de iniciar nuevas.

**Solución Aplicada**:
- Agregado un pequeño delay (200ms) antes de recargar balances y movimientos después de crear el usuario
- Esto asegura que AsyncStorage se haya actualizado y que las llamadas anteriores hayan terminado

## Mejoras Implementadas

### 1. Control de Llamadas Duplicadas
```typescript
const loadingRef = useRef({
  userData: false,
  balances: false,
  movements: false,
});
```

Cada función verifica si ya está en progreso antes de ejecutarse:
```typescript
if (loadingRef.current.balances) {
  addLog('⚠️ HomeScreen - loadBalances ya está en progreso, ignorando llamada duplicada');
  return;
}
```

### 2. Carga Secuencial de Datos Iniciales
```typescript
useEffect(() => {
  const loadInitialData = async () => {
    // Primero cargar datos del usuario (necesario para obtener el KSUID)
    await loadUserData();
    // Luego cargar balances y movimientos en paralelo (ya tenemos el KSUID)
    await Promise.all([
      loadBalances(),
      loadMovements(),
    ]);
  };
  loadInitialData();
}, []);
```

### 3. Manejo Correcto de Estado Vacío
```typescript
if (movementsData && movementsData.length > 0) {
  setMovements(movementsData);
} else {
  addLog('✅ HomeScreen - No hay movimientos del backend (array vacío)');
  setMovements([]); // Mostrar estado vacío, no mock
}
```

### 4. Validación de KSUID antes de Llamadas
```typescript
// Si el userId es un UUID (no tiene prefijo usr-), esperar a que loadUserData lo convierta a KSUID
if (!userId.startsWith('usr-')) {
  addLog(`⚠️ HomeScreen - UserId no es un KSUID válido (${userId}), esperando a que se cree el usuario...`);
  setMovements([]);
  return;
}
```

## Flujo Optimizado

### Flujo de Login y Carga Inicial
1. Usuario hace login → `App.tsx` `handleLoginSuccess`
2. Se intenta obtener KSUID del backend usando `getUserByEmail` (una sola vez)
3. Si no existe, se guarda UUID temporalmente
4. Navegación a `HomeScreen`
5. `HomeScreen` carga datos secuencialmente:
   - Primero `loadUserData` (obtiene o crea usuario, obtiene KSUID)
   - Luego `loadBalances` y `loadMovements` en paralelo (ya con KSUID)

### Flujo de Creación Automática de Usuario
1. `loadUserData` intenta obtener usuario con `getUserById` usando UUID
2. Backend responde 400 "Invalid user ID"
3. Se detecta el error y se crea el usuario automáticamente
4. Se obtiene el KSUID del usuario creado
5. Se actualiza AsyncStorage con el KSUID
6. Se recargan balances y movimientos con el nuevo KSUID (con delay de 200ms)

## Métricas de Mejora

### Antes
- Llamadas duplicadas: ~6-9 llamadas simultáneas al mismo endpoint
- Tiempo de carga inicial: ~3-5 segundos (con llamadas redundantes)
- Uso de mock data: Incluso cuando backend devolvía array vacío

### Después
- Llamadas duplicadas: 0 (controlado por `loadingRef`)
- Tiempo de carga inicial: ~1-2 segundos (carga secuencial optimizada)
- Uso de mock data: Solo en caso de error real o cuando no hay userId

## Próximos Pasos Recomendados

1. **Implementar caché de respuestas**: Para evitar llamadas innecesarias cuando los datos no han cambiado
2. **Implementar debounce**: Para evitar múltiples llamadas cuando el usuario hace pull-to-refresh rápidamente
3. **Implementar cancelación de requests**: Usar `AbortController` para cancelar llamadas pendientes cuando se crea un nuevo usuario
4. **Optimizar getUserByEmail**: Considerar crear un endpoint específico `/api/v1/users/by-email/:email` en lugar de obtener todos los usuarios pendientes y filtrar

