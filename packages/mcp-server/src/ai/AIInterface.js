import { OpenAI } from 'openai';
import { Anthropic } from '@anthropic-ai/sdk';
import { logger } from '../utils/logger.js';
import inquirer from 'inquirer';
import { FileSystemMCPServer } from '../index.js';
import { SearchEngine } from '../search/SearchEngine.js';
import { TagManager } from '../tags/TagManager.js';
import { FileSystemManager } from '../file-system/FileSystemManager.js';
import fs from 'fs';
import path from 'path';

export class AIInterface {
    constructor() {
        // 환경변수에서 API 키 읽기
        const openaiKey = process.env.OPENAI_API_KEY;
        const anthropicKey = process.env.ANTHROPIC_API_KEY;

        // API 키가 하나도 없는 경우 에러
        if (!openaiKey && !anthropicKey) {
            throw new Error('API 키가 설정되지 않았습니다. .env 파일에 최소 하나의 API 키를 설정해주세요.');
        }

        // 사용 가능한 API 초기화
        if (openaiKey) {
            this.openai = new OpenAI({ apiKey: openaiKey });
            logger.info('OpenAI API가 초기화되었습니다 (환경변수).');
        } else {
            this.openai = null;
            logger.warn('OPENAI_API_KEY 환경변수가 없어 해당 기능을 사용할 수 없습니다.');
        }

        if (anthropicKey) {
            this.anthropic = new Anthropic({ apiKey: anthropicKey });
            logger.info('Anthropic API가 초기화되었습니다 (환경변수).');
        } else {
            this.anthropic = null;
            logger.warn('ANTHROPIC_API_KEY 환경변수가 없어 해당 기능을 사용할 수 없습니다.');
        }

        this.mcpServer = new FileSystemMCPServer();
        this.conversationContext = [];
        this.setupAI();
    }

    async setupAI() {
        try {
            await this.mcpServer.initialize();
            logger.info('AI 인터페이스가 MCP 서버와 연동되었습니다.');
        } catch (error) {
            logger.error('AI 인터페이스 초기화 실패:', error);
            throw error;
        }
    }

    async processCommand(command) {
        try {
            // 대화 맥락에 명령어 추가
            this.conversationContext.push({ role: 'user', content: command });

            // 1. 명령어 분석 및 의도 파악
            const analysis = await this.analyzeCommand(command);
            console.log('\n🤔 AI 분석:', analysis.explanation);

            // 2. 창의적 해결책 도출
            const solution = await this.generateCreativeSolution(analysis);
            console.log('\n💡 해결 방안:', solution.explanation);

            // 3. 실행 계획 수립
            const plan = await this.createExecutionPlan(analysis, solution);
            console.log('\n📋 실행 계획:', plan.steps.map(step => `- ${step.description}`).join('\n'));

            // 4. 계획 실행
            const results = await this.executePlan(plan);
            
            // 5. 결과 요약 및 피드백
            const summary = await this.summarizeResults(results, analysis);
            console.log('\n✨ 작업 결과:', summary.summary);
            
            if (summary.suggestions.length > 0) {
                console.log('\n💭 추가 제안:');
                summary.suggestions.forEach(suggestion => console.log(`- ${suggestion}`));
            }

            // 대화 맥락에 AI 응답 추가
            this.conversationContext.push({ 
                role: 'assistant', 
                content: JSON.stringify({ analysis, solution, results, summary })
            });

            return { analysis, solution, results, summary };
        } catch (error) {
            logger.error('AI 명령 처리 중 오류:', error);
            throw new Error('AI가 명령을 처리하는 중 오류가 발생했습니다.');
        }
    }

