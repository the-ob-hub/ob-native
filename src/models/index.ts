/**
 * User Model
 */
export interface User {
  id: string;
  phone?: string;
  email?: string;
  fullName?: string;
  documentType?: string;
  documentNumber?: string;
  birthDate?: string;
  nationality?: string;
  address?: string;
  countryOfResidence?: string;
  countryOfFundsOrigin?: string;
  isPEP?: boolean;
  onboardingStatus: OnboardingStatus;
  createdAt: string;
  updatedAt: string;
}

export type OnboardingStatus =
  | 'in_progress'
  | 'pending_validation'
  | 'completed'
  | 'failed'
  | 'abandoned';

/**
 * Message Model (for conversation)
 */
export interface Message {
  id: string;
  userId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  metadata?: {
    type?: 'text' | 'camera_request' | 'image';
    side?: 'front' | 'back';
    imageUri?: string;
    imageId?: string;
    [key: string]: any;
  };
}

/**
 * Onboarding State
 */
export interface OnboardingState {
  userId: string;
  currentStep: string;
  collectedData: Partial<User>;
  conversationHistory: Message[];
  isPaused: boolean;
  startedAt: string;
  lastActivity: string;
  onboardingStatus?: OnboardingStatus;
}

/**
 * LLM Agent Context
 */
export interface AgentContext {
  userId: string;
  conversationHistory: Message[];
  collectedData: Partial<User>;
  onboardingState: OnboardingState | null;
  systemPrompt: string;
}

