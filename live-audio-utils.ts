/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

// Interface matching @google/genai's GenerativeContentBlob
export interface InternalGenerativeContentBlob {
    mimeType: string;
    data: string; // base64 encoded string
}

export function encode(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * Creates an object suitable for Gemini LiveAPI media input.
 * Converts Float32Array PCM data (-1.0 to 1.0) to a base64 encoded Int16 PCM string.
 * Assumes input audio is 16000 Hz.
 * @param data Float32Array of PCM data.
 * @returns An object with mimeType and base64 data string.
 */
export function createAudioBlobForLiveAPI(data: Float32Array): InternalGenerativeContentBlob {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    // Convert float32 from -1 to 1 range to int16 from -32768 to 32767 range
    int16[i] = data[i] * 32768;
    // Clamping might still be a good idea if input can exceed [-1, 1]
    // int16[i] = Math.max(-32768, Math.min(32767, data[i] * 32768));
  }
  const uint8Array = new Uint8Array(int16.buffer);
  const base64Data = encode(uint8Array); // Use the existing encode function

  return {
    mimeType: 'audio/pcm;rate=16000', // Mime type for raw PCM audio data at 16kHz
    data: base64Data
  };
}


/**
 * Decodes audio data (Int16 PCM) from Uint8Array to an AudioBuffer.
 * @param data Uint8Array containing audio data (expected to be Int16 PCM).
 * @param ctx The AudioContext to use for creating the AudioBuffer.
 * @param sampleRate The sample rate of the audio data.
 * @param numChannels The number of channels in the audio data.
 * @returns A Promise that resolves to an AudioBuffer.
 */
export async function decodePCMToAudioBuffer(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  // Ensure the Uint8Array length is even for Int16 conversion
  const byteLength = data.byteLength - (data.byteLength % 2);
  const dataInt16 = new Int16Array(data.buffer, data.byteOffset, byteLength / 2);
  
  const numSamplesPerChannel = dataInt16.length / numChannels;
  
  const buffer = ctx.createBuffer(
    numChannels,
    numSamplesPerChannel,
    sampleRate,
  );

  const dataFloat32 = new Float32Array(dataInt16.length);
  for (let i = 0; i < dataInt16.length; i++) {
    dataFloat32[i] = dataInt16[i] / 32768.0; // Convert Int16 to Float32 (-1.0 to 1.0)
  }
  
  if (numChannels === 1) { // For mono
    buffer.copyToChannel(dataFloat32, 0);
  } else { // For stereo or multi-channel (de-interleave)
    for (let i = 0; i < numChannels; i++) {
      const channelData = new Float32Array(numSamplesPerChannel);
      for (let j = 0; j < numSamplesPerChannel; j++) {
        channelData[j] = dataFloat32[j * numChannels + i];
      }
      buffer.copyToChannel(channelData, i);
    }
  }
  return buffer;
}

// Update the alias createBlob to reflect the new return type of createAudioBlobForLiveAPI
export { createAudioBlobForLiveAPI as createBlob };
export { decodePCMToAudioBuffer as decodeAudioData };
