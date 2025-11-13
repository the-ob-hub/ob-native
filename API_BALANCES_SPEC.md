# API Specification: User Balances

## Endpoint
```
GET /api/v1/users/:userId/balances
```

## Request

### Headers
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

### Path Parameters
- `userId` (string, required): ID del usuario autenticado

### Example Request
```
GET /api/v1/users/123e4567-e89b-12d3-a456-426614174000/balances
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## Response

### Success Response (200 OK)

**Content-Type:** `application/json`

**Schema:**
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

### Response Fields

#### Root Object
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `balances` | `Balance[]` | Yes | Array de balances del usuario |

#### Balance Object
| Field | Type | Required | Description | Constraints |
|-------|------|----------|-------------|-------------|
| `currency` | `string` | Yes | Código de moneda | Must be one of: `"UYU"`, `"USD"`, `"USDc"` |
| `amount` | `number` | Yes | Monto del balance | Decimal number, >= 0 |
| `availableActions` | `string[]` | Yes | Acciones disponibles para esta moneda | Array of action IDs |

#### Action IDs
Valid values for `availableActions`:
- `"agregar"` - Agregar fondos
- `"enviar"` - Enviar dinero
- `"exchange"` - Intercambiar moneda
- `"pagar"` - Pagar con esta moneda

---

## Important Requirements

### 1. Order of Balances
**CRITICAL:** Los balances DEBEN venir en este orden exacto:
1. **UYU** (Pesos Uruguayos) - Primero
2. **USD** (Dólares) - Segundo
3. **USDc** (USD Coin) - Tercero

El orden es importante para la UX del swipe entre balances.

### 2. Currency Codes
- Use exact strings: `"UYU"`, `"USD"`, `"USDc"` (case-sensitive)
- No usar códigos alternativos como `"ARS"`, `"PESOS"`, etc.

### 3. Amount Format
- Must be a **number** (not string)
- Decimal precision: 2 decimal places
- Example: `1250.36` ✅ (not `"1250.36"` ❌)

### 4. Available Actions per Currency

**UYU (Pesos):**
```json
{
  "currency": "UYU",
  "availableActions": ["agregar", "pagar", "exchange"]
}
```
- ✅ agregar
- ✅ pagar
- ✅ exchange
- ❌ enviar (no disponible para pesos)

**USD (Dólares):**
```json
{
  "currency": "USD",
  "availableActions": ["agregar", "enviar", "exchange"]
}
```
- ✅ agregar
- ✅ enviar
- ✅ exchange
- ❌ pagar (no disponible para dólares)

**USDc (USD Coin):**
```json
{
  "currency": "USDc",
  "availableActions": ["agregar", "enviar", "exchange", "pagar"]
}
```
- ✅ agregar
- ✅ enviar
- ✅ exchange
- ✅ pagar (todas las acciones disponibles)

---

## Error Responses

### 401 Unauthorized
```json
{
  "error": "Unauthorized",
  "message": "Invalid or missing authentication token"
}
```

### 404 Not Found
```json
{
  "error": "Not Found",
  "message": "User not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal Server Error",
  "message": "An error occurred while fetching balances"
}
```

### Empty Balances (200 OK)
Si el usuario no tiene balances, retornar array vacío:
```json
{
  "balances": []
}
```

---

## Example Responses

### Example 1: User with all balances
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

### Example 2: User with only USDc balance
```json
{
  "balances": [
    {
      "currency": "USDc",
      "amount": 5000.00,
      "availableActions": ["agregar", "enviar", "exchange", "pagar"]
    }
  ]
}
```

### Example 3: User with zero balances
```json
{
  "balances": []
}
```

---

## TypeScript Interface (for reference)

```typescript
type Currency = 'UYU' | 'USD' | 'USDc';
type ActionId = 'agregar' | 'enviar' | 'exchange' | 'pagar';

interface Balance {
  currency: Currency;
  amount: number;
  availableActions: ActionId[];
}

interface BalancesResponse {
  balances: Balance[];
}
```

---

## Testing Examples

### cURL Example
```bash
curl -X GET \
  'https://api.example.com/api/v1/users/123e4567-e89b-12d3-a456-426614174000/balances' \
  -H 'Authorization: Bearer YOUR_ACCESS_TOKEN' \
  -H 'Content-Type: application/json'
```

### Postman Collection
```json
{
  "info": {
    "name": "Get User Balances",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Get Balances",
      "request": {
        "method": "GET",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{access_token}}"
          }
        ],
        "url": {
          "raw": "{{base_url}}/api/v1/users/:userId/balances",
          "host": ["{{base_url}}"],
          "path": ["api", "v1", "users", ":userId", "balances"],
          "variable": [
            {
              "key": "userId",
              "value": "123e4567-e89b-12d3-a456-426614174000"
            }
          ]
        }
      }
    }
  ]
}
```

---

## Notes for Backend Developer

1. **Order is critical**: Always return balances in order: UYU → USD → USDc
2. **Amount as number**: Never return amount as string, always as number
3. **Available actions**: Each currency has specific available actions (see section 4)
4. **Empty array**: If user has no balances, return `{"balances": []}` not `null` or error
5. **Authentication**: Endpoint requires valid Bearer token
6. **User validation**: Verify userId exists and belongs to authenticated user

---

## Frontend Integration

The frontend expects this exact structure. Any deviation will cause issues with:
- Balance ordering in swipe
- Action button visibility
- Balance display

Please ensure the API matches this specification exactly.

