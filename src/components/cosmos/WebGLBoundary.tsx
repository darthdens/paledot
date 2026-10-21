import { Component, ReactNode } from 'react';
import { useLanguage } from '@/i18n/LanguageContext';

interface State { hasError: boolean }

class ErrorBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, State> {
  override state: State = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  override componentDidCatch(err: unknown) { console.error('[Cosmos] render error', err); }
  override render() { return this.state.hasError ? this.props.fallback : this.props.children; }
}

function Fallback() {
  const { language, tr, tx, numberLocale } = useLanguage();
  return (
    <div className="w-full h-full flex items-center justify-center p-8 text-center">
      <div className="max-w-md space-y-3 text-neutral-200">
        <h2 className="font-serif text-2xl">
          {tx('The cosmos can\u2019t be displayed', 'Le cosmos ne peut pas s\u2019afficher')}
        </h2>
        <p className="text-sm text-neutral-400">
          {tx('Your browser doesn\u2019t appear to support WebGL. Try an up-to-date Chrome, Safari, or Firefox with hardware acceleration enabled.', 'Votre navigateur ne semble pas prendre en charge WebGL. Essayez Chrome, Safari ou Firefox \u00e0 jour, et activez l\u2019acc\u00e9l\u00e9ration mat\u00e9rielle.')}
        </p>
      </div>
    </div>
  );
}

export function WebGLBoundary({ children }: { children: ReactNode }) {
  return <ErrorBoundary fallback={<Fallback />}>{children}</ErrorBoundary>;
}