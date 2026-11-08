import type { User } from '@app/shared';
import UserModel from '../models/User.js';

export interface StoredUser extends User {
  passwordHash: string;
}

/** Convert a Sequelize User row to the public-facing User shape. */
export function toPublicUser(u: UserModel): User {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    createdAt: u.createdAt,
  };
}

/**
 * Find a user by their email address (case-insensitive).
 * Returns null when no match is found.
 */
export async function findUserByEmail(email: string): Promise<UserModel | null> {
  const normalizedEmail = email.toLowerCase().trim();
  return UserModel.findOne({ where: { email: normalizedEmail } });
}

/**
 * Find a user by their primary-key id.
 * Returns null when no match is found.
 */
export async function findUserById(id: string): Promise<UserModel | null> {
  return UserModel.findByPk(id);
}

/**
 * Create a new user row. The caller is responsible for hashing the password
 * before passing it here.
 */
export async function createUser(
  name: string,
  email: string,
  passwordHash: string
): Promise<UserModel> {
  const normalizedEmail = email.toLowerCase().trim();
  return UserModel.create({ name: name.trim(), email: normalizedEmail, passwordHash });
}
