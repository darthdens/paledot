import { Component, ReactNode } from 'react';
import { useLanguage } from '@/i18n/LanguageContext';

interface State { hasError: boolean; isLoadError: boolean; attempt: number }

const MAX_AUTO_RETRIES = 3;

function isAssetLoadError(err: unknown) {
  const msg = err instanceof Error ? err.message : String(err ?? '');
  return /could not load|failed to fetch|loading chunk|dynamically imported module/i.test(msg);
}

class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  override state: State = { hasError: false, isLoadError: false, attempt: 0 };
  private timer: ReturnType<typeof setTimeout> | null = null;

  static getDerivedStateFromError(err: unknown): Partial<State> {
    return { hasError: true, isLoadError: isAssetLoadError(err) };
  }

  override componentDidCatch(err: unknown) {
    console.error('[Cosmos] render error', err);
    // Network hiccups (a texture or file that failed to download) are usually
    // temporary — quietly try again a few times before showing a message.
    if (isAssetLoadError(err) && this.state.attempt < MAX_AUTO_RETRIES) {
      this.timer = setTimeout(() => this.retry(), 800 * (this.state.attempt + 1));
    }
  }

  override componentWillUnmount() { if (this.timer) clearTimeout(this.timer); }

  retry = () => {
    this.setState((s) => ({ hasError: false, isLoadError: false, attempt: s.attempt + 1 }));
  };

  override render() {
    if (!this.state.hasError) return <div key={this.state.attempt} className="contents">{this.props.children}</div>;
    if (this.state.isLoadError && this.state.attempt < MAX_AUTO_RETRIES) return null;
    return <Fallback isLoadError={this.state.isLoadError} onRetry={() => window.location.reload()} />;
  }
}

function Fallback({ isLoadError, onRetry }: { isLoadError: boolean; onRetry: () => void }) {
  const { tx } = useLanguage();
  return (
    <div className="w-full h-full flex items-center justify-center p-8 text-center">
      <div className="max-w-md space-y-4 text-neutral-200">
        <h2 className="font-serif text-2xl">
          {tx('The cosmos can\u2019t be displayed', 'Le cosmos ne peut pas s\u2019afficher')}
        </h2>
        <p className="text-sm text-neutral-400">
          {isLoadError
            ? tx('Part of the universe didn\u2019t finish downloading. Check your connection and try again.', 'Une partie de l\u2019univers n\u2019a pas fini de se t\u00e9l\u00e9charger. V\u00e9rifiez votre connexion et r\u00e9essayez.')
            : tx('Your browser doesn\u2019t appear to support WebGL. Try an up-to-date Chrome, Safari, or Firefox with hardware acceleration enabled.', 'Votre navigateur ne semble pas prendre en charge WebGL. Essayez Chrome, Safari ou Firefox \u00e0 jour, et activez l\u2019acc\u00e9l\u00e9ration mat\u00e9rielle.')}
        </p>
        <button
          type="button"
          onClick={onRetry}
          className="rounded-full border border-white/20 bg-white/10 px-5 py-2 text-sm hover:bg-white/20"
        >
          {tx('Try again', 'R\u00e9essayer')}
        </button>
      </div>
    </div>
  );
}

export function WebGLBoundary({ children }: { children: ReactNode }) {
  return <ErrorBoundary>{children}</ErrorBoundary>;
}
