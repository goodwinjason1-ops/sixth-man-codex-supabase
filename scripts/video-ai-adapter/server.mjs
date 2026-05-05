import {
  isAuthorized,
  jsonResponse,
  normalizePort
} from './analyzer.mjs';
import {
  createFfmpegFrameSamplerFromEnv,
  createRoboflowHostedDetectorFromEnv,
  runInferenceForJob
} from './inference-worker.mjs';

const port = normalizePort(process.env.VIDEO_AI_ADAPTER_PORT);
const token = process.env.VIDEO_AI_ADAPTER_TOKEN || '';
const adapterName = process.env.VIDEO_AI_ADAPTER_NAME || 'open-source-shot-mvp';
const modelName = process.env.VIDEO_AI_ADAPTER_MODEL || 'deterministic-adapter-smoke';
const allowSmokeFallback = process.env.VIDEO_AI_ALLOW_SMOKE_FALLBACK !== 'false';
const frameDetector = createRoboflowHostedDetectorFromEnv();
const frameSampler = createFfmpegFrameSamplerFromEnv();
const maxFrames = Number(process.env.VIDEO_AI_MAX_FRAMES || 12);

const nodeServer = await import('node:http');

const readJsonBody = (request) => new Promise((resolve, reject) => {
  let body = '';
  request.on('data', (chunk) => {
    body += chunk;
    if (body.length > 1_000_000) {
      reject(new Error('Request body too large.'));
      request.destroy();
    }
  });
  request.on('end', () => {
    if (!body.trim()) {
      resolve({});
      return;
    }
    try {
      resolve(JSON.parse(body));
    } catch {
      reject(new Error('Invalid JSON body.'));
    }
  });
  request.on('error', reject);
});

const writeResponse = async (response, webResponse) => {
  response.statusCode = webResponse.status;
  for (const [key, value] of webResponse.headers.entries()) {
    response.setHeader(key, value);
  }
  response.end(await webResponse.text());
};

const app = nodeServer.createServer(async (request, response) => {
  const url = new URL(request.url || '/', `http://${request.headers.host || 'localhost'}`);
  const headers = new Headers(request.headers);

  try {
    if (request.method === 'GET' && url.pathname === '/health') {
      await writeResponse(response, jsonResponse({
        ok: true,
        provider: adapterName,
        model: modelName
      }));
      return;
    }

    if (request.method !== 'POST' || url.pathname !== '/analyze') {
      await writeResponse(response, jsonResponse({ error: 'Not found.' }, { status: 404 }));
      return;
    }

    if (!isAuthorized(headers, token)) {
      await writeResponse(response, jsonResponse({ error: 'Unauthorized.' }, { status: 401 }));
      return;
    }

    const payload = await readJsonBody(request);
    const result = await runInferenceForJob(payload, {
      adapterName,
      modelName,
      allowSmokeFallback,
      frameDetector,
      frameSampler,
      maxFrames
    });
    await writeResponse(response, jsonResponse(result));
  } catch (error) {
    await writeResponse(response, jsonResponse({
      error: error instanceof Error ? error.message : 'Video AI adapter failed.'
    }, { status: 400 }));
  }
});

app.listen(port, () => {
  console.log(`Video AI adapter listening on http://localhost:${port}`);
});
