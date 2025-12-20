
import React, { useState } from 'react';
import { GoogleGenAI } from "@google/genai";
import { useSegments } from '../../lib/store/segments';
import { useAnalytics } from '../../lib/store/analytics';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Sparkles, Loader2, TerminalSquare } from 'lucide-react';
import Markdown from 'markdown-to-jsx';
import { motion, AnimatePresence } from 'framer-motion';

const MotionDiv = motion.div as any;

export const SystemAnalyst: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const { segments } = useSegments();
  const { sensorHistory } = useAnalytics();

  const runAnalysis = async () => {
    setLoading(true);
    setAnalysis(null);

    try {
      // Fix: Initializing GoogleGenAI with apiKey from process.env.API_KEY as per guidelines.
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const systemState = {
        totalDevices: segments.length,
        devices: segments.map(s => ({
            name: s.name,
            type: s.segType,
            status: s.is_led_on,
            temp: s.temperature,
            humidity: s.humidity,
            inputActive: s.inputActive
        })),
        recentHistory: Object.keys(sensorHistory).length > 0 ? "Sensor data available" : "No recent history"
      };

      const prompt = `
        You are the AI System Administrator for an IoT Dashboard called "Kamyar Pro".
        
        Current System State JSON:
        ${JSON.stringify(systemState)}

        Task:
        1. Summarize the current status of the home/facility professionally.
        2. Identify any anomalies (high temperatures, unexpected logic states).
        3. Suggest an optimization if applicable.
        
        Style: Cyberpunk/Technical, Professional, Brief (under 100 words). Use bullet points.
      `;

      // Fix: Changed model to 'gemini-3-flash-preview' and called generateContent with parameters.
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });

      // Fix: Accessing generated text via the .text property (not a method).
      setAnalysis(response.text || "Analysis complete but returned no text.");
    } catch (e) {
      console.error(e);
      setAnalysis("Error communicating with Neural Core. Protocol failure detected.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-primary/20 bg-black/20 backdrop-blur-sm overflow-hidden mb-8">
      <CardHeader className="bg-gradient-to-r from-primary/10 to-transparent border-b border-primary/10 py-3">
        <CardTitle className="text-sm font-black uppercase tracking-[0.2em] flex items-center gap-2 text-primary">
          <Sparkles size={14} /> AI Neural Diagnostic
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        {/* Fix: Removed API Key selection UI as it is managed externally for standard text tasks. */}
        <div className="flex flex-col gap-4">
          <AnimatePresence mode="wait">
              {analysis && (
                  <MotionDiv 
                      initial={{ opacity: 0, height: 0 }} 
                      animate={{ opacity: 1, height: 'auto' }}
                      className="bg-secondary/5 rounded-lg p-4 border-l-2 border-primary"
                  >
                      <div className="flex items-center gap-2 mb-2 text-primary text-[10px] font-black uppercase tracking-widest">
                          <TerminalSquare size={12} /> Analysis Output
                      </div>
                      <div className="prose prose-invert prose-p:text-sm prose-li:text-sm text-sm text-muted-foreground font-mono leading-relaxed">
                          <Markdown>{analysis}</Markdown>
                      </div>
                  </MotionDiv>
              )}
          </AnimatePresence>
          
          <div className="flex justify-end">
              <Button 
                  onClick={runAnalysis} 
                  disabled={loading}
                  className="gap-2 font-black text-[10px] uppercase tracking-[0.2em] min-w-[140px]"
              >
                  {loading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                  {loading ? "Processing..." : "Run Diagnostics"}
              </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
