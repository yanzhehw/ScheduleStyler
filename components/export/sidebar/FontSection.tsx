import React from 'react';
import { AlignLeft, AlignCenter, AlignRight, AlignVerticalJustifyStart, AlignVerticalJustifyCenter, AlignVerticalJustifyEnd } from 'lucide-react';
import { ThemedDropdown } from '../../ui/themed-dropdown';
import { GlassRadioGroup } from '../../ui/glass-radio-group';
import { FontSectionProps, FontPairId } from './types';

const TEXT_COLORS = ['#ffffff', '#f3f4f6', '#e5e7eb', '#d1d5db', '#9ca3af', '#6b7280', '#4b5563', '#374151', '#1f2937', '#111827', '#000000', '#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6'];

export const FontSection: React.FC<FontSectionProps> = ({
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

  return (
    <div className="space-y-4">
      {/* Template Font Pairs Dropdown */}
      <div className="space-y-2" data-dropdown>
        <label className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Template Font Pairs</label>
        <ThemedDropdown
          options={fontPairs.map((pair) => ({
            id: pair.id,
            label: pair.name,
            value: pair.id,
          }))}
          value={selectedFontPairId}
          onChange={(pairId) => applyFontPair(pairId as FontPairId)}
          className="w-full"
          renderButton={(opt) => {
            const pair = fontPairs.find(p => p.id === opt?.value);
            return (
              <div className="text-left truncate">
                <span className="text-xs font-medium truncate" style={{ fontFamily: pair?.titleFont || 'Inter', color: 'var(--text-primary)' }}>
                  {pair?.name}
                </span>
                <span className="text-[9px] block truncate" style={{ color: 'var(--text-muted)' }}>{pair?.description}</span>
              </div>
            );
          }}
          renderOption={(opt, isSelected) => {
            const pair = fontPairs.find(p => p.id === opt.value);
            return (
              <>
                <div className="min-w-0 flex-1">
                  <span className="text-xs font-medium" style={{ fontFamily: pair?.titleFont || 'Inter' }}>
                    {pair?.name}
                  </span>
                  <span className="text-[9px] block" style={{ color: 'var(--text-muted)' }}>{pair?.description}</span>
                </div>
                {isSelected && <span className="shrink-0" style={{ color: 'var(--accent-primary)' }}>✓</span>}
              </>
            );
          }}
        />
      </div>

      {/* Text Alignment Controls - Side by side, full width */}
      <div className="space-y-2 pt-3 border-t" style={{ borderColor: 'var(--border-muted)' }}>
        <label className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Text Alignment</label>
        <div className="flex gap-2">
          <GlassRadioGroup
            name="text-align-horizontal"
            options={[
              { id: 'left', label: <AlignLeft size={13} />, value: 'left' as const },
              { id: 'center', label: <AlignCenter size={13} />, value: 'center' as const },
              { id: 'right', label: <AlignRight size={13} />, value: 'right' as const },
            ]}
            value={template.textAlignHorizontal}
            onChange={(val) => onUpdateTemplate({ ...template, textAlignHorizontal: val })}
          />
          <GlassRadioGroup
            name="text-align-vertical"
            options={[
              { id: 'top', label: <AlignVerticalJustifyStart size={13} />, value: 'top' as const },
              { id: 'center', label: <AlignVerticalJustifyCenter size={13} />, value: 'center' as const },
              { id: 'bottom', label: <AlignVerticalJustifyEnd size={13} />, value: 'bottom' as const },
            ]}
            value={template.textAlignVertical}
            onChange={(val) => onUpdateTemplate({ ...template, textAlignVertical: val })}
          />
        </div>
      </div>

      {/* Individual Font Selectors */}
      <div className="space-y-2.5 pt-3 border-t" style={{ borderColor: 'var(--border-muted)' }} data-dropdown>
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Fonts</label>
          <button onClick={handleResetFonts} className="text-[10px] transition-colors hover:opacity-80" style={{ color: 'var(--text-muted)' }}>
            Reset to default
          </button>
        </div>

        {/* Title Font */}
        <FontSelector
          label="Title"
          font={template.titleFont}
          fontSize={template.titleFontSize}
          bold={template.titleBold}
          italic={template.titleItalic}
          availableFonts={availableFonts}
          onFontChange={(font) => {
            onUpdateTemplate({ ...template, titleFont: font });
            setSelectedFontPairId('none');
          }}
          onFontSizeChange={(size) => onUpdateTemplate({ ...template, titleFontSize: size })}
          onBoldToggle={() => onUpdateTemplate({ ...template, titleBold: !template.titleBold })}
          onItalicToggle={() => onUpdateTemplate({ ...template, titleItalic: !template.titleItalic })}
        />

        {/* Subtitle Font */}
        <FontSelector
          label="Type"
          font={template.subtitleFont}
          fontSize={template.subtitleFontSize}
          bold={template.subtitleBold}
          italic={template.subtitleItalic}
          availableFonts={availableFonts}
          onFontChange={(font) => {
            onUpdateTemplate({ ...template, subtitleFont: font });
            setSelectedFontPairId('none');
          }}
          onFontSizeChange={(size) => onUpdateTemplate({ ...template, subtitleFontSize: size })}
          onBoldToggle={() => onUpdateTemplate({ ...template, subtitleBold: !template.subtitleBold })}
          onItalicToggle={() => onUpdateTemplate({ ...template, subtitleItalic: !template.subtitleItalic })}
        />

        {/* Details Font */}
        <FontSelector
          label="Details"
          font={template.detailsFont}
          fontSize={template.detailsFontSize}
          bold={template.detailsBold}
          italic={template.detailsItalic}
          availableFonts={availableFonts}
          onFontChange={(font) => {
            onUpdateTemplate({ ...template, detailsFont: font });
            setSelectedFontPairId('none');
          }}
          onFontSizeChange={(size) => onUpdateTemplate({ ...template, detailsFontSize: size })}
          onBoldToggle={() => onUpdateTemplate({ ...template, detailsBold: !template.detailsBold })}
          onItalicToggle={() => onUpdateTemplate({ ...template, detailsItalic: !template.detailsItalic })}
        />
      </div>

      {/* Text Colors Section */}
      <div className="space-y-2 pt-3 border-t" style={{ borderColor: 'var(--border-muted)' }}>
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Text Colors</label>
          <button onClick={handleResetColors} className="text-[10px] transition-colors hover:opacity-80" style={{ color: 'var(--text-muted)' }}>
            Reset to default
          </button>
        </div>

        {/* Color buttons row */}
        <div className="flex items-center gap-2 rounded-lg card-section-themed p-2" data-color-picker>
          <ColorButton
            label="Title"
            color={template.titleTextColor || (template.themeVariant === 'dark' ? '#ffffff' : '#1f2937')}
            isActive={openTextColorPicker === 'title'}
            onClick={() => setOpenTextColorPicker(openTextColorPicker === 'title' ? null : 'title')}
          />
          <ColorButton
            label="Type"
            color={template.subtitleTextColor || (template.themeVariant === 'dark' ? '#e5e7eb' : '#1f2937')}
            isActive={openTextColorPicker === 'subtitle'}
            onClick={() => setOpenTextColorPicker(openTextColorPicker === 'subtitle' ? null : 'subtitle')}
          />
          <ColorButton
            label="Details"
            color={template.detailsTextColor || (template.themeVariant === 'dark' ? '#d1d5db' : '#374151')}
            isActive={openTextColorPicker === 'details'}
            onClick={() => setOpenTextColorPicker(openTextColorPicker === 'details' ? null : 'details')}
          />
        </div>

        {/* Color picker callout */}
        {openTextColorPicker && (
          <div className="relative" data-color-picker>
            <div className="border rounded-lg input-themed shadow-xl p-3">
              <div className="text-[10px] mb-2" style={{ color: 'var(--text-muted)' }}>
                {openTextColorPicker === 'title' ? 'Title Color' : openTextColorPicker === 'subtitle' ? 'Type Color' : 'Details Color'}
              </div>
              <div className="grid grid-cols-8 gap-1.5">
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
                      className={`w-5 h-5 rounded border-2 transition-all hover:scale-110 ${isSelected ? 'border-blue-400 scale-110 ring-2 ring-blue-400/50' : 'border-[var(--border-default)] hover:border-[var(--text-muted)]'}`}
                      style={{ backgroundColor: color }}
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

// Sub-components for cleaner code
interface FontSelectorProps {
  label: string;
  font: string;
  fontSize: number;
  bold: boolean;
  italic: boolean;
  availableFonts: string[];
  onFontChange: (font: string) => void;
  onFontSizeChange: (size: number) => void;
  onBoldToggle: () => void;
  onItalicToggle: () => void;
}

const FontSelector: React.FC<FontSelectorProps> = ({
  label,
  font,
  fontSize,
  bold,
  italic,
  availableFonts,
  onFontChange,
  onFontSizeChange,
  onBoldToggle,
  onItalicToggle,
}) => (
  <div className="space-y-1.5">
    {/* Row 1: Label + B/I buttons */}
    <div className="flex items-center justify-between">
      <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{label}</span>
      <div className="flex items-center gap-1">
        <button
          onClick={onBoldToggle}
          className={`px-1.5 py-0.5 text-[10px] font-bold rounded transition-colors ${bold ? 'btn-accent text-white' : 'border border-[var(--border-default)] hover:opacity-80'}`}
          style={{ color: bold ? undefined : 'var(--text-muted)' }}
          title="Bold"
        >
          BOLD
        </button>
        <button
          onClick={onItalicToggle}
          className={`px-1.5 py-0.5 text-[10px] italic rounded transition-colors ${italic ? 'btn-accent text-white' : 'border border-[var(--border-default)] hover:opacity-80'}`}
          style={{ color: italic ? undefined : 'var(--text-muted)' }}
          title="Italic"
        >
          ITALIC
        </button>
      </div>
    </div>
    {/* Row 2: Font dropdown + size input */}
    <div className="flex items-center gap-2">
      <ThemedDropdown
        options={availableFonts.map((f: string) => ({ id: f, label: f, value: f }))}
        value={font}
        onChange={onFontChange}
        className="flex-1 min-w-0"
        renderButton={(opt) => (
          <span
            className="truncate text-sm pr-1"
            style={{ fontFamily: opt?.value, fontWeight: bold ? 700 : 400, fontStyle: italic ? 'italic' : 'normal' }}
          >
            {opt?.label || 'Select'}
          </span>
        )}
        optionStyle={(opt) => ({ fontFamily: opt.value })}
      />
      {/* Font size input with custom themed spinners */}
      <div className="relative flex items-center shrink-0 group/spinner">
        <input
          type="number"
          value={fontSize}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => onFontSizeChange(Math.max(6, Math.min(24, parseInt(e.target.value) || 10)))}
          className="w-[52px] h-8 px-1.5 pr-5 border rounded-md input-themed text-xs text-center font-size-input tabular-nums"
          style={{ color: 'var(--text-primary)' }}
          min={6}
          max={24}
          title="Font size (px)"
        />
        {/* Custom spinner buttons - sleek design */}
        <div className="absolute right-[1px] top-[1px] bottom-[1px] flex flex-col w-4 rounded-r-[5px] overflow-hidden opacity-60 group-hover/spinner:opacity-100 transition-opacity">
          <button
            type="button"
            onClick={() => onFontSizeChange(Math.min(24, fontSize + 1))}
            className="flex-1 flex items-center justify-center transition-all duration-150 hover:bg-[var(--surface-elevated)] active:bg-[var(--accent-primary)]"
            style={{ color: 'var(--text-muted)' }}
            onMouseDown={(e) => e.preventDefault()}
          >
            <svg width="6" height="4" viewBox="0 0 6 4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1 3L3 1L5 3" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => onFontSizeChange(Math.max(6, fontSize - 1))}
            className="flex-1 flex items-center justify-center transition-all duration-150 hover:bg-[var(--surface-elevated)] active:bg-[var(--accent-primary)]"
            style={{ color: 'var(--text-muted)' }}
            onMouseDown={(e) => e.preventDefault()}
          >
            <svg width="6" height="4" viewBox="0 0 6 4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1 1L3 3L5 1" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  </div>
);

interface ColorButtonProps {
  label: string;
  color: string;
  isActive: boolean;
  onClick: () => void;
}

const ColorButton: React.FC<ColorButtonProps> = ({ label, color, isActive, onClick }) => (
  <div className="flex-1 flex flex-col items-center gap-1">
    <span className="text-[9px]" style={{ color: 'var(--text-muted)' }}>{label}</span>
    <button
      onClick={onClick}
      className={`w-6 h-6 rounded-md border-2 transition-colors shadow-sm ${isActive ? 'border-blue-400' : 'border-[var(--border-default)] hover:border-[var(--text-muted)]'}`}
      style={{ backgroundColor: color }}
    />
  </div>
);
