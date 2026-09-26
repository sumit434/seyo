import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from './Button.js';

interface ErrorMessageProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  onDismiss?: () => void;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  title = 'Something went wrong',
  message,
  onRetry,
  onDismiss,
}) => {
  return (
    <div className="rounded-2xl border border-red-200 bg-red-50/70 p-4 text-left animate-fadeIn">
      <div className="flex items-start gap-3">
        <div className="p-1 rounded-xl bg-red-100 text-red-600 mt-0.5 shrink-0">
          <AlertCircle className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-semibold text-red-900">{title}</h4>
          <p className="mt-1 text-sm text-red-700 leading-relaxed">{message}</p>

          <div className="mt-3 flex gap-2">
            {onRetry && (
              <Button
                variant="secondary"
                onClick={onRetry}
                className="py-2 px-3 text-xs w-auto h-auto rounded-xl border-red-200 text-red-800 hover:bg-red-100"
              >
                <RefreshCw className="w-3.5 h-3.5 mr-1" />
                Retry
              </Button>
            )}
            {onDismiss && (
              <button
                type="button"
                onClick={onDismiss}
                className="text-xs font-medium text-red-600 hover:text-red-800 px-2 py-1"
              >
                Dismiss
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
