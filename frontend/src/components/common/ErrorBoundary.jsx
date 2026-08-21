import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    if (import.meta.env.DEV) {
      console.error('[ErrorBoundary caught an error]:', error, errorInfo);
    }
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-linkedin-bg flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white border border-linkedin-border rounded-[12px] p-6 sm:p-8 shadow-linkedin-card text-center space-y-5 animate-in fade-in zoom-in-95 duration-200">
            {/* Warning Icon Badge */}
            <div className="w-14 h-14 mx-auto rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shadow-sm">
              <AlertTriangle className="w-7 h-7" />
            </div>

            {/* Content */}
            <div className="space-y-2">
              <h2 className="text-xl sm:text-2xl font-bold text-linkedin-text-primary">
                Something went wrong
              </h2>
              <p className="text-xs sm:text-sm text-linkedin-text-secondary leading-relaxed">
                An unexpected error occurred while rendering this view. Don't worry, your account data and progress are safe.
              </p>
            </div>

            {/* Error detail in dev mode */}
            {import.meta.env.DEV && this.state.error && (
              <div className="text-left bg-gray-50 border border-gray-200 rounded-md p-3 max-h-32 overflow-y-auto text-[11px] font-mono text-red-600">
                {this.state.error.toString()}
              </div>
            )}

            {/* Actions */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={this.handleReload}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-full bg-linkedin-blue text-white text-xs sm:text-sm font-semibold hover:bg-linkedin-blue-hover transition-colors shadow-sm"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Reload Page</span>
              </button>

              <button
                type="button"
                onClick={this.handleReset}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-full border border-linkedin-border bg-white text-linkedin-text-primary text-xs sm:text-sm font-semibold hover:bg-gray-50 transition-colors"
              >
                <Home className="w-4 h-4 text-linkedin-blue" />
                <span>Go to Dashboard</span>
              </button>
            </div>

            {/* Brand footer mark */}
            <div className="pt-3 border-t border-linkedin-border text-[11px] text-linkedin-text-muted">
              CareerLens &bull; Resilient Career Platform
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
