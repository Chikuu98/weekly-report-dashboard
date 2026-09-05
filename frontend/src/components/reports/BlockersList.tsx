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
  // Parse string into array of items for structured editing
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

    // If key blocker is removed or not in new items, update key blocker
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
    <div className="space-y-3 bg-slate-900/60 border border-slate-800 rounded-2xl p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-white">
              Blockers & Challenges
            </h3>
            <p className="text-xs text-slate-400">
              List obstacles faced this week and flag the single <span className="text-amber-400 font-semibold">Key Issue</span>.
            </p>
          </div>
        </div>

        {!disabled && (
          <button
            type="button"
            onClick={addItem}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors"
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
                  : 'bg-slate-950/70 border-slate-800/80 hover:border-slate-700'
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
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                    : 'bg-slate-800 text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 border border-slate-700'
                } disabled:opacity-50`}
              >
                <ShieldAlert className={`w-3.5 h-3.5 ${isKey ? 'text-slate-950' : 'text-amber-400'}`} />
                <span>{isKey ? 'Key Issue' : 'Flag Key'}</span>
              </button>

              {/* Text Input */}
              <input
                type="text"
                disabled={disabled}
                value={item}
                onChange={(e) => handleItemChange(idx, e.target.value)}
                placeholder="e.g. Delayed API specification from third-party vendor..."
                className="flex-1 bg-transparent text-xs text-white placeholder-slate-600 focus:outline-none disabled:opacity-60"
              />

              {/* Remove button */}
              {!disabled && items.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeItem(idx)}
                  className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {keyBlocker && (
        <div className="flex items-center gap-2 text-xs text-amber-400/90 pt-1 font-medium">
          <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
          <span>Key Issue Flagged: <strong className="text-amber-300">"{keyBlocker}"</strong></span>
        </div>
      )}
    </div>
  );
};
