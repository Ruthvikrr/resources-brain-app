import { pipeline, env } from '@xenova/transformers';

// Very Important for Vercel deployment! Vercel strictly prohibits writing files anywhere except /tmp/
// If we don't set this, the Transformer AI pipeline will violently crash when attempting to download models.
env.cacheDir = '/tmp/.cache';
class EmbeddingPipeline {
  static task = 'feature-extraction';
  static model = 'Xenova/all-MiniLM-L6-v2'; // The exact 384-dimensional architecture our Supabase SQL matches
  static instance: any = null;

  static async getInstance(progress_callback: any = null) {
    if (this.instance === null) {
      // In NodeJS the model is cached automatically in ./cache/
      // @ts-ignore
      this.instance = pipeline(this.task, this.model, { progress_callback });
    }
    return this.instance;
  }
}

/**
 * Turns human-readable text into mathematical 384-dimension Vector coordinates.
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const embedder = await EmbeddingPipeline.getInstance();
    // Generate the embedding tensor (mean pooling creates 1 unified thought structure instead of per-word structures)
    const output = await embedder(text, { pooling: 'mean', normalize: true });
    
    // Supabase pgvector strictly requires a standard JavaScript Array of numbers
    return Array.from(output.data);
  } catch (err) {
    console.error("Embedding Generation Error:", err);
    throw new Error("Failed to generate vector embedding.");
  }
}
