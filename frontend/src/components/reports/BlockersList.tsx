import React, { useState, useEffect } from 'react';
import { AlertCircle, Plus, Trash2, ShieldAlert } from 'lucide-react';

interface BlockersListProps {
  blockersText: string;
  keyBlocker: string | null;
  onBlockersChange: (text: string) => void;
  onKeyBlockerChange: (keyBlocker: string | null) => void;
  disabled?: boolean;
}

export const BlockersList: React.FC<BlockersListProps> = ({
  blockersText,
  keyBlocker,
  onBlockersChange,
  onKeyBlockerChange,
  disabled = false,
}) => {
  const [items, setItems] = useState<string[]>([]);

  useEffect(() => {
    if (blockersText) {
      const parsed = blockersText
        .split('\n')
        .map((s) => s.trim().replace(/^[-•*]\s*/, ''))
        .filter(Boolean);
      setItems(parsed.length > 0 ? parsed : ['']);
    } else {
      setItems(['']);
    }
  }, [blockersText]);

  const updateItems = (newItems: string[]) => {
    setItems(newItems);
    const joined = newItems.filter((i) => i.trim() !== '').join('\n');
    onBlockersChange(joined);

    if (keyBlocker && !newItems.includes(keyBlocker)) {
      onKeyBlockerChange(newItems.find((i) => i.trim() !== '') || null);
    }
  };

  const handleItemChange = (index: number, val: string) => {
    const oldVal = items[index];
    const newItems = [...items];
    newItems[index] = val;
    updateItems(newItems);

    if (keyBlocker === oldVal && val.trim()) {
      onKeyBlockerChange(val.trim());
    }
  };

  const addItem = () => {
    updateItems([...items, '']);
  };

  const removeItem = (index: number) => {
    const itemToRemove = items[index];
    const newItems = items.filter((_, i) => i !== index);
    updateItems(newItems);

    if (keyBlocker === itemToRemove) {
      onKeyBlockerChange(newItems.find((i) => i.trim() !== '') || null);
    }
  };

  const toggleKeyBlocker = (itemText: string) => {
    if (!itemText.trim()) return;
    if (keyBlocker === itemText.trim()) {
      onKeyBlockerChange(null);
    } else {
      onKeyBlockerChange(itemText.trim());
    }
  };

  return (
    <div className="space-y-3 bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
              Blockers & Challenges
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              List obstacles faced this week and flag the single <span className="text-amber-600 dark:text-amber-400 font-semibold">Key Issue</span>.
            </p>
          </div>
        </div>

        {!disabled && (
          <button
            type="button"
            onClick={addItem}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 text-xs font-medium border border-zinc-200 dark:border-zinc-700 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Blocker
          </button>
        )}
      </div>

      <div className="space-y-2 pt-2">
        {items.map((item, idx) => {
          const isKey = keyBlocker && keyBlocker === item.trim() && item.trim() !== '';

          return (
            <div
              key={idx}
              className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all ${
                isKey
                  ? 'bg-amber-500/10 border-amber-500/40 shadow-sm shadow-amber-500/5'
                  : 'bg-zinc-50 dark:bg-zinc-950/70 border-zinc-200 dark:border-zinc-800/80 hover:border-zinc-300 dark:hover:border-zinc-700'
              }`}
            >
              {/* Radio/Flag toggle for Key Issue */}
              <button
                type="button"
                disabled={disabled || !item.trim()}
                onClick={() => toggleKeyBlocker(item)}
                title={isKey ? 'Flagged as Key Issue' : 'Click to flag as Key Issue'}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 ${
                  isKey
                    ? 'bg-amber-500 text-white dark:text-zinc-950 font-bold shadow-sm'
                    : 'bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-500/10 border border-zinc-200 dark:border-zinc-700'
                } disabled:opacity-50`}
              >
                <ShieldAlert className={`w-3.5 h-3.5 ${isKey ? 'text-white dark:text-zinc-950' : 'text-amber-500'}`} />
                <span>{isKey ? 'Key Issue' : 'Flag Key'}</span>
              </button>

              {/* Text Input */}
              <input
                type="text"
                disabled={disabled}
                value={item}
                onChange={(e) => handleItemChange(idx, e.target.value)}
                placeholder="e.g. Delayed API specification from third-party vendor..."
                className="flex-1 bg-transparent text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none disabled:opacity-60"
              />

              {/* Remove button */}
              {!disabled && items.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeItem(idx)}
                  className="p-1 rounded-lg text-zinc-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {keyBlocker && (
        <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400/90 pt-1 font-medium">
          <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
          <span>Key Issue Flagged: <strong className="text-amber-700 dark:text-amber-300">"{keyBlocker}"</strong></span>
        </div>
      )}
    </div>
  );
};
