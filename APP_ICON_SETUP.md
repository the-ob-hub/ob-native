# Configuración del Icono de la App

El icono de la app es el mismo que se usa para el agente: **círculo azul con degradado y dos ojitos blancos**.

## Componente React

El componente `AppIcon.tsx` está disponible en `src/components/AppIcon.tsx` y puede ser usado para renderizar el icono en la app.

## Generar Iconos para Android e iOS

### Opción 1: Usar herramienta online (Recomendado)

1. Abre el archivo `assets/app-icon.svg` en un navegador o editor de imágenes
2. Exporta como PNG a tamaño 1024x1024
3. Ve a https://www.appicon.co/ o https://appicon.build/
4. Sube la imagen PNG de 1024x1024
5. Descarga el paquete generado
6. Reemplaza los archivos en:
   - `android/app/src/main/res/mipmap-*/ic_launcher.png` (y `ic_launcher_round.png`)
   - `ios/obnative/Images.xcassets/AppIcon.appiconset/`

### Opción 2: Generar manualmente

#### Android

Reemplaza los archivos en las siguientes carpetas con imágenes PNG del tamaño correspondiente:

- `mipmap-mdpi/`: 48x48 px
- `mipmap-hdpi/`: 72x72 px
- `mipmap-xhdpi/`: 96x96 px
- `mipmap-xxhdpi/`: 144x144 px
- `mipmap-xxxhdpi/`: 192x192 px

Archivos a reemplazar:
- `ic_launcher.png`
- `ic_launcher_round.png`

#### iOS

Reemplaza los archivos en `ios/obnative/Images.xcassets/AppIcon.appiconset/`:

- `Icon-App-20x20@2x.png`: 40x40 px
- `Icon-App-20x20@3x.png`: 60x60 px
- `Icon-App-29x29@2x.png`: 58x58 px
- `Icon-App-29x29@3x.png`: 87x87 px
- `Icon-App-40x40@2x.png`: 80x80 px
- `Icon-App-40x40@3x.png`: 120x120 px
- `Icon-App-60x60@2x.png`: 120x120 px
- `Icon-App-60x60@3x.png`: 180x180 px
- `Icon-App-1024x1024.png`: 1024x1024 px (App Store)

### Opción 3: Usar ImageMagick (línea de comandos)

```bash
# Instalar ImageMagick (si no está instalado)
# macOS: brew install imagemagick
# Linux: sudo apt-get install imagemagick

# Convertir SVG a PNG base
convert assets/app-icon.svg -resize 1024x1024 assets/app-icon-1024.png

# Generar tamaños para Android
convert assets/app-icon-1024.png -resize 48x48 android/app/src/main/res/mipmap-mdpi/ic_launcher.png
convert assets/app-icon-1024.png -resize 72x72 android/app/src/main/res/mipmap-hdpi/ic_launcher.png
convert assets/app-icon-1024.png -resize 96x96 android/app/src/main/res/mipmap-xhdpi/ic_launcher.png
convert assets/app-icon-1024.png -resize 144x144 android/app/src/main/res/mipmap-xxhdpi/ic_launcher.png
convert assets/app-icon-1024.png -resize 192x192 android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png

# Copiar para versión round (si es necesario)
cp android/app/src/main/res/mipmap-*/ic_launcher.png android/app/src/main/res/mipmap-*/ic_launcher_round.png

# Generar tamaños para iOS
convert assets/app-icon-1024.png -resize 40x40 ios/obnative/Images.xcassets/AppIcon.appiconset/Icon-App-20x20@2x.png
convert assets/app-icon-1024.png -resize 60x60 ios/obnative/Images.xcassets/AppIcon.appiconset/Icon-App-20x20@3x.png
convert assets/app-icon-1024.png -resize 58x58 ios/obnative/Images.xcassets/AppIcon.appiconset/Icon-App-29x29@2x.png
convert assets/app-icon-1024.png -resize 87x87 ios/obnative/Images.xcassets/AppIcon.appiconset/Icon-App-29x29@3x.png
convert assets/app-icon-1024.png -resize 80x80 ios/obnative/Images.xcassets/AppIcon.appiconset/Icon-App-40x40@2x.png
convert assets/app-icon-1024.png -resize 120x120 ios/obnative/Images.xcassets/AppIcon.appiconset/Icon-App-40x40@3x.png
convert assets/app-icon-1024.png -resize 120x120 ios/obnative/Images.xcassets/AppIcon.appiconset/Icon-App-60x60@2x.png
convert assets/app-icon-1024.png -resize 180x180 ios/obnative/Images.xcassets/AppIcon.appiconset/Icon-App-60x60@3x.png
cp assets/app-icon-1024.png ios/obnative/Images.xcassets/AppIcon.appiconset/Icon-App-1024x1024.png
```

## Verificar

Después de reemplazar los iconos:

1. **Android**: Limpia y reconstruye la app
   ```bash
   cd android && ./gradlew clean && cd ..
   npx react-native run-android
   ```

2. **iOS**: Limpia el build y reconstruye
   ```bash
   cd ios && xcodebuild clean && cd ..
   npx react-native run-ios
   ```

## Notas

- El icono debe tener esquinas redondeadas automáticamente en ambos sistemas
- Asegúrate de que el fondo sea transparente o del color del degradado azul
- Los ojitos deben ser blancos (#FFFFFF) y estar bien centrados

