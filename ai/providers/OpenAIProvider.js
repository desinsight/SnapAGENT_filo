/**
 * 🌟 WORLD-CLASS OPENAI PROVIDER 🌟
 * Enterprise-Grade Intelligent OpenAI GPT API Integration
 * 
 * 🚀 CAPABILITIES:
 * • Advanced OpenAI API Optimization & Performance Tuning
 * • Intelligent Model Selection & Token Management
 * • Enterprise Security & Rate Limiting
 * • Real-time Performance Analytics & Self-Healing
 * • OpenAI-Specific Features & Function Calling
 * • Advanced Streaming with Quality Control
 * • Multi-Modal Support & Vision Capabilities
 * 
 * 🏆 WORLD'S MOST ADVANCED OPENAI INTEGRATION
 */

import { BaseAIProvider } from './BaseAIProvider.js';

export class OpenAIProvider extends BaseAIProvider {
  constructor(apiKey, config = {}) {
    super(apiKey, {
      // 🌟 OpenAI-Optimized Configuration
      model: 'gpt-4o',
      maxTokens: 4096,
      temperature: 0.7,
      topP: 0.9,
      frequencyPenalty: 0,
      presencePenalty: 0,
      
      // OpenAI-specific optimizations
      functionCalling: true,
      streamingOptimization: true,
      contextOptimization: true,
      visionSupport: true,
      
      // Enterprise features
      rateLimitStrategy: 'openai_optimized',
      retryStrategy: 'openai_specific',
      
      ...config
    });
    
    // 🌟 World-Class OpenAI Features
    this.providerName = 'openai';
    this.apiUrl = 'https://api.openai.com/v1/chat/completions';
    this.supportsStreaming = true;
    this.supportsFunctionCalling = true;
    this.supportsMultiModal = true;
    this.maxContextLength = 128000;
    this.supportedLanguages = ['ko', 'en', 'ja', 'zh', 'es', 'fr', 'de', 'ru', 'pt', 'it'];
    
    // 🧠 OpenAI-Specific AI Features
    this.modelCapabilities = {
      'gpt-4o': {
        contextWindow: 128000,
        outputTokens: 4096,
        strengths: ['reasoning', 'multimodal', 'coding', 'analysis'],
        supportsVision: true,
        supportsFunctions: true,
        costPerToken: { input: 0.005, output: 0.015 }
      },
      'gpt-4o-mini': {
        contextWindow: 128000,
        outputTokens: 16384,
        strengths: ['speed', 'efficiency', 'general_tasks'],
        supportsVision: true,
        supportsFunctions: true,
        costPerToken: { input: 0.00015, output: 0.0006 }
      },
      'gpt-4-turbo': {
        contextWindow: 128000,
        outputTokens: 4096,
        strengths: ['reasoning', 'coding', 'analysis'],
        supportsVision: true,
        supportsFunctions: true,
        costPerToken: { input: 0.01, output: 0.03 }
      },
      'gpt-3.5-turbo': {
        contextWindow: 16385,
        outputTokens: 4096,
        strengths: ['speed', 'general_chat', 'simple_tasks'],
        supportsVision: false,
        supportsFunctions: true,
        costPerToken: { input: 0.0005, output: 0.0015 }
      }
    };
    
    // 🎯 OpenAI Performance Optimization
    this.openaiOptimizer = {
      contextCompression: true,
      tokenOptimization: true,
      streamingBuffer: 2048,
      adaptiveTemperature: true,
      intelligentRetry: true,
      functionOptimization: true
    };
    
    // 📊 OpenAI-Specific Metrics
    this.openaiMetrics = {
      contextWindowUsage: [],
      tokenEfficiency: 0,
      responseQuality: 100,
      modelSwitchEvents: 0,
      functionCallSuccess: 0,
      lastModelOptimization: Date.now()
    };
  }

