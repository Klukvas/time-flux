'use client';

import { useState } from 'react';
import { BASE_COLORS, contrastTextColor, generateShades } from '@lifespan/utils';

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
}

export function ColorPicker({ value, onChange }: ColorPickerProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const handleBaseClick = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  const handleShadeClick = (shade: string) => {
    onChange(shade);
  };

  return (
    <div className="space-y-2">
      {/* Base color row */}
      <div className="flex flex-wrap gap-2">
        {BASE_COLORS.map((base, index) => {
          const isSelected =
            value.toUpperCase() === base.hex.toUpperCase() ||
            generateShades(base.hex).some(
              (s) => s.toUpperCase() === value.toUpperCase(),
            );
          const isExpanded = expandedIndex === index;

          return (
            <button
              key={base.hex}
              type="button"
              className={`relative h-8 w-8 rounded-full border-2 transition-all hover:scale-110 ${
                isSelected
                  ? 'border-content ring-2 ring-accent/30 scale-110'
                  : isExpanded
                    ? 'border-content/50 scale-110'
                    : 'border-transparent'
              }`}
              style={{ backgroundColor: base.hex }}
              onClick={() => handleBaseClick(index)}
              title={base.label}
            >
              {isSelected && !isExpanded && (
                <svg
                  className="mx-auto h-4 w-4"
                  fill="none"
                  stroke={contrastTextColor(base.hex)}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              )}
              {isExpanded && (
                <svg
                  className="mx-auto h-3.5 w-3.5"
                  fill="none"
                  stroke={contrastTextColor(base.hex)}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              )}
            </button>
          );
        })}
      </div>

      {/* Shade row — expands inline under the base colors */}
      {expandedIndex !== null && (
        <div className="flex items-center gap-1.5 rounded-lg border border-edge bg-surface-secondary px-3 py-2">
          <span className="mr-1 text-xs font-medium text-content-secondary">
            {BASE_COLORS[expandedIndex].label}
          </span>
          {generateShades(BASE_COLORS[expandedIndex].hex).map((shade) => {
            const selected = value.toUpperCase() === shade.toUpperCase();
            return (
              <button
                key={shade}
                type="button"
                className={`h-7 w-7 rounded-full border-2 transition-all hover:scale-110 ${
                  selected
                    ? 'border-content scale-110'
                    : 'border-transparent'
                }`}
                style={{ backgroundColor: shade }}
                onClick={() => handleShadeClick(shade)}
              >
                {selected && (
                  <svg
                    className="mx-auto h-3.5 w-3.5"
                    fill="none"
                    stroke={contrastTextColor(shade)}
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={3}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
