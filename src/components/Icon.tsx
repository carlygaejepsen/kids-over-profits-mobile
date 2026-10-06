import type { ColorValue } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

export type IconName = 'search' | 'news' | 'map' | 'building' | 'info' | 'external' | 'chevron' | 'close' | 'alert';

/** Line icons drawn in currentColor-style stroke, so the colour comes from the caller. Decorative: hidden from screen readers. */
export function Icon({ name, size = 24, color }: { name: IconName; size?: number; color: ColorValue }) {
  const common = { stroke: color as string, strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, fill: 'none' };
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {name === 'search' && (
        <>
          <Circle cx={11} cy={11} r={7} {...common} />
          <Path d="M21 21l-4.3-4.3" {...common} />
        </>
      )}
      {name === 'news' && (
        <>
          <Rect x={3} y={4} width={18} height={16} rx={2} {...common} />
          <Path d="M7 9h10M7 13h10M7 17h6" {...common} />
        </>
      )}
      {name === 'map' && (
        <>
          <Path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21z" {...common} />
          <Circle cx={12} cy={9.5} r={2.5} {...common} />
        </>
      )}
      {name === 'building' && (
        <>
          <Rect x={4} y={3} width={16} height={18} rx={1} {...common} />
          <Path d="M9 21v-4h6v4M8 7h2M14 7h2M8 11h2M14 11h2" {...common} />
        </>
      )}
      {name === 'info' && (
        <>
          <Circle cx={12} cy={12} r={9} {...common} />
          <Path d="M12 11v5M12 8h.01" {...common} />
        </>
      )}
      {name === 'external' && <Path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" {...common} />}
      {name === 'chevron' && <Path d="M9 6l6 6-6 6" {...common} />}
      {name === 'close' && <Path d="M6 6l12 12M18 6L6 18" {...common} />}
      {name === 'alert' && (
        <>
          <Path d="M12 3l10 18H2L12 3z" {...common} />
          <Path d="M12 10v5M12 18h.01" {...common} />
        </>
      )}
    </Svg>
  );
}
