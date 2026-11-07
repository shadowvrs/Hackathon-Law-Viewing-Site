import type { User } from '@app/shared';

export interface StoredUser extends User {
  passwordHash: string;
}

export const users: StoredUser[] = [
  {
    id: 'usr_1',
    name: 'Canadian Citizen',
    email: 'citizen@example.ca',
    passwordHash: 'password123',
    createdAt: new Date().toISOString(),
  },
];

export function toPublicUser(u: StoredUser): User {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    createdAt: u.createdAt,
  };
}
