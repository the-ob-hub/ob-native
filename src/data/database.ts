import SQLite from 'react-native-sqlite-storage';
import { User, Message } from '../models';
import { UserContact } from '../models/contacts';
import allContactsMock from '../mocks/allContacts.json';

SQLite.DEBUG(true);
SQLite.enablePromise(true);

/**
 * SQLite Database for React Native
 * Real persistence on device
 */
class Database {
  private db: SQLite.SQLiteDatabase | null = null;

  async init(): Promise<void> {
    try {
      this.db = await SQLite.openDatabase({
        name: 'OndaBank.db',
        location: 'default',
      });
      
      console.log('📦 Database opened successfully');
      
      // Create tables
      await this.createTables();
    } catch (error) {
      console.error('❌ Error opening database:', error);
      throw error;
    }
  }

  private async createTables(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    // Users table
    await this.db.executeSql(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        phone TEXT,
        email TEXT,
        fullName TEXT,
        documentType TEXT,
        documentNumber TEXT,
        birthDate TEXT,
        nationality TEXT,
        address TEXT,
        countryOfResidence TEXT,
        countryOfFundsOrigin TEXT,
        isPEP INTEGER DEFAULT 0,
        onboardingStatus TEXT DEFAULT 'in_progress',
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      );
    `);

    // Messages table
    await this.db.executeSql(`
      CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        userId TEXT NOT NULL,
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        metadata TEXT,
        FOREIGN KEY (userId) REFERENCES users(id)
      );
    `);

    // Contacts table
    await this.db.executeSql(`
      CREATE TABLE IF NOT EXISTS contacts (
        id TEXT PRIMARY KEY,
        contactId TEXT,
        cvu TEXT,
        fullName TEXT NOT NULL,
        alias TEXT,
        phone TEXT,
        avatar TEXT,
        hasDolarApp INTEGER DEFAULT 0,
        isSaved INTEGER DEFAULT 0,
        lastTransactionDate TEXT,
        transactionCount INTEGER DEFAULT 0,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      );
    `);

    // Crear índices para búsquedas rápidas
    await this.db.executeSql(`
      CREATE INDEX IF NOT EXISTS idx_contacts_contactId ON contacts(contactId);
    `);
    await this.db.executeSql(`
      CREATE INDEX IF NOT EXISTS idx_contacts_phone ON contacts(phone);
    `);
    await this.db.executeSql(`
      CREATE INDEX IF NOT EXISTS idx_contacts_cvu ON contacts(cvu);
    `);

    console.log('✅ Tables created successfully');
    
    // Migrar contactos del mock a la base si no existen
    await this.migrateContactsFromMock();
  }

  async createUser(user: User): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    await this.db.executeSql(
      `INSERT INTO users (
        id, phone, email, fullName, documentType, documentNumber,
        birthDate, nationality, address, countryOfResidence,
        countryOfFundsOrigin, isPEP, onboardingStatus, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        user.id,
        user.phone || null,
        user.email || null,
        user.fullName || null,
        user.documentType || null,
        user.documentNumber || null,
        user.birthDate || null,
        user.nationality || null,
        user.address || null,
        user.countryOfResidence || null,
        user.countryOfFundsOrigin || null,
        user.isPEP ? 1 : 0,
        user.onboardingStatus,
        user.createdAt,
        user.updatedAt,
      ]
    );

    console.log('✅ User created:', user.id);
  }

  async updateUser(userId: string, data: Partial<User>): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const fields: string[] = [];
    const values: any[] = [];

    Object.entries(data).forEach(([key, value]) => {
      if (key !== 'id' && value !== undefined) {
        fields.push(`${key} = ?`);
        if (key === 'isPEP') {
          values.push(value ? 1 : 0);
        } else {
          values.push(value);
        }
      }
    });

    fields.push('updatedAt = ?');
    values.push(new Date().toISOString());
    values.push(userId);

    await this.db.executeSql(
      `UPDATE users SET ${fields.join(', ')} WHERE id = ?`,
      values
    );

    console.log('✅ User updated:', userId);
  }

  async getUser(userId: string): Promise<User | null> {
    if (!this.db) throw new Error('Database not initialized');

    const results = await this.db.executeSql(
      'SELECT * FROM users WHERE id = ?',
      [userId]
    );

    if (results[0].rows.length === 0) {
      return null;
    }

    const row = results[0].rows.item(0);
    return {
      ...row,
      isPEP: row.isPEP === 1,
    };
  }

  async createMessage(message: Message): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    await this.db.executeSql(
      `INSERT INTO messages (id, userId, role, content, timestamp, metadata)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        message.id,
        message.userId,
        message.role,
        message.content,
        message.timestamp,
        message.metadata ? JSON.stringify(message.metadata) : null,
      ]
    );
  }

  async getMessages(userId: string): Promise<Message[]> {
    if (!this.db) throw new Error('Database not initialized');

    const results = await this.db.executeSql(
      'SELECT * FROM messages WHERE userId = ? ORDER BY timestamp ASC',
      [userId]
    );

    const messages: Message[] = [];
    for (let i = 0; i < results[0].rows.length; i++) {
      const row = results[0].rows.item(i);
      messages.push({
        ...row,
        metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
      });
    }

    return messages;
  }

  async getAllUsers(): Promise<User[]> {
    if (!this.db) throw new Error('Database not initialized');

    const results = await this.db.executeSql('SELECT * FROM users');

    const users: User[] = [];
    for (let i = 0; i < results[0].rows.length; i++) {
      const row = results[0].rows.item(i);
      users.push({
        ...row,
        isPEP: row.isPEP === 1,
      });
    }

    return users;
  }

  async deleteUser(userId: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    await this.db.executeSql('DELETE FROM messages WHERE userId = ?', [userId]);
    await this.db.executeSql('DELETE FROM users WHERE id = ?', [userId]);
    
    console.log('✅ User deleted:', userId);
  }

  /**
   * Migra contactos del mock a la base de datos (solo si la tabla está vacía)
   */
  private async migrateContactsFromMock(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      // Verificar si ya hay contactos en la base
      const results = await this.db.executeSql('SELECT COUNT(*) as count FROM contacts');
      const count = results[0].rows.item(0).count;

      if (count > 0) {
        console.log(`📦 Contacts already migrated (${count} contacts)`);
        return;
      }

      // Importar contactos del mock
      const contacts = allContactsMock.contacts || [];

      console.log(`📦 Migrating ${contacts.length} contacts from mock to database...`);

      for (const contact of contacts) {
        const id = contact.contactId || contact.cvu || `contact_${Date.now()}_${Math.random()}`;
        const now = new Date().toISOString();

        await this.db.executeSql(
          `INSERT INTO contacts (
            id, contactId, cvu, fullName, alias, phone, avatar, 
            hasDolarApp, isSaved, lastTransactionDate, transactionCount, createdAt, updatedAt
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            id,
            contact.contactId || null,
            contact.cvu || null,
            contact.fullName,
            contact.alias || null,
            contact.phone || null,
            contact.avatar || null,
            contact.hasDolarApp ? 1 : 0,
            contact.isSaved ? 1 : 0,
            contact.lastTransactionDate || null,
            contact.transactionCount || 0,
            now,
            now,
          ]
        );
      }

      console.log(`✅ Successfully migrated ${contacts.length} contacts to database`);
    } catch (error) {
      console.error('❌ Error migrating contacts:', error);
      // No lanzar error, solo loguear
    }
  }

  /**
   * Guarda un contacto en la base de datos
   */
  async saveContact(contact: UserContact): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const id = contact.contactId || contact.cvu || `contact_${Date.now()}_${Math.random()}`;
    const now = new Date().toISOString();

    await this.db.executeSql(
      `INSERT OR REPLACE INTO contacts (
        id, contactId, cvu, fullName, alias, phone, avatar,
        hasDolarApp, isSaved, lastTransactionDate, transactionCount, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        contact.contactId || null,
        contact.cvu || null,
        contact.fullName,
        contact.alias || null,
        contact.phone || null,
        contact.avatar || null,
        contact.hasDolarApp ? 1 : 0,
        contact.isSaved ? 1 : 0,
        contact.lastTransactionDate || null,
        contact.transactionCount || 0,
        now,
        now,
      ]
    );

    console.log('✅ Contact saved:', contact.fullName);
  }

  /**
   * Obtiene todos los contactos de la base de datos
   */
  async getAllContacts(): Promise<UserContact[]> {
    if (!this.db) throw new Error('Database not initialized');

    const results = await this.db.executeSql('SELECT * FROM contacts ORDER BY updatedAt DESC');

    const contacts: UserContact[] = [];
    for (let i = 0; i < results[0].rows.length; i++) {
      const row = results[0].rows.item(i);
      contacts.push({
        contactId: row.contactId || undefined,
        cvu: row.cvu || undefined,
        fullName: row.fullName,
        alias: row.alias || undefined,
        phone: row.phone || undefined,
        avatar: row.avatar || null,
        hasDolarApp: row.hasDolarApp === 1,
        isSaved: row.isSaved === 1,
        lastTransactionDate: row.lastTransactionDate || undefined,
        transactionCount: row.transactionCount || 0,
      });
    }

    return contacts;
  }

  /**
   * Busca contactos por query (nombre, alias, teléfono o CVU)
   */
  async searchContacts(query: string): Promise<UserContact[]> {
    if (!this.db) throw new Error('Database not initialized');

    const searchTerm = `%${query}%`;
    const results = await this.db.executeSql(
      `SELECT * FROM contacts 
       WHERE fullName LIKE ? OR alias LIKE ? OR phone LIKE ? OR cvu LIKE ?
       ORDER BY updatedAt DESC`,
      [searchTerm, searchTerm, searchTerm, searchTerm]
    );

    const contacts: UserContact[] = [];
    for (let i = 0; i < results[0].rows.length; i++) {
      const row = results[0].rows.item(i);
      contacts.push({
        contactId: row.contactId || undefined,
        cvu: row.cvu || undefined,
        fullName: row.fullName,
        alias: row.alias || undefined,
        phone: row.phone || undefined,
        avatar: row.avatar || null,
        hasDolarApp: row.hasDolarApp === 1,
        isSaved: row.isSaved === 1,
        lastTransactionDate: row.lastTransactionDate || undefined,
        transactionCount: row.transactionCount || 0,
      });
    }

    return contacts;
  }

  /**
   * Limpia todos los datos de la base de datos
   */
  async clearAllData(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    await this.db.executeSql('DELETE FROM messages');
    await this.db.executeSql('DELETE FROM contacts');
    await this.db.executeSql('DELETE FROM users');
    
    console.log('✅ All data cleared from database');
  }
}

export const db = new Database();

