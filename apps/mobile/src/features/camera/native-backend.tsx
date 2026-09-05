import {
  AlphaType,
  ColorType,
  ImageFormat,
  Skia,
} from "@shopify/react-native-skia";
import { File, Paths } from "expo-file-system";
import {
  useEffect,
  useLayoutEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { StyleSheet, Text, View } from "react-native";
import {
  useCameraDevices,
  usePhotoOutput,
  type CameraController,
  type MeteringMode,
} from "react-native-vision-camera";
import {
  SkiaCamera,
  type SkiaCameraRef,
} from "react-native-vision-camera-skia";
import { lookMatrix } from "../looks/recipes";
import { cameraFormats } from "../looks/render";
import {
  clamp,
  EMPTY_CAPABILITIES,
  histogramFromPixels,
  type PhotoFormat,
} from "./model";
import type { CameraBackendProps } from "./backend.types";

export function CameraBackend({
  ref: forwardedRef,
  ...props
}: CameraBackendProps) {
  const latest = useRef(props);
  useLayoutEffect(() => {
    latest.current = props;
  }, [props]);
  const { preferences: p, active } = props;
  const devices = useCameraDevices();
  const matching = devices.filter(
    (d) =>
      d.position === p.facing && d.getSupportedResolutions("photo").length > 0,
  );
  const device =
    matching.find((d) => d.id === p.deviceId) ??
    matching.find((d) => d.type === "wide-angle") ??
    matching[0];
  const ref = useRef<SkiaCameraRef>(null);
  const [formatReport, setFormatReport] = useState<{
    id: string;
    formats: PhotoFormat[];
  } | null>(null);
  const formats =
    formatReport?.id === device?.id ? formatReport?.formats : null;
  const [started, setStarted] = useState(0);
  const configuration = useRef(Promise.resolve());
  const configurationValid = useRef(false);
  const busy = useRef(false);
  const matrix = useMemo(
    () => lookMatrix(p.look, p.intensity),
    [p.look, p.intensity],
  );
  const paint = useMemo(() => {
    const value = Skia.Paint();
    value.setColorFilter(Skia.ColorFilter.MakeMatrix(matrix));
    return value;
  }, [matrix]);

  useEffect(() => {
    let cancelled = false;
    latest.current.onReady(false);
    if (device) {
      cameraFormats(device.id)
        .then((result) => {
          if (!cancelled) setFormatReport({ id: device.id, formats: result });
        })
        .catch(() => {
          if (!cancelled) setFormatReport({ id: device.id, formats: ["jpeg"] });
        });
    }
    return () => {
      cancelled = true;
    };
  }, [device]);

  const format = formats?.includes(p.format)
    ? p.format
    : (formats?.[0] ?? "jpeg");
  const output = usePhotoOutput({
    containerFormat: format,
    quality: 0.95,
    qualityPrioritization: "quality",
  });
  const outputs = useMemo(() => [output], [output]);

  function controller(): CameraController {
    const current = ref.current?.controller;
    if (!current) throw new Error("The camera is still starting.");
    return current;
  }

  useEffect(() => {
    if (!started || !active || !device || !formats) return;
    let cancelled = false;
    latest.current.onReady(false);
    const apply = async () => {
      if (cancelled) return;
      configurationValid.current = false;
      const c = controller();
      const m = p.manual;
      await c.resetFocus();
      if (p.mode === "MANUAL") {
        if (
          device.supportsExposureLocking &&
          (m.iso !== null || m.shutter !== null)
        ) {
          await c.setExposureLocked(
            clamp(
              m.shutter ?? c.exposureDuration,
              c.minExposureDuration,
              c.maxExposureDuration,
            ),
            clamp(m.iso ?? c.iso, c.minISO, c.maxISO),
          );
        }
        if (device.supportsFocusLocking && m.focus !== null)
          await c.setFocusLocked(clamp(m.focus, 0, 1));
        if (device.supportsWhiteBalanceLocking && m.temperature !== null) {
          const gains = c.convertWhiteBalanceTemperatureAndTintValues({
            temperature: m.temperature,
            tint: m.tint,
          });
          await c.setWhiteBalanceLocked({
            redGain: clamp(gains.redGain, 1, device.maxWhiteBalanceGain),
            greenGain: clamp(gains.greenGain, 1, device.maxWhiteBalanceGain),
            blueGain: clamp(gains.blueGain, 1, device.maxWhiteBalanceGain),
          });
        }
      }
      if (
        device.supportsExposureBias &&
        (p.mode === "PHOTO" || (m.iso === null && m.shutter === null))
      )
        await c.setExposureBias(
          clamp(m.ev, device.minExposureBias, device.maxExposureBias),
        );
      if (!cancelled) {
        configurationValid.current = true;
        latest.current.onReady(true);
      }
    };
    configuration.current = configuration.current
      .catch(() => undefined)
      .then(apply);
    void configuration.current.catch((error) => {
      if (!cancelled)
        latest.current.onError(
          `The setting could not be applied. ${error instanceof Error ? error.message : "Return to Photo mode and retry."}`,
        );
    });
    return () => {
      cancelled = true;
    };
  }, [started, active, device, formats, p.manual, p.mode, output]);

  useEffect(() => {
    if (!started || !active || !device) return;
    let cancelled = false;
    latest.current.onReady(false);
    configuration.current = configuration.current
      .catch(() => undefined)
      .then(async () => {
        if (cancelled) return;
        const c = controller();
        await c.setZoom(clamp(p.zoom, c.minZoom, c.maxZoom));
        if (!cancelled && configurationValid.current)
          latest.current.onReady(true);
      });
    void configuration.current.catch((error) => {
      if (!cancelled)
        latest.current.onError(
          error instanceof Error
            ? error.message
            : "Zoom could not be adjusted.",
        );
    });
    return () => {
      cancelled = true;
    };
  }, [started, active, device, p.zoom]);

  useEffect(() => {
    if (!started || !active || !device || !formats) return;
    const c = ref.current?.controller;
    if (!c) return;
    latest.current.onCapabilities({
      ...EMPTY_CAPABILITIES,
      id: device.id,
      name: device.localizedName,
      formats,
      devices: devices
        .filter(
          (d) =>
            (d.position === "back" || d.position === "front") &&
            d.getSupportedResolutions("photo").length > 0,
        )
        .map((d) => ({
          id: d.id,
          name: d.localizedName,
          facing: d.position as "front" | "back",
        })),
      zoom: { min: c.minZoom, max: c.maxZoom },
      zoomStops: [
        ...new Set([c.minZoom, 1, 1.5, 2, 3, ...device.zoomLensSwitchFactors]),
      ]
        .filter((v) => v >= c.minZoom && v <= c.maxZoom)
        .sort((a, b) => a - b)
        .slice(0, 6),
      iso: device.supportsExposureLocking
        ? { min: c.minISO, max: c.maxISO }
        : undefined,
      shutter: device.supportsExposureLocking
        ? { min: c.minExposureDuration, max: c.maxExposureDuration }
        : undefined,
      focus: device.supportsFocusLocking
        ? { min: 0, max: 1, step: 0.01 }
        : undefined,
      temperature: device.supportsWhiteBalanceLocking
        ? { min: 2500, max: 8000, step: 100 }
        : undefined,
      ev: device.supportsExposureBias
        ? {
            min: device.minExposureBias,
            max: device.maxExposureBias,
            step: 0.1,
          }
        : undefined,
      flash: device.hasFlash,
      metering: device.supportsFocusMetering || device.supportsExposureMetering,
      histogram: true,
      resolutions: device.getSupportedResolutions("photo"),
    });
    const interval = setInterval(() => {
      try {
        let histogram: number[] | undefined;
        if (latest.current.preferences.histogram) {
          const image = ref.current?.takeSnapshot();
          if (image) {
            const surface = Skia.Surface.MakeOffscreen(64, 64);
            if (surface) {
              surface
                .getCanvas()
                .drawImageRect(
                  image,
                  Skia.XYWHRect(0, 0, image.width(), image.height()),
                  Skia.XYWHRect(0, 0, 64, 64),
                  Skia.Paint(),
                );
              surface.flush();
              const small = surface.makeImageSnapshot();
              const pixels = small.readPixels(0, 0, {
                width: 64,
                height: 64,
                colorType: ColorType.RGBA_8888,
                alphaType: AlphaType.Unpremul,
              });
              if (pixels) histogram = histogramFromPixels(pixels);
              small.dispose();
              surface.dispose();
            }
            image.dispose();
          }
        }
        latest.current.onReading({
          iso: c.iso || undefined,
          shutter: c.exposureDuration || undefined,
          focus: c.lensPosition,
          histogram,
        });
      } catch {
        /* A paused or interrupted session has no current frame. */
      }
    }, 500);
    return () => clearInterval(interval);
  }, [started, active, device, devices, formats]);

  useImperativeHandle(forwardedRef, () => ({
    async capture() {
      if (busy.current || !active) throw new Error("The camera is busy.");
      busy.current = true;
      try {
        await configuration.current;
        if (!configurationValid.current)
          throw new Error(
            "The manual settings could not be applied. Return to Photo mode or retry the camera.",
          );
        const c = controller();
        const photo = await output.capturePhoto(
          {
            flashMode: device?.hasFlash ? p.flash : "off",
            enableShutterSound: p.sound,
          },
          {},
        );
        try {
          const uri = `file://${await photo.saveToTemporaryFileAsync()}`;
          let thumbnailUri = uri;
          if (photo.isRawPhoto) {
            const snapshot = ref.current?.takeSnapshot();
            if (snapshot) {
              try {
                const file = new File(
                  Paths.cache,
                  `iris-preview-${Date.now()}.jpg`,
                );
                file.write(snapshot.encodeToBytes(ImageFormat.JPEG, 85));
                thumbnailUri = file.uri;
              } finally {
                snapshot.dispose();
              }
            }
          }
          return {
            uri,
            sourceUri: uri,
            thumbnailUri,
            format: photo.containerFormat as PhotoFormat,
            width: photo.width,
            height: photo.height,
            metadata: {
              camera: device?.localizedName ?? "Camera",
              iso: c.iso,
              shutter: c.exposureDuration,
              zoom: c.zoom,
              aperture: device?.lensAperture ?? 0,
            },
          };
        } finally {
          photo.dispose();
        }
      } finally {
        busy.current = false;
      }
    },
    async focus(x, y, lock) {
      await configuration.current;
      const c = controller();
      const modes: MeteringMode[] = [];
      const m = p.manual;
      if (
        c.device.supportsFocusMetering &&
        (p.mode === "PHOTO" || m.focus === null)
      )
        modes.push("AF");
      if (
        c.device.supportsExposureMetering &&
        (p.mode === "PHOTO" || (m.iso === null && m.shutter === null))
      )
        modes.push("AE");
      if (!modes.length)
        throw new Error(
          "Focus and exposure are locked. Set them to Auto to meter the frame.",
        );
      await ref.current!.focusTo(
        { x, y },
        {
          modes,
          adaptiveness: lock ? "locked" : "continuous",
          autoResetAfter: null,
        },
      );
    },
    async reset() {
      await controller().resetFocus();
    },
  }));

  if (!device)
    return (
      <View style={StyleSheet.absoluteFill}>
        <Text style={{ color: "#F4F2ED", padding: 28 }}>
          No camera is available. Connect a camera or reopen Iris on your
          iPhone.
        </Text>
      </View>
    );
  if (!formats) return null;
  return (
    <SkiaCamera
      ref={ref}
      device={device}
      outputs={outputs}
      isActive={active}
      orientationSource="device"
      zoom={device.minZoom}
      style={StyleSheet.absoluteFill}
      targetResolution={{ width: 1280, height: 720 }}
      enablePreviewSizedOutputBuffers
      onStarted={() => setStarted((v) => v + 1)}
      onStopped={() => latest.current.onReady(false)}
      onConfigured={() => {
        latest.current.onReady(false);
        requestAnimationFrame(() => setStarted((v) => v + 1));
      }}
      onError={(e) => {
        latest.current.onReady(false);
        latest.current.onError(e.message);
      }}
      onInterruptionStarted={() => {
        latest.current.onReady(false);
        latest.current.onError("Camera interrupted. Return to Iris to resume.");
      }}
      onInterruptionEnded={() => setStarted((v) => v + 1)}
      onFrame={(frame, render) => {
        "worklet";
        try {
          render(({ canvas, frameTexture }) => {
            canvas.drawImage(frameTexture, 0, 0, paint);
          });
        } finally {
          frame.dispose();
        }
      }}
    />
  );
}
