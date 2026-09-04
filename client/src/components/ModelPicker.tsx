import { useMemo } from 'react';
import type { ModelOption } from '../types';

interface Props {
  models: ModelOption[];
  value: string;
  onChange: (id: string) => void;
  disabled: boolean;
}

const ModelPicker = ({ models, value, onChange, disabled }: Props) => {
  const vendors = useMemo(() => Array.from(new Set(models.map((model) => model.vendor))), [models]);
  const selected = models.find((model) => model.id === value);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <label htmlFor="model" className="label mb-0">
          Assistant model
        </label>
        {models.length > 0 && <span className="tag">{models.length} available</span>}
      </div>
      <div className="relative">
        <select
          id="model"
          value={value}
          disabled={disabled || models.length === 0}
          onChange={(event) => onChange(event.target.value)}
          className="input cursor-pointer appearance-none pr-10"
        >
          {models.length === 0 && <option value="">Loading models</option>}
          {vendors.map((vendor) => (
            <optgroup key={vendor} label={vendor}>
              {models
                .filter((model) => model.vendor === vendor)
                .map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.label}
                  </option>
                ))}
            </optgroup>
          ))}
        </select>
        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
          focusable="false"
          className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M6.5 9.75l5.5 5 5.5-5" />
        </svg>
      </div>
      <p className="text-xs leading-relaxed text-muted">
        {selected ? selected.blurb : 'Pick the model that answers your next message.'}
      </p>
    </div>
  );
};

export default ModelPicker;
