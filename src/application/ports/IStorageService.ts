export interface IStorageService {
  uploadChatAttachment(
    path: string,
    file: Buffer,
    contentType: string
  ): Promise<string>;
}
