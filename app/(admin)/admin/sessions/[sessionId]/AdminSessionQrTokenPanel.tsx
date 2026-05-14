"use client";

import { useActionState, useEffect, useState, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { Copy, KeyRound, QrCode, RefreshCw } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { issueAdminSessionQrTokenAction } from "@/lib/admin/session-actions";
import { formatDateTimeTr } from "@/lib/localization";
import {
  canIssueQrTokenForSessionStatus,
  getQrTokenStatus,
  initialIssueQrTokenActionState,
  type AdminQrTokenMetadata,
  type QrTokenStatus,
} from "@/lib/admin/session-qr";

type AdminSessionQrTokenPanelProps = {
  sessionId: string;
  sessionStatus: string;
  latestToken: AdminQrTokenMetadata | null;
};

type DetailRow = {
  label: string;
  value: ReactNode;
};

function formatDateTime(value: string) {
  return formatDateTimeTr(value);
}

function formatTokenStatus(status: QrTokenStatus) {
  if (status === "active") return "Aktif";
  if (status === "expired") return "Süresi doldu";
  return "Yenilendi";
}

function getTokenStatusTone(status: QrTokenStatus) {
  if (status === "active") return "success" as const;
  if (status === "expired") return "warning" as const;
  return "danger" as const;
}

function TokenDetailList({ items }: { items: DetailRow[] }) {
  return (
    <dl className="divide-y divide-neutral-100">
      {items.map((item) => (
        <div
          key={item.label}
          className="grid gap-2 py-4 first:pt-0 last:pb-0 sm:grid-cols-[130px_1fr]"
        >
          <dt className="text-sm font-medium text-neutral-500">{item.label}</dt>
          <dd className="min-w-0 text-sm font-medium text-neutral-950">
            {item.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function IssueButton({
  disabled,
  hasLatestToken,
}: {
  disabled: boolean;
  hasLatestToken: boolean;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={disabled || pending}
      className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-neutral-950 px-4 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-200 disabled:text-neutral-500"
    >
      <RefreshCw
        className={pending ? "h-4 w-4 animate-spin" : "h-4 w-4"}
        aria-hidden="true"
      />
      {pending ? "Oluşturuluyor..." : hasLatestToken ? "QR Yenile" : "QR Oluştur"}
    </button>
  );
}

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex h-8 items-center justify-center gap-2 rounded-md border border-neutral-300 bg-white px-3 text-xs font-medium text-neutral-700 transition hover:border-neutral-400 hover:text-neutral-950"
    >
      <Copy className="h-3.5 w-3.5" aria-hidden="true" />
      {copied ? "Kopyalandı" : label}
    </button>
  );
}

export function AdminSessionQrTokenPanel({
  sessionId,
  sessionStatus,
  latestToken,
}: AdminSessionQrTokenPanelProps) {
  const router = useRouter();
  const [state, formAction] = useActionState(
    issueAdminSessionQrTokenAction,
    initialIssueQrTokenActionState,
  );
  const canIssueToken = canIssueQrTokenForSessionStatus(sessionStatus);
  const displayedToken = state.issuedToken ?? latestToken;
  const displayedTokenStatus = displayedToken
    ? getQrTokenStatus(displayedToken)
    : null;
  const hasLatestToken = Boolean(displayedToken);

  useEffect(() => {
    if (state.status === "success") {
      router.refresh();
    }
  }, [router, state.issuedToken?.id, state.status]);

  const tokenRows =
    displayedToken && displayedTokenStatus
      ? [
          {
            label: "Anahtar Kimliği",
            value: (
              <span className="break-all font-mono text-xs">
                {displayedToken.id}
              </span>
            ),
          },
          {
            label: "QR Durumu",
            value: (
              <StatusBadge
                label={formatTokenStatus(displayedTokenStatus)}
                tone={getTokenStatusTone(displayedTokenStatus)}
              />
            ),
          },
          { label: "Oluşturulma", value: formatDateTime(displayedToken.createdAt) },
          { label: "Geçerlilik Süresi", value: formatDateTime(displayedToken.expiresAt) },
          {
            label: "Yenilenme",
            value: displayedToken.revokedAt
              ? formatDateTime(displayedToken.revokedAt)
              : "Hayır",
          },
        ]
      : [];

  return (
    <SectionCard
      title="QR Anahtarı"
      description="Bu yoklama oturumu için 60 saniyelik okutma değeri oluşturun."
      actions={
        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-neutral-100 text-neutral-600">
          <KeyRound className="h-4 w-4" aria-hidden="true" />
        </div>
      }
    >
      <form action={formAction} className="grid gap-4">
        <input type="hidden" name="sessionId" value={sessionId} />

        {displayedToken ? (
          <TokenDetailList items={tokenRows} />
        ) : (
          <EmptyState
            title="Henüz QR oluşturulmadı"
            description="Oturum QR okutmaya hazır olduğunda güvenli okutma değeri oluşturun."
            icon={<QrCode className="h-5 w-5" aria-hidden="true" />}
            className="min-h-40"
          />
        )}

        {state.status === "error" && state.message ? (
          <div
            role="alert"
            className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
          >
            {state.message}
          </div>
        ) : null}

        {!canIssueToken ? (
          <p className="text-sm leading-6 text-neutral-500">
            QR yalnızca taslak, planlı veya aktif oturumlar için oluşturulabilir.
          </p>
        ) : null}

        <IssueButton disabled={!canIssueToken} hasLatestToken={hasLatestToken} />
      </form>

      {state.status === "success" && state.issuedToken ? (
        <div className="mt-5 grid gap-4 border-t border-neutral-100 pt-5">
          <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            {state.message} Ham değer oluşturma sonrasında saklanmaz.
          </div>

          <div className="grid gap-4 lg:grid-cols-[180px_1fr]">
            <div className="flex aspect-square items-center justify-center rounded-md border border-dashed border-neutral-300 bg-neutral-50 text-neutral-500">
              <div className="grid justify-items-center gap-2">
                <QrCode className="h-14 w-14" aria-hidden="true" />
                <span className="text-xs font-medium uppercase tracking-normal">
                  QR alanı
                </span>
              </div>
            </div>

            <div className="grid min-w-0 gap-4">
              <div>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-neutral-700">
                    Okutma Bağlantısı
                  </p>
                  <CopyButton
                    value={state.issuedToken.scanUrl}
                    label="Bağlantıyı Kopyala"
                  />
                </div>
                <code className="block break-all rounded-md bg-neutral-950 px-3 py-2 text-xs leading-5 text-white">
                  {state.issuedToken.scanUrl}
                </code>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-neutral-700">
                    Ham QR Değeri
                  </p>
                  <CopyButton
                    value={state.issuedToken.rawToken}
                    label="Değeri Kopyala"
                  />
                </div>
                <code className="block break-all rounded-md bg-neutral-100 px-3 py-2 text-xs leading-5 text-neutral-900">
                  {state.issuedToken.rawToken}
                </code>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </SectionCard>
  );
}
