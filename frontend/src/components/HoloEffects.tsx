
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent,
  type ReactNode,
} from "react";

import "../styles/holo-theme.css";

export type MotionLevel = "minimal" | "balanced" | "immersive";

export type HoloSettings = {
  glow: number;
  motion: MotionLevel;
  particles: boolean;
  tilt: boolean;
};

type HoloContextValue = {
  settings: HoloSettings;
  updateSettings: (updates: Partial<HoloSettings>) => void;
  resetSettings: () => void;
  reducedMotion: boolean;
};

const STORAGE_KEY = "budgetbuddy-holo-settings";

const DEFAULT_SETTINGS: HoloSettings = {
  glow: 65,
  motion: "immersive",
  particles: true,
  tilt: true,
};

const HoloContext = createContext<HoloContextValue | null>(
  null,
);

function readSettings(): HoloSettings {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return DEFAULT_SETTINGS;

    const value: unknown = JSON.parse(saved);

    if (!value || typeof value !== "object") {
      return DEFAULT_SETTINGS;
    }

    const item = value as Partial<HoloSettings>;

    return {
      glow:
        typeof item.glow === "number" &&
        Number.isFinite(item.glow)
          ? Math.max(0, Math.min(100, item.glow))
          : 65,
      motion:
        item.motion === "minimal" ||
        item.motion === "balanced" ||
        item.motion === "immersive"
          ? item.motion
          : "immersive",
      particles:
        typeof item.particles === "boolean"
          ? item.particles
          : true,
      tilt:
        typeof item.tilt === "boolean"
          ? item.tilt
          : true,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function useHolo() {
  const context = useContext(HoloContext);

  if (!context) {
    throw new Error("useHolo must be used inside HoloEffects");
  }

  return context;
}

type EffectsProps = {
  children: ReactNode;
};

export default function HoloEffects({
  children,
}: EffectsProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<number | null>(null);

  const [settings, setSettings] =
    useState<HoloSettings>(readSettings);

  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    );

    const update = () => setReducedMotion(media.matches);
    update();

    media.addEventListener("change", update);

    return () => {
      media.removeEventListener("change", update);
    };
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(settings),
      );
    } catch {
      // The theme still works when storage is unavailable.
    }
  }, [settings]);

  useEffect(() => {
    return () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, []);

  const updateSettings = useCallback(
    (updates: Partial<HoloSettings>) => {
      setSettings((current) => ({
        ...current,
        ...updates,
      }));
    },
    [],
  );

  const resetSettings = useCallback(() => {
    setSettings({ ...DEFAULT_SETTINGS });
  }, []);

  function handlePointerMove(
    event: PointerEvent<HTMLDivElement>,
  ) {
    if (
      reducedMotion ||
      settings.motion === "minimal" ||
      event.pointerType === "touch"
    ) {
      return;
    }

    const root = rootRef.current;
    if (!root) return;

    const rect = root.getBoundingClientRect();

    const x =
      ((event.clientX - rect.left) / rect.width) * 100;
    const y =
      ((event.clientY - rect.top) / rect.height) * 100;

    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
    }

    frameRef.current = requestAnimationFrame(() => {
      root.style.setProperty("--holo-x", `${x}%`);
      root.style.setProperty("--holo-y", `${y}%`);
      frameRef.current = null;
    });
  }

  function handlePointerLeave() {
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }

    rootRef.current?.style.setProperty("--holo-x", "50%");
    rootRef.current?.style.setProperty("--holo-y", "40%");
  }

  const style = {
    "--holo-glow": settings.glow / 100,
    "--holo-x": "50%",
    "--holo-y": "40%",
  } as CSSProperties;

  return (
    <HoloContext.Provider
      value={{
        settings,
        updateSettings,
        resetSettings,
        reducedMotion,
      }}
    >
      <div
        ref={rootRef}
        className={[
          "holo-app",
          `holo-${settings.motion}`,
          reducedMotion ? "holo-reduced" : "",
          settings.particles ? "" : "holo-no-particles",
        ].join(" ")}
        style={style}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
      >
        <div
          className="holo-atmosphere"
          aria-hidden="true"
        >
          <div className="holo-grid" />
          <div className="holo-aurora holo-aurora-one" />
          <div className="holo-aurora holo-aurora-two" />
          <div className="holo-aurora holo-aurora-three" />
          <div className="holo-light-beam" />
          <div className="holo-particles" />
        </div>

        <div className="holo-app-content">
          {children}
        </div>
      </div>
    </HoloContext.Provider>
  );
}

type TiltCardProps = {
  children: ReactNode;
  className?: string;
  id?: string;
  style?: CSSProperties;
};

export function TiltCard({
  children,
  className = "",
  id,
  style,
}: TiltCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { settings, reducedMotion } = useHolo();

  function handleMove(event: PointerEvent<HTMLDivElement>) {
    if (
      !settings.tilt ||
      reducedMotion ||
      settings.motion === "minimal" ||
      event.pointerType === "touch"
    ) {
      return;
    }

    const element = ref.current;
    if (!element) return;

    const rect = element.getBoundingClientRect();

    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;

    const strength =
      settings.motion === "immersive" ? 7 : 3;

    element.style.setProperty(
      "--tilt-x",
      `${(0.5 - y) * strength}deg`,
    );

    element.style.setProperty(
      "--tilt-y",
      `${(x - 0.5) * strength}deg`,
    );

    element.style.setProperty(
      "--shine-x",
      `${x * 100}%`,
    );

    element.style.setProperty(
      "--shine-y",
      `${y * 100}%`,
    );
  }

  function resetTilt() {
    const element = ref.current;
    if (!element) return;

    element.style.setProperty("--tilt-x", "0deg");
    element.style.setProperty("--tilt-y", "0deg");
    element.style.setProperty("--shine-x", "50%");
    element.style.setProperty("--shine-y", "50%");
  }

  return (
    <div
      ref={ref}
      id={id}
      className={`holo-tilt ${className}`}
      style={style}
      onPointerMove={handleMove}
      onPointerLeave={resetTilt}
    >
      {children}
    </div>
  );
}
