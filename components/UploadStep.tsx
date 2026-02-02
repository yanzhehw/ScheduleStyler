import React, { useCallback, useState, useEffect } from 'react';
import { Upload, FileImage, Play, PenLine, Check, KeyRound, Lock, AlertTriangle, X, Timer } from 'lucide-react';
import { TextShimmer } from './ui/text-shimmer';
import { ElectricBorder } from './ui/electric-border';

interface UploadStepProps {
  onFileSelect: (file: File, apiKey?: string, activationToken?: string) => void;
  onLoadSample: () => void;
  onLoadMcGillSample: () => void;
  onEnterManually: () => void;
  onMockWaiting?: () => void; // DEV: Mock waiting state for testing
  isProcessing: boolean;
  apiKeyError?: string | null;
  onDismissApiKeyError?: () => void;
  keyMode: 'invite' | 'byok';
  onKeyModeChange: (mode: 'invite' | 'byok') => void;
  appliedApiKey: string | null;
  onAppliedApiKeyChange: (key: string | null) => void;
}

const GEMINI_API_KEY_REGEX = /^AIza[A-Za-z0-9_-]{35}$/;

const EXTRACTION_MESSAGES = [
  "Extracting Course Title",
  "Extracting Course Type",
  "Extracting Times",
  "Extracting Location",
  "Initializing canvas",
];

