import React, { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public declare props: Props;
  public override state: State = {
    hasError: false,
    error: null
  };

  private _cleanupError?: () => void;

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public override componentDidMount() {
    const handleGlobalError = (event: ErrorEvent) => {
      const errorMsg = event.message || "";
      if (
        errorMsg.includes("Importing a module script failed") ||
        errorMsg.includes("Failed to fetch dynamically imported module")
      ) {
        console.warn("Global chunk load error caught. Forcing reload...");
        this.forceChunkReload();
      }
    };

    window.addEventListener("error", handleGlobalError);
    this._cleanupError = () => window.removeEventListener("error", handleGlobalError);
  }

  public override componentWillUnmount() {
    if (this._cleanupError) {
      this._cleanupError();
    }
  }

  private forceChunkReload() {
    const lastReload = sessionStorage.getItem('last_chunk_error_reload');
    const now = Date.now();
    if (!lastReload || now - parseInt(lastReload, 10) > 10000) {
      sessionStorage.setItem('last_chunk_error_reload', now.toString());
      window.location.reload();
    }
  }

  public override componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
    
    // Check if it's a dynamic module/chunk import failure
    const errorMsg = error.toString().toLowerCase();
    const isChunkError = 
      errorMsg.includes("chunk") || 
      errorMsg.includes("dynamic import") || 
      errorMsg.includes("failed to fetch") || 
      errorMsg.includes("importing a module script");

    if (isChunkError) {
      this.forceChunkReload();
    }
  }

  public override render() {
    if (this.state.hasError) {
      const errorMsg = this.state.error?.toString() || "";
      const isChunkError = 
        errorMsg.includes("chunk") || 
        errorMsg.includes("dynamic import") || 
        errorMsg.includes("failed to fetch") || 
        errorMsg.includes("importing a module script") ||
        errorMsg.includes("Importing a module script failed");

      return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-slate-100 font-sans">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 text-center space-y-6 shadow-2xl">
            <div className="w-16 h-16 bg-rose-500/10 border border-rose-500/30 rounded-full flex items-center justify-center text-rose-400 mx-auto text-3xl">
              ⚠️
            </div>
            
            <div className="space-y-2">
              <h1 className="text-xl font-black text-white tracking-tight">
                {isChunkError ? "Оновлення додатку..." : "Виникла помилка"}
              </h1>
              <p className="text-sm text-slate-400 leading-relaxed">
                {isChunkError 
                  ? "Додаток отримав важливе оновлення компонентів. Будь ласка, зачекайте, поки ми перезавантажимо інтерфейс."
                  : "Під час роботи інтерфейсу виникла непередбачувана помилка."}
              </p>
            </div>

            <div className="bg-black/40 border border-slate-800/80 rounded-xl p-4 text-left font-mono text-[11px] text-rose-400 overflow-x-auto max-h-[150px]">
              <div className="font-bold">{errorMsg}</div>
              {this.state.error?.stack && (
                <div className="text-slate-500 mt-2 text-[10px] whitespace-pre">
                  {this.state.error.stack}
                </div>
              )}
            </div>

            <button
              onClick={() => {
                sessionStorage.clear();
                window.location.reload();
              }}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs font-mono uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-lg shadow-indigo-950/40"
            >
              Перезапустити додаток
            </button>
          </div>
        </div>
      );
    }

    return (this.props as Props).children;
  }
}



