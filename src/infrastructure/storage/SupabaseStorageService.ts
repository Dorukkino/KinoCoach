import { SupabaseClient } from "@supabase/supabase-js";
import { IStorageService } from "@/application/ports/IStorageService";

const BUCKET = "chat-attachments";

export class SupabaseStorageService implements IStorageService {
  constructor(private readonly supabase: SupabaseClient) {}

  async uploadChatAttachment(
    path: string,
    file: Buffer,
    contentType: string
  ): Promise<string> {
    const { error } = await this.supabase.storage
      .from(BUCKET)
      .upload(path, file, { contentType, upsert: true });
    if (error) throw new Error(error.message);

    const { data } = this.supabase.storage.from(BUCKET).getPublicUrl(path);
    return data.publicUrl;
  }
}
