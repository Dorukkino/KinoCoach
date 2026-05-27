"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { CoachingInvitationDto } from "@/application/dto";
import {
  acceptInvitationAction,
  declineInvitationAction,
} from "@/app/actions/invitations";
import { useSupabaseTableRealtime } from "@/presentation/hooks/useSupabaseTableRealtime";

export function StudentInvitationsBanner({
  invitations,
}: {
  invitations: CoachingInvitationDto[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [active, setActive] = useState(invitations);

  useEffect(() => {
    setActive(invitations);
  }, [invitations]);

  const refreshInvitations = useCallback(() => {
    router.refresh();
  }, [router]);

  useSupabaseTableRealtime({
    channelName: "student-invitations",
    table: "coaching_invitations",
    pollIntervalMs: 5000,
    onChange: refreshInvitations,
  });

  const respond = (
    token: string,
    invitationId: string,
    action: "accept" | "decline"
  ) => {
    startTransition(async () => {
      try {
        if (action === "accept") {
          await acceptInvitationAction(token);
        } else {
          await declineInvitationAction(token);
        }
        setActive((prev) => prev.filter((i) => i.id !== invitationId));
        router.refresh();
      } catch (err) {
        alert(err instanceof Error ? err.message : "Davete yanıt verilemedi.");
      }
    });
  };

  if (active.length === 0) return null;

  return (
    <div className="space-y-3 mb-4">
      {active.map((inv) => (
        <div
          key={inv.id}
          className="panel p-5 border-l-4 border-[var(--accent)]"
        >
          <p className="text-xs font-semibold text-[var(--muted)] m-0 mb-1">
            Yeni koçluk daveti
          </p>
          <p className="text-base font-semibold m-0 mb-2">
            <strong>{inv.coachName}</strong> seni öğrencisi olmaya davet etti.
          </p>
          <p className="text-xs text-[var(--muted)] m-0 mb-3">
            Davet son geçerlilik: {new Date(inv.expiresAt).toLocaleDateString("tr-TR")}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              className="btn btn-primary"
              disabled={pending}
              onClick={() => respond(inv.token, inv.id, "accept")}
            >
              Kabul et
            </button>
            <button
              type="button"
              className="btn btn-outline"
              disabled={pending}
              onClick={() => respond(inv.token, inv.id, "decline")}
            >
              Reddet
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
