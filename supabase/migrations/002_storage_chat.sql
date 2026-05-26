-- Chat dosya ekleri (002 — 001'den sonra çalıştırın)

INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-attachments', 'chat-attachments', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY chat_attachments_upload ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'chat-attachments');

CREATE POLICY chat_attachments_read ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'chat-attachments');