    async analyzeCommand(command) {
        // 사용 가능한 AI 서비스 선택
        if (this.anthropic) {
            // Claude AI를 사용하여 명령어 분석
            const systemPrompt = `당신은 파일 시스템 관리 AI입니다. 사용자의 자연어 명령을 분석하여 의도와 필요한 작업을 파악해야 합니다.\n\n분석 시 다음 사항을 고려하세요:\n1. 사용자의 주요 의도와 목표\n2. 명령에 포함된 파일/디렉토리 경로\n3. 필요한 파일 시스템 작업\n4. 태그나 메타데이터 관련 요구사항\n5. 검색이나 필터링 조건\n6. 작업의 우선순위와 순서\n7. 사용자의 선호도나 스타일 (예: '깔끔하게', '개발자처럼')\n8. 이전 대화 맥락\n\n응답은 반드시 아래 JSON 형식만 반환하세요. 설명, 코드블록, 텍스트 없이 오직 JSON만!\n{\n  "intent": "사용자의 주요 의도",\n  "style": "작업 스타일/선호도",\n  "targets": ["관련된 파일/디렉토리 경로"],\n  "operations": ["필요한 작업 목록"],\n  "constraints": {\n    "filters": ["검색/필터링 조건"],\n    "tags": ["관련 태그"],\n    "metadata": {"키": "값"},\n    "style_preferences": ["스타일 관련 선호도"]\n  },\n  "priority": "높음/중간/낮음",\n  "explanation": "전체 분석 설명"\n}`;
            const userMessages = [
                ...this.conversationContext.filter(m => m.role !== 'system'),
                { role: "user", content: command }
            ];
            const response = await this.anthropic.messages.create({
                model: "claude-3-5-sonnet-20241022",
                max_tokens: 1000,
                system: systemPrompt,
                messages: userMessages
            });

            // 코드블록/공백/개행 제거 후 JSON 파싱
            let content = response.content[0].text.trim();
            content = content.replace(/^```json|```$/g, '').trim();
            try {
                return JSON.parse(content);
            } catch (e) {
                throw new Error('Claude 응답 파싱 오류: ' + content);
            }
        } else if (this.openai) {
            // OpenAI를 사용하여 명령어 분석
            const response = await this.openai.chat.completions.create({
                model: "gpt-4-turbo-preview",
                messages: [
                    {
                        role: "system",
                        content: `당신은 파일 시스템 관리 AI입니다. 사용자의 자연어 명령을 분석하여 의도와 필요한 작업을 파악해야 합니다.
                        
                        분석 시 다음 사항을 고려하세요:
                        1. 사용자의 주요 의도와 목표
                        2. 명령에 포함된 파일/디렉토리 경로
                        3. 필요한 파일 시스템 작업
                        4. 태그나 메타데이터 관련 요구사항
                        5. 검색이나 필터링 조건
                        6. 작업의 우선순위와 순서
                        7. 사용자의 선호도나 스타일 (예: "깔끔하게", "개발자처럼")
                        8. 이전 대화 맥락
                        
                        응답은 다음 JSON 형식이어야 합니다:
                        {
                            "intent": "사용자의 주요 의도",
                            "style": "작업 스타일/선호도",
                            "targets": ["관련된 파일/디렉토리 경로"],
                            "operations": ["필요한 작업 목록"],
                            "constraints": {
                                "filters": ["검색/필터링 조건"],
                                "tags": ["관련 태그"],
                                "metadata": {"키": "값"},
                                "style_preferences": ["스타일 관련 선호도"]
                            },
                            "priority": "높음/중간/낮음",
                            "explanation": "전체 분석 설명"
                        }`
                    },
                    ...this.conversationContext,
                    {
                        role: "user",
                        content: command
                    }
                ]
            });

            return JSON.parse(response.choices[0].message.content);
        } else {
            throw new Error('사용 가능한 AI 서비스가 없습니다.');
        }
    }

    async generateCreativeSolution(analysis) {
        // Claude AI를 사용하여 창의적 해결책 도출
        const response = await this.anthropic.messages.create({
            model: "claude-3-haiku-20240307",
            max_tokens: 1000,
            messages: [
                {
                    role: "system",
                    content: `분석된 명령을 바탕으로 창의적인 해결책을 제시하세요.
                    
                    고려사항:
                    1. 사용자의 스타일 선호도 반영
                    2. 효율적인 작업 순서
                    3. 예상되는 문제점과 대비책
                    4. 추가적인 개선 가능성
                    
                    응답은 다음 JSON 형식이어야 합니다:
                    {
                        "approach": "전체 접근 방식",
                        "steps": ["주요 단계"],
                        "considerations": ["고려사항"],
                        "potential_issues": ["예상 문제점"],
                        "improvements": ["개선 가능성"],
                        "explanation": "해결 방안 설명"
                    }`
                },
                ...this.conversationContext,
                {
                    role: "user",
                    content: JSON.stringify(analysis)
                }
            ]
        });

        return JSON.parse(response.content[0].text);
    }

