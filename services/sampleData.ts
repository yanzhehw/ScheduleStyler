import { CalendarEvent, Category, CATEGORY_COLORS } from '../types';

// Raw McGill API response for testing processing pipeline
export const MCGILL_RAW_API_RESPONSE = {
  "events": [
    {
      "courseCode": "FACC 400-002",
      "startTime": "08:35",
      "endTime": "09:55",
      "dayIndex": 0,
      "classType": "Lecture",
      "location": "McConnell Engineering Building 304",
      "metadata": [
        "CRN 3318",
        "1 times 1.5 hrs/wk"
      ]
    },
    {
      "courseCode": "ECSE 308-003",
      "startTime": "11:35",
      "endTime": "13:25",
      "dayIndex": 0,
      "classType": "Tutorial",
      "location": "Trottier Building 2110",
      "metadata": [
        "CRN 2637",
        "1 times 2 hrs/wk"
      ]
    },
    {
      "courseCode": "ECSE 427-002",
      "startTime": "15:35",
      "endTime": "17:25",
      "dayIndex": 0,
      "classType": "Tutorial",
      "location": "McConnell Engineering Building 13",
      "metadata": [
        "CRN 2724",
        "1 times 2 hrs/wk"
      ]
    },
    {
      "courseCode": "ECSE 427-001",
      "startTime": "17:35",
      "endTime": "18:25",
      "dayIndex": 0,
      "classType": "Lecture",
      "location": "Adams Building AUD",
      "metadata": [
        "CRN 2723"
      ]
    },
    {
      "courseCode": "ECSE 308-001",
      "startTime": "10:05",
      "endTime": "11:25",
      "dayIndex": 1,
      "classType": "Lecture",
      "location": "Burnside Hall 1B45",
      "metadata": [
        "CRN 2635",
        "2 times 1.5 hrs/wk"
      ]
    },
    {
      "courseCode": "ECSE 437-001",
      "startTime": "13:05",
      "endTime": "14:25",
      "dayIndex": 1,
      "classType": "Lecture",
      "location": "Trottier Building 1080",
      "metadata": [
        "CRN 2731",
        "2 times 1.5 hrs/wk"
      ]
    },
    {
      "courseCode": "ECSE 308-009",
      "startTime": "09:35",
      "endTime": "11:25",
      "dayIndex": 2,
      "classType": "Lab",
      "location": "Trottier Building 4090",
      "metadata": [
        "CRN 8875",
        "2 times 2 hrs/wk"
      ]
    },
    {
      "courseCode": "ECSE 437-002",
      "startTime": "13:35",
      "endTime": "15:25",
      "dayIndex": 2,
      "classType": "Tutorial",
      "location": "Trottier Building 2110",
      "metadata": [
        "CRN 2732",
        "1 times 2 hrs/wk"
      ]
    },
    {
      "courseCode": "ECSE 427-001",
      "startTime": "17:35",
      "endTime": "18:25",
      "dayIndex": 2,
      "classType": "Lecture",
      "location": "Adams Building AUD",
      "metadata": [
        "CRN 2723"
      ]
    },
    {
      "courseCode": "ECSE 308-001",
      "startTime": "10:05",
      "endTime": "11:25",
      "dayIndex": 3,
      "classType": "Lecture",
      "location": "Burnside Hall 1B45",
      "metadata": [
        "CRN 2635",
        "2 times 1.5 hrs/wk"
      ]
    },
    {
      "courseCode": "ECSE 437-001",
      "startTime": "13:05",
      "endTime": "14:25",
      "dayIndex": 3,
      "classType": "Lecture",
      "location": "Trottier Building 1080",
      "metadata": [
        "CRN 2731",
        "2 times 1.5 hrs/wk"
      ]
    },
    {
      "courseCode": "FACC 400-004",
      "startTime": "15:35",
      "endTime": "16:25",
      "dayIndex": 4,
      "classType": "Lecture",
      "location": "Macdonald Harrington Building G-10",
      "metadata": [
        "CRN 3320",
        "1 times 1 hr/wk"
      ]
    },
    {
      "courseCode": "ECSE 427-001",
      "startTime": "17:35",
      "endTime": "18:25",
      "dayIndex": 4,
      "classType": "Lecture",
      "location": "Adams Building AUD",
      "metadata": [
        "CRN 2723"
      ]
    }
  ]
};

