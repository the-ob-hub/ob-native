import { Message, AgentContext, User } from '../../../models';
import { AGENT_CONFIG } from '../../../constants';

// TODO: Configurar tu API key de OpenAI aquí
// Por ahora, la app funcionará en modo simulado sin OpenAI
const OPENAI_API_KEY: string | undefined = undefined; // Cambia esto por tu API key: 'sk-...'

export class LLMAgent {
  private apiKey: string | undefined;

  constructor() {
    this.apiKey = OPENAI_API_KEY;
    if (!this.apiKey) {
      console.log('⚠️ Sin API Key - Usando modo simulado');
    } else {
      console.log('✅ API Key configurada');
    }
  }

  async processMessage(
    userMessage: string,
    context: AgentContext
  ): Promise<{ response: string; extractedData?: Partial<User> }> {
    // Si no hay API key, usar modo simulado
    if (!this.apiKey) {
      console.warn('⚠️ No hay API Key configurada, usando modo simulado');
      return this.processWithSimulatedResponse(userMessage, context);
    }

    try {
      return await this.processWithChatCompletions(userMessage, context);
    } catch (error) {
      console.error('❌ LLM Error:', error);
      return this.processWithSimulatedResponse(userMessage, context);
    }
  }

  private async processWithChatCompletions(
    userMessage: string,
    context: AgentContext
  ): Promise<{ response: string; extractedData?: Partial<User> }> {
    const messages = [
      {
        role: 'system',
        content: AGENT_CONFIG.systemPrompt,
      },
      ...this.formatHistoryForLLM(context.conversationHistory),
      {
        role: 'user',
        content: userMessage,
      },
    ];

    console.log('🚀 Llamando a OpenAI API...');
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: AGENT_CONFIG.model,
        messages,
        max_tokens: AGENT_CONFIG.maxTokens,
        temperature: AGENT_CONFIG.temperature,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ OpenAI API error:', response.status, errorText);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content || '';
    const parsed = this.parseResponse(content);

    console.log('✅ Respuesta de OpenAI recibida');

    return {
      response: parsed.message || content,
      extractedData: parsed.extractedData,
    };
  }

  async checkDataCompleteness(collectedData: Partial<User>): Promise<{
    complete: boolean;
    missingFields: string[];
  }> {
    const requiredFields = [
      'fullName',
      'documentType',
      'documentNumber',
      'phone',
      'email',
    ];

    const missingFields = requiredFields.filter(
      field => !collectedData[field as keyof User]
    );

    console.log('📊 Verificación de datos completos:');
    console.log('✅ Datos recolectados:', Object.keys(collectedData));
    console.log('❌ Faltantes:', missingFields);

    return {
      complete: missingFields.length === 0,
      missingFields,
    };
  }

  private formatHistoryForLLM(history: Message[]): Array<{ role: string; content: string }> {
    return history
      .slice(-10)
      .map(msg => ({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content,
      }));
  }

  private parseResponse(response: string): {
    message: string;
    extractedData?: Partial<User>;
  } {
    try {
      const parsed = JSON.parse(response);
      return {
        message: parsed.message || response,
        extractedData: parsed.extractedData,
      };
    } catch (error) {
      return { message: response };
    }
  }

  private processWithSimulatedResponse(
    userMessage: string,
    context: AgentContext
  ): { response: string; extractedData?: Partial<User> } {
    const message = userMessage.toLowerCase();
    
    if (!message || message.trim() === '') {
      return {
        response: '¡Hola! Soy Onda, tu asistente en OndaBank. Vamos a crear tu cuenta. ¿Cuál es tu nombre completo?',
      };
    }

    if (message.includes('hola') || message.includes('hi')) {
      return {
        response: '¡Hola! 👋 Perfecto, vamos a empezar. ¿Cuál es tu nombre completo?',
      };
    }

    return {
      response: 'Entiendo. Para continuar necesito tu nombre completo y documento de identidad.',
      extractedData: {},
    };
  }
}

