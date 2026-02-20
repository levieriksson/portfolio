"use client";

import React, { useMemo } from "react";
import { Box, keyframes, useMediaQuery } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { usePathname } from "next/navigation";

function hashStringToSeed(str: string) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function rand(rng: () => number, min: number, max: number) {
  return rng() * (max - min) + min;
}

const createBlobAnimation = (
  dx: number,
  dy: number,
  scaleMin: number,
  scaleMax: number,
  opacityMin: number,
  opacityMax: number,
  rotateDeg: number,
) => keyframes`
  0%   { transform: translate(0, 0) scale(${scaleMin}) rotate(0deg); opacity: ${opacityMin}; }
  25%  { transform: translate(${dx * 0.5}px, ${dy * 0.5}px) scale(${scaleMax}) rotate(${rotateDeg * 0.25}deg); opacity: ${opacityMax}; }
  50%  { transform: translate(${dx}px, ${dy}px) scale(${scaleMin}) rotate(${rotateDeg * 0.5}deg); opacity: ${opacityMin}; }
  75%  { transform: translate(${dx * 0.5}px, ${dy * 0.5}px) scale(${scaleMax}) rotate(${rotateDeg * 0.75}deg); opacity: ${opacityMax}; }
  100% { transform: translate(0, 0) scale(${scaleMin}) rotate(${rotateDeg}deg); opacity: ${opacityMin}; }
`;

type BlobSpec = {
  size: number;
  color: string;
  top?: string;
  left?: string;
  right?: string;
};

export function AnimatedBlobs() {
  const theme = useTheme();
  const prefersReducedMotion = useMediaQuery(
    "(prefers-reduced-motion: reduce)",
  );

  // Optional: vary per route, but deterministically

  const seed = 123456; // constant
  const rng = useMemo(() => mulberry32(seed), []);

  const blobs: BlobSpec[] = [
    { size: 400, color: "rgba(255,0,0,0.35)", top: "10%", left: "5%" },
    { size: 500, color: "rgba(128,0,128,0.30)", top: "50%", right: "10%" },
    { size: 450, color: "rgba(0,0,255,0.32)", top: "30%", left: "60%" },
  ];

  const runtime = useMemo(() => {
    return blobs.map((b, i) => {
      const dx = rand(rng, -150, 150);
      const dy = rand(rng, -150, 150);
      const scaleMin = rand(rng, 0.96, 0.99);
      const scaleMax = rand(rng, 1.02, 1.06);
      const opacityMin = rand(rng, 0.28, 0.4);
      const opacityMax = rand(rng, 0.34, 0.46);
      const rotateDeg = rand(rng, -25, 25);
      const duration = rand(rng, 48, 72);

      // different phase per blob to avoid synchronized motion
      const delay = -rand(rng, 0, duration);

      return {
        ...b,
        animation: createBlobAnimation(
          dx,
          dy,
          scaleMin,
          scaleMax,
          opacityMin,
          opacityMax,
          rotateDeg,
        ),
        duration,
        delay,
      };
    });
  }, [rng]);

  return (
    <Box
      sx={{
        position: "absolute",
        inset: 0,
        zIndex: 0,
        pointerEvents: "none",
        "& > .blob": {
          position: "absolute",
          borderRadius: "50%",
          filter: "none",
          willChange: "transform, opacity",
        },
      }}
    >
      {runtime.map((blob, i) => (
        <Box
          key={i}
          className="blob"
          sx={{
            width: blob.size,
            height: blob.size,
            background: blob.color,
            top: blob.top,
            left: blob.left,
            right: blob.right,
            animation: prefersReducedMotion
              ? "none"
              : `${blob.animation} ${blob.duration}s ease-in-out infinite`,
            animationDelay: prefersReducedMotion ? undefined : `${blob.delay}s`,
          }}
        />
      ))}
    </Box>
  );
}
