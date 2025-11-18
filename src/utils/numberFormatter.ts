/**
 * Utilidad para formatear números según el estándar de la app
 * - Miles con coma: 1,000
 * - Decimales con punto: 1,000.50
 */

export const formatCurrency = (value: number | string, showDecimals: boolean = true): string => {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(numValue)) {
    return '0';
  }

  // Separar parte entera y decimal
  const parts = numValue.toFixed(2).split('.');
  const integerPart = parts[0];
  const decimalPart = parts[1];

  // Formatear parte entera con comas para miles
  const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');

  if (showDecimals && decimalPart !== '00') {
    return `${formattedInteger}.${decimalPart}`;
  }
  
  return formattedInteger;
};

/**
 * Formatea un número para mostrar mientras se escribe (input)
 * - Miles con coma: 1,000
 * - Decimales con punto: 1,000.50
 */
export const formatAmountInput = (value: string): string => {
  if (!value) return '';
  
  // Separar parte entera y decimal
  const parts = value.split('.');
  const integerPart = parts[0].replace(/\D/g, ''); // Solo números
  const decimalPart = parts[1] || '';
  
  // Formatear parte entera con comas para miles
  const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  
  // Limitar decimales a 2
  const formattedDecimal = decimalPart.slice(0, 2);
  
  if (formattedDecimal) {
    return `${formattedInteger}.${formattedDecimal}`;
  }
  return formattedInteger;
};

/**
 * Separa un número formateado en parte entera y decimal para renderizar con diferentes tamaños
 * Retorna: { integer: "1,000", decimal: ".50" }
 */
export const splitFormattedAmount = (formattedValue: string): { integer: string; decimal: string } => {
  const parts = formattedValue.split('.');
  return {
    integer: parts[0] || '0',
    decimal: parts[1] ? `.${parts[1]}` : '',
  };
};

