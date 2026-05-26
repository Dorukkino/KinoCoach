import { DomainError } from "../errors/DomainError";

export class Message {
  constructor(
    public readonly id: string,
    public readonly senderId: string,
    public readonly receiverId: string,
    public readonly content: string,
    public readonly createdAt: Date,
    public readonly attachmentUrl: string | null = null
  ) {
    if (!content.trim() && !attachmentUrl) {
      throw new DomainError("Message must have content or attachment");
    }
  }
}
