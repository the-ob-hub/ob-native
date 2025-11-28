# Cambios Necesarios en el Backend: Contactos y Transferencias

Este documento detalla los cambios necesarios en el backend para soportar completamente el sistema de contactos y transferencias de la app nativa.

---

## 📋 Resumen Ejecutivo

La app nativa necesita un sistema completo de gestión de contactos que permita:
1. **Listar contactos recurrentes** (basados en historial de transacciones)
2. **Buscar usuarios/contactos** por teléfono, nombre, alias o CVU
3. **Agregar contactos manualmente** (con alias personalizado)
4. **Obtener información de usuarios** para transferencias
5. **Gestionar CVUs** de contactos externos

---

## 🎯 Endpoints Necesarios

### 1. GET /api/v1/contacts/recent

**Propósito**: Obtener contactos recurrentes (usuarios con los que se ha transferido recientemente)

**Query Parameters**:
- `currency` (opcional): Filtrar por moneda (`USDc`, `USD`, `UYU`)
- `limit` (opcional): Número máximo de contactos (default: 10)
- `days` (opcional): Días hacia atrás para considerar "reciente" (default: 35)

**Response**:
```json
{
  "success": true,
  "contacts": [
    {
      "contactId": "usr-35zd9Jx5qnvXYJ8mmXKk5hHLq5L",
      "cvu": "0001234567890123456789",
      "fullName": "Juan M. Alvarez",
      "alias": "Juan",
      "phone": "+59812345678",
      "avatar": null,
      "hasDolarApp": true,
      "isSaved": false,
      "metadata": {
        "transactionCount": 5,
        "lastTransactionDate": "2024-01-15T10:30:00Z",
        "firstTransactionDate": "2023-12-01T08:00:00Z",
        "totalAmount": 1500.50,
        "hasPreviousTransaction": true
      }
    }
  ]
}
```

**Lógica del Backend**:
1. Buscar en la tabla `movements` todos los movimientos de tipo `transfer_out` del usuario actual
2. Agrupar por `counterpart_user_id` o `counterpart_account`
3. Contar transacciones y obtener fechas
4. Obtener información del usuario destino si existe (`counterpart_user_id`)
5. Ordenar por fecha de última transacción (más reciente primero)
6. Aplicar filtros de moneda si se especifica
7. Limitar resultados según `limit`

**Tablas involucradas**:
- `movements` (para historial de transacciones)
- `users` (para información de usuarios destino)
- `contacts` (nueva tabla, ver más abajo)

---

### 2. GET /api/v1/contacts

**Propósito**: Obtener todos los contactos del usuario (recurrentes + guardados manualmente)

**Query Parameters**:
- `currency` (opcional): Filtrar por moneda
- `includeSaved` (opcional): Incluir contactos guardados manualmente (default: true)
- `includeHistory` (opcional): Incluir contactos con historial de transacciones (default: true)

**Response**:
```json
{
  "success": true,
  "contacts": [
    {
      "contactId": "usr-35zd9Jx5qnvXYJ8mmXKk5hHLq5L",
      "cvu": "0001234567890123456789",
      "fullName": "Juan M. Alvarez",
      "alias": "Juan",
      "phone": "+59812345678",
      "avatar": null,
      "hasDolarApp": true,
      "isSaved": true,
      "metadata": {
        "transactionCount": 5,
        "lastTransactionDate": "2024-01-15T10:30:00Z",
        "firstTransactionDate": "2023-12-01T08:00:00Z",
        "totalAmount": 1500.50,
        "hasPreviousTransaction": true
      }
    }
  ]
}
```

**Lógica del Backend**:
1. Combinar contactos de dos fuentes:
   - Contactos guardados manualmente (tabla `contacts`)
   - Contactos con historial de transacciones (tabla `movements`)
2. Aplicar filtros según parámetros
3. Ordenar por fecha de última transacción (más reciente primero)

---

### 3. GET /api/v1/contacts/search

**Propósito**: Buscar usuarios/contactos por teléfono, nombre, alias o CVU

**Query Parameters**:
- `query` (requerido): Término de búsqueda
- `currency` (opcional): Filtrar por moneda
- `limit` (opcional): Número máximo de resultados (default: 20)

