/**
 * Script para generar el icono de la app desde el componente AppIcon
 * 
 * Este script requiere que tengas instalado:
 * - react-native-svg-cli: npm install -g react-native-svg-cli
 * - O puedes usar una herramienta online como https://www.appicon.co/
 * 
 * Para generar manualmente:
 * 1. Abre el componente AppIcon.tsx en la app
 * 2. Toma un screenshot del componente renderizado a tamaño 1024x1024
 * 3. Usa una herramienta como https://www.appicon.co/ para generar todos los tamaños
 * 4. Reemplaza los archivos en android/app/src/main/res/mipmap-*/ y ios/obnative/Images.xcassets/AppIcon.appiconset/
 */

const fs = require('fs');
const path = require('path');

console.log('📱 Generador de icono de app');
console.log('');
console.log('El icono de la app debe ser:');
console.log('- Círculo azul con degradado radial');
console.log('- Dos ojitos blancos verticales');
console.log('');
console.log('Para generar los iconos:');
console.log('1. Renderiza el componente AppIcon.tsx a tamaño 1024x1024');
console.log('2. Toma un screenshot o exporta como PNG');
console.log('3. Usa https://www.appicon.co/ o similar para generar todos los tamaños');
console.log('4. Reemplaza los archivos en:');
console.log('   - android/app/src/main/res/mipmap-*/ic_launcher.png');
console.log('   - ios/obnative/Images.xcassets/AppIcon.appiconset/');
console.log('');
console.log('Tamaños necesarios para Android:');
console.log('- mipmap-mdpi: 48x48');
console.log('- mipmap-hdpi: 72x72');
console.log('- mipmap-xhdpi: 96x96');
console.log('- mipmap-xxhdpi: 144x144');
console.log('- mipmap-xxxhdpi: 192x192');
console.log('');
console.log('Tamaños necesarios para iOS:');
console.log('- 20x20 (@2x = 40x40, @3x = 60x60)');
console.log('- 29x29 (@2x = 58x58, @3x = 87x87)');
console.log('- 40x40 (@2x = 80x80, @3x = 120x120)');
console.log('- 60x60 (@2x = 120x120, @3x = 180x180)');
console.log('- 1024x1024 (App Store)');







