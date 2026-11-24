import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import LockScreen from "@/pages/lock-screen";
import AdminPanel from "@/pages/admin-panel";
import InjectSite from "@/pages/inject-site";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
  },
});

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Uncaught application error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#05060a] text-zinc-100 flex items-center justify-center p-6 select-none">
          <div className="cyber-card rounded-3xl p-8 max-w-lg w-full border border-amber-500/40 text-center shadow-2xl space-y-4">
            <div className="text-4xl">⚠️</div>
            <h2 className="text-xl font-gaming font-bold text-amber-400">PANEL NOTICE</h2>
            <p className="text-xs font-chakra text-zinc-400">
              A render exception was caught. You can continue directly or restart the panel session.
            </p>
            {this.state.error && (
              <div className="text-left bg-black/60 p-3 rounded-xl border border-red-500/30 overflow-x-auto max-h-36">
                <p className="text-xs font-mono font-bold text-red-400">{this.state.error.message}</p>
              </div>
            )}
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={() => this.setState({ hasError: false, error: null })}
                className="flex-1 py-3.5 rounded-2xl bg-cyan-500 text-black font-gaming font-bold text-xs uppercase tracking-wider hover:bg-cyan-400 transition-all cursor-pointer shadow-[0_0_20px_rgba(6,182,212,0.4)]"
              >
                ⚡ CONTINUE TO PANEL
              </button>
              <button
                onClick={() => {
                  localStorage.clear();
                  window.location.reload();
                }}
                className="flex-1 py-3.5 rounded-2xl bg-amber-500 text-black font-gaming font-bold text-xs uppercase tracking-wider hover:bg-amber-400 transition-all cursor-pointer shadow-[0_0_20px_rgba(245,158,11,0.4)]"
              >
                🔄 RESET & RESTART
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function AppRouter() {
  const { role, token, restoring } = useAuth();

  if (restoring) {
    return (
      <div className="min-h-screen bg-[#05060a] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin shadow-[0_0_25px_rgba(245,158,11,0.5)]" />
          <p className="text-zinc-500 text-xs font-gaming tracking-widest uppercase animate-pulse">
            LOADING CARX STREET TOOL...
          </p>
        </div>
      </div>
    );
  }

  if (role === "admin") {
    return <AdminPanel />;
  }

  if (role === "user" || token) {
    return <InjectSite />;
  }

  return <LockScreen />;
}

export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <AuthProvider>
            <AppRouter />
          </AuthProvider>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}