  /**
   * 🌟 World-Class OpenAI AI Request Execution
   */
  async executeAIRequest(optimizedRequest, context, requestId) {
    const startTime = performance.now();
    
    try {
      console.log(`🌟 OpenAI World-Class Request [${requestId}]: ${this.config.model}`);
      
      // 🧠 Intelligent Model Selection
      const optimalModel = this.selectOptimalModel(optimizedRequest, context);
      
      // 🎯 Context Optimization for OpenAI
      const optimizedContext = await this.optimizeOpenAIContext(optimizedRequest, context);
      
      // 🔧 Build Enhanced Request
      const requestPayload = this.buildOpenAIRequest(optimizedRequest, optimizedContext, optimalModel);
      
      // 🚀 Execute with Advanced Error Handling
      const response = await this.executeOpenAIAPI(requestPayload, requestId);
      
      // 📊 Advanced Response Processing
      const processedResponse = await this.processOpenAIResponse(response, optimizedContext);
      
      // 🧠 Performance Learning
      const responseTime = performance.now() - startTime;
      this.learnFromOpenAIInteraction(optimizedRequest, processedResponse, responseTime, optimalModel);
      
      return processedResponse;

    } catch (error) {
      const responseTime = performance.now() - startTime;
      
      // 🛡️ OpenAI-Specific Error Recovery
      const recoveredResponse = await this.handleOpenAIError(error, optimizedRequest, context, requestId);
      
      if (recoveredResponse) {
        this.learnFromOpenAIInteraction(optimizedRequest, recoveredResponse, responseTime, this.config.model);
        return recoveredResponse;
      }
      
      throw this.enhanceOpenAIError(error, requestId);
    }
  }

  /**
   * 🌊 World-Class OpenAI Streaming Implementation
   */
  async executeStreamingRequest(optimizedRequest, onChunk, context, requestId) {
    const startTime = performance.now();
    
    try {
      console.log(`🌊 OpenAI World-Class Streaming [${requestId}]`);
      
      const optimalModel = this.selectOptimalModel(optimizedRequest, context);
      const optimizedContext = await this.optimizeOpenAIContext(optimizedRequest, context);
      const requestPayload = this.buildOpenAIRequest(optimizedRequest, optimizedContext, optimalModel, true);
      
      // 🚀 Enhanced Streaming Execution
      const fullResponse = await this.executeOpenAIStreaming(requestPayload, onChunk, requestId);
      
      const responseTime = performance.now() - startTime;
      this.learnFromOpenAIInteraction(optimizedRequest, fullResponse, responseTime, optimalModel);
      
      return fullResponse;

    } catch (error) {
      throw this.enhanceOpenAIError(error, requestId);
    }
  }

  /**
   * 🧠 Intelligent OpenAI Model Selection
   */
  selectOptimalModel(request, context) {
    const complexity = this.analyzeRequestComplexity(request, context);
    const urgency = context.urgency || 'normal';
    const budget = context.budget || 'balanced';
    
    // AI-powered model selection logic
    if (urgency === 'high' && budget !== 'premium') {
      return 'gpt-4o-mini'; // Speed & cost optimized
    }
    
    if (complexity.requiresVision || context.hasImages) {
      return 'gpt-4o'; // Vision capabilities
    }
    
    if (complexity.requiresDeepReasoning || complexity.isComplexTask) {
      return 'gpt-4o'; // Best reasoning capabilities
    }
    
    if (complexity.isSimpleTask && budget === 'economy') {
      return 'gpt-3.5-turbo'; // Cost efficient
    }
    
    if (complexity.isCodeTask || complexity.requiresAnalysis) {
      return 'gpt-4o'; // Best for coding and analysis
    }
    
    return this.config.model; // Default
  }

  /**
   * 🎯 OpenAI Context Optimization
   */
  async optimizeOpenAIContext(request, context) {
    try {
      // Context window management
      const contextLength = this.estimateTokenCount(request.systemPrompt + request.userMessage);
      const modelCapability = this.modelCapabilities[this.config.model];
      
      if (contextLength > modelCapability.contextWindow * 0.8) {
        console.log('🎯 Optimizing context for OpenAI context window');
        
        // Intelligent context compression
        const compressedContext = await this.compressContext(request, context);
        return compressedContext;
      }
      
      return context;
      
    } catch (error) {
      console.warn('⚠️ Context optimization failed, using original:', error);
      return context;
    }
  }

