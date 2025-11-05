const bcrypt = require('bcryptjs');
const pool = require('../config/db');

class User {
  static async create({ email, password, verificationToken, verificationTokenExpires }) {
    const hashedPassword = await bcrypt.hash(password, 10);
    const [result] = await pool.execute(
      `INSERT INTO users (
        email,
        password_hash,
        verification_token,
        verification_token_expires,
        failed_login_attempts,
        account_locked_until
      ) VALUES (?, ?, ?, ?, 0, NULL)`,
      [email, hashedPassword, verificationToken, verificationTokenExpires]
    );

    return this.findById(result.insertId);
  }

  static async findByEmail(email) {
    const [rows] = await pool.execute('SELECT * FROM users WHERE email = ?', [email]);
    return rows[0];
  }

  static async findById(id) {
    const [rows] = await pool.execute('SELECT * FROM users WHERE id = ?', [id]);
    return rows[0];
  }

  static async findByVerificationToken(token) {
    const [rows] = await pool.execute('SELECT * FROM users WHERE verification_token = ?', [token]);
    return rows[0];
  }

  static async clearVerificationToken(userId) {
    await pool.execute(
      'UPDATE users SET verification_token = NULL, verification_token_expires = NULL WHERE id = ?',
      [userId]
    );
  }

  static async verifyEmail(userId) {
    await pool.execute(
      'UPDATE users SET is_verified = TRUE, verification_token = NULL, verification_token_expires = NULL WHERE id = ?',
      [userId]
    );
  }

  static async setResetToken(email, token, expiry) {
    await pool.execute(
      'UPDATE users SET reset_token = ?, reset_token_expiry = ? WHERE email = ?',
      [token, expiry, email]
    );
  }

  static async findByResetToken(token) {
    const [rows] = await pool.execute('SELECT * FROM users WHERE reset_token = ?', [token]);
    return rows[0];
  }

  static async clearResetToken(userId) {
    await pool.execute(
      'UPDATE users SET reset_token = NULL, reset_token_expiry = NULL WHERE id = ?',
      [userId]
    );
  }

  static async updatePassword(userId, newPassword) {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await pool.execute(
      'UPDATE users SET password_hash = ?, reset_token = NULL, reset_token_expiry = NULL WHERE id = ?',
      [hashedPassword, userId]
    );
  }

  static async updateFailedLoginAttempts(userId, attempts) {
    await pool.execute(
      'UPDATE users SET failed_login_attempts = ?, account_locked_until = NULL WHERE id = ?',
      [attempts, userId]
    );
  }

  static async resetFailedLoginAttempts(userId) {
    await pool.execute(
      'UPDATE users SET failed_login_attempts = 0, account_locked_until = NULL WHERE id = ?',
      [userId]
    );
  }

  static async lockAccount(userId, lockUntil) {
    await pool.execute(
      'UPDATE users SET account_locked_until = ?, failed_login_attempts = 0 WHERE id = ?',
      [lockUntil, userId]
    );
  }
}

module.exports = User;
