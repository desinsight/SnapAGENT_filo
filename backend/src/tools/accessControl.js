const winston = require('winston');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const fs = require('fs').promises;
const path = require('path');

class AccessControl {
  constructor(options = {}) {
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.json(),
      transports: [
        new winston.transports.File({ filename: 'access-control.log' })
      ]
    });

    this.jwtSecret = options.jwtSecret || process.env.JWT_SECRET;
    this.users = new Map();
    this.groups = new Map();
    this.accessLogs = [];
    this.ipWhitelist = new Set(options.ipWhitelist || []);
    this.ipBlacklist = new Set(options.ipBlacklist || []);

    this.loadUsers();
    this.loadGroups();
  }

  async loadUsers() {
    try {
      const usersPath = path.join(__dirname, '../data/users.json');
      const data = await fs.readFile(usersPath, 'utf8');
      const users = JSON.parse(data);
      users.forEach(user => this.users.set(user.username, user));
    } catch (error) {
      this.logger.error('사용자 데이터 로드 실패:', error);
    }
  }

  async loadGroups() {
    try {
      const groupsPath = path.join(__dirname, '../data/groups.json');
      const data = await fs.readFile(groupsPath, 'utf8');
      const groups = JSON.parse(data);
      groups.forEach(group => this.groups.set(group.name, group));
    } catch (error) {
      this.logger.error('그룹 데이터 로드 실패:', error);
    }
  }

  async saveUsers() {
    try {
      const usersPath = path.join(__dirname, '../data/users.json');
      await fs.writeFile(usersPath, JSON.stringify(Array.from(this.users.values()), null, 2));
    } catch (error) {
      this.logger.error('사용자 데이터 저장 실패:', error);
    }
  }

  async saveGroups() {
    try {
      const groupsPath = path.join(__dirname, '../data/groups.json');
      await fs.writeFile(groupsPath, JSON.stringify(Array.from(this.groups.values()), null, 2));
    } catch (error) {
      this.logger.error('그룹 데이터 저장 실패:', error);
    }
  }

  async createUser(username, password, options = {}) {
    if (this.users.has(username)) {
      throw new Error('이미 존재하는 사용자입니다.');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = {
      username,
      password: hashedPassword,
      groups: options.groups || [],
      permissions: options.permissions || [],
      isActive: true,
      createdAt: new Date().toISOString()
    };

    this.users.set(username, user);
    await this.saveUsers();
    return user;
  }

  async createGroup(name, options = {}) {
    if (this.groups.has(name)) {
      throw new Error('이미 존재하는 그룹입니다.');
    }

    const group = {
      name,
      permissions: options.permissions || [],
      members: options.members || [],
      createdAt: new Date().toISOString()
    };

    this.groups.set(name, group);
    await this.saveGroups();
    return group;
  }

  async authenticate(username, password) {
    const user = this.users.get(username);
    if (!user || !user.isActive) {
      throw new Error('사용자를 찾을 수 없거나 비활성화된 계정입니다.');
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      throw new Error('잘못된 비밀번호입니다.');
    }

    const token = jwt.sign(
      { username, groups: user.groups },
      this.jwtSecret,
      { expiresIn: '24h' }
    );

    return { token, user: { ...user, password: undefined } };
  }

  verifyToken(token) {
    try {
      return jwt.verify(token, this.jwtSecret);
    } catch (error) {
      throw new Error('유효하지 않은 토큰입니다.');
    }
  }

  async checkPermission(username, permission) {
    const user = this.users.get(username);
    if (!user) return false;

    // 사용자 직접 권한 확인
    if (user.permissions.includes(permission)) return true;

    // 그룹 권한 확인
    for (const groupName of user.groups) {
      const group = this.groups.get(groupName);
      if (group && group.permissions.includes(permission)) return true;
    }

    return false;
  }

  logAccess(username, action, resource, ip) {
    const log = {
      username,
      action,
      resource,
      ip,
      timestamp: new Date().toISOString()
    };

    this.accessLogs.push(log);
    this.logger.info('접근 로그:', log);

    // 로그 파일에 저장
    const logPath = path.join(__dirname, '../logs/access.log');
    fs.appendFile(logPath, JSON.stringify(log) + '\n').catch(error => {
      this.logger.error('접근 로그 저장 실패:', error);
    });
  }

  checkIPAccess(ip) {
    if (this.ipBlacklist.has(ip)) return false;
    if (this.ipWhitelist.size > 0 && !this.ipWhitelist.has(ip)) return false;
    return true;
  }

  async addToWhitelist(ip) {
    this.ipWhitelist.add(ip);
    await this.saveIPLists();
  }

  async addToBlacklist(ip) {
    this.ipBlacklist.add(ip);
    await this.saveIPLists();
  }

  async removeFromWhitelist(ip) {
    this.ipWhitelist.delete(ip);
    await this.saveIPLists();
  }

  async removeFromBlacklist(ip) {
    this.ipBlacklist.delete(ip);
    await this.saveIPLists();
  }

  async saveIPLists() {
    try {
      const ipListsPath = path.join(__dirname, '../data/ip-lists.json');
      await fs.writeFile(ipListsPath, JSON.stringify({
        whitelist: Array.from(this.ipWhitelist),
        blacklist: Array.from(this.ipBlacklist)
      }, null, 2));
    } catch (error) {
      this.logger.error('IP 목록 저장 실패:', error);
    }
  }

  getAccessLogs(options = {}) {
    let logs = [...this.accessLogs];

    if (options.username) {
      logs = logs.filter(log => log.username === options.username);
    }

    if (options.action) {
      logs = logs.filter(log => log.action === options.action);
    }

    if (options.resource) {
      logs = logs.filter(log => log.resource === options.resource);
    }

    if (options.startDate) {
      logs = logs.filter(log => new Date(log.timestamp) >= new Date(options.startDate));
    }

    if (options.endDate) {
      logs = logs.filter(log => new Date(log.timestamp) <= new Date(options.endDate));
    }

    return logs;
  }

  async updateUserPermissions(username, permissions) {
    const user = this.users.get(username);
    if (!user) {
      throw new Error('사용자를 찾을 수 없습니다.');
    }

    user.permissions = permissions;
    await this.saveUsers();
    return user;
  }

  async updateGroupPermissions(groupName, permissions) {
    const group = this.groups.get(groupName);
    if (!group) {
      throw new Error('그룹을 찾을 수 없습니다.');
    }

    group.permissions = permissions;
    await this.saveGroups();
    return group;
  }

  async addUserToGroup(username, groupName) {
    const user = this.users.get(username);
    const group = this.groups.get(groupName);

    if (!user || !group) {
      throw new Error('사용자 또는 그룹을 찾을 수 없습니다.');
    }

    if (!user.groups.includes(groupName)) {
      user.groups.push(groupName);
      await this.saveUsers();
    }

    if (!group.members.includes(username)) {
      group.members.push(username);
      await this.saveGroups();
    }
  }

  async removeUserFromGroup(username, groupName) {
    const user = this.users.get(username);
    const group = this.groups.get(groupName);

    if (!user || !group) {
      throw new Error('사용자 또는 그룹을 찾을 수 없습니다.');
    }

    user.groups = user.groups.filter(g => g !== groupName);
    group.members = group.members.filter(m => m !== username);

    await this.saveUsers();
    await this.saveGroups();
  }

  async executeTool(toolName, params = {}) {
    try {
      console.log(`접근 제어 도구 실행: ${toolName}`, { params });
      
      switch (toolName) {
        case 'checkPermission':
        case 'check_permission':
          return await this.checkPermission(params.userId, params.resourcePath, params.action);
        
        case 'grantPermission':
        case 'grant_permission':
          return await this.grantPermission(params.userId, params.resourcePath, params.permissions);
        
        case 'revokePermission':
        case 'revoke_permission':
          return await this.revokePermission(params.userId, params.resourcePath, params.permissions);
        
        case 'listPermissions':
        case 'list_permissions':
          return await this.listPermissions(params.resourcePath);
        
        case 'createRole':
        case 'create_role':
          return await this.createRole(params.roleName, params.permissions);
        
        case 'assignRole':
        case 'assign_role':
          return await this.assignRole(params.userId, params.roleName);
        
        case 'removeRole':
        case 'remove_role':
          return await this.removeRole(params.userId, params.roleName);
        
        case 'auditAccess':
        case 'audit_access':
          return await this.auditAccess(params.resourcePath, params.timeRange);
        
        default:
          throw new Error(`알 수 없는 접근 제어 도구: ${toolName}`);
      }
    } catch (error) {
      console.error(`접근 제어 도구 실행 실패 (${toolName}):`, error);
      throw error;
    }
  }

  async cleanup() {
    console.log('접근 제어 도구 정리 완료');
  }
}

module.exports = AccessControl; 