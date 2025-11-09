/**
 * Generador de datos aleatorios válidos para onboarding
 * Genera datos compatibles con las validaciones del backend
 * Retorna exactamente el formato OnboardingSubmitRequest requerido por la API
 */
import { OnboardingSubmitRequest, Address } from '../services/api/onboardingService';

const FIRST_NAMES = [
  'Juan', 'María', 'Carlos', 'Ana', 'Luis', 'Laura', 'Diego', 'Sofía',
  'Pedro', 'Carmen', 'Miguel', 'Elena', 'José', 'Patricia', 'Fernando', 'Lucía',
  'Roberto', 'Andrea', 'Ricardo', 'Valentina', 'Alejandro', 'Camila', 'Daniel', 'Isabella'
];

const LAST_NAMES = [
  'García', 'Rodríguez', 'González', 'Fernández', 'López', 'Martínez', 'Sánchez', 'Pérez',
  'Gómez', 'Martín', 'Jiménez', 'Ruiz', 'Hernández', 'Díaz', 'Moreno', 'Álvarez',
  'Muñoz', 'Romero', 'Alonso', 'Gutiérrez', 'Navarro', 'Torres', 'Domínguez', 'Vázquez'
];

const COUNTRIES = [
  'Argentina', 'Uruguay', 'Chile', 'Paraguay', 'Brasil', 'España', 'México', 'Colombia'
];

const DOCUMENT_TYPES = ['DNI', 'CI', 'Pasaporte'];

const STREETS = [
  'Av. Corrientes', 'Av. Santa Fe', 'Av. Córdoba', 'Av. Cabildo', 'Av. Rivadavia',
  'Calle Florida', 'Calle Lavalle', 'Calle San Martín', 'Calle Reconquista', 'Calle Maipú'
];

const CITIES = [
  'Buenos Aires', 'Córdoba', 'Rosario', 'Mendoza', 'La Plata', 'Tucumán', 'Mar del Plata', 'Salta'
];

/**
 * Genera un número aleatorio entre min y max (inclusive)
 */
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Selecciona un elemento aleatorio de un array
 */
function randomElement<T>(array: T[]): T {
  return array[randomInt(0, array.length - 1)];
}

/**
 * Genera un número de documento válido (8 dígitos para DNI)
 */
function generateDocumentNumber(): string {
  return String(randomInt(10000000, 99999999));
}

/**
 * Genera un email válido
 */
function generateEmail(firstName: string, lastName: string): string {
  const domains = ['gmail.com', 'hotmail.com', 'yahoo.com', 'outlook.com', 'ondabank.com'];
  const name = `${firstName.toLowerCase()}.${lastName.toLowerCase()}`;
  const randomNum = randomInt(1, 999);
  const domain = randomElement(domains);
  return `${name}${randomNum}@${domain}`;
}

/**
 * Genera un teléfono argentino válido
 */
function generatePhone(): string {
  const areaCode = randomInt(11, 15); // Códigos de área comunes en Argentina
  const firstPart = randomInt(1000, 9999);
  const secondPart = randomInt(1000, 9999);
  return `+54 9 ${areaCode} ${firstPart}-${secondPart}`;
}

/**
 * Genera una fecha de nacimiento válida (mayor de 18 años)
 * Formato ISO 8601 con hora: YYYY-MM-DDTHH:mm:ssZ
 */
function generateBirthDate(): string {
  const currentYear = new Date().getFullYear();
  const minYear = currentYear - 80; // Máximo 80 años
  const maxYear = currentYear - 18; // Mínimo 18 años
  const year = randomInt(minYear, maxYear);
  const month = randomInt(1, 12);
  const daysInMonth = new Date(year, month, 0).getDate();
  const day = randomInt(1, daysInMonth);
  
  // Generar hora aleatoria
  const hour = randomInt(0, 23);
  const minute = randomInt(0, 59);
  const second = randomInt(0, 59);
  
  // Formatear como ISO 8601: YYYY-MM-DDTHH:mm:ssZ
  const monthStr = String(month).padStart(2, '0');
  const dayStr = String(day).padStart(2, '0');
  const hourStr = String(hour).padStart(2, '0');
  const minuteStr = String(minute).padStart(2, '0');
  const secondStr = String(second).padStart(2, '0');
  
  // Formato ISO 8601: YYYY-MM-DDTHH:mm:ssZ (UTC)
  // El backend espera formato con hora, por ejemplo: "2006-01-02T15:04:05Z07:00"
  // Usamos formato básico primero: YYYY-MM-DDTHH:mm:ssZ
  // Si el backend requiere offset, se puede cambiar a: YYYY-MM-DDTHH:mm:ss+00:00
  return `${year}-${monthStr}-${dayStr}T${hourStr}:${minuteStr}:${secondStr}Z`;
}

/**
 * Genera una dirección válida argentina como objeto estructurado
 */
function generateAddress(): Address {
  const street = randomElement(STREETS);
  const number = String(randomInt(100, 9999));
  const city = randomElement(CITIES);
  const postalCode = String(randomInt(1000, 9999)).padStart(4, '0') + String(randomInt(0, 9));
  
  const provinces = [
    'Buenos Aires', 'Córdoba', 'Santa Fe', 'Mendoza', 'Tucumán',
    'Salta', 'Entre Ríos', 'Misiones', 'Corrientes', 'Chaco'
  ];
  
  return {
    street,
    number,
    city,
    postalCode,
    province: randomElement(provinces),
    country: 'Argentina',
  };
}

/**
 * Genera datos de usuario aleatorios pero válidos
 * Retorna exactamente el formato OnboardingSubmitRequest requerido por la API
 */
export function generateRandomUserData(): OnboardingSubmitRequest {
  const firstName = randomElement(FIRST_NAMES);
  const lastName = randomElement(LAST_NAMES);
  const secondLastName = Math.random() > 0.5 ? ` ${randomElement(LAST_NAMES)}` : '';
  const fullName = `${firstName} ${lastName}${secondLastName}`;
  
  const documentType = randomElement(DOCUMENT_TYPES);
  const documentNumber = generateDocumentNumber();
  const email = generateEmail(firstName, lastName);
  const phone = generatePhone();
  const birthDate = generateBirthDate();
  const nationality = randomElement(COUNTRIES);
  const address = generateAddress();
  const countryOfResidence = randomElement(COUNTRIES);
  const countryOfFundsOrigin = randomElement(COUNTRIES);
  
  // isPEP: mayormente false (90% de probabilidad)
  const isPEP = Math.random() < 0.1;

  return {
    fullName,
    email,
    phone,
    documentType,
    documentNumber,
    birthDate,
    nationality,
    address,
    countryOfResidence,
    countryOfFundsOrigin,
    isPEP,
  };
}

