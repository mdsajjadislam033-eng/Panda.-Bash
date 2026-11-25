import 'dotenv/config';
import express from 'express';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { GoogleGenAI } from '@google/genai';
import { getVoiceScript, VOICE_LINES_MAP, type VoiceLineDef } from './src/data/voiceLines.ts';

const PORT = Number(process.env.PORT) || 3000;
const CACHE_DIR = path.join(os.tmpdir(), 'panda-bash-voice-cache');

const memoryCache = new Map<string, Buffer>();
const inFlight = new Map<string, Promise<Buffer>>();

function ensureCacheDir(): void {
  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  }
}

function getSafeCachePath(cacheKey: string): string {
  const safeName = `${cacheKey.replace(/[^a-z0-9_]/gi, '_')}.wav`;
  const resolved = path.resolve(CACHE_DIR, safeName);
  if (!resolved.startsWith(CACHE_DIR + path.sep)) {
    throw new Error('Invalid cache path');
  }
  return resolved;
}

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured in the server environment.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function wrapPcmAsWav(pcm: Buffer, sampleRate = 24000, channels = 1, bitDepth = 16): Buffer {
  const byteRate = (sampleRate * channels * bitDepth) / 8;
  const blockAlign = (channels * bitDepth) / 8;
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + pcm.length, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(channels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitDepth, 34);
  header.write('data', 36);
  header.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([header, pcm]);
}

async function synthesizeVoiceWav(line: VoiceLineDef, lang: 'bn' | 'en'): Promise<Buffer> {
  const ai = getGeminiClient();
  const { text, style } = getVoiceScript(line, lang);
  const voiceName = line.speaker === 'panda' ? 'Puck' : 'Fenrir';

  let lastErr: unknown;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash-tts',
        contents: [
          {
            role: 'user',
            parts: [
              {
                text,
                speechMetadata: {
                  style,
                },
              },
            ],
          },
        ],
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName },
            },
          },
        },
      });

      const inlinePart = response.candidates?.[0]?.content?.parts?.[0]?.inlineData;
      const base64Audio = inlinePart?.data;
      if (!base64Audio) {
        throw new Error('Empty audio payload returned from Gemini TTS.');
      }

      const rawBytes = Buffer.from(base64Audio, 'base64');
      // Gemini 3.8 unary TTS returns a complete RIFF WAV file; wrap only if raw PCM was returned
      const isRiffWav =
        rawBytes.length >= 12 &&
        rawBytes.subarray(0, 4).toString('ascii') === 'RIFF' &&
        rawBytes.subarray(8, 12).toString('ascii') === 'WAVE';

      return isRiffWav ? rawBytes : wrapPcmAsWav(rawBytes);
    } catch (err) {
      lastErr = err;
      if (attempt === 0) {
        await new Promise((r) => setTimeout(r, 450));
      }
    }
  }

  throw lastErr instanceof Error ? lastErr : new Error('Failed to generate voice audio.');
}

async function getOrGenerateVoice(line: VoiceLineDef, lang: 'bn' | 'en'): Promise<Buffer> {
  const cacheKey = `${lang}_${line.id}`;

  const memHit = memoryCache.get(cacheKey);
  if (memHit) return memHit;

  ensureCacheDir();
  const diskPath = getSafeCachePath(cacheKey);
  if (fs.existsSync(diskPath)) {
    const buf = fs.readFileSync(diskPath);
    if (buf.length > 44) {
      memoryCache.set(cacheKey, buf);
      return buf;
    }
  }

  const pending = inFlight.get(cacheKey);
  if (pending) return pending;

  const task = synthesizeVoiceWav(line, lang)
    .then((wavBuf) => {
      memoryCache.set(cacheKey, wavBuf);
      try {
        ensureCacheDir();
        fs.writeFileSync(diskPath, wavBuf);
      } catch {
        // Non-fatal if disk cache write fails
      }
      return wavBuf;
    })
    .finally(() => {
      inFlight.delete(cacheKey);
    });

  inFlight.set(cacheKey, task);
  return task;
}

async function startServer(): Promise<void> {
  const app = express();

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true });
  });

  app.get('/api/voice/:lang/:lineId', async (req, res) => {
    const { lang, lineId } = req.params;
    if (lang !== 'bn' && lang !== 'en') {
      res.status(400).json({ error: 'Unsupported language parameter.' });
      return;
    }

    const line = VOICE_LINES_MAP.get(lineId);
    if (!line) {
      res.status(404).json({ error: 'Unknown voice line ID.' });
      return;
    }

    try {
      const wavBuffer = await getOrGenerateVoice(line, lang);
      res.setHeader('Content-Type', 'audio/wav');
      res.setHeader('Content-Length', String(wavBuffer.length));
      res.setHeader('Cache-Control', 'public, max-age=86400');
      res.send(wavBuffer);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Voice generation failed.';
      const status =
        msg.includes('GEMINI_API_KEY') || msg.includes('API_KEY')
          ? 503
          : msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED')
          ? 429
          : 500;
      res.status(status).json({ error: msg });
    }
  });

  const httpServer = http.createServer(app);

  const distDir = path.resolve(process.cwd(), 'dist');
  const isProd =
    process.env.NODE_ENV === 'production' ||
    (process.env.npm_lifecycle_event === 'start' && fs.existsSync(path.join(distDir, 'index.html')));

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        allowedHosts: true,
        ws: { server: httpServer },
        hmr: process.env.DISABLE_HMR === 'true' ? false : { server: httpServer },
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`PANDA BASH server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
