#!/bin/bash

# Script para validar la especificación OpenAPI
# Uso: ./validate-openapi.sh

echo "🔍 Validando especificación OpenAPI..."
echo ""

# Verificar que el archivo existe
if [ ! -f "openapi-balances.yaml" ]; then
    echo "❌ Error: openapi-balances.yaml no encontrado"
    exit 1
fi

# Verificar sintaxis YAML básica
echo "1️⃣ Verificando sintaxis YAML..."
if command -v yamllint &> /dev/null; then
    yamllint openapi-balances.yaml && echo "✅ Sintaxis YAML válida" || echo "⚠️  Advertencias en YAML"
else
    echo "⚠️  yamllint no instalado, saltando validación YAML"
fi

# Verificar estructura básica de OpenAPI
echo ""
echo "2️⃣ Verificando estructura OpenAPI..."
if grep -q "openapi: 3.0" openapi-balances.yaml; then
    echo "✅ Versión OpenAPI 3.0 detectada"
else
    echo "❌ No se detectó OpenAPI 3.0"
    exit 1
fi

if grep -q "paths:" openapi-balances.yaml; then
    echo "✅ Sección 'paths' encontrada"
else
    echo "❌ Sección 'paths' no encontrada"
    exit 1
fi

if grep -q "components:" openapi-balances.yaml; then
    echo "✅ Sección 'components' encontrada"
else
    echo "❌ Sección 'components' no encontrada"
    exit 1
fi

# Verificar endpoints críticos
echo ""
echo "3️⃣ Verificando endpoints..."
if grep -q "/users/{userId}/balances" openapi-balances.yaml; then
    echo "✅ Endpoint /users/{userId}/balances encontrado"
else
    echo "❌ Endpoint no encontrado"
    exit 1
fi

# Verificar schemas críticos
echo ""
echo "4️⃣ Verificando schemas..."
if grep -q "BalancesResponse" openapi-balances.yaml; then
    echo "✅ Schema BalancesResponse encontrado"
else
    echo "❌ Schema BalancesResponse no encontrado"
    exit 1
fi

if grep -q "Balance:" openapi-balances.yaml; then
    echo "✅ Schema Balance encontrado"
else
    echo "❌ Schema Balance no encontrado"
    exit 1
fi

if grep -q "Currency:" openapi-balances.yaml; then
    echo "✅ Schema Currency encontrado"
else
    echo "❌ Schema Currency no encontrado"
    exit 1
fi

# Verificar orden de balances
echo ""
echo "5️⃣ Verificando orden de balances (UYU → USD → USDc)..."
if grep -A 5 "balances:" openapi-balances.yaml | grep -q "UYU.*USD.*USDc\|UYU.*USDc.*USD" 2>/dev/null; then
    echo "✅ Orden de balances documentado"
else
    echo "⚠️  Verifica que el orden esté documentado correctamente"
fi

echo ""
echo "✅ Validación básica completada"
echo ""
echo "📋 Próximos pasos:"
echo "   1. Valida online en: https://editor.swagger.io/"
echo "   2. Importa en Postman para probar"
echo "   3. Comparte con el backend developer"
echo ""
echo "💡 Para validación completa online:"
echo "   - Abre https://editor.swagger.io/"
echo "   - Pega el contenido de openapi-balances.yaml"
echo "   - Revisa errores y advertencias"

