/**
 * Script para agregar depósito al balance de un usuario
 * Uso: node scripts/addDeposit.js <userId> <amount> <currency>
 * Ejemplo: node scripts/addDeposit.js <uuid-del-usuario> 10 UYU
 * 
 * Para obtener el userId, puedes:
 * 1. Verlo en los logs de la app cuando haces login (sub de Cognito)
 * 2. O buscarlo en el backend por email
 */

const BASE_URL = 'http://ec2-34-224-57-79.compute-1.amazonaws.com:3000';

async function addDeposit(userId, amount, currency, jwtToken) {
  try {
    console.log(`\n💰 Agregando depósito de ${amount} ${currency} al usuario ${userId}\n`);

    const assetType = currency === 'USDc' ? 'crypto' : 'fiat';

    const payload = {
      assetCode: currency,
      assetType: assetType,
      amount: amount.toString(), // Backend espera string
      description: `Depósito de prueba - ${amount} ${currency}`,
    };

    console.log('📤 Payload:', JSON.stringify(payload, null, 2));
    console.log('🔐 JWT Token:', jwtToken ? jwtToken.substring(0, 30) + '...' : 'NO PROPORCIONADO');

    const response = await fetch(`${BASE_URL}/api/v1/users/${userId}/deposit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${jwtToken}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${JSON.stringify(data)}`);
    }

    console.log('\n✅ Depósito realizado exitosamente!');
    console.log('📊 Response:', JSON.stringify(data, null, 2));
    console.log('\n📱 Verifica los balances en la app para ver el cambio.\n');

  } catch (error) {
    console.error(`\n❌ Error: ${error.message}`);
    if (error.stack) console.error(`Stack: ${error.stack}\n`);
    process.exit(1);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.length < 3) {
    console.error('Uso: node scripts/addDeposit.js <userId> <amount> <currency> [jwtToken]');
    console.error('Ejemplo: node scripts/addDeposit.js <uuid> 10 UYU <jwt-token>');
    console.error('\nNota: Si no proporcionas el JWT, el script intentará obtenerlo de AsyncStorage');
    process.exit(1);
  }

  const userId = args[0];
  const amount = parseFloat(args[1]);
  const currency = args[2];
  const jwtToken = args[3]; // Opcional

  if (isNaN(amount)) {
    console.error('Error: El monto debe ser un número');
    process.exit(1);
  }

  if (!['UYU', 'USD', 'USDc'].includes(currency)) {
    console.error('Error: La moneda debe ser UYU, USD o USDc');
    process.exit(1);
  }

  if (!jwtToken) {
    console.error('Error: Debes proporcionar el JWT token');
    console.error('Puedes obtenerlo de los logs de la app o de AsyncStorage');
    process.exit(1);
  }

  addDeposit(userId, amount, currency, jwtToken);
}

