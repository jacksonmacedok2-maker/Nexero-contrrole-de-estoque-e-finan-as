
import { GoogleGenAI, Modality } from "@google/genai";

// Fix: Initialize GoogleGenAI correctly with apiKey property and remove fallback to ensure it uses the environment variable exclusively.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

export const geminiService = {
  async getSalesInsights(stats: any) {
    const prompt = `Analise os seguintes dados de vendas de hoje para uma pequena empresa:
    Vendas do dia: R$ ${stats.dailySales}
    Receita mensal: R$ ${stats.monthlyRevenue}
    Pedidos pendentes: ${stats.pendingOrders}
    Produtos sem estoque: ${stats.outOfStockItems}
    
    Forneça uma análise curta e profissional em português (máximo 3 frases) sugerindo uma ação imediata.`;

    try {
      const response = await ai.models.generateContent({
        // Fix: Use the recommended gemini-3-flash-preview model for simple summarization/Q&A tasks.
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });
      // Fix: Access .text property directly (not as a method).
      return response.text;
    } catch (error) {
      console.error("Erro ao obter insights:", error);
      return "Não foi possível gerar insights no momento.";
    }
  },

  async speakInsight(text: string) {
    try {
      const response = await ai.models.generateContent({
        // Fix: Use the correct model for text-to-speech tasks.
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: `Diga de forma profissional e encorajadora: ${text}` }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Kore' },
            },
          },
        },
      });

      // Fix: Correct path to audio data in candidates response.
      const audioBase64 = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (!audioBase64) return;

      const outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      const audioBuffer = await decodeAudioData(
        decode(audioBase64),
        outputAudioContext,
        24000,
        1,
      );
      
      const source = outputAudioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(outputAudioContext.destination);
      source.start();
    } catch (error) {
      console.error("Erro no TTS:", error);
    }
  }
};
