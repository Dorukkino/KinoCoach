import { IMessageRepository } from "../ports/IMessageRepository";
import { IStorageService } from "../ports/IStorageService";
import { MessageDto } from "../dto";

export class SendMessageUseCase {
  constructor(
    private readonly messages: IMessageRepository,
    private readonly storage?: IStorageService
  ) {}

  async execute(input: {
    senderId: string;
    receiverId: string;
    content: string;
    file?: { buffer: Buffer; contentType: string; path: string };
  }): Promise<MessageDto> {
    let attachmentUrl: string | null = null;
    if (input.file && this.storage) {
      attachmentUrl = await this.storage.uploadChatAttachment(
        input.file.path,
        input.file.buffer,
        input.file.contentType
      );
    }
    const msg = await this.messages.create(
      input.senderId,
      input.receiverId,
      input.content,
      attachmentUrl
    );

    return {
      id: msg.id,
      senderId: msg.senderId,
      receiverId: msg.receiverId,
      content: msg.content,
      createdAt: msg.createdAt.toISOString(),
      attachmentUrl: msg.attachmentUrl,
      isMine: true,
    };
  }
}
