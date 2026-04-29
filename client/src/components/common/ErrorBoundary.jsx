import PropTypes from 'prop-types';
import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(_error) {
    return { hasError: true };
  }

  componentDidCatch(_error, errorInfo) {
    console.error('ErrorBoundary caught an error:', _error, errorInfo);
    this.setState({ error: _error, errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full bg-slate-800 border border-slate-700 rounded-xl p-8">
            <h1 className="text-2xl font-bold text-red-400 mb-4">Đã xảy ra lỗi</h1>
            <pre className="text-sm text-slate-300 overflow-auto bg-slate-900 p-4 rounded-xl">
              {this.state.error?.toString()}
            </pre>
            <details className="mt-4">
              <summary className="text-slate-400 cursor-pointer">Chi tiết lỗi</summary>
              <pre className="text-sm text-slate-500 mt-2 overflow-auto bg-slate-900 p-4 rounded-xl">
                {this.state.errorInfo?.componentStack}
              </pre>
            </details>
            <button
              onClick={() => window.location.reload()}
              className="mt-6 px-6 py-2 bg-emerald-500 text-white rounded-xl font-semibold hover:bg-emerald-600"
            >
              Tải lại trang
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

ErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired,
};

export default ErrorBoundary;
