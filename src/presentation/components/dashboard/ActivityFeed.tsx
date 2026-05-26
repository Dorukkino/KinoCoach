import { ActivityItem } from "@/app/actions/dashboard";

const typeIcon: Record<ActivityItem["type"], string> = {
  exam: "📝",
  question_session: "📖",
};

const typeBg: Record<ActivityItem["type"], string> = {
  exam: "bg-[var(--accent-soft)] text-[var(--accent-ink)]",
  question_session: "bg-[var(--good-soft)] text-[var(--good-ink)]",
};

export function ActivityFeed({ activities }: { activities: ActivityItem[] }) {
  return (
    <div className="panel p-4 flex flex-col">
      <h3 className="font-semibold text-[15px] m-0 mb-3">Aktivite</h3>
      {activities.length === 0 ? (
        <p className="text-sm text-[var(--muted)] m-0">
          Henüz öğrenci aktivitesi yok.
        </p>
      ) : (
        <ul className="list-none m-0 p-0 flex flex-col overflow-y-auto" style={{ maxHeight: 360 }}>
          {activities.map((item, i) => (
            <li
              key={item.id}
              className={`flex items-start gap-3 py-2.5 ${
                i < activities.length - 1
                  ? "border-b border-[var(--border)]"
                  : ""
              }`}
            >
              <div
                className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm ${typeBg[item.type]}`}
              >
                {typeIcon[item.type]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm m-0 leading-snug">
                  <span className="font-semibold">{item.studentName}</span>{" "}
                  <span className="text-[var(--ink-2)]">{item.description}</span>
                </p>
                <p className="text-xs text-[var(--muted)] m-0 mt-0.5">
                  {item.meta}
                </p>
                {item.note && (
                  <p className="text-xs text-[var(--muted-2)] m-0 mt-1 italic leading-snug">
                    {item.note}
                  </p>
                )}
              </div>
              <span className="text-xs text-[var(--muted-2)] flex-shrink-0 mt-0.5 whitespace-nowrap">
                {item.timeAgo}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
