import { forwardRef, useMemo, useRef, useEffect, useCallback, type RefObject, type CSSProperties } from 'react';
import { motion } from 'motion/react';

function useMousePositionRef(
  containerRef: RefObject<HTMLElement | null> | undefined,
  onMove?: () => void
) {
  const positionRef = useRef({ x: 0, y: 0 });
  const rectRef = useRef<DOMRect | null>(null);

  useEffect(() => {
    const container = containerRef?.current;
    const updateRect = () => {
      rectRef.current = container?.getBoundingClientRect() ?? null;
    };
    updateRect();

    const updatePosition = (x: number, y: number) => {
      const rect = rectRef.current;
      if (rect) {
        positionRef.current = { x: x - rect.left, y: y - rect.top };
      } else {
        positionRef.current = { x, y };
      }
      onMove?.();
    };

    const handleMouseMove = (ev: MouseEvent) => updatePosition(ev.clientX, ev.clientY);
    const handleTouchMove = (ev: TouchEvent) => {
      const touch = ev.touches[0];
      updatePosition(touch.clientX, touch.clientY);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    const resizeObserver = container ? new ResizeObserver(updateRect) : null;
    resizeObserver?.observe(container);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
      resizeObserver?.disconnect();
    };
  }, [containerRef, onMove]);

  return positionRef;
}

interface VariableProximityProps {
  label: string;
  fromFontVariationSettings: string;
  toFontVariationSettings: string;
  containerRef?: RefObject<HTMLElement | null>;
  radius?: number;
  falloff?: 'linear' | 'exponential' | 'gaussian';
  className?: string;
  onClick?: () => void;
  style?: CSSProperties;
}

const VariableProximity = forwardRef<HTMLSpanElement, VariableProximityProps>((props, ref) => {
  const {
    label,
    fromFontVariationSettings,
    toFontVariationSettings,
    containerRef,
    radius = 50,
    falloff = 'linear',
    className = '',
    onClick,
    style,
    ...restProps
  } = props;

  const letterRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const letterCentersRef = useRef<{ x: number; y: number }[]>([]);
  const geometryDirtyRef = useRef(true);
  const interpolatedSettingsRef = useRef<string[]>([]);
  const lastPositionRef = useRef<{ x: number | null; y: number | null }>({ x: null, y: null });
  const frameRef = useRef<number | null>(null);
  const updateLettersRef = useRef<() => void>(() => undefined);

  const scheduleFrame = useCallback(() => {
    if (frameRef.current !== null) return;
    frameRef.current = requestAnimationFrame(() => {
      frameRef.current = null;
      updateLettersRef.current();
    });
  }, []);

  const mousePositionRef = useMousePositionRef(containerRef, scheduleFrame);

  useEffect(() => {
    const container = containerRef?.current;
    if (!container) return;
    const observer = new ResizeObserver(() => {
      geometryDirtyRef.current = true;
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, [containerRef]);

  const parsedSettings = useMemo(() => {
    const parseSettings = (settingsStr: string) =>
      new Map(
        settingsStr
          .split(',')
          .map(s => s.trim())
          .map(s => {
            const [name, value] = s.split(' ');
            return [name.replace(/['"]/g, ''), parseFloat(value)];
          })
      );

    const fromSettings = parseSettings(fromFontVariationSettings);
    const toSettings = parseSettings(toFontVariationSettings);

    return Array.from(fromSettings.entries()).map(([axis, fromValue]) => ({
      axis,
      fromValue,
      toValue: toSettings.get(axis) ?? fromValue
    }));
  }, [fromFontVariationSettings, toFontVariationSettings]);

  const calculateDistance = (x1: number, y1: number, x2: number, y2: number) =>
    Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);

  const calculateFalloff = (distance: number) => {
    const norm = Math.min(Math.max(1 - distance / radius, 0), 1);
    switch (falloff) {
      case 'exponential':
        return norm ** 2;
      case 'gaussian':
        return Math.exp(-((distance / (radius / 2)) ** 2) / 2);
      case 'linear':
      default:
        return norm;
    }
  };

  updateLettersRef.current = () => {
    if (!containerRef?.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    const { x, y } = mousePositionRef.current;
    if (lastPositionRef.current.x === x && lastPositionRef.current.y === y) {
      return;
    }
    lastPositionRef.current = { x, y };

    if (geometryDirtyRef.current || letterCentersRef.current.length !== letterRefs.current.length) {
      letterCentersRef.current = letterRefs.current.map((letterRef) => {
        if (!letterRef) return { x: 0, y: 0 };
        const rect = letterRef.getBoundingClientRect();
        return {
          x: rect.left + rect.width / 2 - containerRect.left,
          y: rect.top + rect.height / 2 - containerRect.top,
        };
      });
      geometryDirtyRef.current = false;
    }

    letterRefs.current.forEach((letterRef, index) => {
      if (!letterRef) return;
      const center = letterCentersRef.current[index];
      if (!center) return;

      const distance = calculateDistance(
        mousePositionRef.current.x,
        mousePositionRef.current.y,
        center.x,
        center.y
      );

      if (distance >= radius) {
        if (letterRef.style.fontVariationSettings !== fromFontVariationSettings) {
          letterRef.style.fontVariationSettings = fromFontVariationSettings;
        }
        return;
      }

      const falloffValue = calculateFalloff(distance);
      const newSettings = parsedSettings
        .map(({ axis, fromValue, toValue }) => {
          const interpolatedValue = fromValue + (toValue - fromValue) * falloffValue;
          return `'${axis}' ${interpolatedValue}`;
        })
        .join(', ');

      interpolatedSettingsRef.current[index] = newSettings;
      if (letterRef.style.fontVariationSettings !== newSettings) {
        letterRef.style.fontVariationSettings = newSettings;
      }
    });
  };

  useEffect(() => () => {
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
  }, []);

  const words = label.split(' ');
  let letterIndex = 0;

  return (
    <span
      ref={ref}
      className={`${className} variable-proximity`}
      onClick={onClick}
      style={{ display: 'inline', ...style }}
      {...restProps}
    >
      {words.map((word, wordIndex) => (
        <span key={wordIndex} style={{ display: 'inline-block', whiteSpace: 'nowrap' }}>
          {word.split('').map(letter => {
            const currentLetterIndex = letterIndex++;
            return (
              <motion.span
                key={currentLetterIndex}
                ref={(el: HTMLSpanElement | null) => {
                  letterRefs.current[currentLetterIndex] = el;
                }}
                style={{
                  display: 'inline-block',
                  fontVariationSettings: interpolatedSettingsRef.current[currentLetterIndex]
                }}
                aria-hidden="true"
              >
                {letter}
              </motion.span>
            );
          })}
          {wordIndex < words.length - 1 && <span style={{ display: 'inline-block' }}>&nbsp;</span>}
        </span>
      ))}
      <span className="sr-only">{label}</span>
    </span>
  );
});

VariableProximity.displayName = 'VariableProximity';
export default VariableProximity;
