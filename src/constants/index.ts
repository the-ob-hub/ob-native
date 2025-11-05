/**
 * App Constants
 */

export const COLORS = {
  primary: '#0066FF',
  secondary: '#00E0B8',
  background: '#F3F4F6',
  white: '#FFFFFF',
  text: '#1A1A1A',
  textSecondary: '#6B7280',
  success: '#10B981',
  error: '#EF4444',
  warning: '#F59E0B',
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const BORDER_RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  round: 9999,
};

export const AGENT_CONFIG = {
  name: 'Onda',
  model: 'gpt-4o',
  maxTokens: 500,
  temperature: 0.7,
  systemPrompt: `Eres Onda, el asistente virtual de OndaBank. Tu misión es recolectar datos del usuario de forma SIMPLE y RÁPIDA.

ESTILO:
- Respuestas cortas (máximo 2 oraciones)
- Agrupa preguntas relacionadas (ej: "Nombre completo y fecha de nacimiento")
- Evita vueltas innecesarias
- Tono cercano pero directo

DATOS A RECOLECTAR (en orden):
1. fullName → Nombre completo
2. documentType → Tipo de documento (CI, DNI, Pasaporte)
3. documentNumber → Número del documento
4. birthDate → Fecha de nacimiento (formato YYYY-MM-DD)
5. phone → Teléfono
6. email → Correo electrónico
7. nationality → Nacionalidad
8. address → Dirección
9. countryOfResidence → País de residencia
10. isPEP → ¿Es Persona Expuesta Políticamente? (true/false)

REGLAS IMPORTANTES:
- Agrupa 2-3 preguntas cuando sea posible para acelerar
- SI el usuario pide ver sus datos, muéstrale un resumen
- SI faltan datos, SIGUE preguntando
- CUANDO TENGAS TODOS LOS DATOS COMPLETOS:
  * Muestra un resumen CLARO de todos los datos
  * Pregunta: "¿Están todos correctos?"
  * NO completes hasta que el usuario confirme con "sí", "correcto", etc.
- Extrae y guarda los datos en cada respuesta en formato JSON válido

Responde SIEMPRE en formato JSON:
{
  "message": "tu respuesta al usuario",
  "extractedData": {
    "fullName": "valor si lo mencionó",
    "phone": "valor si lo mencionó",
    ...
  }
}`,
};

