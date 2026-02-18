import { Box, Stack, Typography } from "@mui/material";

export default function Section({
  id,
  eyebrow,
  title,
  children,
}: {
  id: string;
  eyebrow?: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Box id={id} sx={{ scrollMarginTop: 96, py: { xs: 3, md: 4 } }}>
      <Stack spacing={1.25} sx={{ mb: 2.5 }}>
        {eyebrow ? (
          <Typography
            variant="overline"
            sx={{ color: "text.secondary", letterSpacing: 1.2 }}
          >
            {eyebrow}
          </Typography>
        ) : null}

        <Stack direction="row" spacing={1.25} alignItems="center">
          <Box
            sx={{
              width: 10,
              height: 24,
              borderRadius: 999,
              bgcolor: "primary.main",
              opacity: 0.85,
            }}
          />
          <Typography variant="h4">{title}</Typography>
        </Stack>
      </Stack>

      {children}
    </Box>
  );
}
