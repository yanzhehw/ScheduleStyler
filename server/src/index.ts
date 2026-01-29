import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from parent directory's .env.local BEFORE other imports
dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });

// Dynamic import to ensure env vars are loaded first
const { default: express } = await import('express');
const { default: cors } = await import('cors');
const { default: backgroundsRouter } = await import('./routes/backgrounds.js');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/backgrounds', backgroundsRouter);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log('R2 Bucket:', process.env.R2_BUCKET_NAME || 'schedule-styler-backgrounds');
});
