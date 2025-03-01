// Extend existing User type to include puzzleRating, createdAt, and updatedAt properties
import { User as BaseUser } from '@shared/schema';

declare global {
  interface User extends BaseUser {
    puzzleRating: number;
    createdAt: Date;
    updatedAt: Date;
  }
}
