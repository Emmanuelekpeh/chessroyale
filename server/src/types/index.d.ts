declare namespace Express {
  export interface User {
    id: number;
    username: string;
    email?: string;
    rating: number;
    puzzle_rating: number;
    is_guest: boolean;
    role?: string;
  }
}
