/**
 * Script temporal para eliminar un usuario del backend
 * Ejecutar con: node scripts/deleteUser.js
 */

const BASE_URL = 'http://oobnk.com';

async function deleteUserByEmail(email) {
  try {
    console.log(`🗑️ Intentando eliminar usuario con email: ${email}`);
    
    // Intentar DELETE con email en el body
    const response = await fetch(`${BASE_URL}/api/v1/users`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: email }),
    });

    const data = await response.json();
    console.log(`📊 Status: ${response.status}`);
    console.log(`📊 Response:`, JSON.stringify(data, null, 2));

    if (data.success) {
      console.log(`✅ Usuario eliminado exitosamente`);
      return true;
    } else {
      console.log(`❌ Error: ${data.error || 'Error desconocido'}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Error al eliminar usuario:`, error.message);
    return false;
  }
}

async function deleteUserById(userId) {
  try {
    console.log(`🗑️ Intentando eliminar usuario con ID: ${userId}`);
    
    // Intentar DELETE con userId en el body
    const response = await fetch(`${BASE_URL}/api/v1/users`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId: userId }),
    });

    const data = await response.json();
    console.log(`📊 Status: ${response.status}`);
    console.log(`📊 Response:`, JSON.stringify(data, null, 2));

    if (data.success) {
      console.log(`✅ Usuario eliminado exitosamente`);
      return true;
    } else {
      console.log(`❌ Error: ${data.error || 'Error desconocido'}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Error al eliminar usuario:`, error.message);
    return false;
  }
}

// Ejecutar
const email = 'diego.burgos@gmail.com';
const userId = '3eee78ba-122f-4430-9b11-87939509a9ec';

console.log('='.repeat(60));
console.log('ELIMINANDO USUARIO DEL BACKEND');
console.log('='.repeat(60));

// Intentar por email
deleteUserByEmail(email).then((success) => {
  if (!success) {
    // Si falla por email, intentar por ID
    console.log('\n' + '='.repeat(60));
    console.log('Intentando por ID...');
    console.log('='.repeat(60));
    deleteUserById(userId);
  }
});

