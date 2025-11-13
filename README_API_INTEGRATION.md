# API Integration Guide - Balances Endpoint

## 📋 Overview

This document provides the professional API specification for the **User Balances** endpoint that needs to be implemented by the backend team.

## 🎯 Quick Start

**Endpoint:** `GET /api/v1/users/:userId/balances`

**Response Format:** JSON

**Authentication:** Bearer Token (JWT)

## 📄 Specification Files

We provide **three formats** for maximum compatibility:

1. **OpenAPI 3.0 Specification** (`openapi-balances.yaml`) - **RECOMMENDED**
   - Industry standard format
   - Can be imported into Swagger UI, Postman, Insomnia
   - Auto-generates client code
   - Validates requests/responses

2. **Markdown Documentation** (`API_BALANCES_SPEC.md`)
   - Human-readable format
   - Detailed examples and explanations

3. **TypeScript Interfaces** (`src/models/index.ts`)
   - Type definitions for frontend integration

## 🚀 How to Use

### Option 1: OpenAPI Specification (Recommended)

1. **View in Swagger UI:**
   ```bash
   # Install swagger-ui-cli
   npm install -g swagger-ui-cli
   
   # Serve the spec
   swagger-ui openapi-balances.yaml
   ```

2. **Import into Postman:**
   - Open Postman
   - Click Import → File → Select `openapi-balances.yaml`
   - Collection will be created automatically

3. **Generate Server Code:**
   ```bash
   # Using openapi-generator
   openapi-generator generate -i openapi-balances.yaml -g nodejs-express -o ./backend
   ```

### Option 2: Share the OpenAPI File

Simply share the `openapi-balances.yaml` file with the backend developer. They can:
- View it in any OpenAPI-compatible tool
- Use it to generate server stubs
- Validate their implementation against it

## ✅ Critical Requirements

### 1. Response Order (MANDATORY)
```json
{
  "balances": [
    { "currency": "UYU", ... },    // MUST be first
    { "currency": "USD", ... },    // MUST be second
    { "currency": "USDc", ... }    // MUST be third
  ]
}
```

### 2. Data Types
- `amount`: **number** (not string) - e.g., `1250.36` ✅ not `"1250.36"` ❌
- `currency`: **string** - exact values: `"UYU"`, `"USD"`, `"USDc"` (case-sensitive)
- `availableActions`: **string[]** - array of action IDs

### 3. Available Actions per Currency

| Currency | Available Actions |
|----------|-------------------|
| UYU | `["agregar", "pagar", "exchange"]` |
| USD | `["agregar", "enviar", "exchange"]` |
| USDc | `["agregar", "enviar", "exchange", "pagar"]` |

## 📝 Example Request/Response

### Request
```http
GET /api/v1/users/123e4567-e89b-12d3-a456-426614174000/balances
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

### Response (200 OK)
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

## 🔍 Validation Checklist

Before marking the API as complete, verify:

- [ ] Endpoint returns 200 OK with valid JSON
- [ ] Balances are in correct order (UYU → USD → USDc)
- [ ] `amount` is a number type (not string)
- [ ] Currency codes are exact: "UYU", "USD", "USDc"
- [ ] Available actions match the currency requirements
- [ ] Empty balances return `{"balances": []}` (not null or error)
- [ ] Authentication is required (401 if missing/invalid)
- [ ] 404 returned if user not found
- [ ] Error responses follow the Error schema

## 📧 Communication Template

**Subject:** API Specification - User Balances Endpoint

**Body:**
```
Hi [Backend Developer],

I've prepared the API specification for the User Balances endpoint that we need for the mobile app.

📎 Attached Files:
- openapi-balances.yaml (OpenAPI 3.0 specification - recommended)
- API_BALANCES_SPEC.md (Detailed documentation)

🔗 You can:
1. Import openapi-balances.yaml into Swagger UI or Postman
2. Use it to generate server stubs
3. Validate your implementation

⚠️ Critical Requirements:
- Balances MUST be returned in order: UYU → USD → USDc
- Amount must be number type (not string)
- See API_BALANCES_SPEC.md for detailed requirements

Let me know if you have any questions!

Thanks,
[Your Name]
```

## 🛠️ Tools for Backend Developer

### Swagger UI (Visual Documentation)
```bash
docker run -p 8080:8080 -e SWAGGER_JSON=/api/openapi-balances.yaml -v $(pwd):/api swaggerapi/swagger-ui
```

### Postman (API Testing)
- Import `openapi-balances.yaml` directly
- Collection will be auto-generated

### Code Generation
```bash
# Node.js/Express
openapi-generator generate -i openapi-balances.yaml -g nodejs-express

# Python/Flask
openapi-generator generate -i openapi-balances.yaml -g python-flask

# Java/Spring
openapi-generator generate -i openapi-balances.yaml -g spring
```

## 📚 Additional Resources

- [OpenAPI Specification](https://swagger.io/specification/)
- [Swagger Editor](https://editor.swagger.io/) - Paste the YAML to visualize
- [Postman OpenAPI Import](https://learning.postman.com/docs/integrations/available-integrations/working-with-openAPI/)

---

**Questions?** Contact the frontend team or refer to `API_BALANCES_SPEC.md` for detailed explanations.

