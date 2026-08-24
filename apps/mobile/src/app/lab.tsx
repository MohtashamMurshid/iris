import { useLocalSearchParams } from 'expo-router';

import { LOOKS, type LookId } from '@/features/camera/chrome';
import { PhotoLab } from '@/features/lab/photo-lab';

function isLookId(value: string | undefined): value is LookId {
  return LOOKS.some((look) => look.id === value);
}

export default function PhotoLabScreen() {
  const params = useLocalSearchParams<{ look?: string | string[] }>();
  const raw = Array.isArray(params.look) ? params.look[0] : params.look;
  const initialLook = isLookId(raw) ? raw : 'natural';

  return <PhotoLab initialLook={initialLook} />;
}
