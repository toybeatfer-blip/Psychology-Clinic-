export type Role = 'THERAPIST' | 'ADMIN' | 'ASSISTANT' | string;

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email: string;
        role: Role;
        fullName: string;
      };
    }
  }
}
