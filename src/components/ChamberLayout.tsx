import React, { useMemo, useState } from "react";
import { useMotionValueEvent, type MotionValue } from "motion/react";
import { DIAL_CENTER_X, DIAL_SCENE_CLEARANCE_PX } from "./JogDial";
import { CHAMBERS } from "../types";
import { chamberPositionFromRotation, sceneSlotMeta } from "../sceneOrbit";

export type ChamberRenderMeta = {
  isVisible: boolean;
  isFocused: boolean;
  isActive: boolean;
};

interface ChamberLayoutProps {
  currentChamber: number;
  dialRotationMV: MotionValue<number>;
  children: (chamberIndex: number, meta: ChamberRenderMeta) => React.ReactNode;
  navigation?: React.ReactNode;
}

const pivotOrigin = `${DIAL_CENTER_X}px 50%`;
/** Full-circle orbit around jog hub; semicircle dial is a viewport onto this ring */
const sceneShell = "absolute inset-0 w-full h-full select-none";

export default function ChamberLayout({
  currentChamber,
  dialRotationMV,
  children,
  navigation,
}: ChamberLayoutProps) {
  const [position, setPosition] = useState(() =>
    chamberPositionFromRotation(dialRotationMV.get())
  );

  useMotionValueEvent(dialRotationMV, "change", (r) => {
    setPosition(chamberPositionFromRotation(r));
  });

  const scenes = useMemo(
    () =>
      CHAMBERS.map((chamber) => ({
        chamber,
        meta: sceneSlotMeta(chamber.index, position),
      }))
        .filter(({ meta }) => meta.isVisible)
        .sort((a, b) => a.meta.zIndex - b.meta.zIndex),
    [position]
  );

  return (
    <div className="relative w-full h-full ghub-ambient overflow-hidden">
      <div className="absolute inset-0 z-10 overflow-hidden">
        {scenes.map(({ chamber, meta }) => {
          const index = chamber.index;
          const {
            angleFromSlot,
            opacity,
            zIndex,
            isMain,
            isFocused,
            isActive,
            isVisible,
          } = meta;

          return (
            <div
              key={chamber.id}
              className="absolute inset-0"
              style={{
                zIndex,
                pointerEvents: "none",
              }}
            >
              <div
                className={sceneShell}
                style={{
                  transformOrigin: pivotOrigin,
                  transform: `rotate(${angleFromSlot}deg)`,
                  opacity,
                  pointerEvents: "none",
                  backfaceVisibility: "hidden",
                  WebkitBackfaceVisibility: "hidden",
                }}
              >
                <div
                  className={
                    isMain
                      ? "scene-panel-frame absolute top-3 bottom-3 right-2 md:top-4 md:bottom-4 md:right-3"
                      : "scene-panel-frame scene-panel-frame--adjacent absolute"
                  }
                  style={{
                    left: DIAL_SCENE_CLEARANCE_PX,
                    ...(isMain ? {} : { right: 0, top: 0, bottom: 0 }),
                    pointerEvents:
                      isFocused && index === currentChamber ? "auto" : "none",
                  }}
                >
                  {children(index, { isVisible, isFocused, isActive })}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {navigation}
    </div>
  );
}
