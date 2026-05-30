import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class VoiceAnnouncementService {
  announcePatientCall(patientName?: string | number): void {
    const name = String(patientName ?? '').trim();
    if (!name || !('speechSynthesis' in window) || !('SpeechSynthesisUtterance' in window)) {
      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(`Paciente ${name}, pase adelante`);
    utterance.lang = 'es-GT';
    utterance.rate = 0.95;
    utterance.pitch = 1;
    utterance.volume = 1;

    const voices = window.speechSynthesis.getVoices();
    const spanishVoice = voices.find((voice) => voice.lang.toLowerCase().startsWith('es'));
    if (spanishVoice) {
      utterance.voice = spanishVoice;
    }

    window.speechSynthesis.speak(utterance);
  }
}
