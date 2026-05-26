import { IMessageRepository } from "../ports/IMessageRepository";
import { MessageDto } from "../dto";

export class ListMessagesUseCase {
  constructor(private readonly messages: IMessageRepository) {}

  async execute(
    currentUserId: string,
    otherUserId: string
  ): Promise<MessageDto[]> {
    const list = await this.messages.findThread(currentUserId, otherUserId);
    return list.map((m) => ({
      id: m.id,
      senderId: m.senderId,
      receiverId: m.receiverId,
      content: m.content,
      createdAt: m.createdAt.toISOString(),
      attachmentUrl: m.attachmentUrl,
      isMine: m.senderId === currentUserId,
    }));
  }
}
