import { Toaster } from "sonner";
import { Suspense } from "react";
import { queryClient } from "@/config/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { ThemeProvider } from "@mui/material/styles";
import theme from "@/lib/theme";
import AppRouter from "@/AppRouter";
import IntercomWrapper from "@/Components/IntercomProvider.jsx";
import Loader from "@/Components/Loader";
import CookieConsentWithAnalytics from "@/Components/CookieConsentWithAnalytics.jsx";

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <QueryClientProvider client={queryClient}>
        <ReactQueryDevtools />
        <IntercomWrapper>
          <Suspense fallback={<Loader />}>
            <AppRouter />
          </Suspense>
          <Toaster />
          <CookieConsentWithAnalytics />
        </IntercomWrapper>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
