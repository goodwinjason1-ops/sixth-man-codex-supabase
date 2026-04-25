import React from 'react';
import { AlertTriangle, RefreshCw, Home, WifiOff } from 'lucide-react';
import { logActivity } from '../services/auditService';
import { LOGIN_LOGO_SRC } from '../lib/publicAssets';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ error, errorInfo });

    // Log to audit_logs (fire-and-forget)
    try {
      logActivity(
        { uid: 'system', displayName: 'System', role: 'system' },
        'error.boundary',
        `UI Error: ${error?.message || 'Unknown error'}`,
        {
          componentStack: errorInfo?.componentStack?.slice(0, 500),
          url: window.location.pathname
        }
      );
    } catch (_) {
      // Never let audit logging break the error boundary
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  handleGoHome = () => {
    window.location.href = '/welcome';
  };

  render() {
    if (this.state.hasError) {
      // Detect if user might be a coach on game day (check localStorage for hints)
      const isOffline = !navigator.onLine;

      return (
        <div className="min-h-screen bg-[#F5F9F5] flex items-center justify-center p-4">
          <div className="bg-white border border-[#D4E4D4] rounded-2xl p-8 max-w-md w-full text-center shadow-lg">
            {/* Logo */}
            <img
              src={LOGIN_LOGO_SRC}
              alt="Emerald Lakers"
              className="max-h-[80px] w-auto object-contain mx-auto mb-4"
              onError={(e) => { e.target.style.display = 'none'; }}
            />

            <div className="w-14 h-14 bg-red-50 border border-red-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-7 h-7 text-red-500" />
            </div>

            <h1 className="text-xl font-bold text-gray-800 mb-2">Something went wrong</h1>
            <p className="text-[#6B7C6B] text-sm mb-4">
              {this.props.fallbackMessage || 'An unexpected error occurred. Please try again.'}
            </p>

            {/* Offline / data reassurance for coaches */}
            {isOffline && (
              <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-2">
                <WifiOff className="w-5 h-5 text-amber-600 flex-shrink-0" />
                <p className="text-amber-700 text-sm text-left">
                  You're offline — your data has been saved locally and will sync when you reconnect.
                </p>
              </div>
            )}

            {/* Error details (development only) */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="mb-4 p-3 bg-gray-50 border border-red-200 rounded-lg text-left">
                <p className="text-red-600 text-xs font-mono break-all">
                  {this.state.error.toString()}
                </p>
                {this.state.errorInfo && (
                  <pre className="mt-2 text-[#6B7C6B] text-xs font-mono overflow-auto max-h-32">
                    {this.state.errorInfo.componentStack}
                  </pre>
                )}
              </div>
            )}

            <div className="flex gap-3 justify-center">
              <button
                onClick={this.handleRetry}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#005028] hover:bg-[#00A651] text-white rounded-lg font-medium transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </button>
              <button
                onClick={this.handleGoHome}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#F5F9F5] border border-[#D4E4D4] hover:border-[#00A651] text-gray-800 rounded-lg font-medium transition-colors"
              >
                <Home className="w-4 h-4" />
                Go Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
