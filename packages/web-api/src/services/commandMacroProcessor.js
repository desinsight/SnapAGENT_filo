const naturalLanguageProcessor = require('./naturalLanguageProcessor');

class CommandMacroProcessor {
  constructor() {
    this.macros = new Map();
    this.workflows = new Map();
    this.executionHistory = [];
    this.variables = new Map();
    this.conditions = new Map();
  }

  // 매크로 생성
  createMacro(name, commands, options = {}) {
    try {
      const macro = {
        id: this.generateId(),
        name,
        commands: Array.isArray(commands) ? commands : [commands],
        options: {
          description: options.description || '',
          tags: options.tags || [],
          variables: options.variables || {},
          conditions: options.conditions || [],
          retryCount: options.retryCount || 0,
          timeout: options.timeout || 30000,
          parallel: options.parallel || false,
          ...options
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        usageCount: 0,
        successCount: 0
      };

      this.macros.set(macro.id, macro);
      return macro;
    } catch (error) {
      throw new Error(`매크로 생성 실패: ${error.message}`);
    }
  }

  // 워크플로우 생성
  createWorkflow(name, steps, options = {}) {
    try {
      const workflow = {
        id: this.generateId(),
        name,
        steps: steps.map((step, index) => ({
          id: this.generateId(),
          stepNumber: index + 1,
          command: step.command,
          condition: step.condition || null,
          retryOnFailure: step.retryOnFailure || false,
          maxRetries: step.maxRetries || 3,
          timeout: step.timeout || 10000,
          parallel: step.parallel || false,
          dependsOn: step.dependsOn || [],
          variables: step.variables || {},
          ...step
        })),
        options: {
          description: options.description || '',
          tags: options.tags || [],
          variables: options.variables || {},
          conditions: options.conditions || [],
          retryCount: options.retryCount || 0,
          timeout: options.timeout || 60000,
          parallel: options.parallel || false,
          ...options
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        usageCount: 0,
        successCount: 0
      };

      this.workflows.set(workflow.id, workflow);
      return workflow;
    } catch (error) {
      throw new Error(`워크플로우 생성 실패: ${error.message}`);
    }
  }

  // 매크로 실행
  async executeMacro(macroId, context = {}) {
    try {
      const macro = this.macros.get(macroId);
      if (!macro) {
        throw new Error(`매크로를 찾을 수 없습니다: ${macroId}`);
      }

      console.log(`매크로 실행 시작: ${macro.name}`);

      // 변수 설정
      this.setVariables(macro.options.variables);
      this.setVariables(context.variables || {});

      // 실행 시작 시간
      const startTime = Date.now();

      let results = [];
      let successCount = 0;

      if (macro.options.parallel) {
        // 병렬 실행
        const promises = macro.commands.map(async (command, index) => {
          try {
            const result = await this.executeCommand(command, context);
            return { index, success: true, result };
          } catch (error) {
            return { index, success: false, error: error.message };
          }
        });

        const parallelResults = await Promise.all(promises);
        results = parallelResults.sort((a, b) => a.index - b.index);
        successCount = parallelResults.filter(r => r.success).length;
      } else {
        // 순차 실행
        for (let i = 0; i < macro.commands.length; i++) {
          const command = macro.commands[i];
          
          try {
            // 조건 확인
            if (macro.options.conditions[i] && !this.evaluateCondition(macro.options.conditions[i], context)) {
              console.log(`조건 미충족으로 명령 건너뜀: ${command}`);
              results.push({ index: i, success: true, skipped: true, reason: 'condition_not_met' });
              continue;
            }

            const result = await this.executeCommand(command, context);
            results.push({ index: i, success: true, result });
            successCount++;

            // 변수 업데이트
            if (result.data) {
              this.updateVariablesFromResult(result.data);
            }
          } catch (error) {
            console.error(`명령 실행 실패 (${i + 1}/${macro.commands.length}):`, error);
            
            if (macro.options.retryCount > 0) {
              // 재시도 로직
              const retryResult = await this.retryCommand(command, macro.options.retryCount, context);
              if (retryResult.success) {
                results.push({ index: i, success: true, result: retryResult.result, retried: true });
                successCount++;
              } else {
                results.push({ index: i, success: false, error: error.message, retried: true });
              }
            } else {
              results.push({ index: i, success: false, error: error.message });
            }
          }
        }
      }

      // 실행 시간 계산
      const executionTime = Date.now() - startTime;

      // 매크로 사용 통계 업데이트
      macro.usageCount++;
      if (successCount === macro.commands.length) {
        macro.successCount++;
      }

      // 실행 히스토리에 추가
      const executionRecord = {
        id: this.generateId(),
        type: 'macro',
        macroId,
        macroName: macro.name,
        startTime: new Date(startTime).toISOString(),
        endTime: new Date().toISOString(),
        executionTime,
        totalCommands: macro.commands.length,
        successfulCommands: successCount,
        results,
        context,
        success: successCount === macro.commands.length
      };

      this.executionHistory.push(executionRecord);

      return {
        success: successCount === macro.commands.length,
        macro: macro.name,
        totalCommands: macro.commands.length,
        successfulCommands: successCount,
        executionTime,
        results,
        executionId: executionRecord.id
      };
    } catch (error) {
      console.error('매크로 실행 실패:', error);
      throw error;
    }
  }

  // 워크플로우 실행
  async executeWorkflow(workflowId, context = {}) {
    try {
      const workflow = this.workflows.get(workflowId);
      if (!workflow) {
        throw new Error(`워크플로우를 찾을 수 없습니다: ${workflowId}`);
      }

      console.log(`워크플로우 실행 시작: ${workflow.name}`);

      // 변수 설정
      this.setVariables(workflow.options.variables);
      this.setVariables(context.variables || {});

      const startTime = Date.now();
      const results = [];
      const executedSteps = new Set();
      let successCount = 0;

      // 의존성 그래프 생성
      const dependencyGraph = this.buildDependencyGraph(workflow.steps);

      // 실행 가능한 단계들을 찾아서 실행
      while (executedSteps.size < workflow.steps.length) {
        const executableSteps = this.findExecutableSteps(workflow.steps, executedSteps, dependencyGraph);
        
        if (executableSteps.length === 0) {
          throw new Error('순환 의존성이 감지되었습니다.');
        }

        if (workflow.options.parallel) {
          // 병렬 실행
          const promises = executableSteps.map(async (step) => {
            try {
              const result = await this.executeWorkflowStep(step, context);
              return { step, success: true, result };
            } catch (error) {
              return { step, success: false, error: error.message };
            }
          });

          const stepResults = await Promise.all(promises);
          
          for (const stepResult of stepResults) {
            executedSteps.add(stepResult.step.id);
            results.push(stepResult);
            
            if (stepResult.success) {
              successCount++;
              if (stepResult.result.data) {
                this.updateVariablesFromResult(stepResult.result.data);
              }
            }
          }
        } else {
          // 순차 실행
          for (const step of executableSteps) {
            try {
              const result = await this.executeWorkflowStep(step, context);
              executedSteps.add(step.id);
              results.push({ step, success: true, result });
              successCount++;
              
              if (result.data) {
                this.updateVariablesFromResult(result.data);
              }
            } catch (error) {
              executedSteps.add(step.id);
              results.push({ step, success: false, error: error.message });
            }
          }
        }
      }

      const executionTime = Date.now() - startTime;

      // 워크플로우 사용 통계 업데이트
      workflow.usageCount++;
      if (successCount === workflow.steps.length) {
        workflow.successCount++;
      }

      // 실행 히스토리에 추가
      const executionRecord = {
        id: this.generateId(),
        type: 'workflow',
        workflowId,
        workflowName: workflow.name,
        startTime: new Date(startTime).toISOString(),
        endTime: new Date().toISOString(),
        executionTime,
        totalSteps: workflow.steps.length,
        successfulSteps: successCount,
        results,
        context,
        success: successCount === workflow.steps.length
      };

      this.executionHistory.push(executionRecord);

      return {
        success: successCount === workflow.steps.length,
        workflow: workflow.name,
        totalSteps: workflow.steps.length,
        successfulSteps: successCount,
        executionTime,
        results,
        executionId: executionRecord.id
      };
    } catch (error) {
      console.error('워크플로우 실행 실패:', error);
      throw error;
    }
  }

  // 워크플로우 단계 실행
  async executeWorkflowStep(step, context) {
    try {
      // 조건 확인
      if (step.condition && !this.evaluateCondition(step.condition, context)) {
        throw new Error('조건 미충족');
      }

      // 재시도 로직
      let lastError;
      for (let attempt = 0; attempt <= step.maxRetries; attempt++) {
        try {
          const result = await this.executeCommand(step.command, {
            ...context,
            variables: { ...context.variables, ...step.variables }
          });
          return result;
        } catch (error) {
          lastError = error;
          if (attempt < step.maxRetries) {
            console.log(`단계 재시도 ${attempt + 1}/${step.maxRetries}: ${step.command}`);
            await this.delay(1000 * (attempt + 1)); // 지수 백오프
          }
        }
      }

      throw lastError;
    } catch (error) {
      throw new Error(`워크플로우 단계 실행 실패: ${error.message}`);
    }
  }

  // 명령어 실행
  async executeCommand(command, context) {
    try {
      // 변수 치환
      const processedCommand = this.substituteVariables(command, context);
      
      // 자연어 명령 처리
      const result = await naturalLanguageProcessor.processNaturalLanguageCommand(processedCommand, context);
      
      return result;
    } catch (error) {
      throw new Error(`명령어 실행 실패: ${error.message}`);
    }
  }

  // 재시도 로직
  async retryCommand(command, maxRetries, context) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`명령 재시도 ${attempt}/${maxRetries}: ${command}`);
        await this.delay(1000 * attempt); // 지수 백오프
        
        const result = await this.executeCommand(command, context);
        return { success: true, result };
      } catch (error) {
        if (attempt === maxRetries) {
          return { success: false, error: error.message };
        }
      }
    }
  }

  // 조건 평가
  evaluateCondition(condition, context) {
    try {
      if (typeof condition === 'function') {
        return condition(context);
      }
      
      if (typeof condition === 'string') {
        // 간단한 조건 문자열 평가
        return this.evaluateConditionString(condition, context);
      }
      
      if (typeof condition === 'object') {
        return this.evaluateConditionObject(condition, context);
      }
      
      return true;
    } catch (error) {
      console.error('조건 평가 실패:', error);
      return false;
    }
  }

  // 조건 문자열 평가
  evaluateConditionString(condition, context) {
    // 간단한 변수 존재 여부 확인
    const variableMatch = condition.match(/\$\{(\w+)\}/);
    if (variableMatch) {
      const variableName = variableMatch[1];
      return this.variables.has(variableName) && this.variables.get(variableName);
    }
    
    return true;
  }

  // 조건 객체 평가
  evaluateConditionObject(condition, context) {
    // 복잡한 조건 객체 평가
    for (const [key, value] of Object.entries(condition)) {
      const actualValue = this.variables.get(key) || context.variables?.[key];
      if (actualValue !== value) {
        return false;
      }
    }
    return true;
  }

  // 변수 치환
  substituteVariables(text, context) {
    let result = text;
    const allVariables = { ...this.variables, ...context.variables };
    
    for (const [key, value] of Object.entries(allVariables)) {
      const placeholder = `\${${key}}`;
      result = result.replace(new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), value);
    }
    
    return result;
  }

  // 변수 설정
  setVariables(variables) {
    for (const [key, value] of Object.entries(variables)) {
      this.variables.set(key, value);
    }
  }

  // 결과에서 변수 업데이트
  updateVariablesFromResult(data) {
    if (data && typeof data === 'object') {
      for (const [key, value] of Object.entries(data)) {
        if (typeof value !== 'object' || value === null) {
          this.variables.set(key, value);
        }
      }
    }
  }

  // 의존성 그래프 생성
  buildDependencyGraph(steps) {
    const graph = new Map();
    
    for (const step of steps) {
      graph.set(step.id, step.dependsOn || []);
    }
    
    return graph;
  }

  // 실행 가능한 단계 찾기
  findExecutableSteps(steps, executedSteps, dependencyGraph) {
    return steps.filter(step => {
      if (executedSteps.has(step.id)) {
        return false;
      }
      
      const dependencies = dependencyGraph.get(step.id) || [];
      return dependencies.every(depId => executedSteps.has(depId));
    });
  }

  // 매크로 목록 가져오기
  getMacros() {
    return Array.from(this.macros.values());
  }

  // 워크플로우 목록 가져오기
  getWorkflows() {
    return Array.from(this.workflows.values());
  }

  // 실행 히스토리 가져오기
  getExecutionHistory(limit = 50) {
    return this.executionHistory.slice(-limit);
  }

  // 매크로 삭제
  deleteMacro(macroId) {
    return this.macros.delete(macroId);
  }

  // 워크플로우 삭제
  deleteWorkflow(workflowId) {
    return this.workflows.delete(workflowId);
  }

  // 매크로 업데이트
  updateMacro(macroId, updates) {
    const macro = this.macros.get(macroId);
    if (!macro) {
      throw new Error(`매크로를 찾을 수 없습니다: ${macroId}`);
    }

    Object.assign(macro, updates);
    macro.updatedAt = new Date().toISOString();
    
    return macro;
  }

  // 워크플로우 업데이트
  updateWorkflow(workflowId, updates) {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      throw new Error(`워크플로우를 찾을 수 없습니다: ${workflowId}`);
    }

    Object.assign(workflow, updates);
    workflow.updatedAt = new Date().toISOString();
    
    return workflow;
  }

  // 통계 가져오기
  getStats() {
    const macros = Array.from(this.macros.values());
    const workflows = Array.from(this.workflows.values());
    
    return {
      macros: {
        total: macros.length,
        totalUsage: macros.reduce((sum, m) => sum + m.usageCount, 0),
        totalSuccess: macros.reduce((sum, m) => sum + m.successCount, 0),
        successRate: macros.length > 0 ? 
          (macros.reduce((sum, m) => sum + m.successCount, 0) / macros.reduce((sum, m) => sum + m.usageCount, 1)) * 100 : 0
      },
      workflows: {
        total: workflows.length,
        totalUsage: workflows.reduce((sum, w) => sum + w.usageCount, 0),
        totalSuccess: workflows.reduce((sum, w) => sum + w.successCount, 0),
        successRate: workflows.length > 0 ? 
          (workflows.reduce((sum, w) => sum + w.successCount, 0) / workflows.reduce((sum, w) => sum + w.usageCount, 1)) * 100 : 0
      },
      recentExecutions: this.executionHistory.slice(-10)
    };
  }

  // 유틸리티 함수들
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = new CommandMacroProcessor(); 