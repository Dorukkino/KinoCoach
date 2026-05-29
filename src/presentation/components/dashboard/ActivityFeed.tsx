import { ActivityItem } from "@/app/actions/dashboard";
import Link from "next/link";

const typeIcon: Record<ActivityItem["type"], string> = {
  exam: "DN",
  question_session: "QS",
};

const typeLabel: Record<ActivityItem["type"], string> = {
  exam: "Deneme",
  question_session: "Soru",
};

export function ActivityFeed({ activities }: { activities: ActivityItem[] }) {
  return (
    <div className="panel dashboard-panel activity-panel">
      <div className="dashboard-panel-head">
        <div>
          <h3>Son Aktiviteler</h3>
          <p>Öğrencilerinizin bugünkü hareketleri</p>
        </div>
        <div className="mini-tabs" aria-label="Aktivite filtreleri">
          <span className="active">Tümü</span>
          <span>Denemeler</span>
          <span>Görevler</span>
          <span>Mesajlar</span>
        </div>
      </div>
      {activities.length === 0 ? (
        <p className="empty-copy">
          Henüz öğrenci aktivitesi yok.
        </p>
      ) : (
        <ul className="activity-list">
          {activities.map((item, i) => (
            <li
              key={item.id}
              className={i < activities.length - 1 ? "with-border" : undefined}
            >
              <div className={`activity-icon activity-icon-${item.type}`}>
                {typeIcon[item.type]}
              </div>
              <div className="activity-body">
                <p>
                  <strong>{item.studentName}</strong>{" "}
                  <span>{item.description}</span>
                </p>
                <span className="activity-meta">{typeLabel[item.type]} · {item.meta}</span>
                {item.note && (
                  <p className="activity-note">
                    {item.note}
                  </p>
                )}
              </div>
              <span className="activity-time">
                {item.timeAgo}
              </span>
            </li>
          ))}
        </ul>
      )}
      <Link href="/coach/students" className="panel-footer-link">Tüm aktiviteleri gör -&gt;</Link>
    </div>
  );
}
