"use client";
import React, { Component, ReactNode } from "react";

// 错误回退组件接口
export interface ErrorFallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
}

// 默认错误回退组件
export function DefaultErrorFallback({ error, resetErrorBoundary }: ErrorFallbackProps) {
  return (
    <div className="bg-red-50 p-4 border border-red-200 rounded-md">
      <h2 className="mb-2 font-bold text-red-800">加载数据时出错</h2>
      <p className="mb-4 text-red-600">{error.message}</p>
      <button 
        onClick={resetErrorBoundary}
        className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded text-white"
      >
        重试
      </button>
    </div>
  );
}

// 错误边界组件接口
export interface ErrorBoundaryProps {
  children: ReactNode;
  FallbackComponent?: React.ComponentType<ErrorFallbackProps>;
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

// 错误边界组件
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
    this.resetErrorBoundary = this.resetErrorBoundary.bind(this);
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  resetErrorBoundary() {
    this.setState({ hasError: false, error: null });
    this.props.onReset?.();
  }

  render() {
    if (this.state.hasError && this.state.error) {
      const FallbackComponent = this.props.FallbackComponent || DefaultErrorFallback;
      
      return (
        <FallbackComponent
          error={this.state.error}
          resetErrorBoundary={this.resetErrorBoundary}
        />
      );
    }

    return this.props.children;
  }
} 