    async createExecutionPlan(analysis, solution) {
        // Claude AI를 사용하여 실행 계획 수립
        const response = await this.anthropic.messages.create({
            model: "claude-3-haiku-20240307",
            max_tokens: 1000,
            messages: [
                {
                    role: "system",
                    content: `분석과 해결 방안을 바탕으로 구체적인 실행 계획을 수립하세요.
                    
                    MCP 서버의 기능:
                    1. 파일 시스템 관리
                       - 파일/디렉토리 CRUD
                       - 파일 이동/복사
                       - 파일 정리/분류
                    2. 검색 엔진
                       - 파일 내용 검색
                       - 메타데이터 검색
                       - 태그 기반 검색
                    3. 태그 관리
                       - 태그 추가/제거
                       - 태그 기반 분류
                    4. 메타데이터 관리
                       - 메타데이터 추가/수정
                       - 메타데이터 기반 정리
                    
                    응답은 다음 JSON 형식이어야 합니다:
                    {
                        "steps": [
                            {
                                "operation": "작업_타입",
                                "parameters": {
                                    "path": "경로",
                                    "content": "내용",
                                    "source": "소스경로",
                                    "destination": "대상경로",
                                    "pattern": "검색패턴",
                                    "tags": ["태그1", "태그2"],
                                    "metadata": {"키": "값"}
                                },
                                "description": "이 단계에서 수행할 작업 설명",
                                "style": "작업 스타일",
                                "fallback": "실패 시 대체 방안"
                            }
                        ],
                        "expected_outcome": "예상되는 최종 결과",
                        "style_guidelines": ["스타일 가이드라인"]
                    }`
                },
                ...this.conversationContext,
                {
                    role: "user",
                    content: JSON.stringify({ analysis, solution })
                }
            ]
        });

        return JSON.parse(response.content[0].text);
    }

    async executePlan(plan) {
        const results = [];
        
        for (const step of plan.steps) {
            try {
                console.log(`\n🔄 실행 중: ${step.description}`);
                const result = await this.executeStep(step);
                results.push({
                    step: step.description,
                    success: true,
                    result: result,
                    style: step.style
                });
            } catch (error) {
                console.log(`\n⚠️ 오류 발생: ${error.message}`);
                results.push({
                    step: step.description,
                    success: false,
                    error: error.message,
                    style: step.style
                });

                // 대체 방안 시도
                if (step.fallback) {
                    console.log(`\n🔄 대체 방안 시도: ${step.fallback}`);
                    try {
                        const fallbackResult = await this.executeFallback(step);
                        results.push({
                            step: `대체 방안: ${step.fallback}`,
                            success: true,
                            result: fallbackResult,
                            style: step.style
                        });
                    } catch (fallbackError) {
                        console.log(`\n❌ 대체 방안 실패: ${fallbackError.message}`);
                        results.push({
                            step: `대체 방안: ${step.fallback}`,
                            success: false,
                            error: fallbackError.message,
                            style: step.style
                        });
                    }
                }

                // 계획 조정
                const adjustedPlan = await this.adjustPlan(plan, results);
                if (adjustedPlan) {
                    return await this.executePlan(adjustedPlan);
                }
            }
        }

        return results;
    }

    async executeStep(step) {
        const { operation, parameters, style } = step;

        // 스타일 가이드라인 적용
        if (style) {
            parameters.style = style;
        }

        switch (operation) {
            case 'list':
                return await this.mcpServer.core.fileSystem.listFiles(parameters.path);
            case 'read':
                return await this.mcpServer.core.fileSystem.readFile(parameters.path);
            case 'create':
                return await this.mcpServer.core.fileSystem.createFile(parameters.path, parameters.content);
            case 'update':
                return await this.mcpServer.core.fileSystem.updateFile(parameters.path, parameters.content);
            case 'delete':
                return await this.mcpServer.core.fileSystem.deleteFile(parameters.path);
            case 'move':
                return await this.mcpServer.core.fileSystem.moveFile(parameters.source, parameters.destination);
            case 'copy':
                return await this.mcpServer.core.fileSystem.copyFile(parameters.source, parameters.destination);
            case 'search':
                return await this.mcpServer.core.searchEngine.search(parameters.pattern, parameters.path);
            case 'add-tag':
                return await this.mcpServer.core.tagManager.addTags(parameters.path, parameters.tags);
            case 'remove-tag':
                return await this.mcpServer.core.tagManager.removeTags(parameters.path, parameters.tags);
            case 'list-tags':
                return await this.mcpServer.core.tagManager.getTags(parameters.path);
            case 'organize':
                return await this.mcpServer.core.fileSystem.organizeFiles(parameters.source, parameters.destination);
            case 'update-metadata':
                return await this.mcpServer.core.fileSystem.updateMetadata(parameters.path, parameters.metadata);
            case 'get-metadata':
                return await this.mcpServer.core.fileSystem.getMetadata(parameters.path);
            default:
                throw new Error(`지원하지 않는 작업: ${operation}`);
        }
    }

