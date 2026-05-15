'use server';
/**
 * @fileOverview This file implements a Genkit flow for refining hand-drawn strokes using AI.
 *
 * - refineHandDrawnStrokes - A function that refines a given hand-drawn stroke.
 * - RefineHandDrawnStrokesInput - The input type for the refineHandDrawnStrokes function.
 * - RefineHandDrawnStrokesOutput - The return type for the refineHandDrawnStrokes function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const RefineHandDrawnStrokesInputSchema = z.object({
  points: z.array(z.object({ x: z.number(), y: z.number() })).describe('An array of points representing the hand-drawn stroke.'),
  color: z.string().describe('The color of the stroke.'),
  width: z.number().describe('The width of the stroke.'),
});
export type RefineHandDrawnStrokesInput = z.infer<typeof RefineHandDrawnStrokesInputSchema>;

const RefineHandDrawnStrokesOutputSchema = z.object({
  refinedPoints: z.array(z.object({ x: z.number(), y: z.number() })).describe('An array of points representing the refined stroke.'),
  message: z.string().optional().describe('An optional message explaining the refinement.'),
});
export type RefineHandDrawnStrokesOutput = z.infer<typeof RefineHandDrawnStrokesOutputSchema>;

// Internal schema for the prompt, to pass points as a JSON string
const RefinePromptInputSchema = z.object({
  pointsJson: z.string().describe('A JSON string representing an array of points for the hand-drawn stroke.'),
  color: z.string().describe('The color of the stroke, for context.'),
  width: z.number().describe('The width of the stroke, for context.'),
});

const refineHandDrawnStrokesPrompt = ai.definePrompt({
  name: 'refineHandDrawnStrokesPrompt',
  input: { schema: RefinePromptInputSchema },
  output: { schema: RefineHandDrawnStrokesOutputSchema },
  prompt: `You are an AI assistant specialized in refining hand-drawn vector paths.
Given a series of points representing a hand-drawn stroke, your task is to output a new series of points that represent a more polished, geometrically optimized, or aesthetically smoothed version of the original stroke.
Consider the original color and width for context, but focus on refining the path geometry. The refined path should generally preserve the overall shape and intent of the original drawing while improving its quality.

Original Stroke Points (JSON):
{{{pointsJson}}}

Output your response as a JSON object matching the RefineHandDrawnStrokesOutputSchema. The 'refinedPoints' field should be a JSON array of '{x: number, y: number}' objects. The 'message' field should explain the refinement performed.`,
});

const refineHandDrawnStrokesFlow = ai.defineFlow(
  {
    name: 'refineHandDrawnStrokesFlow',
    inputSchema: RefineHandDrawnStrokesInputSchema,
    outputSchema: RefineHandDrawnStrokesOutputSchema,
  },
  async (input) => {
    const pointsJson = JSON.stringify(input.points);
    const { output } = await refineHandDrawnStrokesPrompt({
      pointsJson: pointsJson,
      color: input.color,
      width: input.width,
    });
    if (!output) {
      throw new Error('AI did not return a valid output for stroke refinement.');
    }
    return output;
  }
);

export async function refineHandDrawnStrokes(input: RefineHandDrawnStrokesInput): Promise<RefineHandDrawnStrokesOutput> {
  return refineHandDrawnStrokesFlow(input);
}
