import { SupabaseClient } from "@supabase/supabase-js";
import {
  CreateNotificationInput,
  INotificationRepository,
} from "@/application/ports/INotificationRepository";
import { NotificationTypeValue } from "@/domain/value-objects/NotificationType";
import { mapNotificationRow } from "../supabase/mappers";

const NOTIFICATION_COLUMNS =
  "id, user_id, title, message, type, is_read, metadata, created_at, updated_at";

export class SupabaseNotificationRepository implements INotificationRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async create(input: CreateNotificationInput) {
    const { data, error } = await this.supabase
      .from("notifications")
      .insert({
        id: crypto.randomUUID(),
        user_id: input.userId,
        title: input.title,
        message: input.message,
        type: input.type,
        metadata: input.metadata ?? null,
      })
      .select(NOTIFICATION_COLUMNS)
      .single();
    if (error || !data) throw new Error(error?.message ?? "Bildirim oluşturulamadı");
    return mapNotificationRow(data);
  }

  async findByUserId(userId: string, limit = 50) {
    const { data, error } = await this.supabase
      .from("notifications")
      .select(NOTIFICATION_COLUMNS)
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error || !data) return [];
    return data.map(mapNotificationRow);
  }

  async countUnread(userId: string) {
    const { count, error } = await this.supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("is_read", false);
    if (error) return 0;
    return count ?? 0;
  }

  async markAsRead(id: string, userId: string) {
    const { error } = await this.supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", id)
      .eq("user_id", userId);
    if (error) throw new Error(error.message);
  }

  async markAllAsRead(userId: string) {
    const { error } = await this.supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", userId)
      .eq("is_read", false);
    if (error) throw new Error(error.message);
  }

  async existsByTypeAndMetadata(
    userId: string,
    type: NotificationTypeValue,
    metadataKey: string,
    metadataValue: string
  ) {
    const { data, error } = await this.supabase
      .from("notifications")
      .select("id")
      .eq("user_id", userId)
      .eq("type", type)
      .contains("metadata", { [metadataKey]: metadataValue })
      .limit(1)
      .maybeSingle();
    if (error) return false;
    return Boolean(data);
  }
}
