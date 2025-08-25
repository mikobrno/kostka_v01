import React from 'react';
import { Copy, Check } from 'lucide-react';

interface CopyIconButtonProps {
  value: string;
  label?: string;
  className?: string;
  // allow multiple toast shapes used across the codebase; intentional any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  toast?: any | null;
}

export const CopyIconButton: React.FC<CopyIconButtonProps> = ({ value, label = 'Kopírovat', className = '', toast = null }) => {
  const [done, setDone] = React.useState(false);

  const handleCopy = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(value || '');
      } else {
        const ta = document.createElement('textarea');
        ta.value = value || '';
        ta.style.position = 'fixed';
        ta.style.left = '-9999px';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      toast?.showSuccess?.('Zkopírováno', `${label} zkopírováno`);
      setDone(true);
      window.setTimeout(() => setDone(false), 1400);
    } catch {
      // swallow
    }
  };

  return (
    <button type="button" onClick={handleCopy} title={label} aria-label={label} className={`p-1 text-gray-500 hover:text-gray-700 ${className}`}>
      {done ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
    </button>
  );
};

export default CopyIconButton;
