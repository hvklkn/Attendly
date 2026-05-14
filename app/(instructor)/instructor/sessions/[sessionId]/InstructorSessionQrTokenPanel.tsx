"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { Copy, KeyRound, QrCode, RefreshCw } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { issueInstructorSessionQrTokenAction } from "@/lib/instructor/session-actions";
import { formatDateTimeTr } from "@/lib/localization";
import {
  canIssueQrTokenForSessionStatus,
  getQrTokenStatus,
  initialIssueQrTokenActionState,
  type IssuedQrToken,
  type IssueQrTokenActionState,
  type QrTokenMetadata,
  type QrTokenStatus,
} from "@/lib/qr-ui";

type InstructorSessionQrTokenPanelProps = {
  sessionId: string;
  sessionStatus: string;
  latestToken: QrTokenMetadata | null;
};

type DetailRow = {
  label: string;
  value: ReactNode;
};

function getTokenStatusLabel(status: QrTokenStatus) {
  if (status === "active") return "Aktif";
  if (status === "expired") return "Süresi doldu";
  return "Yenilendi";
}

function getTokenStatusTone(status: QrTokenStatus) {
  if (status === "active") return "success" as const;
  if (status === "expired") return "warning" as const;
  return "danger" as const;
}

function getRemainingSeconds(expiresAt: string, now = new Date()) {
  return Math.max(
    0,
    Math.ceil((new Date(expiresAt).getTime() - now.getTime()) / 1000),
  );
}

