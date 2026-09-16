'use client';

import { useEffect, useState } from 'react';
import { Download } from 'lucide-react';

// Shows an "Instalar app" button when the browser offers PWA installation
// (Android/Chrome). On iOS the event never fires (install is via Share menu),
// so the button simply doesn't appear.
interface BIPEvent extends Event {
  prompt: () => void;
  userChoice: Promise<{ outcome: string }>;
}

export default function InstallButton() {
  const [deferred, setDeferred] = useState<BIPEvent | null>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BIPEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  if (!deferred) return null;

  return (
    <button
      onClick={async () => {
        deferred.prompt();
        await deferred.userChoice;
        setDeferred(null);
      }}
      className="action-pill"
      style={{ marginTop: 16 }}
    >
      <Download size={15} />
      Instalar app
    </button>
  );
}
