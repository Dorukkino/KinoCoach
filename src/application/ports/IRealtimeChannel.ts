export type MessageHandler = (payload: Record<string, unknown>) => void;

export interface IRealtimeChannel {
  subscribeToMessages(
    coachId: string,
    studentUserId: string,
    onMessage: MessageHandler
  ): () => void;
}
