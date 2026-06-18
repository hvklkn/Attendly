"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, CheckCircle2, LoaderCircle, MapPin } from "lucide-react";
import { submitStudentAttendanceAction } from "@/lib/student/attendance-actions";
import { createStudentScanResultUrl } from "@/lib/student/attendance-result";

type CheckInPhase = "idle" | "locating" | "submitting" | "error";

type StudentAttendanceCheckInProps = {
  token: string;
};

function getCurrentPosition() {
  return new Promise<GeolocationPosition>((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      maximumAge: 0,
      timeout: 15000,
    });
  });
}

export function StudentAttendanceCheckIn({
  token,
}: StudentAttendanceCheckInProps) {
  const router = useRouter();
  const [phase, setPhase] = useState<CheckInPhase>("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function handleCheckIn() {
    setMessage(null);

    if (!("geolocation" in navigator)) {
      router.push(
        createStudentScanResultUrl({
          code: "location_unavailable",
          token,
        }),
      );
      return;
    }

    try {
      setPhase("locating");
      const position = await getCurrentPosition();

      setPhase("submitting");
      const result = await submitStudentAttendanceAction({
        token,
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracyMeters: Number.isFinite(position.coords.accuracy)
          ? position.coords.accuracy
          : null,
      });

      router.push(result.resultUrl);
    } catch {
      setPhase("error");
      setMessage(
        "Konumunuz alınamadı. Lütfen konum izni verip tekrar deneyin.",
      );
      router.push(
        createStudentScanResultUrl({
          code: "location_unavailable",
          token,
        }),
      );
    }
  }

  const isBusy = phase === "locating" || phase === "submitting";

  return (
    <div className="grid gap-3">
      <button
        type="button"
        onClick={() => {
          void handleCheckIn();
        }}
        disabled={isBusy}
        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-neutral-950 px-4 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-300 disabled:text-neutral-500 sm:w-fit"
      >
        {isBusy ? (
          <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
        ) : phase === "error" ? (
          <AlertTriangle className="h-4 w-4" aria-hidden="true" />
        ) : (
          <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
        )}
        {phase === "locating"
          ? "Konum alınıyor..."
          : phase === "submitting"
            ? "Yoklama gönderiliyor..."
            : phase === "error"
              ? "Tekrar Dene"
              : "Yoklamaya Katıl"}
      </button>

      {message ? (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900"
        >
          <MapPin
            className="mt-0.5 h-5 w-5 shrink-0 text-amber-700"
            aria-hidden="true"
          />
          <p>{message}</p>
        </div>
      ) : (
        <p className="text-sm leading-6 text-neutral-600">
          Konumunuz yalnızca bu yoklama oturumu için sınıf alanı kontrolünde
          kullanılır.
        </p>
      )}
    </div>
  );
}
