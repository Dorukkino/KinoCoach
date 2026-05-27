import { IMessageRepository } from "../ports/IMessageRepository";
import { IStorageService } from "../ports/IStorageService";
import { IUserRepository } from "../ports/IUserRepository";
import { MessageDto } from "../dto";
import { SendNotificationUseCase } from "./SendNotificationUseCase";
import { NotificationType } from "@/domain/value-objects/NotificationType";

export class SendMessageUseCase {
  constructor(
    private readonly messages: IMessageRepository,
    private readonly storage?: IStorageService,
    private readonly sendNotification?: SendNotificationUseCase,
    private readonly users?: IUserRepository
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

    if (this.sendNotification) {
      try {
        const receiver = await this.users?.findById(input.receiverId);
        const href = receiver?.role.isCoach() ? "/coach/chat" : "/student/chat";
        await this.sendNotification.execute({
          userId: input.receiverId,
          title: "Yeni mesajınız var",
          message: input.content.trim()
            ? input.content.slice(0, 200)
            : "Size yeni bir mesaj gönderildi.",
          type: NotificationType.NEW_MESSAGE,
          metadata: {
            senderId: input.senderId,
            messageId: msg.id,
            href,
          },
        });
      } catch {
        // Bildirim hatası mesaj gönderimini geri almaz
      }
    }

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
