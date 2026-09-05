import React, { useState, useEffect } from 'react';
import { Award, Plus, Trash2, Star } from 'lucide-react';

interface AchievementsListProps {
  achievementsText: string;
  keyAchievement: string | null;
  onAchievementsChange: (text: string) => void;
  onKeyAchievementChange: (keyAchievement: string | null) => void;
  disabled?: boolean;
}

export const AchievementsList: React.FC<AchievementsListProps> = ({
  achievementsText,
  keyAchievement,
  onAchievementsChange,
  onKeyAchievementChange,
  disabled = false,
}) => {
  const [items, setItems] = useState<string[]>([]);

  useEffect(() => {
    if (achievementsText) {
      const parsed = achievementsText
        .split('\n')
        .map((s) => s.trim().replace(/^[-•*]\s*/, ''))
        .filter(Boolean);
      setItems(parsed.length > 0 ? parsed : ['']);
    } else {
      setItems(['']);
    }
  }, [achievementsText]);

  const updateItems = (newItems: string[]) => {
    setItems(newItems);
    const joined = newItems.filter((i) => i.trim() !== '').join('\n');
    onAchievementsChange(joined);

    if (keyAchievement && !newItems.includes(keyAchievement)) {
      onKeyAchievementChange(newItems.find((i) => i.trim() !== '') || null);
    }
  };

  const handleItemChange = (index: number, val: string) => {
    const oldVal = items[index];
    const newItems = [...items];
    newItems[index] = val;
    updateItems(newItems);

    if (keyAchievement === oldVal && val.trim()) {
      onKeyAchievementChange(val.trim());
    }
  };

  const addItem = () => {
    updateItems([...items, '']);
  };

  const removeItem = (index: number) => {
    const itemToRemove = items[index];
    const newItems = items.filter((_, i) => i !== index);
    updateItems(newItems);

    if (keyAchievement === itemToRemove) {
      onKeyAchievementChange(newItems.find((i) => i.trim() !== '') || null);
    }
  };

  const toggleKeyAchievement = (itemText: string) => {
    if (!itemText.trim()) return;
    if (keyAchievement === itemText.trim()) {
      onKeyAchievementChange(null);
    } else {
      onKeyAchievementChange(itemText.trim());
    }
  };

  return (
    <div className="space-y-3 bg-slate-900/60 border border-slate-800 rounded-2xl p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-white">
              Achievements & Highlights
            </h3>
            <p className="text-xs text-slate-400">
              Highlight key accomplishments this week and flag your <span className="text-emerald-400 font-semibold">Key Achievement</span>.
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
            Add Highlight
          </button>
        )}
      </div>

      <div className="space-y-2 pt-2">
        {items.map((item, idx) => {
          const isKey = keyAchievement && keyAchievement === item.trim() && item.trim() !== '';

          return (
            <div
              key={idx}
              className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all ${
                isKey
                  ? 'bg-emerald-500/10 border-emerald-500/40 shadow-sm shadow-emerald-500/5'
                  : 'bg-slate-950/70 border-slate-800/80 hover:border-slate-700'
              }`}
            >
              {/* Radio/Star toggle for Key Achievement */}
              <button
                type="button"
                disabled={disabled || !item.trim()}
                onClick={() => toggleKeyAchievement(item)}
                title={isKey ? 'Flagged as Key Achievement' : 'Click to flag as Key Achievement'}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 ${
                  isKey
                    ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                    : 'bg-slate-800 text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 border border-slate-700'
                } disabled:opacity-50`}
              >
                <Star className={`w-3.5 h-3.5 ${isKey ? 'text-slate-950 fill-slate-950' : 'text-emerald-400'}`} />
                <span>{isKey ? 'Key Highlight' : 'Flag Key'}</span>
              </button>

              {/* Text Input */}
              <input
                type="text"
                disabled={disabled}
                value={item}
                onChange={(e) => handleItemChange(idx, e.target.value)}
                placeholder="e.g. Completed JWT authentication unit test suite ahead of schedule..."
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

      {keyAchievement && (
        <div className="flex items-center gap-2 text-xs text-emerald-400/90 pt-1 font-medium">
          <Star className="w-3.5 h-3.5 shrink-0 fill-emerald-400" />
          <span>Key Highlight Flagged: <strong className="text-emerald-300">"{keyAchievement}"</strong></span>
        </div>
      )}
    </div>
  );
};
