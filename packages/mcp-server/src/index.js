#!/usr/bin/env node

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import net from 'net';

// ES 모듈에서 __dirname 구하기
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// .env 파일 로드
dotenv.config();

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { 
  CallToolRequestSchema,
  ListToolsRequestSchema,
  InitializeRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

import { FileSystemManager } from './file-system/FileSystemManager.js';
import { SearchEngine } from './search/SearchEngine.js';
import { TagManager } from './tags/TagManager.js';
import { WebServer } from './server/WebServer.js';
import { CLI } from './cli/CLI.js';
import { AIInterface } from './ai/AIInterface.js';

import { logger } from './utils/logger.js';
import { config } from './config.js';

console.log('🔥🔥🔥 MCP index.js 진짜 실행됨! (by AI)');

export class FileSystemMCPServer {
    constructor() {
        this.fileSystem = new FileSystemManager();
        this.searchEngine = new SearchEngine();
        this.tagManager = new TagManager();
        this.server = null;
    }

    async initialize() {
        try {
            await this.fileSystem.initialize();
            await this.searchEngine.initialize();
            await this.tagManager.initialize();
            logger.info('MCP 서버가 초기화되었습니다.');
        } catch (error) {
            logger.error('MCP 서버 초기화 실패:', error);
            throw error;
        }
    }

    async startMCPServer() {
        // HTTP 모드에서는 이 메서드가 사용되지 않음
        // WebServer 클래스가 HTTP 서버를 처리함
        logger.info('MCP 서버가 HTTP 모드로 시작되었습니다.');
        
        // HTTP 모드에서는 무한 대기
        await new Promise(() => {});
    }

    async registerTools() {
        // HTTP 모드에서는 WebServer가 도구를 처리하므로 여기서는 아무것도 하지 않음
        if (!this.server) {
            logger.info('HTTP 모드: WebServer가 도구를 처리합니다.');
            return;
        }
        
        // 파일 시스템 도구들
        await this.server.setRequestHandler(ListToolsRequestSchema, async () => {
            return {
                tools: [
                    {
                        name: "list_drives",
                        description: "사용 가능한 드라이브 목록을 반환합니다.",
                        inputSchema: {
                            type: "object",
                            properties: {},
                            required: []
                        }
                    },
                    {
                        name: "list_files",
                        description: "디렉토리 내 파일 목록을 반환합니다.",
                        inputSchema: {
                            type: "object",
                            properties: {
                                path: {
                                    type: "string",
                                    description: "디렉토리 경로"
                                },
                                recursive: {
                                    type: "boolean",
                                    description: "하위 디렉토리 포함 여부",
                                    default: false
                                }
                            },
                            required: ["path"]
                        }
                    },
                    {
                        name: "read_file",
                        description: "파일 내용을 읽습니다.",
                        inputSchema: {
                            type: "object",
                            properties: {
                                path: {
                                    type: "string",
                                    description: "파일 경로"
                                },
                                encoding: {
                                    type: "string",
                                    description: "인코딩",
                                    default: "utf8"
                                }
                            },
                            required: ["path"]
                        }
                    },
                    {
                        name: "search_files",
                        description: "파일을 검색합니다.",
                        inputSchema: {
                            type: "object",
                            properties: {
                                query: {
                                    type: "string",
                                    description: "검색어"
                                },
                                path: {
                                    type: "string",
                                    description: "검색 경로",
                                    default: "."
                                }
                            },
                            required: ["query"]
                        }
                    },
                    {
                        name: "add_tags",
                        description: "파일에 태그를 추가합니다.",
                        inputSchema: {
                            type: "object",
                            properties: {
                                path: {
                                    type: "string",
                                    description: "파일 경로"
                                },
                                tags: {
                                    type: "array",
                                    items: { type: "string" },
                                    description: "추가할 태그들"
                                }
                            },
                            required: ["path", "tags"]
                        }
                    }
                ]
            };
        });

        // 도구 실행 핸들러 (HTTP 모드에서는 WebServer가 처리)
        if (this.server) {
            await this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
            const { name, arguments: args } = request.params;
            
            try {
                switch (name) {
                    case "list_drives":
                        return await this.handleListDrives();
                    
                    case "list_files":
                        return await this.handleListFiles(args);
                    
                    case "read_file":
                        return await this.handleReadFile(args);
                    
                    case "search_files":
                        return await this.handleSearchFiles(args);
                    
                    case "add_tags":
                        return await this.handleAddTags(args);
                    
                    default:
                        throw new Error(`알 수 없는 도구: ${name}`);
                }
            } catch (error) {
                logger.error(`도구 실행 실패 (${name}):`, error);
                throw error;
            }
        });
        }
    }

    async handleListDrives() {
        const drives = await this.fileSystem.listDrives();
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify(drives, null, 2)
                }
            ]
        };
    }

    async handleListFiles(args) {
        const { path, recursive = false } = args;
        const files = await this.fileSystem.listFiles(path);
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify(files, null, 2)
                }
            ]
        };
    }

    async handleReadFile(args) {
        const { path, encoding = 'utf8' } = args;
        const result = await this.fileSystem.readFile(path);
        return {
            content: [
                {
                    type: "text",
                    text: result.content
                }
            ]
        };
    }

    async handleSearchFiles(args) {
        const { query, path = '.' } = args;
        const results = await this.searchEngine.search(query, path);
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify(results, null, 2)
                }
            ]
        };
    }

    async handleAddTags(args) {
        const { path, tags } = args;
        const result = await this.tagManager.addTags(path, tags);
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify({ success: true, tags: result }, null, 2)
                }
            ]
        };
    }
}

