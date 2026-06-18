"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Camera,
  QrCode,
  RefreshCw,
} from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { routes } from "@/constants/routes";

type ScannerPhase =
  | "idle"
  | "opening_camera"
  | "scanning"
  | "scanned"
  | "error";

type Html5QrcodeInstance = import("html5-qrcode").Html5Qrcode;

const SCANNER_REGION_ID = "student-qr-camera-region";
const CAMERA_ERROR_MESSAGE =
  "Kamera izni alınamadı. QR kodu telefonunuzun kamera uygulamasıyla okutabilir veya eğitmenden yoklama bağlantısını isteyebilirsiniz.";
const INVALID_QR_MESSAGE =
  "QR kodu geçerli bir yoklama bağlantısı içermiyor.";
const TOKEN_MIN_LENGTH = 20;
const TOKEN_MAX_LENGTH = 512;
const TOKEN_PATTERN = /^[A-Za-z0-9_-]+$/;

function normalizeScannedToken(value: string | null) {
  const token = value?.trim();

  if (!token) {
    return null;
  }

  if (
    token.length < TOKEN_MIN_LENGTH ||
    token.length > TOKEN_MAX_LENGTH ||
    !TOKEN_PATTERN.test(token)
  ) {
    return null;
  }

  return token;
}

function isUrlLikePayload(value: string) {
  return (
    /^(https?:\/\/|\/|\.\/|\.\.\/)/i.test(value) ||
    value.includes("?token=") ||
    value.includes("&token=")
  );
}

function extractTokenFromQrPayload(payload: string) {
  const scannedText = payload.trim();

  if (!scannedText) {
    return null;
  }

  if (isUrlLikePayload(scannedText)) {
    try {
      const url = new URL(scannedText, window.location.origin);
      return normalizeScannedToken(url.searchParams.get("token"));
    } catch {
      return null;
    }
  }

  return normalizeScannedToken(scannedText);
}

function getStatusLabel(phase: ScannerPhase, errorMessage: string | null) {
  if (phase === "opening_camera") {
    return "Kamera açılıyor...";
  }

  if (phase === "scanning") {
    return "QR kodu kameraya gösterin";
  }

  if (phase === "scanned") {
    return "QR kodu okundu";
  }

  if (phase === "error") {
    return errorMessage ?? "Tekrar deneyin";
  }

  return "Hazır";
}

function getStatusTone(phase: ScannerPhase, errorMessage: string | null) {
  if (phase === "error") {
    return errorMessage === CAMERA_ERROR_MESSAGE ? "warning" : "danger";
  }

  if (phase === "scanned") {
    return "success";
  }

  if (phase === "opening_camera" || phase === "scanning") {
    return "info";
  }

  return "neutral";
}

