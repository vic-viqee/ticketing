"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type ScanResult = {
  status: "CHECKED_IN" | "ALREADY_USED" | "INVALID";
  attendeeName?: string;
  ticketTier?: string;
};

export default function OrganizerCheckInPage() {
  const params = useParams();
  const eventId = params.eventId as string;
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [count, setCount] = useState(0);
  const [isScanning, setIsScanning] = useState(false);
  const lastScanRef = useRef<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadCount() {
      try {
        const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
        const res = await fetch(`${base}/api/organizer/events/${eventId}/attendees`, {
          cache: "no-store",
        });
        if (!res.ok) return;
        const { data } = (await res.json()) as {
          data: { attendees: { checkedIn: boolean }[] };
        };
        if (!active) return;
        setCount(data.attendees.filter((a) => a.checkedIn).length);
      } catch {
        // ignore
      }
    }

    loadCount();
    const interval = setInterval(loadCount, 5000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [eventId]);

  async function handleScan(raw: string) {
    const token = raw.trim();
    if (!token || token === lastScanRef.current) return;
    lastScanRef.current = token;

    try {
      const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
      const res = await fetch(`${base}/api/organizer/events/${eventId}/check-in`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ qrCodeToken: token }),
      });
      const json = await res.json();
      if (!json.success) {
        setScanResult({ status: "INVALID" });
        return;
      }
      setScanResult({
        status: json.data.checkedIn ? "ALREADY_USED" : "CHECKED_IN",
        attendeeName: json.data.attendeeName,
        ticketTier: json.data.ticketTier,
      });
      setCount((c) => c + (json.data.checkedIn ? 0 : 1));
    } catch {
      setScanResult({ status: "INVALID" });
    }
  }

  function startScanner() {
    setIsScanning(true);
    setScanResult(null);

    if (!("BarcodeDetector" in window)) {
      alert("QR scanning is not supported in this browser.");
      setIsScanning(false);
      return;
    }

    const BarcodeDetectorCtor = (
      window as unknown as {
        BarcodeDetector: new (options: { formats: string[] }) => {
          detect(source: HTMLVideoElement): Promise<{ rawValue: string }[]>;
        };
      }
    ).BarcodeDetector;
    const detector = new BarcodeDetectorCtor({ formats: ["qr_code"] });

    let stream: MediaStream | null = null;
    let video: HTMLVideoElement | null = null;
    let raf: number;

    async function init() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });
      } catch {
        alert("Camera permission is required for QR scanning.");
        setIsScanning(false);
        return;
      }

      video = document.createElement("video");
      video.srcObject = stream;
      video.setAttribute("playsinline", "true");
      document.body.appendChild(video);

      await video.play();

      async function tick() {
        if (!video) return;
        try {
          const barcodes = await detector.detect(video);
          if (barcodes.length > 0) {
            await handleScan(barcodes[0].rawValue);
          }
        } catch {
          // ignore frame errors
        }
        raf = requestAnimationFrame(tick);
      }

      tick();
    }

    init();

    return () => {
      cancelAnimationFrame(raf);
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      if (video && video.parentNode) {
        video.parentNode.removeChild(video);
      }
      setIsScanning(false);
    };
  }

  const cleanup = useRef<(() => void) | null | undefined>(null);

  useEffect(() => {
    return () => {
      if (cleanup.current) cleanup.current();
    };
  }, []);

  function onStartClick() {
    cleanup.current = startScanner();
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">Check-In Scanner</h1>
            <p className="text-sm text-muted-foreground">
              Event: {eventId} · Checked in: {count}
            </p>
          </div>
          <Button onClick={onStartClick} disabled={isScanning}>
            {isScanning ? "Scanning..." : "Start Scan"}
          </Button>
        </div>

        <div className="mt-6">
          {scanResult && (
            <div className="rounded-md border p-4 text-sm">
              <p>
                Status:{" "}
                <span className="font-medium">
                  {scanResult.status === "CHECKED_IN"
                    ? "Checked In"
                    : scanResult.status === "ALREADY_USED"
                    ? "Already Used"
                    : "Invalid"}
                </span>
              </p>
              {scanResult.attendeeName && (
                <p>Attendee: {scanResult.attendeeName}</p>
              )}
              {scanResult.ticketTier && <p>Ticket: {scanResult.ticketTier}</p>}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
