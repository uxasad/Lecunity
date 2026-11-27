'use client';

import { useState, useEffect } from 'react';

const processingTips = [
  '💡 Tip: Audio files under 10MB process faster and more reliably',
  '🎵 Did you know? We automatically compress large files for better upload stability',
  '⚡ Pro tip: Use 48kbps bitrate for optimal transcription quality',
  '📊 Fun fact: The app transcribes and generates structured notes in one go',
  '🔧 Tip: You can download your notes as a PDF when done',
  '🎯 Best practice: Keep videos under 25 minutes for faster processing',
  '✨ Magic: AI automatically identifies key concepts and action items',
  '🚀 Speed tip: Compress audio before upload: ffmpeg -i input.mp3 -b:a 48k output.mp3',
  '📝 Feature: Your notes include summaries, definitions, and example problems',
  '🔒 Privacy: All processing happens through secure API calls',
];

export function ProcessingTips() {
  const [currentTip, setCurrentTip] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTip((prev) => (prev + 1) % processingTips.length);
    }, 5000); // Change tip every 5 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 text-2xl">💭</div>
        <div className="flex-1">
          <p className="text-sm text-blue-800 transition-all duration-500 animate-fade-in">
            {processingTips[currentTip]}
          </p>
        </div>
      </div>
    </div>
  );
}