export function StudentQrScanner() {
  const router = useRouter();
  const isMountedRef = useRef(true);
  const scannerRef = useRef<Html5QrcodeInstance | null>(null);
  const isStartingScannerRef = useRef(false);
  const hasHandledScanRef = useRef(false);
  const [phase, setPhase] = useState<ScannerPhase>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const stopScanner = useCallback(async () => {
    const scanner = scannerRef.current;

    if (!scanner) {
      return;
    }

    scannerRef.current = null;

    try {
      if (scanner.isScanning) {
        await scanner.stop();
      }
    } catch {
      // The browser may already have stopped the media stream.
    }

    try {
      scanner.clear();
    } catch {
      // Clearing is best-effort after camera permission or lifecycle errors.
    }
  }, []);

  const handleDecodedText = useCallback(
    async (decodedText: string) => {
      if (hasHandledScanRef.current) {
        return;
      }

      hasHandledScanRef.current = true;
      const token = extractTokenFromQrPayload(decodedText);

      if (!token) {
        setPhase("error");
        setErrorMessage(INVALID_QR_MESSAGE);
        await stopScanner();
        return;
      }

      setPhase("scanned");
      setErrorMessage(null);
      await stopScanner();

      const searchParams = new URLSearchParams({
        token,
      });

      router.push(`${routes.student.scan}?${searchParams.toString()}`);
    },
    [router, stopScanner],
  );

  const startScanner = useCallback(async () => {
    if (scannerRef.current || isStartingScannerRef.current) {
      return;
    }

    await stopScanner();
    hasHandledScanRef.current = false;
    isStartingScannerRef.current = true;
    setPhase("opening_camera");
    setErrorMessage(null);

    try {
      const { Html5Qrcode, Html5QrcodeSupportedFormats } = await import(
        "html5-qrcode"
      );

      if (!isMountedRef.current) {
        return;
      }

      const scanner = new Html5Qrcode(SCANNER_REGION_ID, {
        formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
        verbose: false,
      });

      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: { ideal: "environment" } },
        {
          fps: 10,
          qrbox: (viewfinderWidth, viewfinderHeight) => {
            const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
            const boxSize = Math.max(220, Math.floor(minEdge * 0.72));

            return {
              width: Math.min(boxSize, viewfinderWidth),
              height: Math.min(boxSize, viewfinderHeight),
            };
          },
        },
        (decodedText) => {
          void handleDecodedText(decodedText);
        },
        () => undefined,
      );

      if (!isMountedRef.current) {
        await stopScanner();
        return;
      }

      if (!hasHandledScanRef.current) {
        setPhase("scanning");
      }
    } catch {
      await stopScanner();
      setPhase("error");
      setErrorMessage(CAMERA_ERROR_MESSAGE);
    } finally {
      isStartingScannerRef.current = false;
    }
  }, [handleDecodedText, stopScanner]);

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
      void stopScanner();
    };
  }, [stopScanner]);

  const statusLabel = getStatusLabel(phase, errorMessage);
  const statusTone = getStatusTone(phase, errorMessage);
  const isBusy = phase === "opening_camera" || phase === "scanning";
  const hasCameraArea = phase === "opening_camera" || phase === "scanning";

  return (
    <div className="grid gap-6">
      <SectionCard
        title="QR ile Yoklamaya Katıl"
        description="QR kodu telefonunuzun kamera uygulamasıyla okutun veya eğitmeninizden yoklama bağlantısını isteyin."
        actions={<StatusBadge label={statusLabel} tone={statusTone} />}
      >
        <div className="grid gap-5">
          <div className="flex items-start gap-3 rounded-lg border border-sky-200 bg-sky-50 p-4 text-sm leading-6 text-sky-900">
            <QrCode
              className="mt-0.5 h-5 w-5 shrink-0 text-sky-700"
              aria-hidden="true"
            />
            <p>
              QR kodu telefonunuzun kamera uygulamasıyla okutun veya
              eğitmeninizden yoklama bağlantısını isteyin.
            </p>
          </div>

          {hasCameraArea ? (
            <div className="grid gap-3">
              <div className="flex items-center gap-2 text-sm font-medium text-neutral-700">
                <Camera className="h-4 w-4" aria-hidden="true" />
                {phase === "opening_camera"
                  ? "Kamera açılıyor..."
                  : "QR kodu kameraya gösterin"}
              </div>
              <div className="relative overflow-hidden rounded-lg border border-neutral-900 bg-neutral-950 shadow-subtle">
                <div
                  id={SCANNER_REGION_ID}
                  className="min-h-[320px] w-full text-white sm:min-h-[420px] [&_canvas]:!hidden [&_video]:!h-full [&_video]:!w-full [&_video]:!object-cover"
                />
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-8">
                  <div className="h-full max-h-80 w-full max-w-80 rounded-lg border-2 border-white/80 shadow-[0_0_0_999px_rgba(0,0,0,0.22)]" />
                </div>
              </div>
            </div>
          ) : (
            <div className="flex min-h-72 flex-col items-center justify-center rounded-lg border border-dashed border-neutral-300 bg-neutral-50 px-6 py-10 text-center">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-md bg-white text-neutral-600 shadow-subtle">
                <QrCode className="h-6 w-6" aria-hidden="true" />
              </div>
              <h3 className="text-base font-semibold text-neutral-950">
                QR kodu okutmaya hazır
              </h3>
              <p className="mt-2 max-w-xl text-sm leading-6 text-neutral-600">
                Uygulama içinden okutmayı yalnızca ihtiyaç duyarsanız açın.
                Kamera izni verilmezse telefonunuzun kamera uygulamasıyla
                okutmaya devam edebilirsiniz.
              </p>
            </div>
          )}

          {phase === "error" && errorMessage ? (
            <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
              <AlertTriangle
                className="mt-0.5 h-5 w-5 shrink-0 text-amber-700"
                aria-hidden="true"
              />
              <p>{errorMessage}</p>
            </div>
          ) : null}

          <button
            type="button"
            onClick={() => {
              void startScanner();
            }}
            disabled={isBusy || phase === "scanned"}
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-md bg-neutral-950 px-5 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-300 disabled:text-neutral-500 sm:w-fit"
          >
            {phase === "error" ? (
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
            ) : (
              <QrCode className="h-4 w-4" aria-hidden="true" />
            )}
            {phase === "error" ? "Tekrar Dene" : "Uygulama içinden QR okut"}
          </button>
        </div>
      </SectionCard>
    </div>
  );
}
