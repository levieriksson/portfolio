"use client";

import { Dialog, Box, IconButton, Typography } from "@mui/material";
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
          bgcolor: "background.paper",
          color: "text.primary",
          height: { xs: "92vh", md: "85vh" },
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        },
      }}
    >
      <Box
        sx={{ px: 2, pt: 2, pb: 1.5, position: "relative", flex: "0 0 auto" }}
      >
        <IconButton
          onClick={onClose}
          sx={{
            position: "absolute",
            top: 8,
            right: 8,
            color: "text.secondary",
            zIndex: 2,
          }}
          aria-label="Close"
        >
          <CloseIcon fontSize="small" />
        </IconButton>

        {(title || subtitle) && (
          <Box sx={{ pr: 6, pl: 2, transform: "translateY(8px)" }}>
            {title && (
              <Typography variant="h6" sx={{ m: 0, lineHeight: 1.1 }}>
                {title}
              </Typography>
            )}
            {subtitle && (
              <Typography variant="caption" sx={{ color: "text.secondary" }}>
                {subtitle}
              </Typography>
            )}
          </Box>
        )}
      </Box>

      <Box sx={{ flex: 1, minHeight: 0, px: 2, pb: 2, overflow: "hidden" }}>
        {children}
      </Box>
    </Dialog>
  );
}
