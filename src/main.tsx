import { ThemeProvider } from "@mui/material";
import { QueryClientProvider } from "@tanstack/react-query";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { SocketProvider } from "./components/socket/Socket.tsx";
import { queryClient } from "./constants/constants.ts";
import theme from "./constants/theme.ts";
import "./index.css";
import Route from "./routes/Route.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <QueryClientProvider client={queryClient}>
        <SocketProvider>
          <RouterProvider router={Route} />
        </SocketProvider>
      </QueryClientProvider>
    </ThemeProvider>
  </StrictMode>
);
