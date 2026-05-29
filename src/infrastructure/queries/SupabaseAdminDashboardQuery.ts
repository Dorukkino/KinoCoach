import "server-only";
import { SupabaseClient } from "@supabase/supabase-js";
import { AccountStatus } from "@/application/ports/IAuthService";
import { UserRoleValue } from "@/domain/value-objects/UserRole";
import { EngagementStatusValue } from "@/domain/value-objects/EngagementStatus";

export type AdminInvitationStatus =
  | "pending"
  | "accepted"
  | "declined"
  | "expired";

export interface AdminMetric {
  label: string;
  value: number;
  tone: "default" | "good" | "warn" | "risk";
}

export interface AdminUserRow {
  id: string;
  email: string;
  role: UserRoleValue;
  fullName: string;
  accountStatus: AccountStatus;
  createdAt: string;
}

export interface AdminEngagementRow {
  id: string;
  studentId: string;
  studentName: string;
  coachId: string;
  coachName: string;
  status: EngagementStatusValue;
  startedAt: string;
  endedAt: string | null;
  endReason: string | null;
  gradeAtStart: string | null;
  track: string | null;
}

export interface AdminInvitationRow {
  id: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  coachId: string;
  coachName: string;
  status: AdminInvitationStatus;
  expiresAt: string;
  createdAt: string;
  respondedAt: string | null;
}

export interface AdminAuditRow {
  id: string;
  adminUserId: string | null;
  action: string;
  targetType: string;
  targetId: string;
  createdAt: string;
}

export interface AdminDashboardData {
  metrics: AdminMetric[];
  userRoleCounts: Record<UserRoleValue, number>;
  engagementStatusCounts: Record<EngagementStatusValue, number>;
  invitationStatusCounts: Record<AdminInvitationStatus, number>;
  recentUsers: AdminUserRow[];
  recentEngagements: AdminEngagementRow[];
  recentInvitations: AdminInvitationRow[];
  recentAuditEvents: AdminAuditRow[];
}

type DbRow = Record<string, unknown>;

const USER_COLUMNS = "id, email, role, full_name, account_status, created_at";
const ENGAGEMENT_COLUMNS =
  "id, student_id, coach_id, status, started_at, ended_at, end_reason, grade_at_start, track";
const INVITATION_COLUMNS =
  "id, student_id, coach_id, status, expires_at, created_at, responded_at";

export class SupabaseAdminDashboardQuery {
  constructor(private readonly supabase: SupabaseClient) {}

  async getDashboard(): Promise<AdminDashboardData> {
    const [
      userRoleCounts,
      disabledUsers,
      studentCount,
      engagementStatusCounts,
      invitationStatusCounts,
      messageCount,
      examCount,
      recentUsers,
      recentEngagements,
      recentInvitations,
      recentAuditEvents,
    ] = await Promise.all([
      this.countUsersByRole(),
      this.count("users", "account_status", "disabled"),
      this.count("students"),
      this.countEngagementsByStatus(),
      this.countInvitationsByStatus(),
      this.count("messages"),
      this.count("exam_results"),
      this.listUsers({ limit: 6 }),
      this.listEngagements({ limit: 6 }),
      this.listInvitations({ limit: 6 }),
      this.listAuditEvents(6),
    ]);

    return {
      metrics: [
        {
          label: "Toplam kullanıcı",
          value:
            userRoleCounts.admin + userRoleCounts.coach + userRoleCounts.student,
          tone: "default",
        },
        { label: "Öğrenci profili", value: studentCount, tone: "good" },
        {
          label: "Aktif ilişki",
          value: engagementStatusCounts.active,
          tone: "good",
        },
        {
          label: "Bekleyen davet",
          value: invitationStatusCounts.pending,
          tone: "warn",
        },
        { label: "Devre dışı hesap", value: disabledUsers, tone: "risk" },
        { label: "Mesaj kaydı", value: messageCount, tone: "default" },
        { label: "Deneme kaydı", value: examCount, tone: "default" },
      ],
      userRoleCounts,
      engagementStatusCounts,
      invitationStatusCounts,
      recentUsers,
      recentEngagements,
      recentInvitations,
      recentAuditEvents,
    };
  }