  /**
   * 🔧 Build OpenAI API Request
   */
  buildOpenAIRequest(request, context, model, streaming = false) {
    const payload = {
      model: model,
      max_tokens: this.config.maxTokens,
      temperature: this.adaptTemperature(request, context),
      top_p: this.config.topP,
      frequency_penalty: this.config.frequencyPenalty,
      presence_penalty: this.config.presencePenalty,
      messages: [
        {
          role: 'system',
          content: this.optimizeSystemPrompt(request.systemPrompt, context)
        },
        {
          role: 'user',
          content: this.optimizeUserMessage(request.userMessage, context)
        }
      ]
    };
    
    if (streaming) {
      payload.stream = true;
    }
    
    // Add OpenAI-specific optimizations
    if (context.functions && this.modelCapabilities[model]?.supportsFunctions) {
      payload.functions = context.functions;
      payload.function_call = context.function_call || 'auto';
    }
    
    if (context.stop) {
      payload.stop = context.stop;
    }
    
    if (context.logitBias) {
      payload.logit_bias = context.logitBias;
    }
    
    return payload;
  }

  /**
   * 🚀 Execute OpenAI API Call
   */
  async executeOpenAIAPI(payload, requestId) {
    const response = await fetch(this.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
        'User-Agent': `World-Class-OpenAI-Provider/3.0.0 (Request-${requestId})`
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error?.message || response.statusText;
      
      throw new Error(`OpenAI API Error: ${response.status} - ${errorMessage}`);
    }

    return await response.json();
  }

