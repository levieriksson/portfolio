"use client";

import { useState } from "react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

import InteractiveMap from "./InteractiveMap";

const RADIUS = 0;

export function InteractiveMapModalButton() {
  const [open, setOpen] = useState(false);
  const [fitToken, setFitToken] = useState(0);

  return (
    <>
      <Button
        variant="outlined"
        size="small"
        onClick={() => setOpen(true)}
        sx={{ borderRadius: RADIUS }}
      >
        Open map
      </Button>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        fullWidth
        maxWidth="lg"
        PaperProps={{ sx: { borderRadius: 1 } }}
        TransitionProps={{
          onEntered: () => setFitToken((t) => t + 1),
        }}
      >
        <DialogTitle
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            pr: 1,
            gap: 2,
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            Flight map
          </Typography>

          <IconButton onClick={() => setOpen(false)} size="small">
            <CloseIcon fontSize="small" />
          </IconButton>
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
          <InteractiveMap
            height="100%"
            showHeader={false}
            fitToken={fitToken}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