**Response**:
```json
{
  "success": true,
  "results": {
    "contacts": [
      {
        "contactId": "usr-35zd9Jx5qnvXYJ8mmXKk5hHLq5L",
        "cvu": "0001234567890123456789",
        "fullName": "Juan M. Alvarez",
        "alias": "Juan",
        "phone": "+59812345678",
        "hasDolarApp": true,
        "hasPreviousTransaction": true,
        "lastTransactionDate": "2024-01-15T10:30:00Z"
      }
    ],
    "users": [
      {
        "contactId": "usr-ABC123xyz789",
        "fullName": "María González",
        "phone": "+59898765432",
        "hasDolarApp": true,
        "hasPreviousTransaction": false
      }
    ],
    "external": [
      {
        "cvu": "0009876543210987654321",
        "fullName": "Pedro Pérez",
        "hasDolarApp": false,
        "hasPreviousTransaction": true,
        "lastTransactionDate": "2024-01-10T14:20:00Z"
      }
    ]
  }
}
```

**Lógica del Backend**:
1. Buscar en tres categorías:
   - **contacts**: Usuarios con historial de transacciones que coincidan con la búsqueda
   - **users**: Usuarios registrados en la app que coincidan pero sin historial
   - **external**: CVUs externos con historial de transacciones
2. La búsqueda debe incluir:
   - Nombre completo (`full_name`)
   - Teléfono (`phone`)
   - Alias (si existe en tabla `contacts`)
   - CVU (`counterpart_account` en movements)
3. Ordenar resultados por relevancia (contactos con historial primero)

---

### 4. POST /api/v1/contacts

**Propósito**: Agregar un contacto manualmente (con alias personalizado)

**Request Body**:
```json
{
  "contactId": "usr-35zd9Jx5qnvXYJ8mmXKk5hHLq5L",
  "cvu": "0001234567890123456789",
  "alias": "Juan",
  "notes": "Amigo de trabajo"
}
```

**Response**:
```json
{
  "success": true,
  "contact": {
    "contactId": "usr-35zd9Jx5qnvXYJ8mmXKk5hHLq5L",
    "cvu": "0001234567890123456789",
    "fullName": "Juan M. Alvarez",
    "alias": "Juan",
    "phone": "+59812345678",
    "hasDolarApp": true,
    "isSaved": true
  }
}
```

**Lógica del Backend**:
1. Validar que se proporcione `contactId` o `cvu` (al menos uno)
2. Si se proporciona `contactId`, verificar que el usuario existe
3. Crear o actualizar registro en tabla `contacts`
4. Si el contacto ya existe, actualizar alias y notas
5. Retornar información completa del contacto

---

### 5. DELETE /api/v1/contacts/:contactId

**Propósito**: Eliminar un contacto guardado manualmente

**Response**:
```json
{
  "success": true
}
```

**Lógica del Backend**:
1. Buscar contacto en tabla `contacts` por ID o CVU
2. Eliminar registro (soft delete recomendado)
3. Retornar éxito

---

### 6. GET /api/v1/users/search

**Propósito**: Buscar usuarios por teléfono o email (para agregar como contacto)

**Query Parameters**:
- `phone` (opcional): Teléfono a buscar
- `email` (opcional): Email a buscar

**Response**:
```json
{
  "success": true,
  "user": {
    "id": "usr-35zd9Jx5qnvXYJ8mmXKk5hHLq5L",
    "fullName": "Juan M. Alvarez",
    "email": "juan@example.com",
    "phone": "+59812345678",
    "cvu": "0001234567890123456789"
  }
}
```

**Nota**: Este endpoint ya existe parcialmente (`GET /api/v1/users/pending-review`), pero necesita mejorarse para búsqueda específica.

---

## 🗄️ Estructura de Base de Datos

### Nueva Tabla: `contacts`

```sql
CREATE TABLE contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    contact_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    cvu VARCHAR(255),
    alias VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP,
    
    -- Constraints
    CONSTRAINT contacts_user_contact_unique UNIQUE (user_id, contact_user_id, cvu),
    CONSTRAINT contacts_has_contact_or_cvu CHECK (contact_user_id IS NOT NULL OR cvu IS NOT NULL)
);

CREATE INDEX idx_contacts_user_id ON contacts(user_id);
CREATE INDEX idx_contacts_contact_user_id ON contacts(contact_user_id);
CREATE INDEX idx_contacts_cvu ON contacts(cvu);
```

**Campos**:
- `id`: ID único del contacto guardado
- `user_id`: ID del usuario que guardó el contacto
- `contact_user_id`: ID del usuario contacto (si es usuario de la app)
- `cvu`: CVU del contacto (si es externo o para referencia)
- `alias`: Nombre personalizado que el usuario le dio al contacto
- `notes`: Notas adicionales del usuario
- `deleted_at`: Para soft delete

