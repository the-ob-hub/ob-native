# OndaBank Mobile App

Una aplicación móvil de banca digital con onboarding conversacional impulsado por IA.

## 🚀 Características

- ✅ **Onboarding Conversacional**: Chat con agente IA para recolectar datos del usuario
- ✅ **SQLite On-Device**: Persistencia de datos en el dispositivo
- ✅ **UI Moderna**: Diseño neumórfico con animaciones fluidas
- ✅ **Bottom Navigation**: Navegación animada entre secciones
- ✅ **Profile Sheet**: Modal deslizante con información completa del usuario
- ✅ **Splash Screen**: Pantalla de bienvenida animada
- ✅ **Demo Mode**: Botón para autocompletar datos de prueba

## 📱 Tecnologías

- **React Native 0.75.4** (sin Expo)
- **TypeScript**
- **SQLite** (react-native-sqlite-storage)
- **AsyncStorage** (@react-native-async-storage/async-storage)
- **React Navigation**
- **OpenAI GPT-4o** (opcional, funciona sin API key en modo simulado)

## 🛠️ Setup

### Prerequisitos

- Node.js 20+
- Xcode 15+ (para iOS)
- CocoaPods
- Watchman

### Instalación

1. Clonar el repositorio:
```bash
git clone <repo-url>
cd ob-native
```

2. Instalar dependencias:
```bash
npm install
```

3. Instalar pods (iOS):
```bash
cd ios
pod install
cd ..
```

4. Configurar variables de entorno (opcional):
```bash
cp .env.example .env
# Editar .env y agregar tu OPENAI_API_KEY si quieres usar el modo real
```

### Ejecutar en iOS

**Opción 1: Desde Xcode**
1. Abrir `ios/obnative.xcworkspace` en Xcode
2. Seleccionar tu dispositivo
3. Presionar ▶️ Run

**Opción 2: Desde terminal**
```bash
npx react-native run-ios --device "Nombre de tu iPhone"
```

### Ejecutar en Android (próximamente)
```bash
npx react-native run-android
```

## 🎯 Uso

### Testing Rápido

En la pantalla de onboarding, presiona el botón **"⚡ COMPLETAR AUTOMÁTICAMENTE"** para autocompletar con datos de prueba:
- Nombre: Diego S. Burgos
- DNI: 11111111
- Teléfono: +54 9 11 3188-5769
- Dirección: Melo 2883, Buenos Aires
- Residente de Argentina
- No PEP

### Flujo de la App

1. **Splash Screen** → Pantalla de bienvenida (2 seg)
2. **Onboarding** → Chat conversacional con Onda (agente IA)
3. **Congratulations** → Pantalla de confirmación (2 seg)
4. **Home** → Pantalla principal con navegación

### Estructura de Navegación

- **Home**: Dashboard principal
- **Tarjetas**: Gestión de tarjetas (próximamente)
- **Inversiones**: Portfolio de inversiones (próximamente)
- **Agent**: Chat con el asistente Onda

## 📁 Estructura del Proyecto

```
ob-native/
├── src/
│   ├── components/          # Componentes reutilizables
│   │   ├── BottomNav.tsx   # Navegación inferior animada
│   │   ├── ProfileSheet.tsx # Modal de perfil
│   │   ├── SkeletonScreen.tsx
│   │   └── UserAvatar.tsx
│   ├── constants/           # Constantes (colores, spacing, etc)
│   ├── data/                # Capa de datos
│   │   └── database.ts     # SQLite implementation
│   ├── features/
│   │   └── onboarding/
│   │       ├── agent/      # LLM Agent
│   │       └── ui/         # Componentes de onboarding
│   ├── models/             # TypeScript interfaces
│   ├── navigation/         # Navegación de la app
│   ├── screens/            # Pantallas principales
│   └── utils/              # Utilidades
├── ios/                    # Código nativo iOS
├── android/                # Código nativo Android
└── App.tsx                 # Entry point
```

## 🔧 Configuración

### iOS Deployment Target

El proyecto está configurado para iOS 15.1+. Esto se configura en `ios/Podfile`:

```ruby
platform :ios, '15.1'
```

### Watchman

El proyecto usa Watchman para file watching. La configuración está en `.watchmanconfig`:

```json
{
  "ignore_dirs": [
    "ios/Pods",
    "ios/build",
    "android/.gradle",
    "node_modules"
  ]
}
```

## 🤖 OpenAI Integration

Por defecto, la app funciona en **modo simulado** sin necesidad de API key. Para habilitar el modo real con OpenAI:

1. Agregar tu API key en `.env`:
```
OPENAI_API_KEY=sk-your-key-here
```

2. Descomentar el código en `src/features/onboarding/agent/llmAgent.ts`:
```typescript
// Cambiar:
const OPENAI_API_KEY: string | undefined = undefined;

// Por:
const OPENAI_API_KEY: string | undefined = OPENAI_API_KEY_ENV;
```

3. Recargar la app

## 📝 Datos Persistentes

La app usa dos métodos de persistencia:

1. **SQLite**: Para datos estructurados (usuarios, mensajes)
   - Ubicación: `Library/LocalDatabase/OndaBank.db`
   - Tablas: `users`, `messages`

2. **AsyncStorage**: Para sesión del usuario
   - Keys: `currentUserId`, `hasCompletedOnboarding`

## 🎨 UI/UX

### Colores Principales

- Primary: `#0066FF` (Azul)
- Secondary: `#00E0B8` (Turquesa)
- Background: `#F3F4F6`
- Text: `#1A1A1A`

### Animaciones

- Bottom Navigation con "bubble" effect
- Splash Screen con fade in/out
- Profile Sheet con slide up
- Skeleton loading con shimmer

## 🐛 Troubleshooting

### Error: EMFILE (too many open files)

Solución:
```bash
watchman shutdown-server
watchman watch-del-all
cd ios && pod install
```

### Error: AsyncStorage is null

Solución:
```bash
cd ios
pod install
# Luego rebuild desde Xcode
```

### Metro no responde

Solución:
```bash
pkill -f "node.*metro"
npm start -- --reset-cache
```

## 📄 Licencia

MIT

## 👨‍💻 Autor

Diego S. Burgos
