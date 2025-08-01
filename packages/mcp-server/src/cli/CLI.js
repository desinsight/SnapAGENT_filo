import fs from 'fs/promises';
import path from 'path';
import inquirer from 'inquirer';
import { logger } from '../utils/logger.js';

export class CLI {
    constructor(mcpServer) {
        this.mcpServer = mcpServer;
        this.commands = {
            'list': this.listFiles.bind(this),
            'read': this.readFile.bind(this),
            'create': this.createFile.bind(this),
            'update': this.updateFile.bind(this),
            'delete': this.deleteFile.bind(this),
            'move': this.moveFile.bind(this),
            'copy': this.copyFile.bind(this),
            'mkdir': this.createDirectory.bind(this),
            'rmdir': this.removeDirectory.bind(this),
            'search': this.searchFiles.bind(this),
            'drives': this.listDrives.bind(this),
            'help': this.showHelp.bind(this),
            'exit': () => process.exit(0)
        };
    }

    // 파일 크기를 읽기 쉬운 형식으로 변환
    formatSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    async start() {
        logger.info('CLI 모드가 시작되었습니다.');
        await this.showHelp();
        await this.prompt();
    }

    async showHelp() {
        console.log('\n사용 가능한 명령어:');
        console.log('  drives               - 사용 가능한 드라이브 목록');
        console.log('  list <path>          - 디렉토리 내용 보기');
        console.log('  read <path>          - 파일 내용 읽기');
        console.log('  create <path>        - 새 파일 생성');
        console.log('  update <path>        - 파일 내용 수정');
        console.log('  delete <path>        - 파일 삭제');
        console.log('  move <src> <dest>    - 파일 이동');
        console.log('  copy <src> <dest>    - 파일 복사');
        console.log('  mkdir <path>         - 디렉토리 생성');
        console.log('  rmdir <path>         - 디렉토리 삭제');
        console.log('  search <query>       - 파일 검색');
        console.log('  help                 - 도움말 보기');
        console.log('  exit                 - 종료\n');
    }

    async prompt() {
        while (true) {
            const { command } = await inquirer.prompt([{
                type: 'input',
                name: 'command',
                message: '명령어를 입력하세요:',
                prefix: '>'
            }]);

            await this.processCommand(command);
        }
    }

    async processCommand(input) {
        const [cmd, ...args] = input.trim().split(' ');
        const command = this.commands[cmd];

        if (!command) {
            console.log('알 수 없는 명령어입니다. help를 입력하여 사용 가능한 명령어를 확인하세요.');
            return;
        }

        try {
            await command(...args);
        } catch (error) {
            logger.error('명령어 실행 중 오류 발생:', error);
            console.log('오류가 발생했습니다:', error.message);
        }
    }

    async listDrives() {
        try {
            const drives = await this.mcpServer.fileSystem.listDrives();
            console.log('\n사용 가능한 드라이브:');
            for (const drive of drives) {
                const freeGB = (drive.freeSpace / (1024 * 1024 * 1024)).toFixed(2);
                const totalGB = (drive.totalSpace / (1024 * 1024 * 1024)).toFixed(2);
                console.log(`  ${drive.name} - ${freeGB}GB / ${totalGB}GB 사용 가능`);
            }
        } catch (error) {
            throw new Error(`드라이브 목록 조회 실패: ${error.message}`);
        }
    }

    async listFiles(dirPath = '.') {
        try {
            const result = await this.mcpServer.fileSystem.listFiles(dirPath);
            console.log('\n디렉토리 내용:');
            
            // 디렉토리 먼저 출력
            for (const dir of result.directories) {
                console.log(`📁 ${dir.name.padEnd(30)} <DIR>          ${dir.modified.toLocaleString()}`);
            }
            
            // 파일 출력
            for (const file of result.files) {
                const size = this.formatSize(file.size);
                console.log(`📄 ${file.name.padEnd(30)} ${size.padStart(12)}  ${file.modified.toLocaleString()}`);
            }
            
            console.log(`\n총 ${result.directories.length}개 디렉토리, ${result.files.length}개 파일`);
            
        } catch (error) {
            throw new Error(`디렉토리 읽기 실패: ${error.message}`);
        }
    }

