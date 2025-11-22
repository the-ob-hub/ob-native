/**
 * Script para agregar depósito al balance de un usuario por email
 * 
 * Uso: node scripts/addDepositToUser.js <email> <amount> <currency> <jwtToken>
 * Ejemplo: node scripts/addDepositToUser.js diego.burgos@gmail.com 10 UYU <jwt-token>
 * 
 * El script:
 * 1. Busca el usuario por email en el backend (si hay endpoint)
 * 2. O usa el JWT para obtener el userId del token
 * 3. Realiza el depósito
 */

const BASE_URL = 'http://ec2-34-224-57-79.compute-1.amazonaws.com:3000';

// Función para decodificar JWT y obtener el userId (sub)
function decodeJWT(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      Buffer.from(base64, 'base64')
        .toString()
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error decodificando JWT:', error.message);
    return null;
  }
}

async function findUserByEmail(email, jwtToken) {
  try {
    // Intentar obtener usuarios pendientes y buscar por email
    const response = await fetch(`${BASE_URL}/api/v1/users/pending-review`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${jwtToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const data = await response.json();
      if (data.success && data.data) {
        const user = data.data.find((u) => u.email === email);
        if (user) {
          return user.id;
        }
      }
    }
  } catch (error) {
    console.log('⚠️ No se pudo buscar por email, usando JWT');
  }
  return null;
}

async function addDeposit(email, amount, currency, jwtToken) {
  try {
    console.log(`\n💰 Agregando depósito de ${amount} ${currency} a ${email}\n`);

    // Intentar obtener userId del JWT
    const decoded = decodeJWT(jwtToken);
    let userId = decoded?.sub;

    if (!userId) {
      console.log('⚠️ No se encontró userId en JWT, buscando por email...');
      userId = await findUserByEmail(email, jwtToken);
    }

    if (!userId) {
      throw new Error('No se pudo obtener el userId. Verifica el JWT o que el usuario exista en el backend.');
    }

    console.log(`✅ UserId encontrado: ${userId}`);

    const assetType = currency === 'USDc' ? 'crypto' : 'fiat';

    const payload = {
      assetCode: currency,
      assetType: assetType,
      amount: amount.toString(), // Backend espera string
      description: `Depósito de prueba - ${amount} ${currency}`,
    };

    console.log('📤 Realizando depósito...');
    console.log('📋 Payload:', JSON.stringify(payload, null, 2));

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
  if (args.length < 4) {
    console.error('Uso: node scripts/addDepositToUser.js <email> <amount> <currency> <jwtToken>');
    console.error('Ejemplo: node scripts/addDepositToUser.js diego.burgos@gmail.com 10 UYU <jwt-token>');
    console.error('\nPara obtener el JWT:');
    console.error('1. Haz login en la app');
    console.error('2. Revisa los logs - verás el JWT guardado');
    console.error('3. O usa AsyncStorage.getItem("jwt_token") desde la app');
    process.exit(1);
  }

  const email = args[0];
  const amount = parseFloat(args[1]);
  const currency = args[2];
  const jwtToken = args[3];

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
    process.exit(1);
  }

  addDeposit(email, amount, currency, jwtToken);
}

