/**
 * Script para agregar depósito al balance de un usuario
 * Uso: ts-node scripts/addDeposit.ts <email> <amount> <currency>
 * Ejemplo: ts-node scripts/addDeposit.ts diego.burgos@gmail.com 10 UYU
 */

import { balanceService } from '../src/services/api/balanceService';
import { cognitoService } from '../src/services/auth/cognitoService';
import { logger } from '../src/utils/logger';

async function addDeposit(email: string, amount: number, currency: 'UYU' | 'USD' | 'USDc') {
  try {
    console.log(`\n💰 Agregando depósito de ${amount} ${currency} a ${email}\n`);

    // Obtener atributos del usuario de Cognito para obtener el UUID (sub)
    console.log('📧 Obteniendo UUID del usuario desde Cognito...');
    const attributes = await cognitoService.getUserAttributes();
    
    if (!attributes) {
      throw new Error('No se pudo obtener atributos del usuario. Asegúrate de estar logueado.');
    }

    const userId = attributes.sub || attributes['cognito:username'];
    if (!userId) {
      throw new Error('No se encontró UUID del usuario en los atributos de Cognito');
    }

    console.log(`✅ UUID obtenido: ${userId}`);
    console.log(`📧 Email: ${attributes.email || email}`);

    // Determinar assetType según currency
    const assetType = currency === 'USDc' ? 'crypto' : 'fiat';

    // Realizar depósito
    console.log(`\n💸 Realizando depósito...`);
    await balanceService.deposit(userId, {
      assetCode: currency,
      assetType: assetType,
      amount: amount,
      description: `Depósito de prueba - ${amount} ${currency}`,
    });

    console.log(`\n✅ Depósito realizado exitosamente!`);
    console.log(`\n📊 Verifica los balances en la app para ver el cambio.\n`);

  } catch (error: any) {
    console.error(`\n❌ Error: ${error.message}`);
    console.error(`Stack: ${error.stack || 'N/A'}\n`);
    process.exit(1);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.length < 3) {
    console.error('Uso: ts-node scripts/addDeposit.ts <email> <amount> <currency>');
    console.error('Ejemplo: ts-node scripts/addDeposit.ts diego.burgos@gmail.com 10 UYU');
    process.exit(1);
  }

  const email = args[0];
  const amount = parseFloat(args[1]);
  const currency = args[2] as 'UYU' | 'USD' | 'USDc';

  if (isNaN(amount)) {
    console.error('Error: El monto debe ser un número');
    process.exit(1);
  }

  if (!['UYU', 'USD', 'USDc'].includes(currency)) {
    console.error('Error: La moneda debe ser UYU, USD o USDc');
    process.exit(1);
  }

  addDeposit(email, amount, currency);
}

