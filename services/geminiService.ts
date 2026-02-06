import { CalendarEvent, Category, CATEGORY_COLORS, ClassType } from "../types";
import { LOG_RESPONSES } from "../config";

/**
 * Extract calendar events from an image via the backend API
 * The API key is securely stored on the server
 */
export async function extractCalendarFromImage(base64Image: string, apiKey?: string): Promise<{ events: CalendarEvent[]; categories: Category[] }> {
  try {
    const response = await fetch('/api/extract', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        base64Image,
        apiKey, // Only sent for BYOK mode
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Extraction failed');
    }

    const data = await response.json() as { events: any[] };

    // Log raw API response
    if (LOG_RESPONSES) {
      console.log('=== Gemini API Raw Response ===');
      console.log(JSON.stringify(data, null, 2));
    }

    // Process using shared function
    const result = processRawEvents(data);

    // Log processed events
    if (LOG_RESPONSES) {
      console.log('=== Processed Events ===');
      console.log(JSON.stringify(result.events, null, 2));
      console.log(`Total: ${result.events.length} events, ${result.categories.length} categories`);
    }

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
