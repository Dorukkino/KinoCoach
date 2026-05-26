import { MotivationMessage } from "../entities/MotivationMessage";

export class MotivationService {
  pickLatest(messages: MotivationMessage[]): MotivationMessage | null {
    if (messages.length === 0) return null;
    return [...messages].sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    )[0];
  }
}