---

## 📊 Modelos Go Necesarios

### Contact Model

```go
package models

import (
    "time"
    "github.com/google/uuid"
    "gorm.io/gorm"
)

type Contact struct {
    ID            uuid.UUID      `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
    CreatedAt     time.Time      `json:"createdAt"`
    UpdatedAt     time.Time      `json:"updatedAt"`
    DeletedAt     gorm.DeletedAt `gorm:"index" json:"-"`

    UserID        uuid.UUID      `gorm:"type:uuid;not null;index" json:"userId"`
    ContactUserID *uuid.UUID     `gorm:"type:uuid;index" json:"contactUserId,omitempty"`
    CVU           *string        `gorm:"type:varchar(255);index" json:"cvu,omitempty"`
    Alias         *string        `gorm:"type:varchar(255)" json:"alias,omitempty"`
    Notes         *string        `gorm:"type:text" json:"notes,omitempty"`

    User          User           `gorm:"foreignKey:UserID;constraint:OnDelete:CASCADE" json:"-"`
    ContactUser   *User          `gorm:"foreignKey:ContactUserID;constraint:OnDelete:SET NULL" json:"-"`
}

func (Contact) TableName() string {
    return "contacts"
}
```

### Contact Response Models

```go
type ContactResponse struct {
    ContactID     *string    `json:"contactId,omitempty"`
    CVU           *string    `json:"cvu,omitempty"`
    FullName      string     `json:"fullName"`
    Alias         *string    `json:"alias,omitempty"`
    Phone         *string    `json:"phone,omitempty"`
    Avatar        *string    `json:"avatar,omitempty"`
    HasDolarApp   bool       `json:"hasDolarApp"`
    IsSaved       bool       `json:"isSaved"`
    Metadata      *ContactMetadata `json:"metadata,omitempty"`
}

type ContactMetadata struct {
    TransactionCount      int       `json:"transactionCount"`
    LastTransactionDate   *string   `json:"lastTransactionDate,omitempty"`
    FirstTransactionDate  *string   `json:"firstTransactionDate,omitempty"`
    TotalAmount           float64   `json:"totalAmount"`
    HasPreviousTransaction bool      `json:"hasPreviousTransaction"`
}

