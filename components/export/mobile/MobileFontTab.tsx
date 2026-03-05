import React from 'react';
import { AlignLeft, AlignCenter, AlignRight, AlignVerticalJustifyStart, AlignVerticalJustifyCenter, AlignVerticalJustifyEnd } from 'lucide-react';
import { GlassRadioGroup } from '../../ui/glass-radio-group';
import { MobileFontTabProps } from './types';

const TEXT_COLORS = ['#ffffff', '#f3f4f6', '#e5e7eb', '#d1d5db', '#9ca3af', '#6b7280', '#4b5563', '#374151', '#1f2937', '#111827', '#000000', '#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6'];

const selectClass = "appearance-none bg-[var(--surface-elevated)] border border-[var(--border-default)] text-[10px] text-gray-200 rounded px-1 py-0.5 pr-4 truncate w-full min-w-0 focus:outline-none focus:border-blue-500";

export const MobileFontTab: React.FC<MobileFontTabProps> = ({
  template,
  onUpdateTemplate,
  availableFonts,
  fontPairs,
  selectedFontPairId,
  setSelectedFontPairId,
  applyFontPair,
  openTextColorPicker,
  setOpenTextColorPicker,
}) => {
  const handleResetFonts = () => {
    onUpdateTemplate({
      ...template,
      titleFont: 'Inter',
      subtitleFont: 'Inter',
      detailsFont: 'Inter',
      titleFontSize: 12,
      subtitleFontSize: 10,
      detailsFontSize: 10,
      titleBold: true,
      titleItalic: false,
      subtitleBold: true,
      subtitleItalic: false,
      detailsBold: false,
      detailsItalic: false,
    });
    setSelectedFontPairId('none');
  };

  const handleResetColors = () => {
    onUpdateTemplate({
      ...template,
      titleTextColor: undefined,
      subtitleTextColor: undefined,
      detailsTextColor: undefined,
    });
  };

  const fontRows: {
    label: string;
    fontKey: 'titleFont' | 'subtitleFont' | 'detailsFont';
    sizeKey: 'titleFontSize' | 'subtitleFontSize' | 'detailsFontSize';
    boldKey: 'titleBold' | 'subtitleBold' | 'detailsBold';
    italicKey: 'titleItalic' | 'subtitleItalic' | 'detailsItalic';
  }[] = [
    { label: 'Title', fontKey: 'titleFont', sizeKey: 'titleFontSize', boldKey: 'titleBold', italicKey: 'titleItalic' },
    { label: 'Type', fontKey: 'subtitleFont', sizeKey: 'subtitleFontSize', boldKey: 'subtitleBold', italicKey: 'subtitleItalic' },
    { label: 'Details', fontKey: 'detailsFont', sizeKey: 'detailsFontSize', boldKey: 'detailsBold', italicKey: 'detailsItalic' },
  ];

  return (
    <div className="space-y-2">
      {/* Font Presets + Alignment — single row */}
      <div className="flex items-center gap-1.5">
        <div className="relative flex-1 min-w-0">
          <select
            value={selectedFontPairId}
            onChange={(e) => applyFontPair(e.target.value)}
            className={selectClass}
            style={{ fontFamily: fontPairs.find(p => p.id === selectedFontPairId)?.titleFont || 'Inter' }}
          >
            {fontPairs.map((pair) => (
              <option key={pair.id} value={pair.id}>{pair.name}</option>
            ))}
          </select>
          <div className="absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 text-[8px]">▼</div>
        </div>
        <GlassRadioGroup
          name="mobile-text-align-h"
          options={[
            { id: 'left', label: <AlignLeft size={10} />, value: 'left' as const },
            { id: 'center', label: <AlignCenter size={10} />, value: 'center' as const },
            { id: 'right', label: <AlignRight size={10} />, value: 'right' as const },
          ]}
          value={template.textAlignHorizontal}
          onChange={(val) => onUpdateTemplate({ ...template, textAlignHorizontal: val })}
          compact
        />
        <GlassRadioGroup
          name="mobile-text-align-v"
          options={[
            { id: 'top', label: <AlignVerticalJustifyStart size={10} />, value: 'top' as const },
            { id: 'center', label: <AlignVerticalJustifyCenter size={10} />, value: 'center' as const },
            { id: 'bottom', label: <AlignVerticalJustifyEnd size={10} />, value: 'bottom' as const },
          ]}
          value={template.textAlignVertical}
          onChange={(val) => onUpdateTemplate({ ...template, textAlignVertical: val })}
          compact
        />
      </div>

      {/* Per-level Font Controls */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <label className="text-[10px] font-medium" style={{ color: 'var(--text-muted)' }}>Fonts</label>
          <button onClick={handleResetFonts} className="inline-btn text-[10px] transition-colors hover:opacity-80" style={{ color: 'var(--text-muted)' }}>
            Reset
          </button>
        </div>

        {fontRows.map((row) => (
          <div key={row.label} className="flex items-center gap-0.5" style={{ height: 22 }}>
            <span className="text-[9px] w-7 shrink-0" style={{ color: 'var(--text-muted)' }}>{row.label}</span>
            <div className="relative min-w-0" style={{ flex: '1 1 0', maxWidth: 120 }}>
              <select
                value={template[row.fontKey]}
                onChange={(e) => {
                  onUpdateTemplate({ ...template, [row.fontKey]: e.target.value });
                  setSelectedFontPairId('none');
                }}
                className={selectClass}
                style={{ fontFamily: template[row.fontKey], fontWeight: template[row.boldKey] ? 700 : 400, fontStyle: template[row.italicKey] ? 'italic' : 'normal' }}
              >
                {availableFonts.map((f: string) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
              <div className="absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 text-[8px]">▼</div>
            </div>
            <button
              onClick={() => onUpdateTemplate({ ...template, [row.sizeKey]: Math.max(6, template[row.sizeKey] - 1) })}
              className="inline-btn flex items-center justify-center rounded border border-[var(--border-default)] text-[7px] transition-colors shrink-0 p-0"
              style={{ width: 20, height: 20, color: 'var(--text-muted)' }}
            >
              −
            </button>
            <span className="text-center text-[9px] tabular-nums shrink-0" style={{ width: 12, color: 'var(--text-primary)' }}>
              {template[row.sizeKey]}
            </span>
            <button
              onClick={() => onUpdateTemplate({ ...template, [row.sizeKey]: Math.min(24, template[row.sizeKey] + 1) })}
              className="inline-btn flex items-center justify-center rounded border border-[var(--border-default)] text-[7px] transition-colors shrink-0 p-0"
              style={{ width: 20, height: 20, color: 'var(--text-muted)' }}
            >
              +
            </button>
            <button
              onClick={() => onUpdateTemplate({ ...template, [row.boldKey]: !template[row.boldKey] })}
              className={`inline-btn shrink-0 rounded leading-none font-bold ${template[row.boldKey] ? 'btn-accent' : ''}`}
              style={{ height: 20, padding: '0 6px', fontSize: 8, boxShadow: 'none', transform: 'none', ...(!template[row.boldKey] ? { background: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--border-default)' } : {}) }}
            >
              Bold
            </button>
            <button
              onClick={() => onUpdateTemplate({ ...template, [row.italicKey]: !template[row.italicKey] })}
              className={`inline-btn shrink-0 rounded leading-none italic ${template[row.italicKey] ? 'btn-accent' : ''}`}
              style={{ height: 20, padding: '0 6px', fontSize: 8, boxShadow: 'none', transform: 'none', ...(!template[row.italicKey] ? { background: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--border-default)' } : {}) }}
            >
              Italic
            </button>
          </div>
        ))}
      </div>

      {/* Text Colors */}
      <div className="space-y-0.5 pt-1 border-t border-[var(--border-muted)]">
        <div className="flex items-center justify-between">
          <label className="text-[9px] font-medium" style={{ color: 'var(--text-muted)' }}>Text Colors</label>
          <button onClick={handleResetColors} className="inline-btn text-[9px] transition-colors hover:opacity-80" style={{ color: 'var(--text-muted)' }}>
            Reset
          </button>
        </div>

        <div className="flex items-center gap-2 rounded-md card-section-themed px-2 py-0.5" data-color-picker>
          {([
            { label: 'Title', key: 'title', colorKey: 'titleTextColor' as const },
            { label: 'Type', key: 'subtitle', colorKey: 'subtitleTextColor' as const },
            { label: 'Details', key: 'details', colorKey: 'detailsTextColor' as const },
          ] as const).map(({ label, key, colorKey }) => (
            <div key={key} className="flex items-center gap-0.5">
              <span className="text-[8px]" style={{ color: 'var(--text-muted)' }}>{label}</span>
              <button
                onClick={() => setOpenTextColorPicker(openTextColorPicker === key ? null : key)}
                className="inline-btn rounded transition-colors"
                style={{ width: 20, height: 20, border: openTextColorPicker === key ? '2px solid #60a5fa' : '1px solid var(--border-default)', backgroundColor: template[colorKey] || (template.themeVariant === 'dark' ? '#ffffff' : '#1f2937') }}
              />
            </div>
          ))}
        </div>

        {openTextColorPicker && (
          <div className="relative" data-color-picker>
            <div className="border rounded-md input-themed shadow-xl p-1">
              <div className="text-[9px] mb-1" style={{ color: 'var(--text-muted)' }}>
                {openTextColorPicker === 'title' ? 'Title Color' : openTextColorPicker === 'subtitle' ? 'Type Color' : 'Details Color'}
              </div>
              <div className="flex flex-wrap gap-px">
                {TEXT_COLORS.map((color) => {
                  const currentColor = openTextColorPicker === 'title' ? template.titleTextColor : openTextColorPicker === 'subtitle' ? template.subtitleTextColor : template.detailsTextColor;
                  const isSelected = currentColor === color;
                  return (
                    <button
                      key={color}
                      onClick={() => {
                        if (openTextColorPicker === 'title') {
                          onUpdateTemplate({ ...template, titleTextColor: color });
                        } else if (openTextColorPicker === 'subtitle') {
                          onUpdateTemplate({ ...template, subtitleTextColor: color });
                        } else {
                          onUpdateTemplate({ ...template, detailsTextColor: color });
                        }
                        setOpenTextColorPicker(null);
                      }}
                      className="inline-btn rounded-sm transition-all"
                      style={{ backgroundColor: color, width: 20, height: 20, border: isSelected ? '1.5px solid #60a5fa' : '0.5px solid var(--border-default)' }}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
