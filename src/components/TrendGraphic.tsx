import React, { useState, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";

interface TrendGraphicProps {
  trend: 'rising' | 'falling' | 'stable';
  className?: string;
}

const cache: Record<string, string> = {};

export function TrendGraphic({ trend, className = "" }: TrendGraphicProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(cache[trend] || null);
  const [loading, setLoading] = useState(!cache[trend]);

  useEffect(() => {
    if (cache[trend]) {
      setImageUrl(cache[trend]);
      setLoading(false);
      return;
    }

    async function generateImage() {
      try {
        setLoading(true);
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        
        const prompts = {
          rising: "A minimalist, flat-design illustrative graphic of a rising bar chart with a green arrow pointing up, clean lines, professional financial style, isolated on a dark background.",
          falling: "A minimalist, flat-design illustrative graphic of a falling line chart with a red arrow pointing down, clean lines, professional financial style, isolated on a dark background.",
          stable: "A minimalist, flat-design illustrative graphic of a steady, horizontal line chart with a yellow dash, clean lines, professional financial style, isolated on a dark background.",
        };

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash-image',
          contents: {
            parts: [
              {
                text: prompts[trend],
              },
            ],
          },
          config: {
            imageConfig: {
              aspectRatio: "1:1",
            },
          },
        });

        let base64Data = "";
        for (const part of response.candidates?.[0]?.content?.parts || []) {
          if (part.inlineData) {
            base64Data = part.inlineData.data;
            break;
          }
        }

        if (base64Data) {
          const url = `data:image/png;base64,${base64Data}`;
          cache[trend] = url;
          setImageUrl(url);
        }
      } catch (error) {
        console.error("Error generating trend graphic:", error);
      } finally {
        setLoading(false);
      }
    }

    generateImage();
  }, [trend]);

  if (loading) {
    return (
      <div className={`animate-pulse bg-gray-800 rounded-lg ${className}`} style={{ width: '48px', height: '48px' }} />
    );
  }

  if (!imageUrl) return null;

  return (
    <img
      src={imageUrl}
      alt={`${trend} trend`}
      className={`rounded-lg object-contain ${className}`}
      style={{ width: '48px', height: '48px' }}
      referrerPolicy="no-referrer"
    />
  );
}
