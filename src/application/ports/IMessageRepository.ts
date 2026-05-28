import { Message } from "@/domain/entities/Message";

export interface MessageThreadCursor {
  createdAt: string;
  id: string;
}

export interface MessageThreadPage {
  messages: Message[];
  hasMore: boolean;
  nextCursor: MessageThreadCursor | null;
}

export interface IMessageRepository {
  findThread(userA: string, userB: string): Promise<Message[]>;
  findThreadPage(
    userA: string,
    userB: string,
    options?: { limit?: number; before?: MessageThreadCursor }
  ): Promise<MessageThreadPage>;
  create(
    senderId: string,
    receiverId: string,
    content: string,
    attachmentUrl?: string | null
  ): Promise<Message>;
}