export const UploadStep: React.FC<UploadStepProps> = ({ onFileSelect, onLoadSample, onLoadMcGillSample, onEnterManually, onMockWaiting, isProcessing, apiKeyError, onDismissApiKeyError, keyMode, onKeyModeChange, appliedApiKey, onAppliedApiKeyChange }) => {
  const [inviteCode, setInviteCode] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [activationToken, setActivationToken] = useState<string | null>(null);
  const [activationError, setActivationError] = useState<string | null>(null);
  const [apiKeyValidationError, setApiKeyValidationError] = useState<string | null>(null);
  const [isActivating, setIsActivating] = useState(false);
  const [messageIndex, setMessageIndex] = useState(0);

  // Cycle through extraction messages every 2.2 seconds
  useEffect(() => {
    if (!isProcessing) {
      setMessageIndex(0);
      return;
    }

    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % EXTRACTION_MESSAGES.length);
    }, 2200);

    return () => clearInterval(interval);
  }, [isProcessing]);

  const isActivated = Boolean(activationToken);
  const isByokMode = keyMode === 'byok';
  const isByokApplied = isByokMode && Boolean(appliedApiKey);
  const isUploadLocked = !isActivated && !isByokApplied && !isProcessing;

  const handleApplyApiKey = useCallback(() => {
    const key = apiKey.trim();
    if (!key) {
      setApiKeyValidationError('Please enter your API key.');
      return;
    }
    if (!GEMINI_API_KEY_REGEX.test(key)) {
      setApiKeyValidationError('Invalid API key format. Please check and try again.');
      return;
    }
    setApiKeyValidationError(null);
    onAppliedApiKeyChange(key);
  }, [apiKey, onAppliedApiKeyChange]);

  const handleRedeem = useCallback(async () => {
    const code = inviteCode.trim();
    if (!code) {
      setActivationError('Please enter your invitation code.');
      return;
    }

    setActivationError(null);
    setIsActivating(true);

    try {
      const response = await fetch('/api/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });

      const data = (await response.json().catch(() => null)) as
        | { activationToken: string }
        | { error: string }
        | null;

      if (!response.ok) {
        setActivationError(
          data && 'error' in data ? data.error : 'Activation failed. Please try again.'
        );
        return;
      }

      if (data && 'activationToken' in data) {
        setActivationToken(data.activationToken);
        setActivationError(null);
      } else {
        setActivationError('Unexpected response from server.');
      }
    } catch (error) {
      setActivationError('Unable to reach server. Please try again.');
    } finally {
      setIsActivating(false);
    }
  }, [inviteCode]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (isUploadLocked || isProcessing) return;
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onFileSelect(
        e.dataTransfer.files[0],
        isByokApplied ? appliedApiKey! : undefined,
        activationToken || undefined
      );
    }
  }, [isProcessing, isUploadLocked, onFileSelect, isByokApplied, appliedApiKey, activationToken]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (isUploadLocked || isProcessing) return;
    if (e.target.files && e.target.files[0]) {
      onFileSelect(
        e.target.files[0],
        isByokApplied ? appliedApiKey! : undefined,
        activationToken || undefined
      );
    }
  }, [isProcessing, isUploadLocked, onFileSelect, isByokApplied, appliedApiKey, activationToken]);

  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[60vh] animate-fade-in">
      <div className="w-full max-w-5xl">
        {/* Upload + Manual options */}
        <div className="grid gap-6 lg:items-stretch lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <div className="flex flex-col gap-4 h-full">
            {isProcessing ? (
              /* Processing state with ElectricBorder */
              <ElectricBorder
                className="h-full min-h-[300px]"
              >
                <div className="p-10 rounded-[22px] text-center bg-[#0f172a] flex-1 flex flex-col items-center justify-center cursor-wait">
                  <div className="space-y-6">
                    <div className="mx-auto w-fit p-5 rounded-full bg-blue-500/20 animate-pulse">
                      <div className="w-10 h-10 border-4 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                    <div className="space-y-3">
                      <h2 className="text-xl font-semibold text-white">Analyzing Schedule...</h2>
                      <div className="h-6 flex items-center justify-center">
                        <TextShimmer
                          duration={1.2}
                          className="text-sm font-medium [--base-color:theme(colors.cyan.400)] [--base-gradient-color:theme(colors.cyan.100)]"
                        >
                          {EXTRACTION_MESSAGES[messageIndex]}
                        </TextShimmer>
                      </div>
                    </div>
                  </div>
                </div>
              </ElectricBorder>
            ) : (
              /* Normal upload state */
              <div
                className={`
                  relative p-10 border-2 border-dashed rounded-3xl text-center transition-all duration-300
                  border-gray-600 hover:border-blue-400 hover:bg-gray-800 bg-gray-900
                  ${isUploadLocked ? 'cursor-not-allowed' : 'cursor-pointer'}
                `}
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
              >
                <input
                  type="file"
                  id="fileUpload"
                  className="hidden"
                  accept="image/*"
                  onChange={handleChange}
                  disabled={isUploadLocked}
                />
                <label
                  htmlFor="fileUpload"
                  className={`flex flex-col items-center gap-5 ${
                    isUploadLocked ? 'cursor-not-allowed' : 'cursor-pointer'
                  }`}
                >
                  <div className={`${isUploadLocked ? 'blur-[1.5px]' : ''} space-y-6`}>
                    <div className="mx-auto w-fit p-5 rounded-full bg-gray-800">
                      <Upload className="w-10 h-10 text-blue-400" />
                    </div>
                    <div className="space-y-2">
                      <h2 className="text-xl font-semibold text-white">Upload Screenshot</h2>
                      <p className="text-gray-400 text-sm">
                        Drag & drop or click to select a PNG/JPG<br />Our AI automatically extracts your schedule from a screenshot.
                      </p>
                    </div>
                  </div>
                </label>

              {isUploadLocked && !isByokMode && (
                <div className="absolute top-3 right-3 flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-700 bg-slate-900/80 text-slate-200 text-xs font-medium max-w-[175px] text-center leading-tight">
                  <Lock className="w-4 h-4 text-slate-300 shrink-0" />
                  <span>Activate your code to unlock AI detection</span>
                </div>
              )}
              {isByokMode && !isByokApplied && (
                <div className="absolute top-3 right-3 flex items-center gap-2 px-3 py-1.5 rounded-full border border-amber-700/50 bg-amber-900/60 text-amber-200 text-xs font-medium">
                  <KeyRound className="w-4 h-4 text-amber-300 shrink-0" />
                  <span>Please apply a valid API key</span>
                </div>
              )}
              {isByokApplied && (
                <div className="absolute top-3 right-3 flex items-center gap-2 px-3 py-1.5 rounded-full border border-blue-700/50 bg-blue-900/60 text-blue-200 text-xs font-medium">
                  <KeyRound className="w-4 h-4 text-blue-300 shrink-0" />
                  <span>Using your personal API key</span>
                </div>
              )}
              </div>
            )}

            {!isProcessing && (
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-4">
                <div className="flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-blue-400" />
                  <div className="flex items-center gap-2 rounded-full border border-slate-700 bg-slate-950/80 p-1 text-xs font-semibold text-slate-300 w-fit">
                    <button
                    type="button"
                    onClick={() => onKeyModeChange('invite')}
                    className={`px-3 py-1 rounded-full transition-colors whitespace-nowrap ${
                      keyMode === 'invite'
                        ? 'bg-slate-800 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Invitation Code
                  </button>
                  <button
                    type="button"
                    onClick={() => onKeyModeChange('byok')}
                    className={`px-3 py-1 rounded-full transition-colors whitespace-nowrap ${
                      keyMode === 'byok'
                        ? 'bg-slate-800 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Your Own Gemini API key
                    </button>
                  </div>
                </div>

                {keyMode === 'invite' ? (
                  <div className="space-y-2">
                    <div className="flex flex-col gap-3 sm:flex-row">
                      <input
                        type="text"
                        value={inviteCode}
                        onChange={(e) => {
                          setInviteCode(e.target.value);
                          if (activationError) setActivationError(null);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleRedeem();
                          }
                        }}
                        placeholder="Enter your invite code"
                        className="flex-1 rounded-xl border border-slate-700 bg-slate-950/70 px-4 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                        disabled={isActivating || isActivated}
                      />
                      <button
                        type="button"
                        onClick={handleRedeem}
                        disabled={isActivating || isActivated}
                        className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${
                          isActivated
                            ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-400/40'
                            : 'bg-blue-600 text-white hover:bg-blue-500'
                        } ${isActivating ? 'opacity-70 cursor-wait' : ''}`}
                      >
                        {isActivated ? (
                          <>
                            <Check className="w-4 h-4" /> Activated
                          </>
                        ) : (
                          'Activate'
                        )}
                      </button>
                    </div>
                    {activationError && (
                      <p className="text-xs text-rose-400">{activationError}</p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex flex-col gap-3 sm:flex-row">
                      <input
                        type="text"
                        value={apiKey}
                        onChange={(e) => {
                          setApiKey(e.target.value);
                          setApiKeyValidationError(null);
                          if (appliedApiKey) {
                            onAppliedApiKeyChange(null);
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleApplyApiKey();
                          }
                        }}
                        placeholder="Paste your Gemini key (Kept Local)"
                        className="flex-1 rounded-xl border border-slate-700 bg-slate-950/70 px-4 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                      />
                      <button
                        type="button"
                        onClick={handleApplyApiKey}
                        disabled={Boolean(appliedApiKey)}
                        className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${
                          appliedApiKey
                            ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-400/40'
                            : 'bg-blue-600 text-white hover:bg-blue-500'
                        }`}
                      >
                        {appliedApiKey ? (
                          <>
                            <Check className="w-4 h-4" /> Applied
                          </>
                        ) : (
                          'Apply'
                        )}
                      </button>
                    </div>
                    {apiKeyValidationError && (
                      <p className="text-xs text-rose-400">{apiKeyValidationError}</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {isProcessing ? (
            /* Inspiration Preview - empty placeholder during processing */
            <div
              id="inspirationPreview"
              className="h-full min-h-[300px] rounded-3xl border-2 border-dashed border-slate-700 bg-slate-900/50"
            >
              {/* Reserved for future inspiration preview content */}
            </div>
          ) : (
            <button
              onClick={onEnterManually}
              className="h-full min-h-[400px] p-10 border-2 border-dashed rounded-3xl text-center transition-all duration-300 border-gray-600 hover:border-emerald-400 hover:bg-gray-800 bg-gray-900 cursor-pointer"
            >
              <div className="flex flex-col items-center gap-5">
                <div className="p-5 rounded-full bg-gray-800">
                  <PenLine className="w-10 h-10 text-emerald-400" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-xl font-semibold text-white">Enter Manually</h2>
                  <p className="text-gray-400 text-sm">
                    Start with an empty schedule and add classes yourself
                  </p>
                </div>
              </div>
            </button>
          )}
        </div>
      </div>

      {/* Feature Pills */}
      {!isProcessing && (
        <div className="flex gap-4 mt-8 text-sm text-gray-500">
          <div className="flex items-center gap-2 px-3 py-1 bg-gray-800/50 rounded-full border border-gray-700">
            <FileImage size={14} /> <span>Smart Extraction</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 bg-gray-800/50 rounded-full border border-gray-700">
            <div className="w-3 h-3 rounded-full bg-gradient-to-r from-pink-500 to-purple-500"></div> <span>Auto Categorization</span>
          </div>
        </div>
      )}

      {/* Try with pre-built buttons */}
      {!isProcessing && (
        <div className="flex gap-3 mt-6">
          <button
            onClick={onLoadSample}
            className="px-4 py-2 text-sm text-gray-400 hover:text-white border border-gray-700 hover:border-gray-500 rounded-lg transition-colors flex items-center gap-2"
          >
            <Play size={14} /> Sample Schedule
          </button>
          <button
            onClick={onLoadMcGillSample}
            className="px-4 py-2 text-sm text-gray-400 hover:text-white border border-gray-700 hover:border-gray-500 rounded-lg transition-colors flex items-center gap-2"
          >
            <Play size={14} /> McGill Schedule
          </button>
          {onMockWaiting && (
            <button
              onClick={onMockWaiting}
              className="px-4 py-2 text-sm text-amber-400 hover:text-amber-300 border border-amber-700/50 hover:border-amber-600 rounded-lg transition-colors flex items-center gap-2 bg-amber-900/20"
            >
              <Timer size={14} /> Mock Waiting
            </button>
          )}
        </div>
      )}

      {/* API Key Error Modal */}
      {apiKeyError && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
            onClick={onDismissApiKeyError}
          />
          <div className="relative z-10 max-w-md w-full mx-4 p-6 rounded-2xl border border-rose-500/30 bg-slate-900/95 shadow-2xl shadow-rose-500/10">
            <button
              onClick={onDismissApiKeyError}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex flex-col items-center text-center gap-4">
              <div className="p-3 rounded-full bg-rose-500/20">
                <AlertTriangle className="w-8 h-8 text-rose-400" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-white">Request Failed</h3>
                <p className="text-sm text-slate-300">{apiKeyError}</p>
              </div>
              <button
                onClick={onDismissApiKeyError}
                className="mt-2 px-6 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
