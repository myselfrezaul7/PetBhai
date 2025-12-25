// This service now delegates all AI operations to the backend API
// to protect API keys and centralize logic.

export const isAiConfigured = (): boolean => {
  // In the full-stack architecture, we assume the backend is configured.
  // You could add a health check here if needed, but for now we'll assume it's ready.
  return true;
};

export const getVetAssistantResponse = async (prompt: string): Promise<string> => {
  try {
    const response = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to get response from AI service');
    }

    const data = await response.json();
    return data.text;
  } catch (error) {
    console.error('Error in getVetAssistantResponse:', error);
    return "I'm sorry, but I'm having trouble connecting to my knowledge base right now. Please try again later.";
  }
};

export const generateImageFromPrompt = async (prompt: string): Promise<string> => {
  try {
    const response = await fetch('/api/ai/generate-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to generate image');
    }

    const data = await response.json();
    return data.imageUrl;
  } catch (error) {
    console.error('Error generating image:', error);
    throw new Error('Failed to generate the image. Please try again later.');
  }
};

export const generateVlogThumbnail = async (
  title: string,
  subject: string,
  mood: string
): Promise<string> => {
  try {
    const response = await fetch('/api/ai/generate-thumbnail', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, subject, mood }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to generate thumbnail');
    }

    const data = await response.json();
    return data.imageUrl;
  } catch (error) {
    console.error('Error generating thumbnail:', error);
    throw error;
  }
};

export const analyzeRescueImage = async (
  imageFile: File
): Promise<{ type: string; condition: string }> => {
  try {
    // Convert file to base64
    const base64Data = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(imageFile);
    });

    // Remove data url prefix
    const base64String = base64Data.split(',')[1];
    const mimeType = imageFile.type;

    const response = await fetch('/api/ai/analyze-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mimeType, data: base64String }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to analyze image');
    }

    return await response.json();
  } catch (error) {
    console.error('Error analyzing image:', error);
    throw error;
  }
};
