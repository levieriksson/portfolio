"use client";

import { Dialog, Box, IconButton } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import Grow from "@mui/material/Grow";

type BaseModalProps = {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
};

export function BaseModal({ open, onClose, children }: BaseModalProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      TransitionComponent={Grow}
      transitionDuration={300}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 4,
          bgcolor: "rgba(15,15,25,0.9)",
          backdropFilter: "blur(24px)",
          color: "white",
          p: 3,
        },
      }}
    >
      <Box sx={{ position: "relative" }}>
        <IconButton
          onClick={onClose}
          sx={{ position: "absolute", top: 8, right: 8, color: "white" }}
        >
          <CloseIcon />
        </IconButton>
        {children}
      </Box>
    </Dialog>
  );
}
