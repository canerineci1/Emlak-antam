export interface WhisperConfig {
  apiKey: string;
  provider: 'OPENAI' | 'GROQ';
}

let activeWhisperKey: string = '';

export function setWhisperApiKey(key: string) {
  activeWhisperKey = key.trim();
}

export function getWhisperApiKey(): string {
  return activeWhisperKey;
}

export async function transcribeAudioFile(fileUri: string): Promise<string> {
  const key = activeWhisperKey;
  if (!key) {
    throw new Error('WHISPER_KEY_MISSING');
  }

  const isGroq = key.startsWith('gsk_');
  const endpoint = isGroq
    ? 'https://api.groq.com/openai/v1/audio/transcriptions'
    : 'https://api.openai.com/v1/audio/transcriptions';

  const model = isGroq ? 'whisper-large-v3' : 'whisper-1';

  const formData = new FormData();
  formData.append('file', {
    uri: fileUri,
    type: 'audio/m4a',
    name: 'audio.m4a',
  } as any);
  formData.append('model', model);
  formData.append('language', 'tr');

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${key}`,
    },
    body: formData,
  });

  const data = await response.json();
  if (data.text) {
    return data.text.trim();
  }

  if (data.error && data.error.message) {
    throw new Error(data.error.message);
  }

  throw new Error('Ses metne dönüştürülemedi.');
}
