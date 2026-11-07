// src/components/ui/ToggleSwitch.tsx
import React, { memo } from 'react';
import classNames from 'classnames';

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ checked, onChange, disabled }) => {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={classNames(
        "relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E78720] focus-visible:ring-offset-2",
        {
          "bg-[#E78720]": checked,
          "bg-gray-200": !checked,
          "opacity-50 cursor-not-allowed": disabled
        }
      )}
    >
      <span className="sr-only">Use setting</span>
      <span
        aria-hidden="true"
        className={classNames(
          "pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
          {
            "translate-x-5": checked,
            "translate-x-0": !checked
          }
        )}
      />
    </button>
  );
};

export default memo(ToggleSwitch);