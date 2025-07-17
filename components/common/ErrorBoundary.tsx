import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error in ErrorBoundary:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      const isLightTheme = document.documentElement.classList.contains('light-theme');
      const cardClasses = isLightTheme
        ? 'bg-white border border-red-200 text-red-800'
        : 'themed-card border border-red-700 text-red-300';
      const buttonClasses = isLightTheme
        ? 'bg-primary-600 text-white hover:bg-primary-700'
        : 'bg-primary-500 text-white hover:bg-primary-600';
      const codeBg = isLightTheme ? 'bg-red-50' : 'bg-secondary-800';

      return (
        <div className={`p-6 rounded-lg text-center ${cardClasses}`}>
          <h1 className="text-xl font-bold">אופס! משהו השתבש.</h1>
          <p className="mt-2">אירעה שגיאה בטעינת הרכיב הזה.</p>
          <p className={`mt-4 text-xs ${codeBg} p-2 rounded font-mono`}>
            {this.state.error?.toString()}
          </p>
          <button 
            onClick={() => this.setState({ hasError: false, error: undefined })}
            className={`mt-4 px-4 py-2 rounded transition-colors ${buttonClasses}`}
          >
            נסה שוב
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
