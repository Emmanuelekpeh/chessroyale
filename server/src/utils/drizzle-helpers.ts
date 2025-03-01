import { eq } from 'drizzle-orm';
import * as schema from '@shared/schema';
import { InferSelectModel } from 'drizzle-orm';

// Type-safe wrapper functions for database operations
export function getUserByUsername(db: any, username: string) {
  return db.query.users.findFirst({
    where: (users: any) => eq(users.username, username)
  });
}

export function getUserById(db: any, id: number) {
  return db.query.users.findFirst({
    where: (users: any) => eq(users.id, id)
  });
}

export function updateUser(db: any, id: number, data: Partial<InferSelectModel<typeof schema.users>>) {
  return db
    .update(schema.users)
    .set(data)
    .where(eq(schema.users.id, id));
}

export function getPuzzleById(db: any, id: number) {
  return db.query.puzzles.findFirst({
    where: (puzzles: any) => eq(puzzles.id, id)
  });
}

// Add more helpers as needed for your database operations
