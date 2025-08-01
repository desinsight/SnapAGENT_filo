#!/usr/bin/env node

import { AIInterface } from './AIInterface.js';
import inquirer from 'inquirer';
import { logger } from '../utils/logger.js';
import fs from 'fs';
import path from 'path';
import readline from 'readline';

async function main() {
    try {
        // 환경변수에서 API 키 확인
        let openaiKey = process.env.OPENAI_API_KEY;
        let anthropicKey = process.env.ANTHROPIC_API_KEY;

        // API 키가 없는 경우에만 입력 요청
        if (!openaiKey) {
            const { inputOpenaiKey } = await inquirer.prompt([{
                type: 'password',
                name: 'inputOpenaiKey',
                message: 'OpenAI API 키를 입력하세요 (선택사항, .env 파일에 OPENAI_API_KEY로 설정 권장):',
                validate: input => input.length === 0 || input.length > 0 ? true : 'API 키를 입력해주세요.'
            }]);
            if (inputOpenaiKey) {
                process.env.OPENAI_API_KEY = inputOpenaiKey;
                openaiKey = inputOpenaiKey;
            }
        }

        if (!anthropicKey) {
            const { inputAnthropicKey } = await inquirer.prompt([{
                type: 'password',
                name: 'inputAnthropicKey',
                message: 'Anthropic API 키를 입력하세요 (선택사항, .env 파일에 ANTHROPIC_API_KEY로 설정 권장):',
                validate: input => input.length === 0 || input.length > 0 ? true : 'API 키를 입력해주세요.'
            }]);
            if (inputAnthropicKey) {
                process.env.ANTHROPIC_API_KEY = inputAnthropicKey;
                anthropicKey = inputAnthropicKey;
            }
        }

        // 최소 하나의 API 키가 있는지 확인
        if (!openaiKey && !anthropicKey) {
            throw new Error('최소 하나의 API 키가 필요합니다. .env 파일에 설정하거나 직접 입력해주세요.');
        }

        const ai = new AIInterface();
        console.log('안녕하세요! 저는 파일 시스템 관리 AI 비서입니다. 😊');
        console.log('자연스러운 대화로 파일 시스템을 관리할 수 있습니다.');
        console.log('예시:');
        console.log('- "D 드라이브의 내용을 깔끔하게 정리해줘"');
        console.log('- "개발자처럼 프로젝트 파일들을 정리해줘"');
        console.log('- "최근에 수정된 파일들을 예쁘게 보여줘"');
        console.log('- "종료"를 입력하면 프로그램이 종료됩니다.\n');

        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        rl.setPrompt('> ');
        rl.prompt();

        rl.on('line', async (line) => {
            const command = line.trim();
            if (command === '종료') {
                rl.close();
                process.exit(0);
            }
            try {
                await ai.processCommand(command);
            } catch (e) {
                console.error('오류:', e.message);
            }
            rl.prompt();
        });
    } catch (error) {
        logger.error('AI 모드 시작 실패:', error);
        process.exit(1);
    }
}

main(); 