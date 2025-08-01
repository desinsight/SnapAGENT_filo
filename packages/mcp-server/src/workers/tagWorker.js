const { parentPort } = require('worker_threads');
const fs = require('fs/promises');
const path = require('path');
const logger = require('../utils/logger');

// 태그 작업 처리
parentPort.on('message', async (message) => {
    try {
        switch (message.type) {
            case 'add_tag':
                await handleAddTag(message.data);
                break;
            case 'remove_tag':
                await handleRemoveTag(message.data);
                break;
            case 'tag_file':
                await handleTagFile(message.data);
                break;
            case 'untag_file':
                await handleUntagFile(message.data);
                break;
            case 'get_file_tags':
                await handleGetFileTags(message.data);
                break;
            case 'get_tagged_files':
                await handleGetTaggedFiles(message.data);
                break;
            case 'search_by_tags':
                await handleSearchByTags(message.data);
                break;
            case 'get_tag_stats':
                await handleGetTagStats(message.data);
                break;
            default:
                throw new Error(`Unknown task type: ${message.type}`);
        }
    } catch (error) {
        logger.error('Error in tag worker:', error);
        parentPort.postMessage({
            type: 'error',
            error: error.message
        });
    }
});

async function handleAddTag(data) {
    const { name, color, description } = data;
    const tag = {
        name,
        color: color || '#000000',
        description: description || '',
        createdAt: Date.now(),
        fileCount: 0
    };

    parentPort.postMessage({
        type: 'tag_update',
        data: {
            action: 'add',
            tag
        }
    });
}

async function handleRemoveTag(data) {
    const { name } = data;
    parentPort.postMessage({
        type: 'tag_update',
        data: {
            action: 'remove',
            tag: name
        }
    });
}

async function handleTagFile(data) {
    const { filePath, tags } = data;
    const stats = await fs.stat(filePath);
    const fileInfo = {
        path: filePath,
        size: stats.size,
        modified: stats.mtime,
        tags
    };

    parentPort.postMessage({
        type: 'tag_update',
        data: {
            action: 'tag',
            file: fileInfo
        }
    });
}

async function handleUntagFile(data) {
    const { filePath, tags } = data;
    parentPort.postMessage({
        type: 'tag_update',
        data: {
            action: 'untag',
            file: filePath,
            tags
        }
    });
}

async function handleGetFileTags(data) {
    const { filePath } = data;
    try {
        const stats = await fs.stat(filePath);
        parentPort.postMessage({
            type: 'result',
            data: {
                path: filePath,
                exists: true,
                stats
            }
        });
    } catch (error) {
        if (error.code === 'ENOENT') {
            parentPort.postMessage({
                type: 'result',
                data: {
                    path: filePath,
                    exists: false
                }
            });
        } else {
            throw error;
        }
    }
}

async function handleGetTaggedFiles(data) {
    const { tag } = data;
    parentPort.postMessage({
        type: 'result',
        data: {
            tag,
            files: []
        }
    });
}

async function handleSearchByTags(data) {
    const { tags, options } = data;
    const { matchAll = false, recursive = false } = options || {};

    parentPort.postMessage({
        type: 'result',
        data: {
            tags,
            options,
            files: []
        }
    });
}

async function handleGetTagStats(data) {
    const { tag } = data;
    const stats = {
        name: tag,
        fileCount: 0,
        totalSize: 0,
        fileTypes: {},
        lastUsed: 0
    };

    parentPort.postMessage({
        type: 'result',
        data: stats
    });
} 