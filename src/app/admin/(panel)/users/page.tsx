import {
  createAdminUserAction,
  listAdminUsersAction,
  updateAdminUserAction,
} from "@/app/actions/admin";
import {
  AdminBadge,
  AdminTable,
  AdminTd,
  AdminTh,
  EmptyState,
  formatDate,
} from "../../_components/admin-ui";
import { AccountStatus } from "@/application/ports/IAuthService";
import { UserRoleValue } from "@/domain/value-objects/UserRole";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const query = asString(params.q);
  const role = parseRole(asString(params.role));
  const status = parseStatus(asString(params.status));
  const users = await listAdminUsersAction({ query, role, status });

  return (
    <main className="screen">
      <div className="page-head">
        <div className="page-title">
          <h1>Kullanıcı Yönetimi</h1>
          <p>Tüm admin, koç ve öğrenci hesaplarını yönetin.</p>
        </div>
      </div>

      <section className="panel p-5 mb-5">
        <h2 className="text-base font-semibold m-0 mb-1">Yeni kullanıcı ekle</h2>
        <p className="text-sm text-[var(--muted)] m-0 mb-4">
          Kullanıcıya şifre belirleme bağlantısı e-posta ile gönderilir.
        </p>
        <form
          action={createAdminUserAction}
          className="grid lg:grid-cols-[1fr_1fr_160px_120px_140px_auto] gap-3"
        >
          <input
            name="fullName"
            className="input"
            placeholder="Ad soyad"
            required
          />
          <input
            name="email"
            type="email"
            className="input"
            placeholder="E-posta"
            required
          />
          <select name="role" className="input" defaultValue="coach">
            <option value="admin">Admin</option>
            <option value="coach">Koç</option>
            <option value="student">Öğrenci</option>
          </select>
          <input
            name="grade"
            className="input"
            placeholder="Sınıf"
            aria-label="Öğrenci sınıfı"
          />
          <input
            name="track"
            className="input"
            placeholder="Alan"
            aria-label="Öğrenci alanı"
          />
          <button className="btn btn-primary justify-center" type="submit">
            Davet gönder
          </button>
        </form>
      </section>

      <form className="panel p-4 mb-5 grid md:grid-cols-[1fr_180px_180px_auto] gap-3">
        <input
          name="q"
          defaultValue={query}
          className="input"
          placeholder="Ad veya e-posta ara"
        />
        <select name="role" defaultValue={role} className="input">
          <option value="all">Tüm roller</option>
          <option value="admin">Admin</option>
          <option value="coach">Koç</option>
          <option value="student">Öğrenci</option>
        </select>
        <select name="status" defaultValue={status} className="input">
          <option value="all">Tüm durumlar</option>
          <option value="active">Aktif</option>
          <option value="disabled">Devre dışı</option>
        </select>
        <button className="btn btn-primary justify-center" type="submit">
          Filtrele
        </button>
      </form>

      {users.length ? (
        <AdminTable>
          <thead>
            <tr>
              <AdminTh>Kullanıcı</AdminTh>
              <AdminTh>Rol</AdminTh>
              <AdminTh>Durum</AdminTh>
              <AdminTh>Oluşturma</AdminTh>
              <AdminTh>Aksiyon</AdminTh>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <AdminTd>
                  <input
                    name="fullName"
                    form={`user-form-${user.id}`}
                    defaultValue={user.fullName}
                    className="input"
                    aria-label={`${user.email} adı`}
                  />
                  <div className="text-xs text-[var(--muted)] mt-2">{user.email}</div>
                </AdminTd>
                <AdminTd>
                  <select
                    name="role"
                    form={`user-form-${user.id}`}
                    defaultValue={user.role}
                    className="input min-w-32"
                  >
                    <option value="admin">Admin</option>
                    <option value="coach">Koç</option>
                    <option value="student">Öğrenci</option>
                  </select>
                </AdminTd>
                <AdminTd>
                  <AdminBadge tone={user.accountStatus === "active" ? "good" : "risk"}>
                    {user.accountStatus === "active" ? "Aktif" : "Devre dışı"}
                  </AdminBadge>
                  <select
                    name="accountStatus"
                    form={`user-form-${user.id}`}
                    defaultValue={user.accountStatus}
                    className="input min-w-32 mt-2"
                  >
                    <option value="active">Aktif</option>
                    <option value="disabled">Devre dışı</option>
                  </select>
                </AdminTd>
                <AdminTd>{formatDate(user.createdAt)}</AdminTd>
                <AdminTd>
                  <form
                    id={`user-form-${user.id}`}
                    action={updateAdminUserAction}
                    className="grid gap-2"
                  >
                    <input type="hidden" name="userId" value={user.id} />
                    <button className="btn btn-primary justify-center" type="submit">
                      Kaydet
                    </button>
                  </form>
                </AdminTd>
              </tr>
            ))}
          </tbody>
        </AdminTable>
      ) : (
        <EmptyState>Bu filtrelerle kullanıcı bulunamadı.</EmptyState>
      )}
    </main>
  );
}

function asString(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function parseRole(value: string): UserRoleValue | "all" {
  if (value === "admin" || value === "coach" || value === "student") return value;
  return "all";
}

function parseStatus(value: string): AccountStatus | "all" {
  if (value === "active" || value === "disabled") return value;
  return "all";
}
