import { Message } from "@/domain/entities/Message";

export interface IMessageRepository {
  findThread(userA: string, userB: string): Promise<Message[]>;
  create(
    senderId: string,
    receiverId: string,
    content: string,
    attachmentUrl?: string | null
  ): Promise<Message>;
}
