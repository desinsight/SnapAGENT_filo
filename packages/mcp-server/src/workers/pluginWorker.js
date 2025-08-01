const { parentPort } = require('worker_threads');
const path = require('path');
const fs = require('fs/promises');
const logger = require('../utils/logger');

// 플러그인 작업 처리
parentPort.on('message', async (message) => {
    try {
        switch (message.type) {
            case 'install_plugin':
                await handleInstallPlugin(message.data);
                break;
            case 'uninstall_plugin':
                await handleUninstallPlugin(message.data);
                break;
            case 'enable_plugin':
                await handleEnablePlugin(message.data);
                break;
            case 'disable_plugin':
                await handleDisablePlugin(message.data);
                break;
            case 'get_plugin_info':
                await handleGetPluginInfo(message.data);
                break;
            case 'list_plugins':
                await handleListPlugins(message.data);
                break;
            default:
                throw new Error(`Unknown task type: ${message.type}`);
        }
    } catch (error) {
        logger.error('Error in plugin worker:', error);
        parentPort.postMessage({
            type: 'error',
            error: error.message
        });
    }
});

async function handleInstallPlugin(data) {
    const { name, source, version } = data;
    const pluginDir = path.join(process.cwd(), 'plugins', name);

    try {
        // 플러그인 디렉토리 생성
        await fs.mkdir(pluginDir, { recursive: true });

        // 플러그인 설치 로직
        const plugin = {
            name,
            version,
            source,
            enabled: true,
            installedAt: Date.now(),
            config: {}
        };

        parentPort.postMessage({
            type: 'plugin_update',
            data: {
                action: 'install',
                plugin
            }
        });
    } catch (error) {
        logger.error(`Error installing plugin ${name}:`, error);
        throw error;
    }
}

async function handleUninstallPlugin(data) {
    const { name } = data;
    const pluginDir = path.join(process.cwd(), 'plugins', name);

    try {
        // 플러그인 디렉토리 삭제
        await fs.rm(pluginDir, { recursive: true, force: true });

        parentPort.postMessage({
            type: 'plugin_update',
            data: {
                action: 'uninstall',
                plugin: name
            }
        });
    } catch (error) {
        logger.error(`Error uninstalling plugin ${name}:`, error);
        throw error;
    }
}

async function handleEnablePlugin(data) {
    const { name } = data;
    const pluginDir = path.join(process.cwd(), 'plugins', name);

    try {
        // 플러그인 활성화 로직
        const plugin = {
            name,
            enabled: true,
            enabledAt: Date.now()
        };

        parentPort.postMessage({
            type: 'plugin_update',
            data: {
                action: 'enable',
                plugin
            }
        });
    } catch (error) {
        logger.error(`Error enabling plugin ${name}:`, error);
        throw error;
    }
}

async function handleDisablePlugin(data) {
    const { name } = data;
    const pluginDir = path.join(process.cwd(), 'plugins', name);

    try {
        // 플러그인 비활성화 로직
        const plugin = {
            name,
            enabled: false,
            disabledAt: Date.now()
        };

        parentPort.postMessage({
            type: 'plugin_update',
            data: {
                action: 'disable',
                plugin
            }
        });
    } catch (error) {
        logger.error(`Error disabling plugin ${name}:`, error);
        throw error;
    }
}

async function handleGetPluginInfo(data) {
    const { name } = data;
    const pluginDir = path.join(process.cwd(), 'plugins', name);

    try {
        // 플러그인 정보 조회
        const packageJson = await fs.readFile(path.join(pluginDir, 'package.json'), 'utf-8');
        const pluginInfo = JSON.parse(packageJson);

        parentPort.postMessage({
            type: 'result',
            data: {
                name: pluginInfo.name,
                version: pluginInfo.version,
                description: pluginInfo.description,
                author: pluginInfo.author,
                dependencies: pluginInfo.dependencies,
                config: pluginInfo.config || {}
            }
        });
    } catch (error) {
        if (error.code === 'ENOENT') {
            parentPort.postMessage({
                type: 'result',
                data: {
                    name,
                    error: 'Plugin not found'
                }
            });
        } else {
            throw error;
        }
    }
}

async function handleListPlugins(data) {
    const { includeDisabled = false } = data;
    const pluginsDir = path.join(process.cwd(), 'plugins');

    try {
        // 플러그인 목록 조회
        const entries = await fs.readdir(pluginsDir, { withFileTypes: true });
        const plugins = [];

        for (const entry of entries) {
            if (entry.isDirectory()) {
                try {
                    const packageJson = await fs.readFile(
                        path.join(pluginsDir, entry.name, 'package.json'),
                        'utf-8'
                    );
                    const pluginInfo = JSON.parse(packageJson);
                    plugins.push({
                        name: pluginInfo.name,
                        version: pluginInfo.version,
                        description: pluginInfo.description,
                        enabled: true
                    });
                } catch (error) {
                    logger.error(`Error reading plugin ${entry.name}:`, error);
                }
            }
        }

        parentPort.postMessage({
            type: 'result',
            data: plugins
        });
    } catch (error) {
        if (error.code === 'ENOENT') {
            parentPort.postMessage({
                type: 'result',
                data: []
            });
        } else {
            throw error;
        }
    }
} 