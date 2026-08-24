import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

function run(task: () => Promise<void>): void {
  if (Platform.OS === 'web') return;
  void task().catch(() => undefined);
}

export function hapticSelect(): void {
  run(() => Haptics.selectionAsync());
}

export function hapticLight(): void {
  run(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));
}

export function hapticMedium(): void {
  run(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium));
}

export function hapticTick(): void {
  run(async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
    } catch {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  });
}

export function hapticSuccess(): void {
  run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));
}
