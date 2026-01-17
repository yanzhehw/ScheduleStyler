import { GoogleGenAI, Type } from "@google/genai";
import { CalendarEvent, Category, CATEGORY_COLORS, ClassType } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const SYSTEM_INSTRUCTION = `
You are an expert OCR and course schedule extraction assistant. 
Your goal is to extract university class schedules from a screenshot.
Analyze the image layout carefully.
- Columns usually represent days (Monday to Sunday).
- Rows represent time.
- Extract the **Course Code** (e.g., "MATH 101", "CS 202", "BIOL 100") as the 'title'.
- Identify the **Class Type** (Lecture, Tutorial, Lab, Seminar). 
  - Look for keywords like "Lec", "Tut", "Lab".
  - If a section number is present (e.g., L01, T02), infer the type (L=Lecture, T=Tutorial).
  - If unsure, use "Lecture" as default or "Custom".
- Extract **Metadata** into a list. This includes:
  - CRN (Course Registration Number, usually a 4-5 digit number like "2082").
  - Duration/Frequency strings (e.g., "2 times 1.5 hrs/wk").
  - Instructor names if visible.
- Extract **Location** (Room numbers, Building names, Addresses). Note that the address is often the last line.
- If the exact time is not written, ESTIMATE it based on position.
- Return strictly structured JSON.
`;

export async function extractCalendarFromImage(base64Image: string): Promise<{ events: CalendarEvent[]; categories: Category[] }> {
  try {
    const model = "gemini-3-flash-preview";

    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/png",
              data: base64Image,
            },
          },
          {
            text: "Extract all class events from this schedule image. Separate Course Code, Class Type, and Metadata. If the course type is not clear, use 'Unknown'.",
          },
        ],
      },
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            events: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  courseCode: { type: Type.STRING, description: "The course identifier, e.g. CS 101" },
                  classType: { type: Type.STRING, enum: ["Unknown", "Lecture", "Tutorial", "Lab", "Seminar", "Custom"] },
                  customClassType: { type: Type.STRING },
                  startTime: { type: Type.STRING, description: "HH:MM 24h" },
                  endTime: { type: Type.STRING, description: "HH:MM 24h" },
                  dayIndex: { type: Type.INTEGER },
                  location: { type: Type.STRING },
                  metadata: { type: Type.ARRAY, items: { type: Type.STRING }, description: "CRN, frequency, extra info" },
                  isConfidenceLow: { type: Type.BOOLEAN },
                },
                required: ["courseCode", "startTime", "endTime", "dayIndex"],
              },
            },
          },
        },
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response from Gemini");

    const data = JSON.parse(text) as { events: any[] };
    
    // Log raw API response
    console.log('=== Gemini API Raw Response ===');
    console.log(JSON.stringify(data, null, 2));
    
    // Process using shared function
    const result = processRawEvents(data);
    
    // Log processed events
    console.log('=== Processed Events ===');
    console.log(JSON.stringify(result.events, null, 2));
    console.log(`Total: ${result.events.length} events, ${result.categories.length} categories`);

    return result;

  } catch (error) {
    console.error("Extraction failed:", error);
    throw error;
  }
}

function normalizeTime(time: string): string {
  if (!time) return "09:00";
  const parts = time.split(":");
  if (parts.length === 2) {
    let h = parseInt(parts[0]);
    let m = parseInt(parts[1]);
    if (isNaN(h)) h = 9;
    if (isNaN(m)) m = 0;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  }
  return "09:00";
}

// Export processing function for reuse with sample data
export function processRawEvents(rawData: { events: any[] }): { events: CalendarEvent[]; categories: Category[] } {
  const processedEvents: CalendarEvent[] = rawData.events.map((e, index) => {
    // Default class type logic
    let cType: ClassType = e.classType || 'Unknown';
    let eDisplayTitle: string;
    let eClassSection: string | undefined;
    
    if (!['Lecture', 'Tutorial', 'Lab', 'Seminar', 'Unknown'].includes(cType)) {
      cType = 'Custom';
    }
    
    if (cType === 'Unknown' && e.courseCode.includes("-")) {
      [eDisplayTitle, eClassSection] = e.courseCode.split("-").map((element: string) => element.trim());
    } else {
      const parts = e.courseCode.split("-");
      eDisplayTitle = parts[0].trim();
      eClassSection = parts.length > 1 ? parts[1].trim() : undefined;
    }

    return {
      id: `evt-${Date.now()}-${index}`,
      title: e.courseCode || "Untitled Course",
      displayTitle: eDisplayTitle,
      classSection: eClassSection ? Number(eClassSection) : (null as unknown as number),
      classType: cType,
      customClassType: e.customClassType || (cType === 'Custom' ? 'Class' : undefined),
      startTime: normalizeTime(e.startTime),
      endTime: normalizeTime(e.endTime),
      dayIndex: e.dayIndex ?? 0,
      location: e.location || "",
      metadata: e.metadata || [],
      notes: "",
      category: e.courseCode || "General",
      isConfidenceLow: e.isConfidenceLow || false,
    };
  });

  // Generate categories (Courses)
  const uniqueCourses = Array.from(new Set(processedEvents.map(e => e.title)));
  const categories: Category[] = uniqueCourses.map((name, index) => ({
    id: `course-${index}`,
    name: name,
    color: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
    keywords: [name.toLowerCase()],
  }));

  // Assign initial colors
  processedEvents.forEach(e => {
    const cat = categories.find(c => c.name === e.title);
    if (cat) e.color = cat.color;
  });

  return { events: processedEvents, categories };
}
