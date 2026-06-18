"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { Copy, KeyRound, Maximize2, QrCode, RefreshCw, X } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
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

const QR_ROTATION_SECONDS = 60;

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

  async function handleCopy(event: React.MouseEvent<HTMLButtonElement>) {
    event.stopPropagation();

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
      className="inline-flex h-10 w-fit items-center justify-center gap-2 rounded-md border border-neutral-950 bg-white px-4 text-sm font-semibold text-neutral-950 transition hover:bg-neutral-100"
    >
      <Copy className="h-4 w-4" aria-hidden="true" />
      {copied ? "Kopyalandı" : "Yoklama bağlantısını kopyala"}
    </button>
  );
}

function QrVisualCard({
  token,
  remainingSeconds,
  isAutoRotating,
  onOpen,
}: {
  token: IssuedQrToken | null;
  remainingSeconds: number;
  isAutoRotating: boolean;
  onOpen: () => void;
}) {
  const expiryText = token ? formatDateTimeTr(token.expiresAt) : "Henüz yok";

  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (!token) {
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onOpen();
    }
  }

  return (
    <div
      role={token ? "button" : undefined}
      tabIndex={token ? 0 : undefined}
      onClick={token ? onOpen : undefined}
      onKeyDown={handleKeyDown}
      className="grid gap-4 rounded-lg border border-neutral-200 bg-white p-4 shadow-subtle outline-none transition hover:border-neutral-300 focus-visible:ring-2 focus-visible:ring-neutral-950 sm:grid-cols-[minmax(220px,280px)_1fr]"
    >
      <div className="flex min-h-72 items-center justify-center rounded-md bg-neutral-50 p-5">
        {token ? (
          <QRCodeSVG
            value={token.scanUrl}
            size={320}
            level="M"
            marginSize={3}
            className="h-full max-h-64 w-full max-w-64"
            title="Canlı QR kodu"
          />
        ) : (
          <div className="grid justify-items-center gap-3 text-center text-neutral-500">
            <QrCode className="h-12 w-12" aria-hidden="true" />
            <p className="max-w-48 text-sm leading-6">
              QR döngüsünü başlatınca canlı QR kodu burada gösterilecek.
            </p>
          </div>
        )}
      </div>

      <div className="grid content-between gap-4">
        <div className="grid gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-base font-semibold text-neutral-950">
              Canlı QR Kodu
            </p>
            <StatusBadge
              label={isAutoRotating ? "Otomatik Yenileme: Aktif" : "Otomatik Yenileme: Kapalı"}
              tone={isAutoRotating ? "success" : "neutral"}
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-md border border-neutral-200 bg-neutral-50 p-3">
              <p className="text-xs font-medium uppercase tracking-normal text-neutral-500">
                Kalan Süre
              </p>
              <p className="mt-1 text-4xl font-semibold tabular-nums text-neutral-950">
                {token ? remainingSeconds : QR_ROTATION_SECONDS}
              </p>
              <p className="text-sm text-neutral-500">saniye</p>
            </div>

            <div className="rounded-md border border-neutral-200 bg-neutral-50 p-3">
              <p className="text-xs font-medium uppercase tracking-normal text-neutral-500">
                Geçerlilik Süresi
              </p>
              <p className="mt-2 text-sm font-medium leading-6 text-neutral-950">
                {expiryText}
              </p>
            </div>
          </div>

          <p className="text-sm leading-6 text-neutral-600">
            {token
              ? "Yeni QR otomatik oluşturulacak. Bu QR kodu 60 saniyede bir otomatik yenilenir."
              : "Öğrencilerin okutacağı QR kodunu göstermek için döngüyü başlatın."}
          </p>
        </div>

        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            if (token) {
              onOpen();
            }
          }}
          disabled={!token}
          className="inline-flex h-10 w-fit items-center justify-center gap-2 rounded-md bg-neutral-950 px-4 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-200 disabled:text-neutral-500"
        >
          <Maximize2 className="h-4 w-4" aria-hidden="true" />
          Büyüt
        </button>

        {token ? (
          <div className="grid gap-2">
            <CopyButton value={token.scanUrl} />
            <code className="block break-all rounded-md bg-neutral-100 px-3 py-2 text-xs leading-5 text-neutral-900">
              {token.scanUrl}
            </code>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function EnlargedQrModal({
  token,
  remainingSeconds,
  isAutoRotating,
  onClose,
}: {
  token: IssuedQrToken | null;
  remainingSeconds: number;
  isAutoRotating: boolean;
  onClose: () => void;
}) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  if (!token) {
    return null;
  }

  return (
    <div
      role="presentation"
      className="fixed inset-0 z-50 grid place-items-center bg-neutral-950/75 p-4"
      onMouseDown={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="expanded-qr-title"
        className="grid max-h-[94vh] w-full max-w-6xl gap-5 overflow-auto rounded-lg bg-white p-5 shadow-2xl sm:p-6"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2
              id="expanded-qr-title"
              className="text-xl font-semibold text-neutral-950 sm:text-2xl"
            >
              Tam Ekran QR
            </h2>
            <p className="mt-1 text-sm leading-6 text-neutral-600">
              Bu QR kodu 60 saniyede bir otomatik yenilenir.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-neutral-300 bg-white px-3 text-sm font-medium text-neutral-700 transition hover:border-neutral-400 hover:text-neutral-950"
          >
            <X className="h-4 w-4" aria-hidden="true" />
            Kapat
          </button>
        </div>

        <div className="grid justify-items-center gap-5">
          <div className="rounded-lg bg-white p-6 shadow-subtle sm:p-8">
            <QRCodeSVG
              value={token.scanUrl}
              size={1024}
              level="M"
              marginSize={4}
              className="h-[min(70vw,70vh)] max-h-[760px] min-h-[280px] w-[min(70vw,70vh)] max-w-[760px] min-w-[280px]"
              title="Tam ekran canlı QR kodu"
            />
          </div>

          <div className="grid w-full max-w-3xl gap-3 text-center sm:grid-cols-2">
            <div className="rounded-md border border-neutral-200 bg-neutral-50 p-4">
              <p className="text-sm font-medium text-neutral-500">
                Kalan Süre
              </p>
              <p className="mt-1 text-6xl font-semibold tabular-nums text-neutral-950">
                {remainingSeconds}
              </p>
              <p className="text-sm text-neutral-500">saniye</p>
            </div>

            <div className="rounded-md border border-neutral-200 bg-neutral-50 p-4">
              <p className="text-sm font-medium text-neutral-500">
                Otomatik Yenileme
              </p>
              <p className="mt-4 text-2xl font-semibold text-neutral-950">
                {isAutoRotating ? "Aktif" : "Kapalı"}
              </p>
              <p className="mt-2 text-sm leading-6 text-neutral-600">
                Geçerlilik Süresi: {formatDateTimeTr(token.expiresAt)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
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
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const mountedRef = useRef(true);
  const refreshInFlightRef = useRef(false);
  const issuedTokenRef = useRef<IssuedQrToken | null>(null);
  const canIssueToken = canIssueQrTokenForSessionStatus(sessionStatus);
  const isClosedSession = sessionStatus === "CLOSED";
  const displayedToken = state.issuedToken ?? latestToken;
  const displayedTokenStatus = displayedToken
    ? getQrTokenStatus(displayedToken)
    : null;
  const hasLatestToken = Boolean(displayedToken);
  const hasDisplayableQr = Boolean(state.issuedToken);

  const closeQrModal = useCallback(() => {
    setIsQrModalOpen(false);
  }, []);

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
    } else {
      setIsQrModalOpen(false);
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

        if (result.status === "success" && result.issuedToken) {
          issuedTokenRef.current = result.issuedToken;
          setState(result);
          setRemainingSeconds(getRemainingSeconds(result.issuedToken.expiresAt));
          router.refresh();
          return true;
        }

        setState({
          ...result,
          issuedToken: issuedTokenRef.current,
        });

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
    if (!state.issuedToken && !isAutoRotating) {
      return;
    }

    const intervalId = window.setInterval(() => {
      const issuedToken = issuedTokenRef.current;

      if (!issuedToken) {
        if (isAutoRotating && canIssueToken) {
          void issueQrToken("automatic");
        }
        return;
      }

      const nextRemainingSeconds = getRemainingSeconds(issuedToken.expiresAt);
      setRemainingSeconds(nextRemainingSeconds);

      if (isAutoRotating && canIssueToken && nextRemainingSeconds <= 0) {
        void issueQrToken("automatic");
      }
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [canIssueToken, isAutoRotating, issueQrToken, state.issuedToken]);

  async function handleStartRotation() {
    if (!canIssueToken || isRefreshing) {
      return;
    }

    setIsAutoRotating(true);

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
            value: hasDisplayableQr
              ? `${remainingSeconds} sn`
              : `${QR_ROTATION_SECONDS} sn`,
          },
          {
            label: "Otomatik Yenileme",
            value: isAutoRotating ? "Aktif" : "Kapalı",
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
      description={
        isClosedSession
          ? "Bu yoklama oturumu kapatıldığı için yeni QR kodu oluşturulamaz."
          : "Öğrenciler bu bağlantıyı okutarak yoklama adımına geçer. QR kodu 60 saniyede bir otomatik yenilenir."
      }
      actions={
        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-neutral-100 text-neutral-600">
          <KeyRound className="h-4 w-4" aria-hidden="true" />
        </div>
      }
    >
      <div className="grid gap-4">
        <QrVisualCard
          token={state.issuedToken}
          remainingSeconds={remainingSeconds}
          isAutoRotating={isAutoRotating}
          onOpen={() => setIsQrModalOpen(true)}
        />

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
            {isClosedSession
              ? "Yoklama kapatıldı. Öğrenciler bu oturum için yeni kayıt oluşturamaz."
              : "QR yalnızca taslak, planlı veya aktif oturumlar için oluşturulabilir."}
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

          <div className="grid min-w-0 gap-4">
            <div className="rounded-md border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
              QR döngüsü açıkken süre dolduğunda yeni QR otomatik oluşturulur
              ve önceki aktif QR geçersiz olur.
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-neutral-700">
                  Yoklama Bağlantısı
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
      ) : null}

      {isQrModalOpen ? (
        <EnlargedQrModal
          token={state.issuedToken}
          remainingSeconds={remainingSeconds}
          isAutoRotating={isAutoRotating}
          onClose={closeQrModal}
        />
      ) : null}
    </SectionCard>
  );
}
