"use client";

import { useMemo } from "react";
import { Calendar, X } from "lucide-react";

export function OprecPeriodPicker({
  value = "",
  onChange,
  disabled = false,
  className = "",
  id,
}) {
  const currentYear = new Date().getFullYear();

  // Parse existing "YYYY/YYYY"
  const [startYear, endYear] = useMemo(() => {
    if (!value) return ["", ""];
    const parts = String(value).split("/");
    return [parts[0]?.trim() || "", parts[1]?.trim() || ""];
  }, [value]);

  // Generate dynamic year options around current year (e.g. -6 to +8) + include existing values if any
  const yearOptions = useMemo(() => {
    const set = new Set();
    for (let y = currentYear - 6; y <= currentYear + 8; y++) {
      set.add(String(y));
    }
    if (startYear && /^\d{4}$/.test(startYear)) set.add(startYear);
    if (endYear && /^\d{4}$/.test(endYear)) set.add(endYear);
    return Array.from(set).sort((a, b) => Number(a) - Number(b));
  }, [currentYear, startYear, endYear]);

  const handleStartChange = (e) => {
    const newStart = e.target.value;
    if (!newStart) {
      onChange?.(endYear ? `/${endYear}` : "");
      return;
    }
    // If endYear is empty or equals/is before newStart, automatically set endYear to newStart + 1
    let nextEnd = endYear;
    if (!endYear || Number(endYear) <= Number(newStart)) {
      nextEnd = String(Number(newStart) + 1);
    }
    onChange?.(`${newStart}/${nextEnd}`);
  };

  const handleEndChange = (e) => {
    const newEnd = e.target.value;
    if (!newEnd) {
      onChange?.(startYear ? `${startYear}/` : "");
      return;
    }
    // If startYear is empty or equals/is after newEnd, automatically set startYear to newEnd - 1
    let nextStart = startYear;
    if (!startYear || Number(startYear) >= Number(newEnd)) {
      nextStart = String(Number(newEnd) - 1);
    }
    onChange?.(`${nextStart}/${newEnd}`);
  };

  const handleClear = () => {
    onChange?.("");
  };

  const hasValue = Boolean(startYear || endYear);

  return (
    <div className={`oprec-period-picker ${className}`}>
      <div className="oprec-period-picker__body">
        <span className="oprec-period-picker__icon" aria-hidden="true">
          <Calendar size={15} />
        </span>

        {/* Tahun Awal (Sebelum /) */}
        <div className="oprec-period-picker__field">
          <select
            id={id ? `${id}-start` : undefined}
            value={startYear}
            onChange={handleStartChange}
            disabled={disabled}
            className="oprec-period-picker__select"
            aria-label="Pilih tahun awal periode kepengurusan"
          >
            <option value="" disabled>
              Tahun Awal
            </option>
            {yearOptions.map((yr) => (
              <option key={`start-${yr}`} value={yr}>
                {yr}
              </option>
            ))}
          </select>
        </div>

        {/* Separator / */}
        <span className="oprec-period-picker__slash" aria-hidden="true">
          /
        </span>

        {/* Tahun Akhir (Sesudah /) */}
        <div className="oprec-period-picker__field">
          <select
            id={id ? `${id}-end` : undefined}
            value={endYear}
            onChange={handleEndChange}
            disabled={disabled}
            className="oprec-period-picker__select"
            aria-label="Pilih tahun akhir periode kepengurusan"
          >
            <option value="" disabled>
              Tahun Akhir
            </option>
            {yearOptions.map((yr) => (
              <option key={`end-${yr}`} value={yr}>
                {yr}
              </option>
            ))}
          </select>
        </div>

        {/* Status / Badge / Clear */}
        <div className="oprec-period-picker__meta">
          {startYear && endYear ? (
            <span className="oprec-period-picker__badge font-mono">
              {startYear}/{endYear}
            </span>
          ) : (
            <span className="oprec-period-picker__hint font-mono">
              YYYY/YYYY
            </span>
          )}

          {hasValue && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="oprec-period-picker__clear"
              aria-label="Kosongkan pilihan tahun periode"
              title="Kosongkan pilihan tahun"
            >
              <X size={13} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
