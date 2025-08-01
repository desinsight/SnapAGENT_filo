const { EventEmitter } = require('events');
const path = require('path');
const fs = require('fs/promises');
const logger = require('../utils/logger');
const config = require('../config');

class PluginManager extends EventEmitter {
    constructor() {
        super();
        this.plugins = new Map();
        this.hooks = new Map();
        this.isInitialized = false;
    }

    async initialize() {
        if (this.isInitialized) return;

        // 플러그인 디렉토리 생성
        const pluginDir = path.join(config.data.directory, 'plugins');
        await fs.mkdir(pluginDir, { recursive: true });

        // 플러그인 로드
        await this.loadPlugins();
        this.isInitialized = true;
        logger.info('Plugin manager initialized');
    }

    getTools() {
        return [
            {
                name: 'install_plugin',
                description: '플러그인 설치',
                parameters: {
                    type: 'object',
                    properties: {
                        name: { type: 'string', description: '플러그인 이름' },
                        version: { type: 'string', description: '플러그인 버전' },
                        source: { type: 'string', description: '플러그인 소스 (npm 패키지명 또는 URL)' }
                    },
                    required: ['name', 'source']
                }
            },
            {
                name: 'uninstall_plugin',
                description: '플러그인 제거',
                parameters: {
                    type: 'object',
                    properties: {
                        name: { type: 'string', description: '플러그인 이름' }
                    },
                    required: ['name']
                }
            },
            {
                name: 'enable_plugin',
                description: '플러그인 활성화',
                parameters: {
                    type: 'object',
                    properties: {
                        name: { type: 'string', description: '플러그인 이름' }
                    },
                    required: ['name']
                }
            },
            {
                name: 'disable_plugin',
                description: '플러그인 비활성화',
                parameters: {
                    type: 'object',
                    properties: {
                        name: { type: 'string', description: '플러그인 이름' }
                    },
                    required: ['name']
                }
            },
            {
                name: 'get_plugin_info',
                description: '플러그인 정보 조회',
                parameters: {
                    type: 'object',
                    properties: {
                        name: { type: 'string', description: '플러그인 이름' }
                    },
                    required: ['name']
                }
            },
            {
                name: 'list_plugins',
                description: '설치된 플러그인 목록 조회',
                parameters: {
                    type: 'object',
                    properties: {
                        includeDisabled: { type: 'boolean', description: '비활성화된 플러그인 포함' }
                    }
                }
            }
        ];
    }

    async installPlugin(name, source, version = 'latest') {
        if (this.plugins.has(name)) {
            throw new Error('Plugin already installed');
        }

        try {
            // 플러그인 설치 로직
            const plugin = {
                name,
                version,
                source,
                enabled: true,
                installedAt: Date.now(),
                hooks: new Map(),
                config: {}
            };

            this.plugins.set(name, plugin);
            await this.savePlugins();
            this.emit('pluginInstalled', plugin);

            return plugin;
        } catch (error) {
            logger.error(`Error installing plugin ${name}:`, error);
            throw error;
        }
    }

    async uninstallPlugin(name) {
        const plugin = this.plugins.get(name);
        if (!plugin) {
            throw new Error('Plugin not found');
        }

        try {
            // 플러그인 제거 로직
            this.plugins.delete(name);
            await this.savePlugins();
            this.emit('pluginUninstalled', name);

            return { status: 'uninstalled' };
        } catch (error) {
            logger.error(`Error uninstalling plugin ${name}:`, error);
            throw error;
        }
    }

    async enablePlugin(name) {
        const plugin = this.plugins.get(name);
        if (!plugin) {
            throw new Error('Plugin not found');
        }

        if (plugin.enabled) {
            return plugin;
        }

        try {
            plugin.enabled = true;
            await this.savePlugins();
            this.emit('pluginEnabled', plugin);

            return plugin;
        } catch (error) {
            logger.error(`Error enabling plugin ${name}:`, error);
            throw error;
        }
    }

    async disablePlugin(name) {
        const plugin = this.plugins.get(name);
        if (!plugin) {
            throw new Error('Plugin not found');
        }

        if (!plugin.enabled) {
            return plugin;
        }

        try {
            plugin.enabled = false;
            await this.savePlugins();
            this.emit('pluginDisabled', plugin);

            return plugin;
        } catch (error) {
            logger.error(`Error disabling plugin ${name}:`, error);
            throw error;
        }
    }

    getPluginInfo(name) {
        const plugin = this.plugins.get(name);
        if (!plugin) {
            throw new Error('Plugin not found');
        }

        return {
            ...plugin,
            hooks: Array.from(plugin.hooks.keys())
        };
    }

    listPlugins(options = {}) {
        const { includeDisabled = false } = options;
        return Array.from(this.plugins.values())
            .filter(plugin => includeDisabled || plugin.enabled)
            .map(plugin => ({
                name: plugin.name,
                version: plugin.version,
                enabled: plugin.enabled,
                installedAt: plugin.installedAt
            }));
    }

    registerHook(plugin, hookName, handler) {
        if (!this.plugins.has(plugin)) {
            throw new Error('Plugin not found');
        }

        const pluginInfo = this.plugins.get(plugin);
        if (!pluginInfo.enabled) {
            throw new Error('Plugin is disabled');
        }

        if (!this.hooks.has(hookName)) {
            this.hooks.set(hookName, new Map());
        }

        this.hooks.get(hookName).set(plugin, handler);
        pluginInfo.hooks.set(hookName, handler);
    }

    async executeHook(hookName, ...args) {
        if (!this.hooks.has(hookName)) {
            return [];
        }

        const results = [];
        for (const [plugin, handler] of this.hooks.get(hookName)) {
            try {
                const result = await handler(...args);
                results.push({ plugin, result });
            } catch (error) {
                logger.error(`Error executing hook ${hookName} for plugin ${plugin}:`, error);
                results.push({ plugin, error: error.message });
            }
        }

        return results;
    }

    async loadPlugins() {
        try {
            const pluginsPath = path.join(config.data.directory, 'plugins.json');
            const data = await fs.readFile(pluginsPath, 'utf-8');
            const plugins = JSON.parse(data);

            for (const [name, plugin] of Object.entries(plugins)) {
                this.plugins.set(name, {
                    ...plugin,
                    hooks: new Map()
                });
            }
        } catch (error) {
            if (error.code !== 'ENOENT') {
                logger.error('Error loading plugins:', error);
            }
        }
    }

    async savePlugins() {
        try {
            const pluginsPath = path.join(config.data.directory, 'plugins.json');
            const data = Object.fromEntries(
                Array.from(this.plugins.entries()).map(([name, plugin]) => [
                    name,
                    {
                        ...plugin,
                        hooks: Array.from(plugin.hooks.keys())
                    }
                ])
            );

            await fs.writeFile(pluginsPath, JSON.stringify(data, null, 2));
        } catch (error) {
            logger.error('Error saving plugins:', error);
            throw error;
        }
    }
}

module.exports = PluginManager; 