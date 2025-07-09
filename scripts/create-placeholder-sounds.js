#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Create a simple WAV file header for a 1-second silent audio file
function createSilentWav() {
  const sampleRate = 44100;
  const numChannels = 1;
  const bitsPerSample = 16;
  const duration = 1; // 1 second
  const numSamples = sampleRate * duration;
  const dataSize = numSamples * numChannels * (bitsPerSample / 8);
  
  const buffer = Buffer.alloc(44 + dataSize);
  
  // RIFF header
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);
  
  // fmt chunk
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16); // fmt chunk size
  buffer.writeUInt16LE(1, 20); // PCM format
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * numChannels * (bitsPerSample / 8), 28); // byte rate
  buffer.writeUInt16LE(numChannels * (bitsPerSample / 8), 32); // block align
  buffer.writeUInt16LE(bitsPerSample, 34);
  
  // data chunk
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);
  
  // Silent audio data (zeros)
  // Buffer is already filled with zeros
  
  return buffer;
}

// Sound files to create
const soundFiles = [
  'emergency-alert.wav',
  'urgent-beep.wav',
  'critical-alarm.wav',
  'high-priority.wav'
];

// Ensure sounds directory exists
const soundsDir = path.join(__dirname, '..', 'public', 'sounds');
if (!fs.existsSync(soundsDir)) {
  fs.mkdirSync(soundsDir, { recursive: true });
}

// Create placeholder WAV files
soundFiles.forEach(filename => {
  const filepath = path.join(soundsDir, filename);
  if (!fs.existsSync(filepath)) {
    fs.writeFileSync(filepath, createSilentWav());
    console.log(`Created placeholder sound: ${filename}`);
  } else {
    console.log(`Sound already exists: ${filename}`);
  }
});

console.log('Placeholder sound files created successfully!');