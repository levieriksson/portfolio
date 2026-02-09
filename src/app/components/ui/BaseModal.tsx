"use client";

import { Dialog, Box, IconButton, Typography, useTheme } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import Grow from "@mui/material/Grow";

type BaseModalProps = {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
};

export function BaseModal({
  open,
  onClose,
  children,
  title,
  subtitle,
}: BaseModalProps) {
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
          aria-label="Close"
        >
          <CloseIcon fontSize="small" />
        </IconButton>

        {(title || subtitle) && (
          <Box sx={{ pr: 6, mb: 2 }}>
            {title && (
              <Typography variant="h6" sx={{ m: 0, lineHeight: 1.1 }}>
                {title}
              </Typography>
            )}
            {subtitle && (
              <Typography variant="caption" sx={{ opacity: 0.7 }}>
                {subtitle}
              </Typography>
            )}
          </Box>
        )}

        {children}
      </Box>
    </Dialog>
  );
}