function TokenDetailList({ items }: { items: DetailRow[] }) {
  return (
    <dl className="divide-y divide-neutral-100">
      {items.map((item) => (
        <div
          key={item.label}
          className="grid gap-2 py-4 first:pt-0 last:pb-0 sm:grid-cols-[140px_1fr]"
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

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = window.setTimeout(() => setCopied(false), 1600);
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
      {copied ? "Kopyalandı" : "Bağlantıyı Kopyala"}
    </button>
  );
}

export function InstructorSessionQrTokenPanel({
  sessionId,
  sessionStatus,
  latestToken,
}: InstructorSessionQrTokenPanelProps) {
  const router = useRouter();
  const [state, setState] = useState<IssueQrTokenActionState>(
    initialIssueQrTokenActionState,
  );
  const [isAutoRotating, setIsAutoRotating] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const mountedRef = useRef(true);
  const refreshInFlightRef = useRef(false);
  const issuedTokenRef = useRef<IssuedQrToken | null>(null);
  const canIssueToken = canIssueQrTokenForSessionStatus(sessionStatus);
  const displayedToken = state.issuedToken ?? latestToken;
  const displayedTokenStatus = displayedToken
    ? getQrTokenStatus(displayedToken)
    : null;
  const hasLatestToken = Boolean(displayedToken);
  const hasDisplayableQr = Boolean(state.issuedToken);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    issuedTokenRef.current = state.issuedToken;

    if (state.issuedToken) {
      setRemainingSeconds(getRemainingSeconds(state.issuedToken.expiresAt));
    }
  }, [state.issuedToken]);

  const issueQrToken = useCallback(
    async (mode: "manual" | "automatic") => {
      if (!canIssueToken || refreshInFlightRef.current) {
        return false;
      }

      refreshInFlightRef.current = true;
      setIsRefreshing(true);

      const formData = new FormData();
      formData.set("sessionId", sessionId);

      try {
        const result = await issueInstructorSessionQrTokenAction(
          initialIssueQrTokenActionState,
          formData,
        );

        if (!mountedRef.current) {
          return false;
        }

        setState(result);

        if (result.status === "success" && result.issuedToken) {
          setRemainingSeconds(getRemainingSeconds(result.issuedToken.expiresAt));
          router.refresh();
          return true;
        }

        if (mode === "automatic") {
          setIsAutoRotating(false);
        }

        return false;
      } catch {
        if (mountedRef.current) {
          setState({
            status: "error",
            message:
              "QR otomatik yenilenemedi. Döngü durduruldu, lütfen tekrar deneyin.",
            issuedToken: issuedTokenRef.current,
          });

          if (mode === "automatic") {
            setIsAutoRotating(false);
          }
        }

        return false;
      } finally {
        if (mountedRef.current) {
          setIsRefreshing(false);
        }

        refreshInFlightRef.current = false;
      }
    },
    [canIssueToken, router, sessionId],
  );

  useEffect(() => {
    if (!isAutoRotating || !canIssueToken) {
      return;
    }

    const intervalId = window.setInterval(() => {
      const issuedToken = issuedTokenRef.current;

      if (!issuedToken) {
        void issueQrToken("automatic");
        return;
      }

      const nextRemainingSeconds = getRemainingSeconds(issuedToken.expiresAt);
      setRemainingSeconds(nextRemainingSeconds);

      if (nextRemainingSeconds <= 0) {
        void issueQrToken("automatic");
      }
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [canIssueToken, isAutoRotating, issueQrToken]);

  async function handleStartRotation() {
    if (!canIssueToken || isRefreshing) {
      return;
    }

    setIsAutoRotating(true);

    const visibleIssuedToken = state.issuedToken ?? issuedTokenRef.current;
    const hasFreshVisibleToken =
      visibleIssuedToken &&
      getQrTokenStatus(visibleIssuedToken) === "active" &&
      getRemainingSeconds(visibleIssuedToken.expiresAt) > 0;

    if (hasFreshVisibleToken) {
      setRemainingSeconds(getRemainingSeconds(visibleIssuedToken.expiresAt));
      return;
    }

    const issued = await issueQrToken("automatic");

    if (!issued && mountedRef.current) {
      setIsAutoRotating(false);
    }
  }

  function handleStopRotation() {
    setIsAutoRotating(false);
  }

  async function handleManualRefresh() {
    await issueQrToken("manual");
  }

  const rotationStatus = useMemo(() => {
    if (!canIssueToken) return "Pasif";
    if (isRefreshing) return "Yenileniyor";
    if (isAutoRotating) return "Döngüde";
    return "Hazır";
  }, [canIssueToken, isAutoRotating, isRefreshing]);

  const tokenRows =
    displayedToken && displayedTokenStatus
      ? [
          {
            label: "QR Durumu",
            value: (
              <StatusBadge
                label={getTokenStatusLabel(displayedTokenStatus)}
                tone={getTokenStatusTone(displayedTokenStatus)}
              />
            ),
          },
          {
            label: "Oluşturulma",
            value: formatDateTimeTr(displayedToken.createdAt),
          },
          {
            label: "Geçerlilik Süresi",
            value: formatDateTimeTr(displayedToken.expiresAt),
          },
          {
            label: "Kalan Süre",
            value: hasDisplayableQr ? `${remainingSeconds} sn` : "Başlatılmadı",
          },
          {
            label: "Yenilenme",
            value: displayedToken.revokedAt
              ? formatDateTimeTr(displayedToken.revokedAt)
              : "Hayır",
          },
        ]
      : [];

  return (
    <SectionCard
      title="Canlı QR Kodu"
      description="Öğrenciler bu bağlantıyı okutarak yoklama adımına geçer. QR kodu 60 saniyede bir otomatik yenilenir."
      actions={
        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-neutral-100 text-neutral-600">
          <KeyRound className="h-4 w-4" aria-hidden="true" />
        </div>
      }
    >
      <div className="grid gap-4">
        {displayedToken ? (
          <TokenDetailList items={tokenRows} />
        ) : (
          <EmptyState
            title="Henüz QR oluşturulmadı"
            description="Oturum yoklamaya hazır olduğunda canlı QR kodu oluşturun."
            icon={<QrCode className="h-5 w-5" aria-hidden="true" />}
            className="min-h-40"
          />
        )}

        <div className="grid gap-3 rounded-md border border-neutral-200 bg-neutral-50 p-4 sm:grid-cols-[1fr_auto] sm:items-center">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-semibold text-neutral-950">
                Kalan Süre
              </p>
              <StatusBadge
                label={rotationStatus}
                tone={isAutoRotating ? "success" : "neutral"}
              />
            </div>
            <p className="mt-1 text-sm leading-6 text-neutral-600">
              {hasDisplayableQr
                ? `${remainingSeconds} saniye sonra yeni QR otomatik oluşturulacak.`
                : "QR döngüsünü başlatınca ilk güvenli okutma bağlantısı oluşturulur."}
            </p>
          </div>

          <div className="text-left sm:text-right">
            <p className="text-3xl font-semibold tabular-nums text-neutral-950">
              {hasDisplayableQr ? remainingSeconds : "--"}
            </p>
            <p className="text-xs font-medium uppercase tracking-normal text-neutral-500">
              saniye
            </p>
          </div>
        </div>

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

        <div className="flex flex-wrap gap-2">
          {isAutoRotating ? (
            <button
              type="button"
              onClick={handleStopRotation}
              className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-neutral-300 bg-white px-4 text-sm font-medium text-neutral-700 transition hover:border-neutral-400 hover:text-neutral-950"
            >
              QR Döngüsünü Durdur
            </button>
          ) : (
            <button
              type="button"
              onClick={handleStartRotation}
              disabled={!canIssueToken || isRefreshing}
              className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-neutral-950 px-4 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-200 disabled:text-neutral-500"
            >
              <RefreshCw
                className={isRefreshing ? "h-4 w-4 animate-spin" : "h-4 w-4"}
                aria-hidden="true"
              />
              {isRefreshing ? "Oluşturuluyor..." : "QR Döngüsünü Başlat"}
            </button>
          )}

          <button
            type="button"
            onClick={handleManualRefresh}
            disabled={!canIssueToken || isRefreshing}
            className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-neutral-300 bg-white px-4 text-sm font-medium text-neutral-700 transition hover:border-neutral-400 hover:text-neutral-950 disabled:cursor-not-allowed disabled:border-neutral-200 disabled:bg-neutral-100 disabled:text-neutral-400"
          >
            <RefreshCw
              className={isRefreshing ? "h-4 w-4 animate-spin" : "h-4 w-4"}
              aria-hidden="true"
            />
            {hasLatestToken ? "QR Yenile" : "QR Oluştur"}
          </button>
        </div>
      </div>

      {state.status === "success" && state.issuedToken ? (
        <div className="mt-5 grid gap-4 border-t border-neutral-100 pt-5">
          <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            {state.message} Ham değer kaydedilmez.
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
              <div className="rounded-md border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
                QR döngüsü açıkken süre dolduğunda yeni QR otomatik
                oluşturulur ve önceki aktif QR geçersiz olur.
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-neutral-700">
                    Okutma Bağlantısı
                  </p>
                  <CopyButton value={state.issuedToken.scanUrl} />
                </div>
                <code className="block break-all rounded-md bg-neutral-950 px-3 py-2 text-xs leading-5 text-white">
                  {state.issuedToken.scanUrl}
                </code>
              </div>

              <div>
                <p className="mb-2 text-sm font-medium text-neutral-700">
                  Ham QR Değeri
                </p>
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
