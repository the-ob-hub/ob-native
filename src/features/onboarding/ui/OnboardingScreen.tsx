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
import { onboardingService, OnboardingSubmitRequest, Address } from '../../../services/api/onboardingService';
import { generateRandomUserData } from '../../../utils/generateRandomUserData';
import { useLogs } from '../../../contexts/LogContext';

interface OnboardingScreenProps {
  onComplete: () => void;
}

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onComplete }) => {
  const [agent] = useState(() => new LLMAgent());
  const [state, setState] = useState<OnboardingState | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [submittingToBackend, setSubmittingToBackend] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const { addLog } = useLogs();
  
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

  /**
   * Valida que todos los campos requeridos estén presentes
   */
  const validateOnboardingData = (collectedData: Partial<User>): { isValid: boolean; missingFields: string[] } => {
    const requiredFields: (keyof OnboardingSubmitRequest)[] = [
      'email',
      'fullName',
      'phone',
      'documentType',
      'documentNumber',
      'birthDate',
      'nationality',
      'address',
      'countryOfResidence',
      'countryOfFundsOrigin',
    ];

    const missingFields: string[] = [];
    
    for (const field of requiredFields) {
      if (!collectedData[field] || String(collectedData[field]).trim() === '') {
        missingFields.push(field);
      }
    }

    // isPEP debe estar definido (puede ser false)
    if (collectedData.isPEP === undefined) {
      missingFields.push('isPEP');
    }

    return {
      isValid: missingFields.length === 0,
      missingFields,
    };
  };

  /**
   * Convierte un string de dirección a objeto Address
   * Si ya es un objeto Address, lo retorna tal cual
   */
  const parseAddress = (address: string | Address | undefined): Address => {
    // Si ya es un objeto Address, retornarlo
    if (address && typeof address === 'object' && 'street' in address) {
      return address as Address;
    }
    
    // Si es string, intentar parsearlo o crear estructura básica
    if (typeof address === 'string' && address.trim()) {
      // Intentar parsear formato común: "Calle Nombre 1234, Ciudad"
      const parts = address.split(',');
      if (parts.length >= 2) {
        const streetPart = parts[0].trim();
        const cityPart = parts[1].trim();
        
        // Intentar extraer número de la calle
        const streetMatch = streetPart.match(/^(.+?)\s+(\d+)$/);
        if (streetMatch) {
          return {
            street: streetMatch[1].trim(),
            number: streetMatch[2],
            city: cityPart,
            country: 'Argentina',
          };
        }
        
        return {
          street: streetPart,
          number: '',
          city: cityPart,
          country: 'Argentina',
        };
      }
      
      // Si no se puede parsear, usar el string completo como street
      return {
        street: address,
        number: '',
        city: '',
        country: 'Argentina',
      };
    }
    
    // Valor por defecto
    return {
      street: '',
      number: '',
      city: '',
      country: 'Argentina',
    };
  };

  /**
   * Mapea los datos recolectados al formato de la API
   */
  const mapToApiFormat = (collectedData: Partial<User>): OnboardingSubmitRequest => {
    return {
      email: collectedData.email || '',
      fullName: collectedData.fullName || '',
      phone: collectedData.phone || '',
      documentType: collectedData.documentType || '',
      documentNumber: collectedData.documentNumber || '',
      birthDate: collectedData.birthDate || '',
      nationality: collectedData.nationality || '',
      address: parseAddress(collectedData.address),
      countryOfResidence: collectedData.countryOfResidence || '',
      countryOfFundsOrigin: collectedData.countryOfFundsOrigin || '',
      isPEP: collectedData.isPEP || false,
    };
  };

  /**
   * Envía los datos al backend
   */
  const submitToBackend = async (collectedData: Partial<User>): Promise<{ success: boolean; userId?: string; error?: string }> => {
    try {
      // Validar datos
      const validation = validateOnboardingData(collectedData);
      if (!validation.isValid) {
        const errorMsg = `Faltan campos requeridos: ${validation.missingFields.join(', ')}`;
        addLog(`❌ Validación fallida: ${errorMsg}`);
        return { success: false, error: errorMsg };
      }

      // Mapear a formato API
      const apiData = mapToApiFormat(collectedData);
      
      addLog(`📝 Enviando onboarding al backend...`);
      addLog(`📝 Datos: ${JSON.stringify(apiData).substring(0, 200)}...`);

      // Enviar al backend
      const response = await onboardingService.submitOnboarding(apiData);
      
      // Loggear respuesta completa
      addLog(`📝 Respuesta del backend: ${JSON.stringify(response)}`);
      
      // El backend retorna la estructura: { success: true, data: { user_id: "...", ... } }
      const backendUserId = response.data?.user_id;
      
      if (!backendUserId) {
        addLog(`❌ El backend no retornó un userId válido. Respuesta: ${JSON.stringify(response)}`);
        return { 
          success: false, 
          error: 'El backend no retornó un userId válido en la respuesta' 
        };
      }
      
      addLog(`✅ Onboarding enviado exitosamente. UserId: ${backendUserId}`);
      addLog(`📝 Status: ${response.data?.status || 'N/A'}`);
      
      return {
        success: true,
        userId: String(backendUserId), // Asegurar que sea string
      };
    } catch (error) {
      let errorMessage = 'Error desconocido';
      
      if (error instanceof Error) {
        errorMessage = error.message;
        
        // Intentar parsear errores de validación del backend
        if (error.message.includes('400') || error.message.includes('422')) {
          try {
            const errorMatch = error.message.match(/\{.*\}/);
            if (errorMatch) {
              const errorData = JSON.parse(errorMatch[0]);
              errorMessage = errorData.message || errorData.error || errorMessage;
            }
          } catch (e) {
            // Si no se puede parsear, usar el mensaje original
          }
        }
      }
      
      addLog(`❌ Error al enviar onboarding: ${errorMessage}`);
      return { success: false, error: errorMessage };
    }
  };

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

    addLog('🎉 Auto-fill activado - Generando datos aleatorios...');

    // Generar datos aleatorios válidos en formato exacto de la API
    const randomData = generateRandomUserData();
    addLog(`📝 Datos generados: ${randomData.fullName}, ${randomData.email}`);

    // Mensaje del usuario
    const userMessage: Message = {
      id: generateId(),
      userId: state.userId,
      role: 'user',
      content: '✨ [Auto-completado]',
      timestamp: formatDate(new Date()),
    };

    // Mensaje del asistente indicando que se están enviando los datos
    const addressDisplay = randomData.address 
      ? `${randomData.address.street} ${randomData.address.number}, ${randomData.address.city}`
      : '';
    
    const assistantMessage: Message = {
      id: generateId(),
      userId: state.userId,
      role: 'assistant',
      content: '¡Perfecto! He generado tus datos:\n\n' +
        `✅ ${randomData.fullName}\n` +
        `✅ ${randomData.documentType}: ${randomData.documentNumber}\n` +
        `✅ Tel: ${randomData.phone}\n` +
        `✅ ${addressDisplay}\n` +
        `✅ Residente de ${randomData.countryOfResidence}\n` +
        `✅ ${randomData.isPEP ? 'Es PEP' : 'No es PEP'}\n\n` +
        'Enviando datos al servidor...',
      timestamp: formatDate(new Date()),
    };

    await db.createMessage(userMessage);
    await db.createMessage(assistantMessage);

    state.conversationHistory.push(userMessage);
    state.conversationHistory.push(assistantMessage);

    setState({ ...state });
    setMessages(prev => [...prev, userMessage, assistantMessage]);

    // ENVIAR AL BACKEND PRIMERO (esto crea el usuario en el backend)
    setSubmittingToBackend(true);
    
    try {
      addLog(`📝 Enviando datos al backend (auto-fill)...`);
      addLog(`📝 Datos: ${JSON.stringify(randomData).substring(0, 200)}...`);

      // Llamar directamente al servicio de onboarding
      const response = await onboardingService.submitOnboarding(randomData);
      
      // Loggear la respuesta completa para debugging
      addLog(`📝 Respuesta completa del backend: ${JSON.stringify(response)}`);
      
      // El backend retorna la estructura: { success: true, data: { user_id: "...", ... } }
      const backendUserId = response.data?.user_id;
      
      if (!backendUserId) {
        addLog(`❌ El backend no retornó un userId válido. Respuesta: ${JSON.stringify(response)}`);
        throw new Error('El backend no retornó un userId válido en la respuesta');
      }
      
      addLog(`✅ Usuario creado en backend. UserId: ${backendUserId}`);
      addLog(`📝 Status: ${response.data?.status || 'N/A'}`);
      addLog(`📝 Mensaje: ${response.data?.message || 'N/A'}`);
      
      // Actualizar estado local con los datos y el userId del backend
      // Convertir Address a string para guardar localmente
      const addressString = randomData.address 
        ? `${randomData.address.street} ${randomData.address.number}, ${randomData.address.city}`
        : '';
      
      state.collectedData = { 
        ...state.collectedData, 
        ...randomData,
        address: addressString, // Guardar como string localmente
      };
      state.userId = backendUserId; // Actualizar con el userId del backend
      
      // Crear/actualizar usuario en DB local con el userId del backend
      const now = formatDate(new Date());
      const userData: User = {
        id: backendUserId,
        email: randomData.email,
        fullName: randomData.fullName,
        phone: randomData.phone,
        documentType: randomData.documentType,
        documentNumber: randomData.documentNumber,
        birthDate: randomData.birthDate,
        nationality: randomData.nationality,
        address: addressString, // Guardar como string
        countryOfResidence: randomData.countryOfResidence,
        countryOfFundsOrigin: randomData.countryOfFundsOrigin,
        isPEP: randomData.isPEP,
        onboardingStatus: 'completed',
        createdAt: now,
        updatedAt: now,
      };
      
      // Verificar si el usuario local existe (usando el userId original), si no crearlo
      // Si existe, actualizarlo con el nuevo userId del backend
      const existingUser = await db.getUser(state.userId).catch(() => null);
      if (existingUser) {
        // Si el userId cambió, necesitamos crear uno nuevo con el userId del backend
        // y opcionalmente borrar el viejo
        await db.createUser(userData);
        // Opcional: borrar el usuario viejo si el ID cambió
        if (state.userId !== backendUserId) {
          await db.deleteUser(state.userId);
        }
      } else {
        await db.createUser(userData);
      }
      
      // Actualizar todos los mensajes con el nuevo userId del backend
      // (opcional, pero mejor mantener consistencia)
      
      // Validar que backendUserId sea válido antes de guardar
      if (!backendUserId || backendUserId === 'undefined' || backendUserId === 'null') {
        throw new Error('userId inválido recibido del backend');
      }
      
      // Guardar userId del backend en AsyncStorage
      await AsyncStorage.setItem('currentUserId', String(backendUserId));
      await AsyncStorage.setItem('hasCompletedOnboarding', 'true');
      addLog(`💾 UserId del backend guardado: ${backendUserId}`);

      // Mensaje de éxito (solo si tenemos userId válido)
      if (backendUserId) {
        const successMessage: Message = {
          id: generateId(),
          userId: String(backendUserId), // Asegurar que sea string
          role: 'assistant',
          content: '✅ ¡Usuario creado exitosamente en el servidor! Tu cuenta está lista.',
          timestamp: formatDate(new Date()),
        };
        await db.createMessage(successMessage);
        state.conversationHistory.push(successMessage);
        setMessages(prev => [...prev, successMessage]);
      }
      
      state.currentStep = 'completed';
      setState({ ...state });

      // Completar después de 2 segundos
      setTimeout(() => {
        setCompleting(true);
      }, 2000);
      
    } catch (error) {
      let errorMessage = 'Error desconocido';
      
      if (error instanceof Error) {
        errorMessage = error.message;
        
        // Intentar parsear errores de validación del backend
        if (error.message.includes('400') || error.message.includes('422')) {
          try {
            const errorMatch = error.message.match(/\{.*\}/);
            if (errorMatch) {
              const errorData = JSON.parse(errorMatch[0]);
              errorMessage = errorData.message || errorData.error || errorMessage;
            }
          } catch (e) {
            // Si no se puede parsear, usar el mensaje original
          }
        }
      }
      
      addLog(`❌ Error al crear usuario en backend: ${errorMessage}`);
      
      // Error al enviar al backend
      // Solo crear mensaje si tenemos un userId válido
      if (state.userId) {
        const errorMsg: Message = {
          id: generateId(),
          userId: state.userId,
          role: 'assistant',
          content: `❌ Error al crear usuario: ${errorMessage}\n\nPor favor, intenta nuevamente.`,
          timestamp: formatDate(new Date()),
        };
        await db.createMessage(errorMsg);
        state.conversationHistory.push(errorMsg);
        setMessages(prev => [...prev, errorMsg]);
      } else {
        // Si no hay userId, solo mostrar en la UI sin guardar en DB
        const errorMsg: Message = {
          id: generateId(),
          userId: generateId(), // Generar un ID temporal solo para el mensaje
          role: 'assistant',
          content: `❌ Error al crear usuario: ${errorMessage}\n\nPor favor, intenta nuevamente.`,
          timestamp: formatDate(new Date()),
        };
        state.conversationHistory.push(errorMsg);
        setMessages(prev => [...prev, errorMsg]);
      }
      
      // No marcar como completed si falló el backend
      state.currentStep = 'confirmation';
      setState({ ...state });
    } finally {
      setSubmittingToBackend(false);
    }
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
        // Enviar al backend antes de completar
        setSubmittingToBackend(true);
        
        // Mensaje indicando que se está enviando
        const sendingMessage: Message = {
          id: generateId(),
          userId: state.userId,
          role: 'assistant',
          content: '⏳ Enviando tus datos al servidor...',
          timestamp: formatDate(new Date()),
        };
        await db.createMessage(sendingMessage);
        setMessages(prev => [...prev, sendingMessage]);
        
        const backendResult = await submitToBackend(state.collectedData);
        setSubmittingToBackend(false);
        
        if (backendResult.success) {
          // Usar userId del backend si viene, sino usar el local
          const finalUserId = backendResult.userId || state.userId;
          
          // Completar onboarding
          state.currentStep = 'completed';
          
          // Actualizar status en DB
          await db.updateUser(state.userId, { onboardingStatus: 'completed' });
          
          // Guardar userId en AsyncStorage
          await AsyncStorage.setItem('currentUserId', finalUserId);
          await AsyncStorage.setItem('hasCompletedOnboarding', 'true');
          addLog(`💾 UserId guardado en AsyncStorage: ${finalUserId}`);
          
          // Mensaje de éxito
          const successMessage: Message = {
            id: generateId(),
            userId: state.userId,
            role: 'assistant',
            content: '✅ ¡Perfecto! Tus datos se enviaron correctamente. Tu cuenta está lista.',
            timestamp: formatDate(new Date()),
          };
          await db.createMessage(successMessage);
          state.conversationHistory.push(successMessage);
          setMessages(prev => [...prev, successMessage]);
          
          setCompleting(true);
        } else {
          // Error al enviar al backend
          const errorMessage: Message = {
            id: generateId(),
            userId: state.userId,
            role: 'assistant',
            content: `❌ Error al enviar datos: ${backendResult.error}\n\nPor favor, verifica tus datos e intenta nuevamente.`,
            timestamp: formatDate(new Date()),
          };
          await db.createMessage(errorMessage);
          state.conversationHistory.push(errorMessage);
          setMessages(prev => [...prev, errorMessage]);
          
          // No marcar como completed si falló el backend
          state.currentStep = 'confirmation';
          setState({ ...state });
        }
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

      {submittingToBackend && (
        <View style={styles.thinkingIndicator}>
          <ActivityIndicator size="small" color={COLORS.primary} />
          <Text style={styles.thinkingText}>Enviando datos al servidor...</Text>
        </View>
      )}

      <ChatInput
        onSend={handleSendMessage}
        disabled={loading || completing || submittingToBackend}
        placeholder={completing ? 'Onboarding completado' : submittingToBackend ? 'Enviando datos...' : 'Escribe un mensaje...'}
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