// Sample schedule data for testing without calling Gemini API
export const SAMPLE_EVENTS: CalendarEvent[] = [
  // STA130H1 S - Lecture (Monday 10-12)
  {
    id: 'evt-1768605368335-0',
    title: 'STA130H1 S',
    displayTitle: 'STA130H1 S',
    classSection: null as unknown as number,
    classType: 'Lecture',
    startTime: '10:00',
    endTime: '12:00',
    dayIndex: 0, // Monday
    location: 'SS 2135',
    metadata: ['CRN: 12345', '2 hrs/wk'],
    notes: '',
    category: 'STA130H1 S',
    color: CATEGORY_COLORS[0],
    isConfidenceLow: false,
  },
  // MAT223H1 S - Tutorial (Monday 14-15)
  {
    id: 'evt-1768605368335-1',
    title: 'MAT223H1 S',
    displayTitle: 'MAT223H1 S',
    classSection: null as unknown as number,
    classType: 'Tutorial',
    startTime: '14:00',
    endTime: '15:00',
    dayIndex: 0, // Monday
    location: 'BA 1180',
    metadata: ['CRN: 23456'],
    notes: '',
    category: 'MAT223H1 S',
    color: CATEGORY_COLORS[1],
    isConfidenceLow: false,
  },
  // ECO102H1 S - Lecture (Tuesday 9-11)
  {
    id: 'evt-1768605368335-2',
    title: 'ECO102H1 S',
    displayTitle: 'ECO102H1 S',
    classSection: null as unknown as number,
    classType: 'Lecture',
    startTime: '09:00',
    endTime: '11:00',
    dayIndex: 1, // Tuesday
    location: 'CON 310',
    metadata: ['CRN: 34567', '2 hrs/wk'],
    notes: '',
    category: 'ECO102H1 S',
    color: CATEGORY_COLORS[2],
    isConfidenceLow: false,
  },
  // MAT136H1 S - Lecture (Tuesday 13-14)
  {
    id: 'evt-1768605368335-3',
    title: 'MAT136H1 S',
    displayTitle: 'MAT136H1 S',
    classSection: null as unknown as number,
    classType: 'Lecture',
    startTime: '13:00',
    endTime: '14:00',
    dayIndex: 1, // Tuesday
    location: 'CON 350',
    metadata: ['CRN: 45678'],
    notes: '',
    category: 'MAT136H1 S',
    color: CATEGORY_COLORS[3],
    isConfidenceLow: false,
  },
  // LIN204H1 S - Tutorial (Tuesday 15-16)
  {
    id: 'evt-1768605368335-4',
    title: 'LIN204H1 S',
    displayTitle: 'LIN204H1 S',
    classSection: null as unknown as number,
    classType: 'Tutorial',
    startTime: '15:00',
    endTime: '16:00',
    dayIndex: 1, // Tuesday
    location: 'SS 1088',
    metadata: ['CRN: 56789'],
    notes: '',
    category: 'LIN204H1 S',
    color: CATEGORY_COLORS[4],
    isConfidenceLow: false,
  },
  // MAT223H1 S - Lecture (Wednesday 10-11)
  {
    id: 'evt-1768605368336-5',
    title: 'MAT223H1 S',
    displayTitle: 'MAT223H1 S',
    classSection: null as unknown as number,
    classType: 'Lecture',
    startTime: '10:00',
    endTime: '11:00',
    dayIndex: 2, // Wednesday
    location: 'BA 1130',
    metadata: ['CRN: 23456'],
    notes: '',
    category: 'MAT223H1 S',
    color: CATEGORY_COLORS[1],
    isConfidenceLow: false,
  },
  // ECO102H1 S - Tutorial (Wednesday 14-15)
  {
    id: 'evt-1768605368336-6',
    title: 'ECO102H1 S',
    displayTitle: 'ECO102H1 S',
    classSection: null as unknown as number,
    classType: 'Tutorial',
    startTime: '14:00',
    endTime: '15:00',
    dayIndex: 2, // Wednesday
    location: 'WW 120',
    metadata: ['CRN: 34568'],
    notes: '',
    category: 'ECO102H1 S',
    color: CATEGORY_COLORS[2],
    isConfidenceLow: false,
  },
  // MAT136H1 S - Lecture (Thursday 13-14)
  {
    id: 'evt-1768605368336-7',
    title: 'MAT136H1 S',
    displayTitle: 'MAT136H1 S',
    classSection: null as unknown as number,
    classType: 'Lecture',
    startTime: '13:00',
    endTime: '14:00',
    dayIndex: 3, // Thursday
    location: 'CON 350',
    metadata: ['CRN: 45678'],
    notes: '',
    category: 'MAT136H1 S',
    color: CATEGORY_COLORS[3],
    isConfidenceLow: false,
  },
  // LIN204H1 S - Lecture (Thursday 11-13)
  {
    id: 'evt-1768605368336-8',
    title: 'LIN204H1 S',
    displayTitle: 'LIN204H1 S',
    classSection: null as unknown as number,
    classType: 'Lecture',
    startTime: '11:00',
    endTime: '13:00',
    dayIndex: 3, // Thursday
    location: 'SS 2135',
    metadata: ['CRN: 56790', '2 hrs/wk'],
    notes: '',
    category: 'LIN204H1 S',
    color: CATEGORY_COLORS[4],
    isConfidenceLow: false,
  },
  // STA130H1 S - Tutorial (Friday 10-11)
  {
    id: 'evt-1768605368336-9',
    title: 'STA130H1 S',
    displayTitle: 'STA130H1 S',
    classSection: null as unknown as number,
    classType: 'Tutorial',
    startTime: '10:00',
    endTime: '11:00',
    dayIndex: 4, // Friday
    location: 'SS 1084',
    metadata: ['CRN: 12346'],
    notes: '',
    category: 'STA130H1 S',
    color: CATEGORY_COLORS[0],
    isConfidenceLow: false,
  },
  // MAT136H1 S - Tutorial (Friday 14-15)
  {
    id: 'evt-1768605368336-10',
    title: 'MAT136H1 S',
    displayTitle: 'MAT136H1 S',
    classSection: null as unknown as number,
    classType: 'Tutorial',
    startTime: '14:00',
    endTime: '15:00',
    dayIndex: 4, // Friday
    location: 'BA 2175',
    metadata: ['CRN: 45679'],
    notes: '',
    category: 'MAT136H1 S',
    color: CATEGORY_COLORS[3],
    isConfidenceLow: false,
  },
  // MAT223H1 S - Lecture (Friday 10-11)
  {
    id: 'evt-1768605368336-11',
    title: 'MAT223H1 S',
    displayTitle: 'MAT223H1 S',
    classSection: null as unknown as number,
    classType: 'Lecture',
    startTime: '10:00',
    endTime: '11:00',
    dayIndex: 4, // Friday
    location: 'BA 1130',
    metadata: ['CRN: 23456'],
    notes: '',
    category: 'MAT223H1 S',
    color: CATEGORY_COLORS[1],
    isConfidenceLow: false,
  },
];

// Generate categories from sample events
export const SAMPLE_CATEGORIES: Category[] = (() => {
  const uniqueCourses = Array.from(new Set(SAMPLE_EVENTS.map(e => e.title)));
  return uniqueCourses.map((name, index) => ({
    id: `course-${index}`,
    name: name,
    color: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
    keywords: [name.toLowerCase()],
  }));
})();

