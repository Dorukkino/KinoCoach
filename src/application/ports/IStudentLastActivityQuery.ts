/** Öğrencilerin gerçek son aktivite zamanını (çoklu kaynak) toplu döner. */
export interface IStudentLastActivityQuery {
  findLatestByStudentIds(studentIds: string[]): Promise<Map<string, Date>>;
}
