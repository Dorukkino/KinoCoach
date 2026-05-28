import {
  IMessageRepository,
  MessageThreadCursor,
} from "../ports/IMessageRepository";
import { MessageDto } from "../dto";

function toMessageDto(
  m: Awaited<
    ReturnType<IMessageRepository["findThreadPage"]>
  >["messages"][number],
  currentUserId: string
): MessageDto {
  return {
    id: m.id,
    senderId: m.senderId,
    receiverId: m.receiverId,
    content: m.content,
    createdAt: m.createdAt.toISOString(),
    attachmentUrl: m.attachmentUrl,
    isMine: m.senderId === currentUserId,
  };
}

export interface MessageThreadResultDto {
  messages: MessageDto[];
  hasMore: boolean;
  nextCursor: MessageThreadCursor | null;
}

export class ListMessagesUseCase {
  constructor(private readonly messages: IMessageRepository) {}

  async execute(
    currentUserId: string,
    otherUserId: string,
    options?: { limit?: number; before?: MessageThreadCursor }
  ): Promise<MessageThreadResultDto> {
    const page = await this.messages.findThreadPage(
      currentUserId,
      otherUserId,
      options
    );
    return {
      messages: page.messages.map((m) => toMessageDto(m, currentUserId)),
      hasMore: page.hasMore,
      nextCursor: page.nextCursor,
    };
  }
}
