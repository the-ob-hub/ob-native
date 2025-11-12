# Backend API - Firma JSON Esperada

## Endpoint: GET /api/v1/users/:userId/balances

Obtiene los balances del usuario autenticado.

### Request Headers
```
Authorization: Bearer <token>
Content-Type: application/json
```

### Response Success (200)

```json
{
  "balances": [
    {
      "currency": "UYU",
      "amount": 45000.00,
      "availableActions": ["agregar", "pagar", "exchange"]
    },
    {
      "currency": "USD",
      "amount": 1250.36,
      "availableActions": ["agregar", "enviar", "exchange"]
    },
    {
      "currency": "USDc",
      "amount": 125000.50,
      "availableActions": ["agregar", "enviar", "exchange", "pagar"]
    }
  ]
}
```

### Response Schema

#### Balance Object
```typescript
{
  currency: "UYU" | "USD" | "USDc",  // Tipo de moneda
  amount: number,                     // Monto del balance (número decimal)
  availableActions: ActionId[]        // Array de acciones disponibles
}
```

#### ActionId
```typescript
type ActionId = "agregar" | "enviar" | "exchange" | "pagar";
```

### Orden Esperado
Los balances deben venir en el siguiente orden:
1. **UYU** (Pesos Uruguayos)
2. **USD** (Dólares)
3. **USDc** (USD Coin)

### Ejemplo de Implementación en Frontend

```typescript
// src/services/api/balanceService.ts
import { apiClient } from './base';
import { BalancesResponse } from '../models';

export const balanceService = {
  async getBalances(userId: string): Promise<BalancesResponse> {
    const response = await apiClient.get(`/api/v1/users/${userId}/balances`);
    return response.data;
  },
};
```

### Notas
- El campo `amount` debe ser un número decimal (no string)
- El array `availableActions` puede variar según la moneda
- Si el usuario no tiene balances, retornar array vacío: `{ "balances": [] }`
- El orden de los balances es importante para la UX