type CreateContactInput struct {
    ContactID *string `json:"contactId,omitempty"`
    CVU       *string `json:"cvu,omitempty"`
    Alias     *string `json:"alias,omitempty"`
    Notes     *string `json:"notes,omitempty"`
}
```

---

## 🔧 Cambios en TransferInput

El modelo `TransferInput` actual ya soporta `counterpartUserId` y `counterpartAccount`, pero necesita mejoras:

**Cambios Recomendados**:
1. ✅ Ya existe `CounterpartUserID` (UUID)
2. ✅ Ya existe `CounterpartAccount` (CVU)
3. ✅ Ya existe `CounterpartName` (nombre del destinatario)
4. ⚠️ **Necesario**: Validar que al menos uno de `CounterpartUserID` o `CounterpartAccount` esté presente
5. ⚠️ **Mejora**: Si se proporciona `CounterpartUserID`, obtener automáticamente `CounterpartName` de la tabla `users`

---

## 📝 Lógica de Implementación

### 1. Obtener Contactos Recurrentes

```go
func (s *contactService) GetRecentContacts(ctx context.Context, userID uuid.UUID, params RecentContactsParams) ([]ContactResponse, error) {
    // 1. Buscar movimientos de transfer_out del usuario
    movements, err := s.movementRepo.GetByUserAndType(ctx, userID, "transfer_out", params.Days)
    
    // 2. Agrupar por counterpart_user_id o counterpart_account
    contactMap := make(map[string]*ContactResponse)
    
    for _, movement := range movements {
        key := ""
        if movement.CounterpartUserID != nil {
            key = movement.CounterpartUserID.String()
        } else if movement.CounterpartAccount != nil {
            key = *movement.CounterpartAccount
        }
        
        if contact, exists := contactMap[key]; exists {
            // Actualizar metadata
            contact.Metadata.TransactionCount++
            // Actualizar fechas...
        } else {
            // Crear nuevo contacto
            contact := &ContactResponse{
                Metadata: &ContactMetadata{
                    TransactionCount: 1,
                    // ...
                },
            }
            contactMap[key] = contact
        }
    }
    
    // 3. Obtener información de usuarios destino
    for key, contact := range contactMap {
        if uuid, err := uuid.Parse(key); err == nil {
            // Es un user_id, obtener información del usuario
            user, err := s.userRepo.GetByID(ctx, uuid)
            if err == nil {
                contact.FullName = user.FullName
                contact.Phone = &user.Phone
                contact.HasDolarApp = true
            }
        }
    }
    
    // 4. Ordenar por fecha de última transacción
    // 5. Aplicar límite
    // 6. Retornar
}
```

### 2. Buscar Contactos

```go
func (s *contactService) SearchContacts(ctx context.Context, userID uuid.UUID, query string) (*SearchContactsResponse, error) {
    queryLower := strings.ToLower(query)
    
    // 1. Buscar en usuarios por nombre, teléfono, email
    users, _ := s.userRepo.Search(ctx, queryLower)
    
    // 2. Buscar en movimientos por counterpart_account (CVU)
    movements, _ := s.movementRepo.SearchByAccount(ctx, userID, query)
    
    // 3. Separar en categorías:
    //    - contacts: usuarios con historial
    //    - users: usuarios sin historial
    //    - external: CVUs externos
    
    // 4. Retornar resultados
}
```

---

## ✅ Checklist de Implementación

### Fase 1: Base de Datos
- [ ] Crear tabla `contacts`
- [ ] Crear índices necesarios
- [ ] Crear migración SQL

### Fase 2: Modelos Go
- [ ] Crear modelo `Contact`
- [ ] Crear modelos de respuesta (`ContactResponse`, `ContactMetadata`)
- [ ] Crear modelos de input (`CreateContactInput`)

### Fase 3: Repositorios
- [ ] Crear `ContactRepository` con métodos CRUD
- [ ] Agregar métodos de búsqueda en `MovementRepository`
- [ ] Agregar métodos de búsqueda en `UserRepository`

### Fase 4: Servicios
- [ ] Crear `ContactService` con lógica de negocio
- [ ] Implementar `GetRecentContacts`
- [ ] Implementar `GetAllContacts`
- [ ] Implementar `SearchContacts`
- [ ] Implementar `CreateContact`
- [ ] Implementar `DeleteContact`

### Fase 5: Handlers
- [ ] Crear `ContactHandler`
- [ ] Implementar `GET /api/v1/contacts/recent`
- [ ] Implementar `GET /api/v1/contacts`
- [ ] Implementar `GET /api/v1/contacts/search`
- [ ] Implementar `POST /api/v1/contacts`
- [ ] Implementar `DELETE /api/v1/contacts/:contactId`

### Fase 6: Mejoras en Transferencias
- [ ] Validar `TransferInput` (al menos uno de `counterpartUserId` o `counterpartAccount`)
- [ ] Obtener automáticamente `counterpartName` si se proporciona `counterpartUserId`
- [ ] Actualizar historial de contactos después de transferencia exitosa

### Fase 7: Testing
- [ ] Tests unitarios para repositorios
- [ ] Tests unitarios para servicios
- [ ] Tests de integración para handlers
- [ ] Tests end-to-end con la app nativa

---

## 🔍 Consideraciones Adicionales

### 1. Privacidad
- Los usuarios solo pueden ver contactos con los que han interactuado
- No se debe exponer información sensible de otros usuarios
- Validar permisos en cada endpoint

### 2. Performance
- Usar índices apropiados en `movements` (por `user_id`, `counterpart_user_id`, `counterpart_account`)
- Considerar caché para contactos recurrentes
- Paginación para listados grandes

### 3. CVU
- El CVU debe ser único por usuario
- Necesitamos un endpoint para obtener el CVU del usuario actual
- El CVU puede ser usado para transferencias externas

### 4. Migración de Datos
- Si hay datos históricos de transferencias, pueden usarse para poblar contactos recurrentes
- Considerar un script de migración para contactos existentes

---

## 📞 Notas Finales

- Los endpoints deben seguir el formato de respuesta estándar: `{ success: boolean, data: any, error?: string }`
- Todos los endpoints deben validar que el usuario esté autenticado
- Los userIds pueden ser UUID o KSUID (con prefijo `usr-`), el backend debe manejar ambos
- Los timestamps deben estar en formato ISO 8601
- Los montos deben ser strings (decimal.Decimal en Go)

---

**Última actualización**: 2025-01-XX
**Prioridad**: 🔴 Alta (requerido para funcionalidad completa de transferencias)

