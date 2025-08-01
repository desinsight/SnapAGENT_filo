import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { logger } from '../utils/logger.js';
import { config } from '../config.js';
import connectDB from '../utils/db.js';
import authRoutes from '../routes/auth.js';

export class WebServer {
    constructor(mcpServer) {
        this.mcpServer = mcpServer;
        this.app = express();
        this.server = null;
        this.wss = null;
        this.dbConnected = false;
        
        // MongoDB 연결을 비동기로 처리
        this.initializeDB();
        this.setupMiddleware();
        this.setupRoutes();
    }

    async initializeDB() {
        try {
            this.dbConnected = await connectDB();
            if (this.dbConnected) {
                console.log('✅ WebServer: MongoDB 연결 성공');
            } else {
                console.log('ℹ️ WebServer: MongoDB 없이 실행 중');
            }
        } catch (error) {
            console.warn('⚠️ WebServer: MongoDB 연결 실패, 서버는 계속 실행됩니다');
            this.dbConnected = false;
        }
    }

    setupMiddleware() {
        this.app.use(cors());
        this.app.use(express.json());
        this.app.use(express.urlencoded({ extended: true }));
    }

    setupRoutes() {
        // 기본 상태 확인
        this.app.get('/api/status', (req, res) => {
            res.json({ 
                status: 'running', 
                timestamp: new Date().toISOString(),
                version: '1.0.0'
            });
        });

        // 드라이브 목록
        this.app.get('/api/drives', async (req, res) => {
            try {
                const drives = await this.mcpServer.fileSystem.listDrives();
                res.json({ success: true, data: drives });
            } catch (error) {
                logger.error('드라이브 목록 조회 실패:', error);
                res.status(500).json({ success: false, error: error.message });
            }
        });

        // 파일 목록
        this.app.get('/api/files', async (req, res) => {
            try {
                const { path = '.' } = req.query;
                console.log('🔍 [API] /api/files 요청:', { path, query: req.query });
                
                const result = await this.mcpServer.fileSystem.listFiles(path);
                console.log('📁 [API] /api/files 응답:', { 
                    path, 
                    success: true, 
                    directoriesCount: result?.directories?.length || 0,
                    filesCount: result?.files?.length || 0 
                });
                
                res.json({ success: true, data: result });
            } catch (error) {
                console.error('❌ [API] /api/files 에러:', { path, error: error.message });
                logger.error('파일 목록 조회 실패:', error);
                res.status(500).json({ success: false, error: error.message });
            }
        });

        // 파일 읽기
        this.app.get('/api/files/read', async (req, res) => {
            try {
                const { path } = req.query;
                if (!path) {
                    return res.status(400).json({ success: false, error: '파일 경로가 필요합니다.' });
                }
                const result = await this.mcpServer.fileSystem.readFile(path);
                res.json({ success: true, data: result });
            } catch (error) {
                logger.error('파일 읽기 실패:', error);
                res.status(500).json({ success: false, error: error.message });
            }
        });

        // 파일 생성
        this.app.post('/api/files/create', async (req, res) => {
            try {
                const { path, content } = req.body;
                if (!path || content === undefined) {
                    return res.status(400).json({ success: false, error: '파일 경로와 내용이 필요합니다.' });
                }
                const result = await this.mcpServer.fileSystem.createFile(path, content);
                res.json({ success: true, data: result });
            } catch (error) {
                logger.error('파일 생성 실패:', error);
                res.status(500).json({ success: false, error: error.message });
            }
        });

        // 파일 업데이트
        this.app.put('/api/files/update', async (req, res) => {
            try {
                const { path, content } = req.body;
                if (!path || content === undefined) {
                    return res.status(400).json({ success: false, error: '파일 경로와 내용이 필요합니다.' });
                }
                const result = await this.mcpServer.fileSystem.updateFile(path, content);
                res.json({ success: true, data: result });
            } catch (error) {
                logger.error('파일 업데이트 실패:', error);
                res.status(500).json({ success: false, error: error.message });
            }
        });

        // 파일 삭제
        this.app.delete('/api/files/delete', async (req, res) => {
            try {
                const { path } = req.query;
                if (!path) {
                    return res.status(400).json({ success: false, error: '파일 경로가 필요합니다.' });
                }
                await this.mcpServer.fileSystem.deleteFile(path);
                res.json({ success: true });
            } catch (error) {
                logger.error('파일 삭제 실패:', error);
                res.status(500).json({ success: false, error: error.message });
            }
        });

        // 파일 이동
        this.app.post('/api/files/move', async (req, res) => {
            try {
                const { source, destination } = req.body;
                if (!source || !destination) {
                    return res.status(400).json({ success: false, error: '원본과 대상 경로가 필요합니다.' });
                }
                const result = await this.mcpServer.fileSystem.moveFile(source, destination);
                res.json({ success: true, data: result });
            } catch (error) {
                logger.error('파일 이동 실패:', error);
                res.status(500).json({ success: false, error: error.message });
            }
        });

        // 파일 복사
        this.app.post('/api/files/copy', async (req, res) => {
            try {
                const { source, destination } = req.body;
                if (!source || !destination) {
                    return res.status(400).json({ success: false, error: '원본과 대상 경로가 필요합니다.' });
                }
                const result = await this.mcpServer.fileSystem.copyFile(source, destination);
                res.json({ success: true, data: result });
            } catch (error) {
                logger.error('파일 복사 실패:', error);
                res.status(500).json({ success: false, error: error.message });
            }
        });

        // 파일 검색
        this.app.get('/api/search', async (req, res) => {
            try {
                const { query, path = '.' } = req.query;
                if (!query) {
                    return res.status(400).json({ success: false, error: '검색어가 필요합니다.' });
                }
                const results = await this.mcpServer.searchEngine.search(query, path);
                res.json({ success: true, data: results });
            } catch (error) {
                logger.error('파일 검색 실패:', error);
                res.status(500).json({ success: false, error: error.message });
            }
        });

        // 태그 관리
        this.app.post('/api/tags/add', async (req, res) => {
            try {
                const { path, tags } = req.body;
                if (!path || !tags) {
                    return res.status(400).json({ success: false, error: '파일 경로와 태그가 필요합니다.' });
                }
                const result = await this.mcpServer.tagManager.addTags(path, tags);
                res.json({ success: true, data: result });
            } catch (error) {
                logger.error('태그 추가 실패:', error);
                res.status(500).json({ success: false, error: error.message });
            }
        });

        this.app.get('/api/tags', async (req, res) => {
            try {
                const { path } = req.query;
                if (!path) {
                    return res.status(400).json({ success: false, error: '파일 경로가 필요합니다.' });
                }
                const tags = await this.mcpServer.tagManager.getTags(path);
                res.json({ success: true, data: tags });
            } catch (error) {
                logger.error('태그 조회 실패:', error);
                res.status(500).json({ success: false, error: error.message });
            }
        });

        // AI 연결 엔드포인트
        this.app.post('/api/ai/process', async (req, res) => {
            try {
                const { aiProvider, action, params } = req.body;
                
                if (!aiProvider || !action) {
                    return res.status(400).json({ 
                        success: false, 
                        error: 'AI 제공자와 액션이 필요합니다.' 
                    });
                }

                // 자연어 명령 해석 (parse_command)
                if (action === 'parse_command' && params?.command) {
                    // MCP 서버의 AI 인터페이스 활용
                    const aiInterface = this.mcpServer.aiInterface;
                    const result = await aiInterface.analyzeCommand(params.command);
                    return res.json({ success: true, data: result });
                }

                // 기존 AI 처리 로직 (향후 확장)
                const result = await this.processAIAction(aiProvider, action, params);
                res.json({ success: true, data: result });
            } catch (error) {
                logger.error('AI 처리 실패:', error);
                res.status(500).json({ success: false, error: error.message });
            }
        });

        // 즐겨찾기 관리 (인메모리 저장소)
        this.favorites = [];
        this.recentFiles = [];

        // 즐겨찾기 API
        this.app.get('/api/favorites', (req, res) => {
            try {
                res.json(this.favorites);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        this.app.post('/api/favorites', (req, res) => {
            try {
                const favorite = {
                    id: Date.now().toString(),
                    ...req.body,
                    addedAt: new Date()
                };
                this.favorites.push(favorite);
                res.json(favorite);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        this.app.delete('/api/favorites/:id', (req, res) => {
            try {
                this.favorites = this.favorites.filter(f => f.id !== req.params.id);
                res.json({ success: true });
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        // 최근 파일 API
        this.app.get('/api/recent-files', (req, res) => {
            try {
                const limit = parseInt(req.query.limit) || 10;
                res.json(this.recentFiles.slice(0, limit));
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        this.app.post('/api/recent-files', (req, res) => {
            try {
                const recentFile = {
                    id: Date.now().toString(),
                    ...req.body,
                    accessedAt: new Date()
                };
                
                // 중복 제거
                this.recentFiles = this.recentFiles.filter(f => f.path !== recentFile.path);
                
                // 맨 앞에 추가
                this.recentFiles.unshift(recentFile);
                
                // 최대 100개까지만 보관
                if (this.recentFiles.length > 100) {
                    this.recentFiles = this.recentFiles.slice(0, 100);
                }
                
                res.json(recentFile);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        // 정적 파일 서빙 (프론트엔드)
        this.app.use(express.static('public'));

        this.app.use('/api/access', authRoutes);
    }

    setupWebSocket() {
        if (!this.server) {
            logger.error('WebSocket을 설정하기 전에 서버가 초기화되어야 합니다.');
            return;
        }
        this.wss = new WebSocketServer({ server: this.server });
        
        this.wss.on('connection', (ws) => {
            logger.info('WebSocket 클라이언트 연결됨');
            
            ws.on('message', async (message) => {
                try {
                    const data = JSON.parse(message);
                    const response = await this.handleWebSocketMessage(data);
                    ws.send(JSON.stringify(response));
                } catch (error) {
                    logger.error('WebSocket 메시지 처리 실패:', error);
                    ws.send(JSON.stringify({ 
                        status: 'error', 
                        message: error.message 
                    }));
                }
            });

            ws.on('close', () => {
                logger.info('WebSocket 클라이언트 연결 해제됨');
            });
        });
    }

    async handleWebSocketMessage(data) {
        const { type, params } = data;
        
        switch (type) {
            case 'list_directory':
                const files = await this.mcpServer.fileSystem.listFiles(params.path);
                return { status: 'success', data: files };
            
            case 'search_files':
                const results = await this.mcpServer.searchEngine.search(params.query, params.path);
                return { status: 'success', data: results };
            
            default:
                throw new Error(`알 수 없는 메시지 타입: ${type}`);
        }
    }

    async processAIAction(aiProvider, action, params) {
        // AI 제공자별 처리 로직
        switch (aiProvider) {
            case 'claude':
                return await this.processClaudeAction(action, params);
            case 'openai':
                return await this.processOpenAIAction(action, params);
            default:
                throw new Error(`지원하지 않는 AI 제공자: ${aiProvider}`);
        }
    }

    async processClaudeAction(action, params) {
        // Claude AI 처리 로직 (향후 구현)
        return { 
            provider: 'claude', 
            action, 
            result: 'Claude AI 처리 결과 (구현 예정)' 
        };
    }

    async processOpenAIAction(action, params) {
        // OpenAI 처리 로직 (향후 구현)
        return { 
            provider: 'openai', 
            action, 
            result: 'OpenAI 처리 결과 (구현 예정)' 
        };
    }

    start(port = config.server.port) {
        try {
            this.server = createServer(this.app);
            
            this.server.listen(port, () => {
                logger.info(`웹 서버가 포트 ${port}에서 시작되었습니다.`);
                console.log(`HTTP 서버가 포트 ${port}에서 시작되었습니다.`);
                logger.info(`API 엔드포인트: http://localhost:${port}/api`);
                logger.info(`웹 인터페이스: http://localhost:${port}`);
                this.setupWebSocket(); // listen 콜백 후에 WebSocket 설정
            });

            this.server.on('error', (error) => {
                logger.error('웹 서버 오류:', error);
                throw error; // 에러 발생 시 프로세스 종료
            });

        } catch (error) {
            logger.error('웹 서버 시작 실패:', error);
            process.exit(1);
        }
    }

    async stop() {
        if (this.server) {
            return new Promise((resolve, reject) => {
                this.server.close((error) => {
                    if (error) {
                        logger.error('웹 서버 종료 실패:', error);
                        reject(error);
                    } else {
                        logger.info('웹 서버가 종료되었습니다.');
                        resolve();
                    }
                });
            });
        }
    }
} 