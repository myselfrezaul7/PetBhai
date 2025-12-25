// This service now delegates all AI operations to the backend API
// to protect API keys and centralize logic.

const API_URL = import.meta.env.VITE_API_URL || '/api';

export const isAiConfigured = (): boolean => {
  // In the full-stack architecture, we assume the backend is configured.
  // You could add a health check here if needed, but for now we'll assume it's ready.
  return true;
};

export const getVetAssistantResponse = async (prompt: string): Promise<string> => {
  if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
    return 'Please provide a question for me to answer.';
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

  try {
    const response = await fetch(`${API_URL}/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: prompt.trim() }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      let errorMessage = 'Failed to get response from AI service';
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
      } catch {
        // Response body might not be JSON
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return (
      data.text || "I received your question but couldn't generate a response. Please try again."
    );
  } catch (error) {
    clearTimeout(timeoutId);
    console.error('Error in getVetAssistantResponse:', error);

    if (error instanceof Error && error.name === 'AbortError') {
      return 'The request took too long. Please try again with a simpler question.';
    }

    return "I'm sorry, but I'm having trouble connecting to my knowledge base right now. Please try again later.";
  }
};

export const generateImageFromPrompt = async (prompt: string): Promise<string> => {
  if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
    throw new Error('Please provide a description for the image.');
  }

  if (prompt.length > 2000) {
    throw new Error('Prompt is too long. Please use 2000 characters or less.');
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout

  try {
    const response = await fetch(`${API_URL}/ai/generate-image`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: prompt.trim() }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      let errorMessage = 'Failed to generate image';
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
      } catch {
        // Response might not be JSON
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    if (!data.imageUrl) {
      throw new Error('No image was generated. Please try a different prompt.');
    }
    return data.imageUrl;
  } catch (error) {
    clearTimeout(timeoutId);
    console.error('Error generating image:', error);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Image generation timed out. Please try again.');
    }
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to generate the image. Please try again later.');
  }
};

export const generateVlogThumbnail = async (
  title: string,
  subject: string,
  mood: string
): Promise<string> => {
  // Validate inputs
  if (!title || typeof title !== 'string' || title.trim().length === 0) {
    throw new Error('Please provide a title for the thumbnail.');
  }
  if (!subject || typeof subject !== 'string' || subject.trim().length === 0) {
    throw new Error('Please provide a subject for the thumbnail.');
  }
  if (!mood || typeof mood !== 'string' || mood.trim().length === 0) {
    throw new Error('Please provide a mood/style for the thumbnail.');
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout

  try {
    const response = await fetch(`${API_URL}/ai/generate-thumbnail`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: title.trim(),
        subject: subject.trim(),
        mood: mood.trim(),
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      let errorMessage = 'Failed to generate thumbnail';
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
      } catch {
        // Response might not be JSON
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    if (!data.imageUrl) {
      throw new Error('No thumbnail was generated. Please try different parameters.');
    }
    return data.imageUrl;
  } catch (error) {
    clearTimeout(timeoutId);
    console.error('Error generating thumbnail:', error);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Thumbnail generation timed out. Please try again.');
    }
    throw error;
  }
};

export const analyzeRescueImage = async (
  imageFile: File
): Promise<{ type: string; condition: string }> => {
  // Validate input
  if (!imageFile || !(imageFile instanceof File)) {
    throw new Error('Invalid image file provided');
  }

  const validImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (!validImageTypes.includes(imageFile.type)) {
    throw new Error('Invalid image format. Please use JPEG, PNG, GIF, or WebP.');
  }

  const maxSize = 10 * 1024 * 1024; // 10MB
  if (imageFile.size > maxSize) {
    throw new Error('Image file is too large. Maximum size is 10MB.');
  }

  try {
    // Convert file to base64
    const base64Data = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          reject(new Error('Failed to read file as data URL'));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read image file'));
      reader.readAsDataURL(imageFile);
    });

    // Remove data url prefix safely
    const commaIndex = base64Data.indexOf(',');
    if (commaIndex === -1) {
      throw new Error('Invalid base64 data format');
    }
    const base64String = base64Data.substring(commaIndex + 1);
    const mimeType = imageFile.type;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout for image analysis

    const response = await fetch(`${API_URL}/ai/analyze-image`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mimeType, data: base64String }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      let errorMessage = 'Failed to analyze image';
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
      } catch {
        // Response might not be JSON
      }
      throw new Error(errorMessage);
    }

    const result = await response.json();
    return {
      type: result.type || 'Unknown',
      condition: result.condition || 'Unable to determine condition',
    };
  } catch (error) {
    console.error('Error analyzing image:', error);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Image analysis timed out. Please try again.');
    }
    throw error;
  }
};
