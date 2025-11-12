#!/bin/bash

echo "🧹 Limpiando caché y procesos..."

# Matar procesos
pkill -f "node.*metro" 2>/dev/null || true
pkill -f "react-native" 2>/dev/null || true

# Limpiar cachés
rm -rf node_modules/.cache 2>/dev/null || true
rm -rf /tmp/metro-* 2>/dev/null || true
rm -rf /tmp/haste-* 2>/dev/null || true
watchman watch-del-all 2>/dev/null || true

# Limpiar builds iOS
rm -rf ios/build 2>/dev/null || true
rm -rf ios/Pods/build 2>/dev/null || true

echo "✅ Limpieza completada"
echo ""
echo "📱 Para continuar:"
echo "1. Ejecuta: npm start -- --reset-cache"
echo "2. En otra terminal: npx react-native run-ios --device 'Diego 16'"
echo ""
echo "O desde Xcode:"
echo "- Abre ios/obnative.xcworkspace"
echo "- Product → Clean Build Folder (Shift+Cmd+K)"
echo "- Product → Build (Cmd+B)"
echo "- Ejecuta en dispositivo"

