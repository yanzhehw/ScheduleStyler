# ScheduleStyler

Transform ugly ahh calendar screenshots into good looking Ones.

## Before & After

<table>
<tr>
<td align="center"><strong>Before</strong></td>
<td align="center"><strong>After</strong></td>
</tr>
<tr>
<td><img src="assets/Old_1.png" alt="Original messy calendar" width="400"/></td>
<td><img src="assets/Modern_1.png" alt="Styled modern calendar" width="400"/></td>
</tr>
</table>
<!-- 
<p align="center">
  <img src="assets/Modern_2.png" alt="Alternative styled output" width="600"/>
</p> -->

---

## How It Works

1. **Upload** - Drop in a screenshot of your calendar 
2. **Edit** - Review extracted events and styling options
3. **Export** - Download your styled schedule with selected template
---

## Getting Started

### Prerequisites

- Node.js (v18+)
- A [Google AI Studio](https://aistudio.google.com/) API key

### Installation

```bash

# Install dependencies
npm install

# Set your Gemini API key
echo "GEMINI_API_KEY=your_api_key_here" > .env.local

# Start the development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## License

MIT