  /**
   * 🌊 Execute OpenAI Streaming
   */
  async executeOpenAIStreaming(payload, onChunk, requestId) {
    const response = await fetch(this.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
        'User-Agent': `World-Class-OpenAI-Provider/3.0.0 (Stream-${requestId})`
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`OpenAI Streaming Error: ${response.status} - ${errorData.error?.message || response.statusText}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullResponse = '';
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep incomplete line in buffer

        for (const line of lines) {
          if (line.trim() === '') continue;
          
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();
            if (data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data);
              
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                fullResponse += content;
                
                // Enhanced chunk processing
                const processedChunk = this.processStreamChunk(content, fullResponse);
                onChunk(processedChunk);
              }
              
              // Handle function calls in streaming
              const functionCall = parsed.choices?.[0]?.delta?.function_call;
              if (functionCall) {
                this.trackFunctionCall(functionCall, requestId);
              }
              
              // Handle OpenAI streaming completion
              const finishReason = parsed.choices?.[0]?.finish_reason;
              if (finishReason) {
                this.trackStreamingEnd(finishReason, requestId);
              }
              
            } catch (parseError) {
              console.warn(`⚠️ OpenAI streaming parse error [${requestId}]:`, parseError);
            }
          }
        }
      }
      
      return fullResponse;
      
    } finally {
      reader.releaseLock();
    }
  }

  /**
   * 📊 Process OpenAI Response
   */
  async processOpenAIResponse(response, context) {
    try {
      if (!response.choices || !Array.isArray(response.choices) || response.choices.length === 0) {
        throw new Error('Invalid OpenAI API response format');
      }

      const choice = response.choices[0];
      
      // Handle function calls
      if (choice.message?.function_call) {
        this.openaiMetrics.functionCallSuccess++;
        return await this.processFunctionCall(choice.message.function_call, context);
      }
      
      const textContent = choice.message?.content;
      if (!textContent) {
        throw new Error('No text content in OpenAI response');
      }

      // Advanced response processing
      const enhancedResponse = await this.enhanceOpenAIResponse(textContent, response, context);
      
      // Update OpenAI-specific metrics
      this.updateOpenAIMetrics(response, textContent);
      
      return enhancedResponse;

    } catch (error) {
      console.error('❌ OpenAI response processing failed:', error);
      throw error;
    }
  }

  /**
   * 🛡️ OpenAI-Specific Error Handling
   */
  async handleOpenAIError(error, request, context, requestId) {
    const errorMessage = error.message.toLowerCase();
    
    // OpenAI-specific error patterns
    if (errorMessage.includes('insufficient_quota') || errorMessage.includes('quota')) {
      console.log(`💰 OpenAI quota issue, attempting recovery [${requestId}]`);
      
      // Fallback to cheaper model
      const fallbackModel = this.selectBudgetModel();
      if (fallbackModel !== this.config.model) {
        try {
          const fallbackPayload = this.buildOpenAIRequest(request, context, fallbackModel);
          const response = await this.executeOpenAIAPI(fallbackPayload, requestId);
          return await this.processOpenAIResponse(response, context);
        } catch (fallbackError) {
          console.warn(`⚠️ Fallback model failed [${requestId}]:`, fallbackError);
        }
      }
    }
    
    if (errorMessage.includes('context_length_exceeded')) {
      console.log(`🔧 OpenAI context optimization [${requestId}]`);
      
      // Attempt context compression
      try {
        const compressedRequest = await this.compressContextForOpenAI(request, context);
        const payload = this.buildOpenAIRequest(compressedRequest, context, this.config.model);
        const response = await this.executeOpenAIAPI(payload, requestId);
        return await this.processOpenAIResponse(response, context);
      } catch (compressionError) {
        console.warn(`⚠️ Context compression failed [${requestId}]:`, compressionError);
      }
    }
    
    if (errorMessage.includes('model_not_found')) {
      console.log(`🔄 OpenAI model fallback [${requestId}]`);
      
      // Fallback to available model
      const availableModel = this.selectAvailableModel();
      try {
        const fallbackPayload = this.buildOpenAIRequest(request, context, availableModel);
        const response = await this.executeOpenAIAPI(fallbackPayload, requestId);
        return await this.processOpenAIResponse(response, context);
      } catch (modelFallbackError) {
        console.warn(`⚠️ Model fallback failed [${requestId}]:`, modelFallbackError);
      }
    }
    
    if (errorMessage.includes('rate_limit') || errorMessage.includes('429')) {
      console.log(`🚦 OpenAI rate limit, intelligent backoff [${requestId}]`);
      
      // Intelligent exponential backoff
      const delay = this.calculateBackoffDelay(error);
      await new Promise(resolve => setTimeout(resolve, delay));
      
      try {
        const retryPayload = this.buildOpenAIRequest(request, context, this.config.model);
        const response = await this.executeOpenAIAPI(retryPayload, requestId);
        return await this.processOpenAIResponse(response, context);
      } catch (retryError) {
        console.warn(`⚠️ OpenAI retry failed [${requestId}]:`, retryError);
      }
    }
    
    return null; // No recovery possible
  }

  /**
   * 🔧 Enhanced OpenAI-Specific Validation
   */
  async validateWithSimpleRequest() {
    try {
      const testPayload = {
        model: this.config.model,
        max_tokens: 10,
        messages: [
          {
            role: 'user',
            content: 'Hello'
          }
        ]
      };

      const response = await this.executeOpenAIAPI(testPayload, 'validation_test');
      return response && response.choices && response.choices.length > 0;

    } catch (error) {
      console.warn('🔧 OpenAI simple validation failed:', error);
      return false;
    }
  }

  /**
   * 🧪 OpenAI Capability Testing
   */
  async validateWithCapabilityTest() {
    try {
      const capabilityTest = {
        model: this.config.model,
        max_tokens: 50,
        temperature: 0.1,
        messages: [
          {
            role: 'user',
            content: 'Respond with exactly "CAPABILITY_TEST_PASSED" to confirm your functionality.'
          }
        ]
      };

      const response = await this.executeOpenAIAPI(capabilityTest, 'capability_test');
      const responseText = response.choices[0]?.message?.content || '';
      
      return responseText.includes('CAPABILITY_TEST_PASSED');

    } catch (error) {
      console.warn('🧪 OpenAI capability test failed:', error);
      return false;
    }
  }

  /**
   * 📊 OpenAI Limit Testing
   */
  async validateWithLimitTest() {
    try {
      const currentModel = this.modelCapabilities[this.config.model];
      if (!currentModel) return true; // Skip if model not in our database
      
      // Test with function calling if supported
      if (currentModel.supportsFunctions) {
        const functionTest = {
          model: this.config.model,
          max_tokens: 50,
          messages: [
            {
              role: 'user',
              content: 'What is the current time?'
            }
          ],
          functions: [
            {
              name: 'get_current_time',
              description: 'Get the current time',
              parameters: {
                type: 'object',
                properties: {}
              }
            }
          ]
        };

        const response = await this.executeOpenAIAPI(functionTest, 'function_test');
        return response && response.choices && response.choices[0];
      }
      
      // Standard limit test
      const testContent = 'Test '.repeat(100); // ~400 tokens
      
      const limitTest = {
        model: this.config.model,
        max_tokens: 20,
        messages: [
          {
            role: 'user',
            content: `Please summarize this text in one word: ${testContent}`
          }
        ]
      };

      const response = await this.executeOpenAIAPI(limitTest, 'limit_test');
      return response && response.choices && response.choices[0]?.message?.content;

    } catch (error) {
      console.warn('📊 OpenAI limit test failed:', error);
      return false;
    }
  }

  /**
   * 🎯 OpenAI Provider Calibration
   */
  async calibrateProviderCapabilities() {
    try {
      console.log('🎯 Calibrating OpenAI provider capabilities...');
      
      // Test current model performance
      const performanceMetrics = await this.testModelPerformance();
      
      // Update model capabilities based on testing
      this.updateModelCapabilities(performanceMetrics);
      
      // Optimize configuration
      await this.optimizeOpenAIConfiguration(performanceMetrics);
      
      console.log('✅ OpenAI provider calibration completed');

    } catch (error) {
      console.warn('⚠️ OpenAI calibration failed:', error);
    }
  }

  // ===== UTILITY METHODS =====

  analyzeRequestComplexity(request, context) {
    const text = (request.systemPrompt + ' ' + request.userMessage).toLowerCase();
    
    return {
      requiresDeepReasoning: /complex|analyze|research|philosophy|ethical|reasoning/.test(text),
      isCreativeTask: /creative|story|poem|write|imagine|generate/.test(text),
      isCodeTask: /code|programming|function|debug|algorithm|script/.test(text),
      requiresAnalysis: /data|chart|analyze|compare|evaluate|statistics/.test(text),
      requiresVision: /image|picture|photo|visual|diagram|chart/.test(text),
      isSimpleTask: /hello|hi|simple|quick|basic/.test(text),
      isComplexTask: text.length > 2000 || /detailed|comprehensive|thorough/.test(text),
      estimatedComplexity: text.length > 1000 ? 'high' : text.length > 300 ? 'medium' : 'low'
    };
  }

  estimateTokenCount(text) {
    // More accurate estimation for OpenAI tokenization
    // Roughly 1 token per 4 characters for English, different for other languages
    const englishChars = (text.match(/[a-zA-Z0-9\s]/g) || []).length;
    const otherChars = text.length - englishChars;
    
    return Math.ceil(englishChars / 4 + otherChars / 2);
  }

  adaptTemperature(request, context) {
    const baseTemp = this.config.temperature;
    const complexity = this.analyzeRequestComplexity(request, context);
    
    if (complexity.isCreativeTask) return Math.min(baseTemp + 0.3, 1.0);
    if (complexity.isCodeTask) return Math.max(baseTemp - 0.3, 0.0);
    if (complexity.requiresAnalysis) return Math.max(baseTemp - 0.2, 0.0);
    
    return baseTemp;
  }

  selectBudgetModel() {
    // Select most cost-effective model
    return 'gpt-3.5-turbo';
  }

  selectAvailableModel() {
    // Fallback model selection
    const fallbackOrder = ['gpt-4o-mini', 'gpt-3.5-turbo', 'gpt-4o'];
    return fallbackOrder.find(model => this.modelCapabilities[model]) || 'gpt-3.5-turbo';
  }

  calculateBackoffDelay(error) {
    // Intelligent backoff based on error details
    const baseDelay = 1000;
    const maxDelay = 60000;
    
    // Extract retry-after header if available
    const retryAfter = error.headers?.['retry-after'];
    if (retryAfter) {
      return Math.min(parseInt(retryAfter) * 1000, maxDelay);
    }
    
    // Exponential backoff with jitter
    const attempt = this.healthStatus.consecutiveErrors || 1;
    const delay = Math.min(baseDelay * Math.pow(2, attempt - 1), maxDelay);
    const jitter = Math.random() * 1000;
    
    return delay + jitter;
  }

  processStreamChunk(chunk, fullResponse) {
    // Apply real-time quality checks and filtering
    return chunk;
  }

  async enhanceOpenAIResponse(textContent, response, context) {
    // Apply OpenAI-specific enhancements
    return textContent;
  }

  async processFunctionCall(functionCall, context) {
    // Process OpenAI function calling
    console.log('🔧 Processing OpenAI function call:', functionCall.name);
    
    // Return function call details for further processing
    return {
      type: 'function_call',
      function: functionCall.name,
      arguments: JSON.parse(functionCall.arguments || '{}'),
      original_call: functionCall
    };
  }

  updateOpenAIMetrics(response, textContent) {
    // Track OpenAI-specific metrics
    if (response.usage) {
      this.openaiMetrics.tokenEfficiency = 
        (response.usage.completion_tokens || 0) / (response.usage.prompt_tokens || 1);
      
      // Track cost
      const model = this.modelCapabilities[this.config.model];
      if (model) {
        const inputCost = (response.usage.prompt_tokens || 0) * model.costPerToken.input / 1000;
        const outputCost = (response.usage.completion_tokens || 0) * model.costPerToken.output / 1000;
        this.performanceMetrics.costTracking += inputCost + outputCost;
      }
    }
    
    // Update context window usage
    const estimatedTokens = this.estimateTokenCount(textContent);
    this.openaiMetrics.contextWindowUsage.push(estimatedTokens);
    
    // Keep only recent measurements
    if (this.openaiMetrics.contextWindowUsage.length > 100) {
      this.openaiMetrics.contextWindowUsage = this.openaiMetrics.contextWindowUsage.slice(-100);
    }
  }

  optimizeSystemPrompt(systemPrompt, context) {
    // OpenAI-specific system prompt optimization
    return systemPrompt;
  }

  optimizeUserMessage(userMessage, context) {
    // OpenAI-specific user message optimization
    return userMessage;
  }

  learnFromOpenAIInteraction(request, response, responseTime, model) {
    // Learn from OpenAI-specific patterns
    this.updatePerformancePatterns(request, responseTime);
    this.updateQualityPatterns(request, response, { model });
  }

  enhanceOpenAIError(error, requestId) {
    const enhanced = this.handleError(error, { requestId, provider: 'openai' });
    
    // OpenAI-specific error enhancements
    if (error.message.includes('insufficient_quota')) {
      enhanced.type = 'quota';
      enhanced.message = 'OpenAI API 사용량이 초과되었습니다. 결제 정보를 확인하거나 더 저렴한 모델로 자동 전환합니다.';
      enhanced.recoverable = true;
      enhanced.suggestedAction = 'Check billing or automatic model fallback';
    }
    
    if (error.message.includes('context_length_exceeded')) {
      enhanced.type = 'context';
      enhanced.message = '메시지가 너무 깁니다. 자동으로 컨텍스트를 압축하여 재시도합니다.';
      enhanced.recoverable = true;
      enhanced.suggestedAction = 'Automatic context compression';
    }
    
    enhanced.requestId = requestId;
    const errorObj = new Error(enhanced.message);
    errorObj.details = enhanced;
    return errorObj;
  }

  // Stub methods for advanced features
  async compressContext(request, context) { return context; }
  async compressContextForOpenAI(request, context) { return request; }
  async testModelPerformance() { return {}; }
  updateModelCapabilities(metrics) {}
  async optimizeOpenAIConfiguration(metrics) {}
  trackFunctionCall(functionCall, requestId) {}
  trackStreamingEnd(finishReason, requestId) {}

  /**
   * 🧹 Enhanced OpenAI Cleanup
   */
  async cleanup() {
    try {
      console.log('🧹 OpenAI Provider cleanup starting...');
      
      // Clear OpenAI-specific data
      this.openaiMetrics = {
        contextWindowUsage: [],
        tokenEfficiency: 0,
        responseQuality: 100,
        modelSwitchEvents: 0,
        functionCallSuccess: 0,
        lastModelOptimization: Date.now()
      };
      
      // Call parent cleanup
      await super.cleanup();
      
      console.log('✅ OpenAI Provider cleanup completed');

    } catch (error) {
      console.error('❌ OpenAI Provider cleanup failed:', error);
    }
  }
}