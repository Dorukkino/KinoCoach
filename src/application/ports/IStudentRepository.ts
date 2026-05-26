import { Student } from "@/domain/entities/Student";

export interface CreateStudentInput {
  userId: string;
  name: string;
  email: string;
  grade?: string;
  track?: string;
}

export interface IStudentRepository {
  findById(id: string): Promise<Student | null>;
  findByUserId(userId: string): Promise<Student | null>;
  findManyByIds(ids: string[]): Promise<Student[]>;
  create(input: CreateStudentInput): Promise<Student>;
  update(
    id: string,
    data: Partial<{
      name: string;
      grade: string;
      track: string;
      taskCompletionRate: number;
    }>
  ): Promise<Student>;
  /** Öğrencinin son aktiflik zamanını günceller. */
  touchLastActive(id: string): Promise<void>;
  delete(id: string): Promise<void>;
}
