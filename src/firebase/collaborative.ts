import { ref, onValue, set, push, serverTimestamp, onDisconnect } from 'firebase/database';
import { database } from './config';
import type { DesignValue } from '../editor/schema';

// 生成随机用户ID
const generateUserId = () => `user_${Math.random().toString(36).substr(2, 9)}`;

// 生成随机颜色
const generateUserColor = () => {
  const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57', '#FF9FF3', '#54A0FF'];
  return colors[Math.floor(Math.random() * colors.length)];
};

export class CollaborativeService {
  private roomId: string;
  private userId: string;
  private userName: string;
  private userColor: string;
  private listeners: Map<string, () => void> = new Map();

  constructor(roomId: string = 'default-room') {
    this.roomId = roomId;

    // 尝试从sessionStorage获取已有的用户信息
    const existingUser = sessionStorage.getItem('voyager-user');
    if (existingUser) {
      const userData = JSON.parse(existingUser);
      this.userId = userData.id;
      this.userName = userData.name;
      this.userColor = userData.color;
    } else {
      // 创建新用户
      this.userId = generateUserId();
      this.userName = `用户${this.userId.slice(-4)}`;
      this.userColor = generateUserColor();

      // 保存到sessionStorage
      sessionStorage.setItem('voyager-user', JSON.stringify({
        id: this.userId,
        name: this.userName,
        color: this.userColor
      }));
    }

    // 设置用户在线状态
    this.setupPresence();
  }

  // 设置用户在线状态
  private setupPresence() {
    const userRef = ref(database, `rooms/${this.roomId}/users/${this.userId}`);
    const userPresenceRef = ref(database, `rooms/${this.roomId}/presence/${this.userId}`);

    // 设置用户信息
    set(userRef, {
      id: this.userId,
      name: this.userName,
      color: this.userColor,
      joinedAt: serverTimestamp()
    });

    // 设置在线状态
    set(userPresenceRef, true);

    // 设置断线时自动移除
    onDisconnect(userPresenceRef).remove();
    onDisconnect(userRef).remove();
  }

  // 同步设计数据
  syncDesign(designValue: DesignValue, onUpdate: (value: DesignValue) => void) {
    const designRef = ref(database, `rooms/${this.roomId}/design`);

    // 监听远程更新
    const unsubscribe = onValue(designRef, (snapshot) => {
      const data = snapshot.val();
      if (data && data.lastUpdatedBy !== this.userId) {
        onUpdate(data.value);
      }
    });

    this.listeners.set('design', unsubscribe);

    // 返回更新函数
    return (newValue: DesignValue) => {
      set(designRef, {
        value: newValue,
        lastUpdatedBy: this.userId,
        lastUpdated: serverTimestamp()
      });
    };
  }

  // 监听在线用户
  onUsersChange(callback: (users: any[]) => void) {
    const usersRef = ref(database, `rooms/${this.roomId}/users`);
    const presenceRef = ref(database, `rooms/${this.roomId}/presence`);

    let users: any = {};
    let presence: any = {};

    const updateUsers = () => {
      const onlineUsers = Object.values(users).filter((user: any) => presence[user.id]);
      // 过滤掉当前用户，避免重复显示
      const otherUsers = onlineUsers.filter((user: any) => user.id !== this.userId);
      callback(otherUsers);
    };

    const unsubscribeUsers = onValue(usersRef, (snapshot) => {
      users = snapshot.val() || {};
      updateUsers();
    });

    const unsubscribePresence = onValue(presenceRef, (snapshot) => {
      presence = snapshot.val() || {};
      updateUsers();

      // 清理离线用户的数据
      this.cleanupOfflineUsers(users, presence);
    });

    this.listeners.set('users', unsubscribeUsers);
    this.listeners.set('presence', unsubscribePresence);
  }

  // 清理离线用户数据
  private cleanupOfflineUsers(users: any, presence: any) {
    Object.keys(users).forEach(userId => {
      if (!presence[userId]) {
        // 用户已离线，清理其数据
        const userRef = ref(database, `rooms/${this.roomId}/users/${userId}`);
        const cursorRef = ref(database, `rooms/${this.roomId}/cursors/${userId}`);

        // 延迟清理，避免短暂断线时的闪烁
        setTimeout(() => {
          set(userRef, null);
          set(cursorRef, null);
        }, 5000);
      }
    });
  }

  // 同步用户光标位置
  updateCursor(x: number, y: number) {
    const cursorRef = ref(database, `rooms/${this.roomId}/cursors/${this.userId}`);
    set(cursorRef, {
      x,
      y,
      color: this.userColor,
      name: this.userName,
      timestamp: serverTimestamp()
    });

    // 设置断线时自动移除光标
    onDisconnect(cursorRef).remove();
  }

  // 监听其他用户光标
  onCursorsChange(callback: (cursors: any[]) => void) {
    const cursorsRef = ref(database, `rooms/${this.roomId}/cursors`);

    const unsubscribe = onValue(cursorsRef, (snapshot) => {
      const data = snapshot.val() || {};
      // 过滤掉自己的光标
      const otherCursors = Object.values(data).filter((cursor: any) => cursor.name !== this.userName);
      callback(otherCursors);
    });

    this.listeners.set('cursors', unsubscribe);
  }

  // 发送操作事件
  sendOperation(operation: any) {
    const operationsRef = ref(database, `rooms/${this.roomId}/operations`);
    push(operationsRef, {
      ...operation,
      userId: this.userId,
      userName: this.userName,
      timestamp: serverTimestamp()
    });
  }

  // 清理所有监听器
  cleanup() {
    this.listeners.forEach(unsubscribe => unsubscribe());
    this.listeners.clear();
  }

  // 获取用户信息
  getUserInfo() {
    return {
      id: this.userId,
      name: this.userName,
      color: this.userColor
    };
  }
}