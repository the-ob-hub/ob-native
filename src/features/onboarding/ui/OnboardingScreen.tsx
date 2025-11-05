import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  TouchableWithoutFeedback,
  TouchableOpacity,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { LLMAgent } from '../agent/llmAgent';
import { Message, OnboardingState, User } from '../../../models';
import { COLORS, SPACING, BORDER_RADIUS } from '../../../constants';
import { generateId, formatDate } from '../../../utils/helpers';
import { db } from '../../../data/database';

interface OnboardingScreenProps {
  onComplete: () => void;
}

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onComplete }) => {
  const [agent] = useState(() => new LLMAgent());
  const [state, setState] = useState<OnboardingState | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [completing, setCompleting] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  
  // Easter Egg: 1 tap en el logo para auto-completar
  const hasAutoFilledRef = useRef(false);

  useEffect(() => {
    initializeOnboarding();
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  // Auto-navegar cuando completing
  useEffect(() => {
    if (completing) {
      const timer = setTimeout(() => {
        onComplete();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [completing, onComplete]);

  const initializeOnboarding = async () => {
    try {
      setLoading(true);
      await db.init();
      
      const userId = generateId();
      const now = formatDate(new Date());

      const newState: OnboardingState = {
        userId,
        currentStep: 'greeting',
        collectedData: {},
        conversationHistory: [],
        isPaused: false,
        startedAt: now,
        lastActivity: now,
      };

      const user: User = {
        id: userId,
        onboardingStatus: 'in_progress',
        createdAt: now,
        updatedAt: now,
      };

      await db.createUser(user);

      // Mensaje de bienvenida
      const welcomeMessage: Message = {
        id: generateId(),
        userId,
        role: 'assistant',
        content: '¡Hola! Soy Onda, tu asistente en OndaBank. Vamos a crear tu cuenta. ¿Cuál es tu nombre completo?',
        timestamp: now,
      };

      await db.createMessage(welcomeMessage);
      newState.conversationHistory.push(welcomeMessage);
      
      setState(newState);
      setMessages([welcomeMessage]);
    } catch (error) {
      console.error('❌ Error en inicialización:', error);
    } finally {
      setLoading(false);
    }
  };

  // Easter Egg: Auto-completar con 1 tap
  const handleLogoTap = async () => {
    if (hasAutoFilledRef.current || completing || !state) return;
    
    console.log('🎉 Easter Egg activado - Auto-completando datos...');
    hasAutoFilledRef.current = true;
    await autoFillData();
  };

  const autoFillData = async () => {
    if (!state || completing) return;

    // Datos de Diego
    const mockData = {
      fullName: 'Diego S. Burgos',
      email: 'diego.burgos@ondabank.com',
      phone: '+54 9 11 3188-5769',
      documentType: 'DNI',
      documentNumber: '11111111',
      birthDate: '1990-05-15',
      nationality: 'Argentina',
      address: 'Melo 2883, Buenos Aires',
      countryOfResidence: 'Argentina',
      countryOfFundsOrigin: 'Argentina',
      isPEP: false,
    };

    // Actualizar estado y DB
    state.collectedData = { ...state.collectedData, ...mockData };
    await db.updateUser(state.userId, mockData);
    await db.updateUser(state.userId, { onboardingStatus: 'completed' });

    // Mensaje del usuario
    const userMessage: Message = {
      id: generateId(),
      userId: state.userId,
      role: 'user',
      content: '✨ [Auto-completado]',
      timestamp: formatDate(new Date()),
    };

    // Mensaje del asistente confirmando
    const assistantMessage: Message = {
      id: generateId(),
      userId: state.userId,
      role: 'assistant',
      content: '¡Perfecto! He completado todos tus datos:\n\n' +
        `✅ ${mockData.fullName}\n` +
        `✅ ${mockData.documentType}: ${mockData.documentNumber}\n` +
        `✅ Tel: ${mockData.phone}\n` +
        `✅ ${mockData.address}\n` +
        `✅ Residente de ${mockData.countryOfResidence}\n` +
        `✅ No es PEP\n\n` +
        '¡Tu cuenta está lista!',
      timestamp: formatDate(new Date()),
    };

    await db.createMessage(userMessage);
    await db.createMessage(assistantMessage);

    state.conversationHistory.push(userMessage);
    state.conversationHistory.push(assistantMessage);
    state.currentStep = 'completed';

    setState({ ...state });
    setMessages(prev => [...prev, userMessage, assistantMessage]);

    // Guardar en AsyncStorage
    await AsyncStorage.setItem('currentUserId', state.userId);
    await AsyncStorage.setItem('hasCompletedOnboarding', 'true');
    console.log('💾 UserId guardado (auto-fill):', state.userId);

    // Completar después de 2 segundos
    setTimeout(() => {
      setCompleting(true);
    }, 2000);
  };

  const handleSendMessage = async (messageContent: string) => {
    if (!state || loading) return;

    const userMessage: Message = {
      id: generateId(),
      userId: state.userId,
      role: 'user',
      content: messageContent,
      timestamp: formatDate(new Date()),
    };

    setMessages(prev => [...prev, userMessage]);
    setLoading(true);

    try {
      await db.createMessage(userMessage);

      const agentResponse = await agent.processMessage(messageContent, {
        userId: state.userId,
        conversationHistory: [...state.conversationHistory, userMessage],
        collectedData: state.collectedData,
        onboardingState: state,
        systemPrompt: '',
      });

      // Actualizar datos recolectados
      if (agentResponse.extractedData) {
        state.collectedData = { ...state.collectedData, ...agentResponse.extractedData };
        await db.updateUser(state.userId, agentResponse.extractedData);
      }

      // Verificar si tenemos todos los datos
      const dataCheck = await agent.checkDataCompleteness(state.collectedData);
      
      // Detectar si el asistente pidió confirmación
      const responseLower = agentResponse.response.toLowerCase();
      const isAskingConfirmation = responseLower.includes('¿están todos correctos?') || 
                                    responseLower.includes('están correctos?') ||
                                    responseLower.includes('confirma') ||
                                    responseLower.includes('correctos?');

      // Si tenemos todos los datos completos, marcar como en confirmación
      if (dataCheck.complete) {
        state.currentStep = 'confirmation';
      }

      if (isAskingConfirmation) {
        state.currentStep = 'confirmation';
      }

      // Si el usuario confirmó
      const confirmationWords = ['sí', 'si', 'correcto', 'ok', 'perfecto', 'perfect', 'bien', 'dale', 'vamos', 'confirmo', 'yes', 'exacto', 'genial', 'excelente'];
      const userConfirmed = confirmationWords.some(word => messageContent.toLowerCase().includes(word));
      
      if (state.currentStep === 'confirmation' && userConfirmed) {
        // Completar onboarding
        state.currentStep = 'completed';
        
        // Actualizar status en DB
        await db.updateUser(state.userId, { onboardingStatus: 'completed' });
        
        // Guardar userId en AsyncStorage para usarlo en HomeScreen
        await AsyncStorage.setItem('currentUserId', state.userId);
        await AsyncStorage.setItem('hasCompletedOnboarding', 'true');
        console.log('💾 UserId guardado en AsyncStorage:', state.userId);
        
        setCompleting(true);
      }

      const assistantMessage: Message = {
        id: generateId(),
        userId: state.userId,
        role: 'assistant',
        content: agentResponse.response,
        timestamp: formatDate(new Date()),
      };

      await db.createMessage(assistantMessage);
      state.conversationHistory.push(userMessage);
      state.conversationHistory.push(assistantMessage);
      
      setState({ ...state });
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('❌ Error procesando mensaje:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading && messages.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Cargando...</Text>
      </View>
    );
  }

  // Pantalla de bienvenida al completar
  if (completing) {
    const userName = state?.collectedData?.fullName || 'Usuario';
    return (
      <View style={styles.welcomeContainer}>
        <Text style={styles.welcomeEmoji}>🎉</Text>
        <Text style={styles.welcomeTitle}>¡Bienvenido, {userName}!</Text>
        <Text style={styles.welcomeMessage}>Tu cuenta de OndaBank está lista.</Text>
        <Text style={styles.welcomeSubmessage}>Ya puedes comenzar a disfrutar de nuestros servicios.</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>OndaBank</Text>
        <Text style={styles.headerSubtitle}>Soy Onda, tu asistente</Text>
      </View>

      <TouchableOpacity 
        style={styles.demoButton}
        onPress={handleLogoTap}
        activeOpacity={0.7}
      >
        <Text style={styles.demoButtonText}>⚡ COMPLETAR AUTOMÁTICAMENTE</Text>
      </TouchableOpacity>

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={item => item.id}
        renderItem={({ item }) => <ChatMessage message={item} />}
        contentContainerStyle={styles.messagesContainer}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />

      {loading && (
        <View style={styles.thinkingIndicator}>
          <ActivityIndicator size="small" color={COLORS.primary} />
          <Text style={styles.thinkingText}>Onda está pensando...</Text>
        </View>
      )}

      <ChatInput
        onSend={handleSendMessage}
        disabled={loading || completing}
        placeholder={completing ? 'Onboarding completado' : 'Escribe un mensaje...'}
      />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingTop: SPACING.xxl + 16,
    paddingBottom: SPACING.lg,
    paddingHorizontal: SPACING.lg,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.background,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
    marginBottom: SPACING.md,
  },
  demoButton: {
    backgroundColor: COLORS.secondary,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.lg,
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.md,
    marginBottom: SPACING.md,
    borderRadius: BORDER_RADIUS.xl,
    alignItems: 'center',
    shadowColor: COLORS.secondary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  demoButtonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  messagesContainer: {
    paddingVertical: SPACING.md,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: SPACING.md,
    color: COLORS.textSecondary,
  },
  thinkingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.sm,
  },
  thinkingText: {
    marginLeft: SPACING.sm,
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  welcomeContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    backgroundColor: COLORS.white,
  },
  welcomeEmoji: {
    fontSize: 80,
    marginBottom: SPACING.lg,
  },
  welcomeTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.primary,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  welcomeMessage: {
    fontSize: 20,
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING.sm,
    fontWeight: '500',
  },
  welcomeSubmessage: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
});

