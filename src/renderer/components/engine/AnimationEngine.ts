import { EasingType, Keyframe, KeyframeProps, CGLayer } from '@shared/types';

export const EasingFunctions: Record<EasingType, (t: number) => number> = {
  linear: (t) => t,
  easeInQuad: (t) => t * t,
  easeOutQuad: (t) => t * (2 - t),
  easeInOutQuad: (t) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),
  easeInCubic: (t) => t * t * t,
  easeOutCubic: (t) => {
    const t1 = t - 1;
    return t1 * t1 * t1 + 1;
  },
  easeInOutCubic: (t) =>
    t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
  easeOutBack: (t) => {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  },
  easeOutElastic: (t) => {
    if (t === 0) return 0;
    if (t === 1) return 1;
    const c4 = (2 * Math.PI) / 3;
    return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
  },
  easeOutBounce: (t) => {
    const n1 = 7.5625;
    const d1 = 2.75;
    if (t < 1 / d1) {
      return n1 * t * t;
    } else if (t < 2 / d1) {
      const t1 = t - 1.5 / d1;
      return n1 * t1 * t1 + 0.75;
    } else if (t < 2.5 / d1) {
      const t1 = t - 2.25 / d1;
      return n1 * t1 * t1 + 0.9375;
    } else {
      const t1 = t - 2.625 / d1;
      return n1 * t1 * t1 + 0.984375;
    }
  },
};

export interface ComputedLayerTransform {
  x: number;
  y: number;
  scaleX: number;
  scaleY: number;
  opacity: number;
  rotation: number;
  blur: number;
  mask?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export function computeLayerAtTime(layer: CGLayer, time: number): ComputedLayerTransform {
  const base: ComputedLayerTransform = {
    x: layer.transform.x,
    y: layer.transform.y,
    scaleX: layer.transform.scaleX,
    scaleY: layer.transform.scaleY,
    opacity: layer.opacity,
    rotation: layer.transform.rotation,
    blur: 0,
    mask: layer.mask?.enabled
      ? {
          x: layer.mask.x,
          y: layer.mask.y,
          width: layer.mask.width,
          height: layer.mask.height,
        }
      : undefined,
  };

  const keyframes = layer.keyframes;
  if (!keyframes || keyframes.length === 0) {
    return base;
  }

  // Sort keyframes by time
  const sorted = [...keyframes].sort((a, b) => a.time - b.time);

  // If time is before or at first keyframe
  if (time <= sorted[0].time) {
    return applyProps(base, sorted[0].props);
  }

  // If time is after or at last keyframe
  if (time >= sorted[sorted.length - 1].time) {
    return applyProps(base, sorted[sorted.length - 1].props);
  }

  // Find two surrounding keyframes
  let prev = sorted[0];
  let next = sorted[1];
  for (let i = 0; i < sorted.length - 1; i++) {
    if (time >= sorted[i].time && time <= sorted[i + 1].time) {
      prev = sorted[i];
      next = sorted[i + 1];
      break;
    }
  }

  const duration = next.time - prev.time;
  const rawProgress = duration > 0 ? (time - prev.time) / duration : 1;
  const easingFn = EasingFunctions[next.easing] || EasingFunctions.linear;
  const eased = easingFn(Math.max(0, Math.min(1, rawProgress)));

  return interpolateProps(base, prev.props, next.props, eased);
}

function applyProps(base: ComputedLayerTransform, props: KeyframeProps): ComputedLayerTransform {
  return {
    x: props.x ?? base.x,
    y: props.y ?? base.y,
    scaleX: props.scaleX ?? base.scaleX,
    scaleY: props.scaleY ?? base.scaleY,
    opacity: props.opacity ?? base.opacity,
    rotation: props.rotation ?? base.rotation,
    blur: props.blur ?? base.blur,
    mask: base.mask
      ? {
          x: props.maskX ?? base.mask.x,
          y: props.maskY ?? base.mask.y,
          width: props.maskW ?? base.mask.width,
          height: props.maskH ?? base.mask.height,
        }
      : undefined,
  };
}

function interpolateProps(
  base: ComputedLayerTransform,
  p1: KeyframeProps,
  p2: KeyframeProps,
  t: number
): ComputedLayerTransform {
  const interp = (v1?: number, v2?: number, fallback: number = 0) => {
    const a = v1 ?? fallback;
    const b = v2 ?? fallback;
    return a + (b - a) * t;
  };

  const x = interp(p1.x, p2.x, base.x);
  const y = interp(p1.y, p2.y, base.y);
  const scaleX = interp(p1.scaleX, p2.scaleX, base.scaleX);
  const scaleY = interp(p1.scaleY, p2.scaleY, base.scaleY);
  const opacity = interp(p1.opacity, p2.opacity, base.opacity);
  const rotation = interp(p1.rotation, p2.rotation, base.rotation);
  const blur = interp(p1.blur, p2.blur, base.blur);

  let mask = base.mask;
  if (base.mask) {
    mask = {
      x: interp(p1.maskX, p2.maskX, base.mask.x),
      y: interp(p1.maskY, p2.maskY, base.mask.y),
      width: interp(p1.maskW, p2.maskW, base.mask.width),
      height: interp(p1.maskH, p2.maskH, base.mask.height),
    };
  }

  return { x, y, scaleX, scaleY, opacity, rotation, blur, mask };
}
