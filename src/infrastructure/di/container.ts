import "server-only";
import { cache } from "react";
import { SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "../supabase/server";
import { createSupabaseAdminClient } from "../supabase/admin";
import { SupabaseStudentRepository } from "../repositories/SupabaseStudentRepository";
import { SupabaseUserRepository } from "../repositories/SupabaseUserRepository";
import { SupabaseWeeklyProgramRepository } from "../repositories/SupabaseWeeklyProgramRepository";
import { SupabaseExamResultRepository } from "../repositories/SupabaseExamResultRepository";
import { SupabaseMessageRepository } from "../repositories/SupabaseMessageRepository";
import { SupabaseCoachNoteRepository } from "../repositories/SupabaseCoachNoteRepository";
import { SupabaseMotivationRepository } from "../repositories/SupabaseMotivationRepository";
import { SupabaseLessonNetRepository } from "../repositories/SupabaseLessonNetRepository";
import { SupabaseCoachRepository } from "../repositories/SupabaseCoachRepository";
import { SupabaseEngagementRepository } from "../repositories/SupabaseEngagementRepository";
import { SupabaseInvitationRepository } from "../repositories/SupabaseInvitationRepository";
import { SupabaseStudentLastActivityQuery } from "../queries/SupabaseStudentLastActivityQuery";
import { SupabaseAuthService } from "../auth/SupabaseAuthService";
import { SupabaseAdminAuthService } from "../auth/SupabaseAdminAuthService";
import { SupabaseStorageService } from "../storage/SupabaseStorageService";
import { createSmtpEmailService } from "../email/SmtpEmailService";
import { RegisterCoachUseCase } from "@/application/use-cases/RegisterCoachUseCase";
import { InviteStudentByEmailUseCase } from "@/application/use-cases/InviteStudentByEmailUseCase";
import { GetStudentDetailUseCase } from "@/application/use-cases/GetStudentDetailUseCase";
import { CreateWeeklyProgramUseCase } from "@/application/use-cases/CreateWeeklyProgramUseCase";
import { UpdateWeeklyProgramCompletionUseCase } from "@/application/use-cases/UpdateWeeklyProgramCompletionUseCase";
import { GetWeeklyProgramUseCase } from "@/application/use-cases/GetWeeklyProgramUseCase";
import { ListStudentWeeksUseCase } from "@/application/use-cases/ListStudentWeeksUseCase";
import { UpdateExamResultUseCase } from "@/application/use-cases/UpdateExamResultUseCase";
import { ListExamResultsUseCase } from "@/application/use-cases/ListExamResultsUseCase";
import { SendMessageUseCase } from "@/application/use-cases/SendMessageUseCase";
import { ListMessagesUseCase } from "@/application/use-cases/ListMessagesUseCase";
import { UpsertCoachNoteUseCase } from "@/application/use-cases/UpsertCoachNoteUseCase";
import { GetCoachNoteUseCase } from "@/application/use-cases/GetCoachNoteUseCase";
import { ListCoachNotesUseCase } from "@/application/use-cases/ListCoachNotesUseCase";
import { GetCoachNotesPageUseCase } from "@/application/use-cases/GetCoachNotesPageUseCase";
import { SetMotivationMessageUseCase } from "@/application/use-cases/SetMotivationMessageUseCase";
import { GetMotivationForStudentUseCase } from "@/application/use-cases/GetMotivationForStudentUseCase";
import { GetLessonNetUseCase } from "@/application/use-cases/GetLessonNetUseCase";
import { UpsertLessonNetUseCase } from "@/application/use-cases/UpsertLessonNetUseCase";
import { StartEngagementUseCase } from "@/application/use-cases/StartEngagementUseCase";
import { EndEngagementUseCase } from "@/application/use-cases/EndEngagementUseCase";
import { AcceptInvitationUseCase } from "@/application/use-cases/AcceptInvitationUseCase";
import { DeclineInvitationUseCase } from "@/application/use-cases/DeclineInvitationUseCase";
import { ListActiveStudentsForCoachUseCase } from "@/application/use-cases/ListActiveStudentsForCoachUseCase";
import { ListArchivedStudentsForCoachUseCase } from "@/application/use-cases/ListArchivedStudentsForCoachUseCase";
import { CalculateStudentStatusService } from "@/application/services/CalculateStudentStatusService";
import { ChartDataService } from "@/application/services/ChartDataService";
import { DashboardStatsService } from "@/application/services/DashboardStatsService";

export type ServerContainer = ReturnType<typeof buildContainer>;

function buildContainer(supabase: SupabaseClient, admin?: SupabaseClient) {
  const students = new SupabaseStudentRepository(supabase);
  const users = new SupabaseUserRepository(supabase);
  const programs = new SupabaseWeeklyProgramRepository(supabase);
  const exams = new SupabaseExamResultRepository(supabase);
  const messages = new SupabaseMessageRepository(supabase);
  const notes = new SupabaseCoachNoteRepository(supabase);
  const motivation = new SupabaseMotivationRepository(supabase);
  const lessonNets = new SupabaseLessonNetRepository(supabase);
  const coaches = new SupabaseCoachRepository(supabase);
  const engagements = new SupabaseEngagementRepository(supabase);
  const invitations = new SupabaseInvitationRepository(supabase);
  const auth = new SupabaseAuthService(supabase);
  const storage = new SupabaseStorageService(supabase);
  const emailService = createSmtpEmailService();

  const statusMapper = new CalculateStudentStatusService();
  const chartData = new ChartDataService();
  const dashboardStats = new DashboardStatsService();

  // Admin-client variants bypass RLS; gerekli olduğu yerlerde (cross-user
  // lookups, davetli öğrenci kaydı, davet kabul akışında engagement insert)
  // kullanılır.
  const adminAuth = admin ? new SupabaseAdminAuthService(admin) : null;
  const adminStudents = admin ? new SupabaseStudentRepository(admin) : null;
  const adminUsers = admin ? new SupabaseUserRepository(admin) : null;
  const adminEngagements = admin
    ? new SupabaseEngagementRepository(admin)
    : null;
  const adminInvitations = admin
    ? new SupabaseInvitationRepository(admin)
    : null;
  const lastActivityQuery = admin
    ? new SupabaseStudentLastActivityQuery(admin)
    : new SupabaseStudentLastActivityQuery(supabase);

  return {
    auth,
    students,
    users,
    coaches,
    engagements,
    invitations,
    notes,
    statusMapper,
    chartData,
    dashboardStats,
    registerCoach: new RegisterCoachUseCase(auth, users, adminAuth),
    inviteStudent:
      adminAuth && adminStudents && adminUsers && adminEngagements && adminInvitations
        ? new InviteStudentByEmailUseCase(
            adminAuth,
            adminStudents,
            adminUsers,
            adminEngagements,
            adminInvitations,
            emailService
          )
        : null,
    listActiveStudents: new ListActiveStudentsForCoachUseCase(
      engagements,
      students,
      statusMapper,
      lastActivityQuery
    ),
    listArchivedStudents: new ListArchivedStudentsForCoachUseCase(
      engagements,
      students
    ),
    getStudentDetail: new GetStudentDetailUseCase(
      students,
      engagements,
      statusMapper,
      lastActivityQuery
    ),
    startEngagement: new StartEngagementUseCase(engagements),
    endEngagement: new EndEngagementUseCase(engagements),
    acceptInvitation: adminEngagements
      ? new AcceptInvitationUseCase(invitations, adminEngagements, students)
      : null,
    declineInvitation: new DeclineInvitationUseCase(invitations, students),
    createWeeklyProgram: new CreateWeeklyProgramUseCase(programs, engagements),
    updateWeeklyCompletion: new UpdateWeeklyProgramCompletionUseCase(
      programs,
      students,
      engagements
    ),
    getWeeklyProgram: new GetWeeklyProgramUseCase(programs, engagements),
    listStudentWeeks: new ListStudentWeeksUseCase(programs, engagements),
    updateExamResult: new UpdateExamResultUseCase(exams, students),
    listExamResults: new ListExamResultsUseCase(exams),
    sendMessage: new SendMessageUseCase(messages, storage),
    listMessages: new ListMessagesUseCase(messages),
    upsertCoachNote: new UpsertCoachNoteUseCase(notes, engagements),
    getCoachNote: new GetCoachNoteUseCase(notes, engagements),
    listCoachNotes: new ListCoachNotesUseCase(notes, students, engagements),
    getCoachNotesPage: new GetCoachNotesPageUseCase(
      notes,
      students,
      engagements,
      statusMapper,
      lastActivityQuery
    ),
    setMotivation: new SetMotivationMessageUseCase(motivation, engagements),
    getMotivation: new GetMotivationForStudentUseCase(motivation, engagements),
    getLessonNet: new GetLessonNetUseCase(lessonNets, engagements),
    upsertLessonNet: new UpsertLessonNetUseCase(lessonNets, engagements, students),
  };
}

export async function createServerContainer() {
  const supabase = await createSupabaseServerClient();
  let admin: SupabaseClient | undefined;
  try {
    admin = createSupabaseAdminClient();
  } catch {
    admin = undefined;
  }
  return buildContainer(supabase, admin);
}

// Request-scoped cached version — aynı request içinde tek container oluşturur
export const getCachedServerContainer = cache(createServerContainer);
