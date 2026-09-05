import {
  useEffect,
  useLayoutEffect,
  useId,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import type { CameraBackendProps } from "./backend.types";
import {
  EMPTY_CAPABILITIES,
  clamp,
  histogramFromPixels,
  type Range,
} from "./model";
import { applyMatrix, lookMatrix } from "../looks/recipes";

type BrowserCapabilities = MediaTrackCapabilities & {
  zoom?: Range;
  iso?: Range;
  exposureTime?: Range;
  exposureCompensation?: Range;
  focusDistance?: Range;
  colorTemperature?: Range;
  exposureMode?: string[];
  focusMode?: string[];
  whiteBalanceMode?: string[];
  pointsOfInterest?: boolean;
};
export function CameraBackend({
  ref: forwardedRef,
  ...props
}: CameraBackendProps) {
  const { preferences: p, active } = props;
  const latest = useRef(props);
  useLayoutEffect(() => {
    latest.current = props;
  }, [props]);
  const video = useRef<HTMLVideoElement>(null);
  const stream = useRef<MediaStream | null>(null);
  const caps = useRef<BrowserCapabilities>({});
  const [hardwareZoom, setHardwareZoom] = useState(false);
  const [generation, setGeneration] = useState(0);
  const applying = useRef(Promise.resolve());
  const filterId = `look-${useId().replace(/[^a-z0-9]/gi, "")}`;
  const matrix = useMemo(
    () => lookMatrix(p.look, p.intensity),
    [p.look, p.intensity],
  );

  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    let ownStream: MediaStream | undefined;
    latest.current.onReady(false);
    async function start() {
      if (!navigator.mediaDevices?.getUserMedia)
        throw new Error(
          "Camera access needs HTTPS or localhost and a supported browser.",
        );
      const options: MediaStreamConstraints = {
        audio: false,
        video: {
          ...(p.deviceId
            ? { deviceId: { exact: p.deviceId } }
            : {
                facingMode: {
                  ideal: p.facing === "back" ? "environment" : "user",
                },
              }),
          width: { ideal: 3840 },
          height: { ideal: 2160 },
        },
      };
      try {
        ownStream = await navigator.mediaDevices.getUserMedia(options);
      } catch (error) {
        // Browsers may rotate device identifiers after a restart or permission change.
        if (
          !p.deviceId ||
          !(error instanceof DOMException) ||
          error.name !== "OverconstrainedError"
        )
          throw error;
        if (cancelled) return;
        ownStream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            facingMode: { ideal: p.facing === "back" ? "environment" : "user" },
            width: { ideal: 3840 },
            height: { ideal: 2160 },
          },
        });
      }
      if (cancelled) {
        ownStream.getTracks().forEach((t) => t.stop());
        return;
      }
      stream.current = ownStream;
      const element = video.current;
      if (!element) return;
      element.srcObject = ownStream;
      await element.play();
      if (cancelled) return;
      const track = ownStream.getVideoTracks()[0];
      const capabilities =
        (track.getCapabilities?.() as BrowserCapabilities) ?? {};
      caps.current = capabilities;
      setHardwareZoom(!!capabilities.zoom);
      const info = track.getSettings();
      const available = (
        await navigator.mediaDevices.enumerateDevices()
      ).filter((d) => d.kind === "videoinput");
      if (cancelled) return;
      latest.current.onCapabilities({
        ...EMPTY_CAPABILITIES,
        id: info.deviceId ?? "",
        name: track.label || "Browser camera",
        formats: ["jpeg"],
        devices: available.map((d, i) => ({
          id: d.deviceId,
          name: d.label || `Camera ${i + 1}`,
          facing: /front|user|facetime/i.test(d.label) ? "front" : "back",
        })),
        zoom: capabilities.zoom ?? { min: 1, max: 4 },
        zoomStops: [1, 1.5, 2, 3].filter(
          (v) =>
            v >= (capabilities.zoom?.min ?? 1) &&
            v <= (capabilities.zoom?.max ?? 4),
        ),
        iso: capabilities.exposureMode?.includes("manual")
          ? capabilities.iso
          : undefined,
        shutter:
          capabilities.exposureMode?.includes("manual") &&
          capabilities.exposureTime
            ? {
                min: capabilities.exposureTime.min / 10000,
                max: capabilities.exposureTime.max / 10000,
              }
            : undefined,
        focus: capabilities.focusMode?.includes("manual")
          ? capabilities.focusDistance
          : undefined,
        temperature: capabilities.whiteBalanceMode?.includes("manual")
          ? capabilities.colorTemperature
          : undefined,
        ev: capabilities.exposureCompensation,
        metering: !!capabilities.pointsOfInterest,
        histogram: true,
        resolutions: [
          {
            width: info.width ?? element.videoWidth,
            height: info.height ?? element.videoHeight,
          },
        ],
      });
      track.onended = () => {
        latest.current.onReady(false);
        latest.current.onError(
          "Camera disconnected. Reconnect it and tap Retry camera.",
        );
      };
      setGeneration((v) => v + 1);
    }
    void start().catch((error) => {
      if (!cancelled)
        latest.current.onError(
          error instanceof Error
            ? error.message ||
                `The camera could not start (${error.name}). Check camera access and retry.`
            : "The camera could not start.",
        );
    });
    return () => {
      cancelled = true;
      ownStream?.getTracks().forEach((t) => t.stop());
      if (stream.current === ownStream) stream.current = null;
    };
  }, [active, p.facing, p.deviceId]);

  useEffect(() => {
    const track = stream.current?.getVideoTracks()[0];
    if (!active || !generation || !track) return;
    const c = caps.current;
    const m = p.manual;
    let cancelled = false;
    latest.current.onReady(false);
    const settings: Record<string, unknown> = {};
    if (c.zoom) settings.zoom = clamp(p.zoom, c.zoom.min, c.zoom.max);
    if (c.exposureMode?.includes("manual")) {
      const locked =
        p.mode === "MANUAL" && (m.iso !== null || m.shutter !== null);
      settings.exposureMode = locked ? "manual" : "continuous";
      if (locked && m.iso !== null && c.iso)
        settings.iso = clamp(m.iso, c.iso.min, c.iso.max);
      if (locked && m.shutter !== null && c.exposureTime)
        settings.exposureTime = clamp(
          m.shutter * 10000,
          c.exposureTime.min,
          c.exposureTime.max,
        );
    }
    if (c.focusMode?.includes("manual")) {
      settings.focusMode =
        p.mode === "MANUAL" && m.focus !== null ? "manual" : "continuous";
      if (p.mode === "MANUAL" && m.focus !== null && c.focusDistance)
        settings.focusDistance = clamp(
          m.focus,
          c.focusDistance.min,
          c.focusDistance.max,
        );
    }
    if (c.whiteBalanceMode?.includes("manual")) {
      settings.whiteBalanceMode =
        p.mode === "MANUAL" && m.temperature !== null ? "manual" : "continuous";
      if (p.mode === "MANUAL" && m.temperature !== null && c.colorTemperature)
        settings.colorTemperature = clamp(
          m.temperature,
          c.colorTemperature.min,
          c.colorTemperature.max,
        );
    }
    if (
      c.exposureCompensation &&
      (p.mode === "PHOTO" || (m.iso === null && m.shutter === null))
    )
      settings.exposureCompensation = clamp(
        m.ev,
        c.exposureCompensation.min,
        c.exposureCompensation.max,
      );
    applying.current = applying.current
      .catch(() => undefined)
      .then(async () => {
        if (cancelled) return;
        if (Object.keys(settings).length)
          await track.applyConstraints({
            advanced: [settings as MediaTrackConstraintSet],
          });
        if (!cancelled) latest.current.onReady(true);
      });
    void applying.current.catch((error) => {
      if (!cancelled)
        latest.current.onError(
          `The camera rejected this setting. ${error instanceof Error ? error.message : ""}`,
        );
    });
    return () => {
      cancelled = true;
    };
  }, [active, generation, p.manual, p.mode, p.zoom]);

  function captureCanvas(size?: number) {
    const element = video.current;
    if (!element || element.readyState < 2)
      throw new Error("The camera is not ready yet.");
    const canvas = document.createElement("canvas");
    const width = element.videoWidth,
      height = element.videoHeight;
    const zoom = caps.current.zoom ? 1 : latest.current.preferences.zoom;
    const scale = size ? Math.min(1, size / width) : 1 / zoom;
    canvas.width = Math.max(1, Math.round(width * scale));
    canvas.height = Math.max(1, Math.round(height * scale));
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) throw new Error("The browser cannot capture images.");
    if (latest.current.preferences.facing === "front") {
      context.translate(canvas.width, 0);
      context.scale(-1, 1);
    }
    context.drawImage(
      element,
      (width - width / zoom) / 2,
      (height - height / zoom) / 2,
      width / zoom,
      height / zoom,
      0,
      0,
      canvas.width,
      canvas.height,
    );
    return { canvas, context };
  }
  useEffect(() => {
    if (!active || !generation) return;
    const interval = setInterval(() => {
      if (!latest.current.preferences.histogram) return;
      try {
        const { canvas, context } = captureCanvas(96);
        const data = context.getImageData(0, 0, canvas.width, canvas.height);
        const pref = latest.current.preferences;
        applyMatrix(data.data, lookMatrix(pref.look, pref.intensity));
        latest.current.onReading({ histogram: histogramFromPixels(data.data) });
      } catch {
        /* No frame while changing cameras. */
      }
    }, 500);
    return () => clearInterval(interval);
  }, [active, generation]);

  useImperativeHandle(forwardedRef, () => ({
    async capture() {
      await applying.current;
      if (!active) throw new Error("Resume the camera to take a photo.");
      const { canvas } = captureCanvas();
      const uri = canvas.toDataURL("image/jpeg", 0.98);
      return {
        uri,
        sourceUri: uri,
        thumbnailUri: uri,
        format: "jpeg",
        width: canvas.width,
        height: canvas.height,
        metadata: {
          camera: stream.current?.getVideoTracks()[0].label ?? "Browser camera",
          zoom: p.zoom,
        },
      };
    },
    async focus(x, y, lock) {
      const element = video.current;
      const track = stream.current?.getVideoTracks()[0];
      if (!element || !track || !caps.current.pointsOfInterest)
        throw new Error("This browser camera handles focus automatically.");
      await track.applyConstraints({
        advanced: [
          {
            pointsOfInterest: [
              { x: x / element.clientWidth, y: y / element.clientHeight },
            ],
            focusMode: lock ? "single-shot" : "continuous",
          } as MediaTrackConstraintSet,
        ],
      });
    },
    async reset() {
      const track = stream.current?.getVideoTracks()[0];
      if (track && caps.current.focusMode?.includes("continuous"))
        await track.applyConstraints({
          advanced: [{ focusMode: "continuous" } as MediaTrackConstraintSet],
        });
    },
  }));
  return (
    <>
      <svg aria-hidden width="0" height="0" style={{ position: "absolute" }}>
        <filter id={filterId} colorInterpolationFilters="sRGB">
          <feColorMatrix type="matrix" values={matrix.join(" ")} />
        </filter>
      </svg>
      <video
        ref={video}
        muted
        playsInline
        autoPlay
        aria-label="Live camera feed"
        style={{
          position: "absolute",
          width: "100%",
          height: "100%",
          objectFit: "cover",
          filter: `url(#${filterId})`,
          transform: `scale(${(hardwareZoom ? 1 : p.zoom) * (p.facing === "front" ? -1 : 1)}, ${hardwareZoom ? 1 : p.zoom})`,
        }}
      />
    </>
  );
}
