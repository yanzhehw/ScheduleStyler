import React, { useState } from 'react';
import { AppStep, CalendarEvent, Category, TemplateConfig, CATEGORY_COLORS } from './types';
import { extractCalendarFromImage } from './services/geminiService';
import { convertFileToBase64 } from './services/imageUtils';
import { SAMPLE_EVENTS, SAMPLE_CATEGORIES, MCGILL_RAW_API_RESPONSE } from './services/sampleData';
import { processRawEvents } from './services/geminiService';
import { UploadStep } from './components/UploadStep';
import { EditStep } from './components/EditStep';
import { ExportStep } from './components/ExportStep';
import { Wand2 } from 'lucide-react';

const DEFAULT_TEMPLATE: TemplateConfig = {
  id: 'default',
  name: 'Modern Clean',
  fontScale: 1,
  showNotes: true,
  compact: false,
  themeFamily: 'default',
  themeVariant: 'dark',
  theme: 'default-dark',
  primaryColor: '#3b82f6',
  borderRadius: '16px',
  showTime: true,
  showLocation: true,
  showGrid: true,
  showClassType: true,
  viewMode: 'desktop',
  aspectRatio: 0.3, // Default: slightly landscape (0 = 16:9, 0.5 = square, 1 = 9:16)
};

const App: React.FC = () => {
  const [step, setStep] = useState<AppStep>(AppStep.UPLOAD);
  const [isProcessing, setIsProcessing] = useState(false);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [template, setTemplate] = useState<TemplateConfig>(DEFAULT_TEMPLATE);

  const handleFileUpload = async (file: File) => {
    setIsProcessing(true);
    setStep(AppStep.PROCESSING); // Technically visual state within UploadStep
    try {
      const base64 = await convertFileToBase64(file);
      const data = await extractCalendarFromImage(base64);
      setEvents(data.events);
      setCategories(data.categories);
      setStep(AppStep.EDIT);
    } catch (error) {
      console.error("Extraction error", error);
      alert("Failed to analyze the image. Please try a clearer screenshot.");
      setStep(AppStep.UPLOAD);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLoadSample = () => {
    setEvents([...SAMPLE_EVENTS]);
    setCategories([...SAMPLE_CATEGORIES]);
    setStep(AppStep.EDIT);
  };

  const handleLoadMcGillSample = () => {
    // Process raw API data through the same pipeline as real API calls
    console.log('=== McGill Sample - Raw API Response ===');
    console.log(JSON.stringify(MCGILL_RAW_API_RESPONSE, null, 2));
    
    const processed = processRawEvents(MCGILL_RAW_API_RESPONSE);
    
    console.log('=== McGill Sample - Processed Events ===');
    console.log(JSON.stringify(processed.events, null, 2));
    console.log(`Total: ${processed.events.length} events, ${processed.categories.length} categories`);
    
    setEvents(processed.events);
    setCategories(processed.categories);
    setStep(AppStep.EDIT);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0f172a] text-slate-100 font-sans selection:bg-blue-500/30">
      
      {/* Header */}
      <header className="h-16 border-b border-gray-800 flex items-center justify-between px-8 bg-gray-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-tr from-blue-500 to-purple-500 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Wand2 size={18} className="text-white" />
          </div>
          <span className="font-bold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
            ScheduleStyler
          </span>
        </div>
        
        <div className="flex gap-2">
          {[AppStep.UPLOAD, AppStep.EDIT, AppStep.EXPORT].map((s, idx) => {
             const isActive = step === s;
             const isPast = [AppStep.UPLOAD, AppStep.EDIT, AppStep.EXPORT].indexOf(step) > idx;
             return (
               <div key={s} className="flex items-center gap-2">
                 <div className={`
                    px-3 py-1 rounded-full text-xs font-semibold transition-all
                    ${isActive ? 'bg-blue-600 text-white shadow-md shadow-blue-900/20' : 
                      isPast ? 'bg-gray-800 text-gray-400' : 'text-gray-600'}
                 `}>
                   {idx + 1}. {s.charAt(0) + s.slice(1).toLowerCase()}
                 </div>
                 {idx < 2 && <div className="w-4 h-0.5 bg-gray-800"></div>}
               </div>
             )
          })}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-6 overflow-hidden">
        {step === AppStep.UPLOAD && (
          <UploadStep
            onFileSelect={handleFileUpload}
            onLoadSample={handleLoadSample}
            onLoadMcGillSample={handleLoadMcGillSample}
            isProcessing={isProcessing}
          />
        )}

        {step === AppStep.PROCESSING && (
          <UploadStep
            onFileSelect={() => {}}
            onLoadSample={() => {}}
            onLoadMcGillSample={() => {}}
            isProcessing={true}
          />
        )}

        {step === AppStep.EDIT && (
          <EditStep
            events={events}
            categories={categories}
            template={template}
            onUpdateEvents={setEvents}
            onUpdateTemplate={setTemplate}
            onNext={() => setStep(AppStep.EXPORT)}
            onReupload={() => setStep(AppStep.UPLOAD)}
          />
        )}

        {step === AppStep.EXPORT && (
          <ExportStep 
            events={events}
            template={template}
            onUpdateTemplate={setTemplate}
            onBack={() => setStep(AppStep.EDIT)}
          />
        )}
      </main>
    </div>
  );
};

export default App;