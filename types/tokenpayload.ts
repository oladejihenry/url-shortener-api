export interface TokenPayload {
  userId: number;
  sessionId: string;
  tokenVersion: number;
  type: 'access' | 'refresh';
}
