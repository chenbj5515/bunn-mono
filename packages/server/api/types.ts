import { Hono } from 'hono';

// 用户类型
type User = {
  id: number;
  name: string;
};

// API类型定义
export type AppType = {
  '/*': {
    get: {
      resBody: {
        message: string;
        version: string;
      }
    }
  },
  '/users': {
    get: {
      resBody: User[]
    }
  },
  '/users/:id': {
    get: {
      param: {
        id: string
      },
      resBody: User
    }
  }
}; 