    async executeFallback(step) {
        // Claude AI를 사용하여 대체 방안 실행
        const response = await this.anthropic.messages.create({
            model: "claude-3-haiku-20240307",
            max_tokens: 1000,
            messages: [
                {
                    role: "system",
                    content: `실패한 작업에 대한 대체 방안을 실행하세요.
                    
                    응답은 다음 JSON 형식이어야 합니다:
                    {
                        "operation": "대체_작업_타입",
                        "parameters": {
                            "path": "경로",
                            "content": "내용",
                            "source": "소스경로",
                            "destination": "대상경로",
                            "pattern": "검색패턴",
                            "tags": ["태그1", "태그2"],
                            "metadata": {"키": "값"}
                        },
                        "explanation": "대체 방안 설명"
                    }`
                },
                ...this.conversationContext,
                {
                    role: "user",
                    content: JSON.stringify(step)
                }
            ]
        });

        const fallbackStep = JSON.parse(response.content[0].text);
        return await this.executeStep(fallbackStep);
    }

    async adjustPlan(originalPlan, results) {
        // Claude AI를 사용하여 계획 조정
        const response = await this.anthropic.messages.create({
            model: "claude-3-haiku-20240307",
            max_tokens: 1000,
            messages: [
                {
                    role: "system",
                    content: `실행 중 오류가 발생했습니다. 원래 계획과 결과를 바탕으로 계획을 조정하세요.
                    
                    응답은 다음 JSON 형식이어야 합니다:
                    {
                        "adjusted_steps": [
                            {
                                "operation": "작업_타입",
                                "parameters": {
                                    "path": "경로",
                                    "content": "내용",
                                    "source": "소스경로",
                                    "destination": "대상경로",
                                    "pattern": "검색패턴",
                                    "tags": ["태그1", "태그2"],
                                    "metadata": {"키": "값"}
                                },
                                "description": "조정된 작업 설명",
                                "style": "작업 스타일",
                                "fallback": "실패 시 대체 방안"
                            }
                        ],
                        "explanation": "계획 조정 이유"
                    }`
                },
                ...this.conversationContext,
                {
                    role: "user",
                    content: JSON.stringify({
                        original_plan: originalPlan,
                        results: results
                    })
                }
            ]
        });

        const adjustment = JSON.parse(response.content[0].text);
        console.log('\n🔄 계획 조정:', adjustment.explanation);
        
        return {
            steps: adjustment.adjusted_steps,
            expected_outcome: originalPlan.expected_outcome,
            style_guidelines: originalPlan.style_guidelines
        };
    }

    async summarizeResults(results, analysis) {
        // Claude AI를 사용하여 결과 요약
        const response = await this.anthropic.messages.create({
            model: "claude-3-haiku-20240307",
            max_tokens: 1000,
            messages: [
                {
                    role: "system",
                    content: `실행 결과를 요약하고 사용자에게 친숙한 형태로 설명하세요.
                    
                    응답은 다음 JSON 형식이어야 합니다:
                    {
                        "summary": "전체 작업 요약",
                        "details": [
                            {
                                "step": "작업 단계",
                                "result": "결과 설명",
                                "style": "적용된 스타일"
                            }
                        ],
                        "suggestions": ["추가 작업 제안"],
                        "style_feedback": "스타일 관련 피드백"
                    }`
                },
                ...this.conversationContext,
                {
                    role: "user",
                    content: JSON.stringify({
                        results: results,
                        analysis: analysis
                    })
                }
            ]
        });

        return JSON.parse(response.content[0].text);
    }

    async start() {
        logger.info('AI 모드가 시작되었습니다.');
        console.log('\n안녕하세요! 저는 파일 시스템 관리 AI 비서입니다. 😊');
        console.log('자연스러운 대화로 파일 시스템을 관리할 수 있습니다.');
        console.log('\n예시:');
        console.log('- "D 드라이브의 내용을 깔끔하게 정리해줘"');
        console.log('- "개발자처럼 프로젝트 파일들을 정리해줘"');
        console.log('- "최근에 수정된 파일들을 예쁘게 보여줘"');
        console.log('- "종료"를 입력하면 프로그램이 종료됩니다.\n');

        while (true) {
            const { command } = await inquirer.prompt([{
                type: 'input',
                name: 'command',
                message: '무엇을 도와드릴까요?',
                prefix: '🤖'
            }]);

            if (command.toLowerCase() === '종료') {
                console.log('AI 모드를 종료합니다. 안녕히 가세요! 👋');
                break;
            }

            try {
                await this.processCommand(command);
            } catch (error) {
                console.log('오류가 발생했습니다:', error.message);
            }
        }
    }
} 