async function startTCPServer(serverInstance, port = 5050) {
  console.log('🟣 TCP 서버 실행 준비 중...');
  const tcpServer = net.createServer((socket) => {
    let buffer = '';
    socket.on('data', async (data) => {
      buffer += data.toString();
      let lines = buffer.split('\n');
      buffer = lines.pop() || '';
      for (const line of lines) {
        if (line.trim()) {
          try {
            console.log('🟧 [MCP서버] 수신 요청:', line);
            const request = JSON.parse(line);
            // JSON-RPC 방식만 지원
            if (request.method && request.id) {
              let result = null;
              try {
                if (request.method === 'tools/call') {
                  const { name, arguments: args } = request.params;
                  switch (name) {
                    case 'list_drives':
                      result = await serverInstance.handleListDrives();
                      break;
                    case 'list_files':
                      result = await serverInstance.handleListFiles(args);
                      break;
                    case 'read_file':
                      result = await serverInstance.handleReadFile(args);
                      break;
                    case 'search_files':
                      result = await serverInstance.handleSearchFiles(args);
                      break;
                    case 'add_tags':
                      result = await serverInstance.handleAddTags(args);
                      break;
                    default:
                      throw new Error(`알 수 없는 도구: ${name}`);
                  }
                  console.log('🟨 [MCP서버] 전송 응답:', JSON.stringify({ jsonrpc: '2.0', id: request.id, result }));
                  socket.write(JSON.stringify({ jsonrpc: '2.0', id: request.id, result }) + '\n');
                } else {
                  socket.write(JSON.stringify({ jsonrpc: '2.0', id: request.id, error: { message: '지원하지 않는 메서드' } }) + '\n');
                }
              } catch (err) {
                socket.write(JSON.stringify({ jsonrpc: '2.0', id: request.id, error: { message: err.message } }) + '\n');
              }
            }
          } catch (err) {
            // 파싱 에러 무시
          }
        }
      }
    });
  });
  try {
    tcpServer.listen(port, () => {
      console.log(`🟢 MCP TCP 서버가 포트 ${port}에서 실행 중입니다.`);
    });
  } catch (err) {
    console.error('🔴 TCP 서버 listen 중 에러:', err);
  }
  console.log('🟣 TCP 서버 listen 호출 완료');
}

// 메인 실행 코드
async function main() {
    try {
        const args = process.argv.slice(2);
        const mode = args[0] || 'mcp';
        
        console.log('MCP 서버 시작 중...');
        console.log('모드:', mode);
        console.log('인수:', args);

        const server = new FileSystemMCPServer();
        console.log('MCP 서버 인스턴스 생성됨');
        
        await server.initialize();
        console.log('MCP 서버 초기화 완료');

        // AI 인터페이스 인스턴스 생성 및 할당 (선택사항)
        try {
            server.aiInterface = new AIInterface();
            console.log('AI 인터페이스 초기화 완료');
        } catch (error) {
            console.warn('AI 인터페이스 초기화 실패 (API 키 미설정):', error.message);
            console.warn('AI 기능 없이 서버를 시작합니다.');
            server.aiInterface = null;
        }

        switch (mode) {
            case 'mcp':
            case '--http':
                console.log('🟡 main: HTTP 모드 진입');
                console.log('MCP HTTP 모드로 시작...');
                const httpServer = new WebServer(server);
                console.log('HTTP 서버 인스턴스 생성됨');
                httpServer.start(5050);
                console.log('HTTP 서버가 포트 5050에서 시작되었습니다.');
                // HTTP 서버가 계속 실행되도록 대기
                await new Promise(() => {}); // 무한 대기
                break;
                
            case 'tcp':
                console.log('🟡 main: tcp case 진입');
                console.log('MCP TCP 모드로 시작...');
                await startTCPServer(server, 5050);
                // TCP 서버가 계속 실행되도록 대기
                await new Promise(() => {}); // 무한 대기
                break;
            
            case 'web':
                console.log('웹 모드로 시작...');
                const webServer = new WebServer(server);
                console.log('웹 서버 인스턴스 생성됨');
                webServer.start(3000);
                console.log('웹 서버 시작 요청됨');
                break;
            
            case 'http':
                console.log('HTTP 모드로 시작...');
                const httpServer2 = new WebServer(server);
                console.log('HTTP 서버 인스턴스 생성됨');
                httpServer2.start(5050);
                console.log('HTTP 서버가 포트 5050에서 시작되었습니다.');
                // HTTP 서버가 계속 실행되도록 대기
                await new Promise(() => {}); // 무한 대기
                break;
            
            case 'cli':
                console.log('CLI 모드로 시작...');
                const cli = new CLI(server);
                console.log('CLI 인스턴스 생성됨');
                await cli.start();
                break;
            
            default:
                console.log('사용법: node index.js [mcp|tcp|web|cli]');
                console.log('  mcp: HTTP 모드 (기본)');
                console.log('  tcp: TCP 서버 모드 (포트 5050)');
                console.log('  web: 웹 서버 모드');
                console.log('  cli: CLI 모드');
                process.exit(1);
        }
    } catch (error) {
        console.error('시작 중 오류 발생:', error);
        logger.error('시작 중 오류 발생:', error);
        process.exit(1);
    }
}

// 직접 실행 시에만 main() 호출
main(); 