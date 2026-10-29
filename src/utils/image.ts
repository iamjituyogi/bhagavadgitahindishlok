import { Image, ImageSourcePropType } from 'react-native';

/** Portrait ratio used by most chapter artwork; the fallback when a size can't be read. */
export const DEFAULT_ART_RATIO = 9 / 16;

/** width / height of a bundled image, so it can be shown whole instead of cropped. */
export function imageRatio(source: ImageSourcePropType): number {
  const resolved = Image.resolveAssetSource(source);
  const w = resolved?.width ?? 0;
  const h = resolved?.height ?? 0;
  return w > 0 && h > 0 ? w / h : DEFAULT_ART_RATIO;
}