  async listUsers(input: {
    query?: string;
    role?: UserRoleValue | "all";
    status?: AccountStatus | "all";
    limit?: number;
  } = {}): Promise<AdminUserRow[]> {
    let query = this.supabase
      .from("users")
      .select(USER_COLUMNS)
      .order("created_at", { ascending: false })
      .limit(input.limit ?? 50);

    if (input.role && input.role !== "all") query = query.eq("role", input.role);
    if (input.status && input.status !== "all") {
      query = query.eq("account_status", input.status);
    }
    if (input.query?.trim()) {
      const pattern = `%${input.query.trim()}%`;
      query = query.or(`email.ilike.${pattern},full_name.ilike.${pattern}`);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return ((data ?? []) as DbRow[]).map(mapUser);
  }

  async listEngagements(input: {
    status?: EngagementStatusValue | "all";
    query?: string;
    limit?: number;
  } = {}): Promise<AdminEngagementRow[]> {
    let query = this.supabase
      .from("coaching_engagements")
      .select(ENGAGEMENT_COLUMNS)
      .order("started_at", { ascending: false })
      .limit(input.limit ?? 50);

    if (input.status && input.status !== "all") {
      query = query.eq("status", input.status);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);

    let rows = ((data ?? []) as DbRow[]).map(mapEngagementBase);
    const names = await this.resolveNames(rows);
    rows = rows.map((row) => ({
      ...row,
      studentName: names.students.get(row.studentId)?.name ?? "Öğrenci",
      coachName: names.users.get(row.coachId)?.fullName ?? "Koç",
    }));

    const needle = input.query?.trim().toLocaleLowerCase("tr");
    if (!needle) return rows;
    return rows.filter((row) =>
      `${row.studentName} ${row.coachName}`.toLocaleLowerCase("tr").includes(needle)
    );
  }

  async listInvitations(input: {
    status?: AdminInvitationStatus | "all";
    query?: string;
    limit?: number;
  } = {}): Promise<AdminInvitationRow[]> {
    let query = this.supabase
      .from("coaching_invitations")
      .select(INVITATION_COLUMNS)
      .order("created_at", { ascending: false })
      .limit(input.limit ?? 50);

    if (input.status && input.status !== "all") {
      query = query.eq("status", input.status);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);

    let rows = ((data ?? []) as DbRow[]).map(mapInvitationBase);
    const names = await this.resolveNames(rows);
    rows = rows.map((row) => {
      const student = names.students.get(row.studentId);
      return {
        ...row,
        studentName: student?.name ?? "Öğrenci",
        studentEmail: student?.email ?? "",
        coachName: names.users.get(row.coachId)?.fullName ?? "Koç",
      };
    });

    const needle = input.query?.trim().toLocaleLowerCase("tr");
    if (!needle) return rows;
    return rows.filter((row) =>
      `${row.studentName} ${row.studentEmail} ${row.coachName}`
        .toLocaleLowerCase("tr")
        .includes(needle)
    );
  }

  async listAuditEvents(limit = 25): Promise<AdminAuditRow[]> {
    const { data, error } = await this.supabase
      .from("admin_audit_events")
      .select("id, admin_user_id, action, target_type, target_id, created_at")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw new Error(error.message);
    return ((data ?? []) as DbRow[]).map((row) => ({
      id: String(row.id),
      adminUserId: row.admin_user_id ? String(row.admin_user_id) : null,
      action: String(row.action),
      targetType: String(row.target_type),
      targetId: String(row.target_id),
      createdAt: String(row.created_at),
    }));
  }

  private async count(table: string, column?: string, value?: string): Promise<number> {
    let query = this.supabase.from(table).select("id", {
      count: "exact",
      head: true,
    });
    if (column && value) query = query.eq(column, value);
    const { count, error } = await query;
    if (error) throw new Error(error.message);
    return count ?? 0;
  }

  private async countUsersByRole(): Promise<Record<UserRoleValue, number>> {
    const roles: UserRoleValue[] = ["admin", "coach", "student"];
    const counts = await Promise.all(
      roles.map((role) => this.count("users", "role", role))
    );
    return { admin: counts[0], coach: counts[1], student: counts[2] };
  }

  private async countEngagementsByStatus(): Promise<
    Record<EngagementStatusValue, number>
  > {
    const statuses: EngagementStatusValue[] = ["active", "paused", "ended"];
    const counts = await Promise.all(
      statuses.map((status) =>
        this.count("coaching_engagements", "status", status)
      )
    );
    return { active: counts[0], paused: counts[1], ended: counts[2] };
  }

  private async countInvitationsByStatus(): Promise<
    Record<AdminInvitationStatus, number>
  > {
    const statuses: AdminInvitationStatus[] = [
      "pending",
      "accepted",
      "declined",
      "expired",
    ];
    const counts = await Promise.all(
      statuses.map((status) =>
        this.count("coaching_invitations", "status", status)
      )
    );
    return {
      pending: counts[0],
      accepted: counts[1],
      declined: counts[2],
      expired: counts[3],
    };
  }

  private async resolveNames(rows: Array<{ studentId: string; coachId: string }>) {
    const studentIds = [...new Set(rows.map((row) => row.studentId))];
    const coachIds = [...new Set(rows.map((row) => row.coachId))];

    const [students, users] = await Promise.all([
      studentIds.length
        ? this.supabase
            .from("students")
            .select("id, user_id, name, users(email)")
            .in("id", studentIds)
        : Promise.resolve({ data: [], error: null }),
      coachIds.length
        ? this.supabase
            .from("users")
            .select("id, full_name, email")
            .in("id", coachIds)
        : Promise.resolve({ data: [], error: null }),
    ]);

    if (students.error) throw new Error(students.error.message);
    if (users.error) throw new Error(users.error.message);

    const studentMap = new Map<
      string,
      { name: string; email: string; userId: string }
    >();
    for (const row of (students.data ?? []) as DbRow[]) {
      const joined = row.users as { email?: string } | { email?: string }[] | null;
      const user = Array.isArray(joined) ? joined[0] : joined;
      studentMap.set(String(row.id), {
        name: String(row.name ?? "Öğrenci"),
        email: String(user?.email ?? ""),
        userId: String(row.user_id),
      });
    }

    const userMap = new Map<string, { fullName: string; email: string }>();
    for (const row of (users.data ?? []) as DbRow[]) {
      userMap.set(String(row.id), {
        fullName: String(row.full_name ?? row.email ?? "Koç"),
        email: String(row.email ?? ""),
      });
    }

    return { students: studentMap, users: userMap };
  }
}

function mapUser(row: DbRow): AdminUserRow {
  return {
    id: String(row.id),
    email: String(row.email),
    role: String(row.role) as UserRoleValue,
    fullName: String(row.full_name ?? ""),
    accountStatus: row.account_status === "disabled" ? "disabled" : "active",
    createdAt: String(row.created_at),
  };
}

function mapEngagementBase(row: DbRow): AdminEngagementRow {
  return {
    id: String(row.id),
    studentId: String(row.student_id),
    studentName: "Öğrenci",
    coachId: String(row.coach_id),
    coachName: "Koç",
    status: String(row.status) as EngagementStatusValue,
    startedAt: String(row.started_at),
    endedAt: row.ended_at ? String(row.ended_at) : null,
    endReason: row.end_reason ? String(row.end_reason) : null,
    gradeAtStart: row.grade_at_start ? String(row.grade_at_start) : null,
    track: row.track ? String(row.track) : null,
  };
}

function mapInvitationBase(row: DbRow): AdminInvitationRow {
  return {
    id: String(row.id),
    studentId: String(row.student_id),
    studentName: "Öğrenci",
    studentEmail: "",
    coachId: String(row.coach_id),
    coachName: "Koç",
    status: String(row.status) as AdminInvitationStatus,
    expiresAt: String(row.expires_at),
    createdAt: String(row.created_at),
    respondedAt: row.responded_at ? String(row.responded_at) : null,
  };
}
