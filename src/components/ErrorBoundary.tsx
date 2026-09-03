import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('POS Application Runtime Error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#FDFBF7] flex flex-col items-center justify-center p-6 text-center font-sans">
          <div className="max-w-md w-full bg-white p-6 rounded-2xl border border-amber-200 shadow-lg space-y-4">
            <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center mx-auto text-xl font-bold">
              !
            </div>
            <h2 className="text-xl font-black text-[#4B3621]">DAS CAFF POS Loading Error</h2>
            <p className="text-xs text-stone-600">
              The application encountered a startup issue. Please try refreshing the page or clearing browser cache.
            </p>
            {this.state.error && (
              <pre className="p-3 bg-stone-100 rounded-lg text-left text-[11px] text-red-700 overflow-x-auto max-h-36">
                {this.state.error.message || String(this.state.error)}
              </pre>
            )}
            <button
              onClick={() => window.location.reload()}
              className="w-full py-2.5 px-4 rounded-xl bg-[#4B3621] text-white text-xs font-bold hover:bg-[#3D2C1B] cursor-pointer"
            >
              Reload POS
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
