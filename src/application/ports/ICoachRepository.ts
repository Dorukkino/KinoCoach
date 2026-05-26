import { Coach } from "@/domain/entities/Coach";

export interface ICoachRepository {
  findById(id: string): Promise<Coach | null>;
}
