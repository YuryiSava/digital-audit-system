'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return this.props.fallback || (
                <div className="p-4 bg-red-900/20 border border-red-500 rounded-lg text-white">
                    <h2 className="text-xl font-bold mb-2">Что-то пошло не так</h2>
                    <p className="text-red-200 text-sm mb-4">
                        {this.state.error?.message || 'Произошла неизвестная ошибка при отображении компонента.'}
                    </p>
                    <button
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded transition-colors"
                        onClick={() => this.setState({ hasError: false })}
                    >
                        Попробовать снова
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}
