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
      onClose={onClose}
      TransitionComponent={Grow}
      transitionDuration={300}
      maxWidth="md"
      fullWidth
      PaperProps={{
        elevation: 0,
        sx: {
          borderRadius: 2,
          bgcolor: theme.palette.background.paper,
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