    async readFile(filePath) {
        try {
            const result = await this.mcpServer.fileSystem.readFile(filePath);
            console.log('\n파일 내용:');
            console.log(result.content);
        } catch (error) {
            throw new Error(`파일 읽기 실패: ${error.message}`);
        }
    }

    async createFile(filePath) {
        try {
            const { content } = await inquirer.prompt([{
                type: 'input',
                name: 'content',
                message: '파일 내용을 입력하세요:'
            }]);
            await fs.writeFile(filePath, content, 'utf8');
            console.log('파일이 생성되었습니다.');
        } catch (error) {
            throw new Error(`파일 생성 실패: ${error.message}`);
        }
    }

    async updateFile(filePath) {
        try {
            const { content } = await inquirer.prompt([{
                type: 'input',
                name: 'content',
                message: '새로운 파일 내용을 입력하세요:'
            }]);
            await fs.writeFile(filePath, content, 'utf8');
            console.log('파일이 업데이트되었습니다.');
        } catch (error) {
            throw new Error(`파일 업데이트 실패: ${error.message}`);
        }
    }

    async deleteFile(filePath) {
        try {
            const { confirm } = await inquirer.prompt([{
                type: 'confirm',
                name: 'confirm',
                message: `정말로 ${filePath}를 삭제하시겠습니까?`
            }]);
            if (confirm) {
                await fs.unlink(filePath);
                console.log('파일이 삭제되었습니다.');
            }
        } catch (error) {
            throw new Error(`파일 삭제 실패: ${error.message}`);
        }
    }

    async moveFile(src, dest) {
        try {
            await fs.rename(src, dest);
            console.log('파일이 이동되었습니다.');
        } catch (error) {
            throw new Error(`파일 이동 실패: ${error.message}`);
        }
    }

    async copyFile(src, dest) {
        try {
            await fs.copyFile(src, dest);
            console.log('파일이 복사되었습니다.');
        } catch (error) {
            throw new Error(`파일 복사 실패: ${error.message}`);
        }
    }

    async createDirectory(dirPath) {
        try {
            await fs.mkdir(dirPath, { recursive: true });
            console.log('디렉토리가 생성되었습니다.');
        } catch (error) {
            throw new Error(`디렉토리 생성 실패: ${error.message}`);
        }
    }

    async removeDirectory(dirPath) {
        try {
            const { confirm } = await inquirer.prompt([{
                type: 'confirm',
                name: 'confirm',
                message: `정말로 ${dirPath} 디렉토리와 그 내용을 모두 삭제하시겠습니까?`
            }]);
            if (confirm) {
                await fs.rm(dirPath, { recursive: true, force: true });
                console.log('디렉토리가 삭제되었습니다.');
            }
        } catch (error) {
            throw new Error(`디렉토리 삭제 실패: ${error.message}`);
        }
    }

    async searchFiles(query) {
        try {
            if (!query) {
                const { searchQuery } = await inquirer.prompt([{
                    type: 'input',
                    name: 'searchQuery',
                    message: '검색어를 입력하세요:'
                }]);
                query = searchQuery;
            }

            const results = await this.mcpServer.searchEngine.search(query, '.');
            console.log('\n검색 결과:');
            
            if (results.length === 0) {
                console.log('검색 결과가 없습니다.');
                return;
            }

            for (const result of results.slice(0, 10)) { // 상위 10개만 표시
                console.log(`  ${result.path} (점수: ${result.score})`);
            }

            if (results.length > 10) {
                console.log(`  ... 그리고 ${results.length - 10}개 더`);
            }
        } catch (error) {
            throw new Error(`파일 검색 실패: ${error.message}`);
        }
    }
} 