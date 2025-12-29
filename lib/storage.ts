// Простая система хранения данных в localStorage (без бэкенда)

export interface Project {
  id: string;
  name: string;
  description: string;
  members?: string;
  user_id: string;
  files?: any[];
  messages?: any[];
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  email: string;
}

// Ключи для localStorage
const STORAGE_KEYS = {
  USER: 'context_user',
  PROJECTS: 'context_projects',
  SESSION: 'context_session',
};

// Работа с пользователем
export const auth = {
  // Получить текущего пользователя
  getCurrentUser: (): User | null => {
    if (typeof window === 'undefined') return null;
    const userStr = localStorage.getItem(STORAGE_KEYS.USER);
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  },

  // Вход (простая заглушка)
  signIn: async (email: string, password: string): Promise<{ user: User | null; error: Error | null }> => {
    // Простая проверка (в реальности здесь была бы проверка пароля)
    // Для демо просто создаем пользователя
    const user: User = {
      id: `user_${Date.now()}`,
      email: email.trim(),
    };
    
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
      localStorage.setItem(STORAGE_KEYS.SESSION, 'true');
    }
    
    return { user, error: null };
  },

  // Регистрация (простая заглушка)
  signUp: async (email: string, password: string): Promise<{ user: User | null; error: Error | null }> => {
    // Просто создаем пользователя
    const user: User = {
      id: `user_${Date.now()}`,
      email: email.trim(),
    };
    
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
      localStorage.setItem(STORAGE_KEYS.SESSION, 'true');
    }
    
    return { user, error: null };
  },

  // Выход
  signOut: async (): Promise<void> => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEYS.USER);
      localStorage.removeItem(STORAGE_KEYS.SESSION);
    }
  },

  // Проверка сессии
  hasSession: (): boolean => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(STORAGE_KEYS.SESSION) === 'true';
  },
};

// Работа с проектами
export const projects = {
  // Получить все проекты пользователя
  getAll: (userId: string): Project[] => {
    if (typeof window === 'undefined') return [];
    const projectsStr = localStorage.getItem(STORAGE_KEYS.PROJECTS);
    if (!projectsStr) return [];
    try {
      const allProjects: Project[] = JSON.parse(projectsStr);
      return allProjects.filter(p => p.user_id === userId);
    } catch {
      return [];
    }
  },

  // Получить проект по ID
  getById: (projectId: string, userId: string): Project | null => {
    if (typeof window === 'undefined') return null;
    const projectsStr = localStorage.getItem(STORAGE_KEYS.PROJECTS);
    if (!projectsStr) return null;
    try {
      const allProjects: Project[] = JSON.parse(projectsStr);
      const project = allProjects.find(p => p.id === projectId && p.user_id === userId);
      return project || null;
    } catch {
      return null;
    }
  },

  // Создать проект
  create: (project: Omit<Project, 'id' | 'created_at' | 'updated_at'>): Project => {
    if (typeof window === 'undefined') {
      throw new Error('localStorage is not available');
    }

    const newProject: Project = {
      ...project,
      id: `project_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      files: project.files || [],
      messages: project.messages || [],
    };

    const projectsStr = localStorage.getItem(STORAGE_KEYS.PROJECTS);
    const allProjects: Project[] = projectsStr ? JSON.parse(projectsStr) : [];
    allProjects.push(newProject);
    localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(allProjects));

    return newProject;
  },

  // Обновить проект
  update: (projectId: string, userId: string, updates: Partial<Project>): Project | null => {
    if (typeof window === 'undefined') {
      throw new Error('localStorage is not available');
    }

    const projectsStr = localStorage.getItem(STORAGE_KEYS.PROJECTS);
    if (!projectsStr) return null;

    const allProjects: Project[] = JSON.parse(projectsStr);
    const index = allProjects.findIndex(p => p.id === projectId && p.user_id === userId);
    
    if (index === -1) return null;

    allProjects[index] = {
      ...allProjects[index],
      ...updates,
      updated_at: new Date().toISOString(),
    };

    localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(allProjects));
    return allProjects[index];
  },

  // Удалить проект
  delete: (projectId: string, userId: string): boolean => {
    if (typeof window === 'undefined') {
      throw new Error('localStorage is not available');
    }

    const projectsStr = localStorage.getItem(STORAGE_KEYS.PROJECTS);
    if (!projectsStr) return false;

    const allProjects: Project[] = JSON.parse(projectsStr);
    const filtered = allProjects.filter(p => !(p.id === projectId && p.user_id === userId));
    
    if (filtered.length === allProjects.length) return false;

    localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(filtered));
    return true;
  },
};

