"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";

import InteractiveMap from "./InteractiveMap";

const RADIUS = 1;

export function InteractiveMapModalButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [fitToken, setFitToken] = useState(0);

  const goAnalytics = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setOpen(false);
    router.push("/flight-tracker");
  };

  return (
    <>
      <Box sx={{ display: "flex", gap: 1 }}>
        <Button
          variant="outlined"
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            setOpen(true);
          }}
          sx={{
            borderRadius: RADIUS,
            textTransform: "none",
            fontWeight: 600,
            color: "text.primary",
            borderColor: "divider",
          }}
        >
          Explore live map
        </Button>

        <Button
          variant="outlined"
          size="small"
          onClick={goAnalytics}
          sx={{
            borderRadius: RADIUS,
            textTransform: "none",
            fontWeight: 700,
            color: "text.primary",
            borderColor: "divider",
          }}
        >
          Full analytics
        </Button>
      </Box>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        fullWidth
        maxWidth="lg"
        PaperProps={{ sx: { borderRadius: RADIUS } }}
        TransitionProps={{
          onEntered: () => setFitToken((t) => t + 1),
        }}
      >
        <DialogTitle
          sx={(t) => ({
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            pr: 1,
            gap: 2,
            borderBottom: "1px solid",
            borderColor: t.palette.divider,
          })}
        >
          <Typography variant="body2" sx={{ fontWeight: 700 }}>
            Flight map
          </Typography>

          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<OpenInNewIcon fontSize="small" />}
              onClick={goAnalytics}
              sx={{
                borderRadius: RADIUS,
                textTransform: "none",
                fontWeight: 700,
                color: "text.primary",
                borderColor: "divider",
              }}
            >
              Go fullscreen
            </Button>

            <IconButton
              onClick={(e) => {
                e.stopPropagation();
                setOpen(false);
              }}
              size="small"
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent
          sx={{
            p: 0,
            height: "85vh",
            display: "flex",
            flexDirection: "column",
            minHeight: 0,
          }}
        >
          <Box sx={{ flex: 1, minHeight: 0 }}>
            <InteractiveMap
              height="100%"
              showHeader={false}
              fitToken={fitToken}
              constraintsMode="modal"
            />
          </Box>
        </DialogContent>
      </Dialog>
    </>
  );
}
