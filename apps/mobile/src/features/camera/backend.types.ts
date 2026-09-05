import type { Ref } from "react";
import type {
  CameraReading,
  Capabilities,
  CaptureResult,
  Preferences,
} from "./model";
export type CameraHandle = {
  capture: () => Promise<CaptureResult>;
  focus: (x: number, y: number, lock: boolean) => Promise<void>;
  reset: () => Promise<void>;
};
export type CameraBackendProps = {
  ref?: Ref<CameraHandle>;
  preferences: Preferences;
  active: boolean;
  onReady: (ready: boolean) => void;
  onCapabilities: (c: Capabilities) => void;
  onReading: (r: CameraReading) => void;
  onError: (message: string) => void;
};
