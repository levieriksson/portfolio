"use client";

import { Dialog, Box, IconButton, useTheme } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import Grow from "@mui/material/Grow";

type BaseModalProps = {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
};

export function BaseModal({ open, onClose, children }: BaseModalProps) {
  const theme = useTheme();

  return (
    <Dialog
      open={open}
      onClose={(_, reason) => {
        if (reason === "backdropClick") return;
        onClose();
      }}
      TransitionComponent={Grow}
      transitionDuration={300}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        elevation: 0,
        sx: {
          borderRadius: 1,
          bgcolor: theme.palette.background.paper,
          color: "white",
          p: 3,
        },
      }}
    >
      <Box sx={{ position: "relative" }}>
        <IconButton
          onClick={onClose}
          sx={{
            position: "absolute",
            top: 0,
            right: 0,
            color: "white",
            zIndex: 2,
          }}
        >
          <CloseIcon />
        </IconButton>

        {children}
      </Box>
    </Dialog>
  );
}
