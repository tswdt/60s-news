import React from 'react';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ErrorBoundary] 图形组件渲染失败:', error, errorInfo);
  }

  componentDidUpdate(prevProps: Props) {
    if (prevProps.children !== this.props.children && this.state.hasError) {
      this.setState({ hasError: false, error: undefined });
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div style={{
          padding: '24px 20px',
          background: '#FEF2F2',
          border: '1.5px solid #FCA5A5',
          borderRadius: 12,
          textAlign: 'center',
          color: '#991B1B',
          fontSize: 14,
          lineHeight: 1.7,
          width: '100%',
          boxSizing: 'border-box',
        }}>
          <div style={{ fontSize: 20, marginBottom: 8 }}>⚠️</div>
          <strong>图形组件渲染失败</strong>
          <div>请检查 visual.type、visual.data 或 stepIndex。</div>
          {this.state.error?.message && (
            <div style={{ marginTop: 8, fontSize: 12, color: '#7F1D1D' }}>
              {this.state.error.message}
            </div>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
