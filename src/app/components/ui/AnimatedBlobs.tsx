"use client";

import { Box, keyframes } from "@mui/material";

function random(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

// Movement + scale + opacity + rotation animation
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

export function AnimatedBlobs() {
  const blobs = [
    { size: 400, color: "rgba(255,0,0,0.4)", top: "10%", left: "5%" },
    { size: 500, color: "rgba(128,0,128,0.35)", top: "50%", right: "10%" },
    { size: 450, color: "rgba(0,0,255,0.4)", top: "30%", left: "60%" },
  ];

  return (
    <Box
      sx={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        zIndex: 0,
        pointerEvents: "none",
        "& > .blob": {
          position: "absolute",
          borderRadius: "50%",
          filter: "none",
        },
      }}
    >
      {blobs.map((blob, i) => {
        const dx = random(-150, 150);
        const dy = random(-150, 150);
        const scaleMin = random(0.95, 0.98);
        const scaleMax = random(1.02, 1.06);
        const opacityMin = random(0.35, 0.45);
        const opacityMax = random(0.4, 0.5);
        const rotateDeg = random(-30, 30);
        const duration = random(40, 70);

        const movementAnim = createBlobAnimation(
          dx,
          dy,
          scaleMin,
          scaleMax,
          opacityMin,
          opacityMax,
          rotateDeg,
        );

        return (
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
              animation: `${movementAnim} ${duration}s ease-in-out infinite`,
            }}
          />
        );
      })}
    </Box>
  );
}
