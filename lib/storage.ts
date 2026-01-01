// Система хранения данных в браузере (localStorage + IndexedDB)
// Все данные хранятся локально в браузере пользователя в России
// Соответствует требованиям 152-ФЗ

export interface ProcessedDocument {
  fileName: string;
  text: string;
  chunks: string[];
}

export interface Project {
  id: string;
  name: string;
  description: string;
  members?: string;
  user_id: string;
  files?: any[];
  messages?: any[];
  processedDocuments?: ProcessedDocument[];
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  email: string;
  passwordHash: string; // Хэш пароля (не сам пароль)
  created_at: string;
}

export type DiagramType = 
  | 'Class' 
  | 'Sequence' 
  | 'Activity' 
  | 'State' 
  | 'Component' 
  | 'Deployment' 
  | 'UseCase' 
  | 'Object' 
  | 'ER' 
  | 'Gantt' 
  | 'MindMap' 
  | 'Network' 
  | 'Archimate' 
  | 'Timing' 
  | 'WBS' 
  | 'JSON';

export interface Diagram {
  id: string;
  name: string;
  description: string;
  user_id: string;
  selectedOption?: 'projects' | 'scratch' | null;
  selectedProject?: string | null;
  diagramType?: DiagramType | null;
  selectedObject?: string | null;
  plantUmlCode?: string | null;
  diagramImageUrl?: string | null;
  glossary?: Array<{ element: string; description: string }> | null;
  files?: any[];
  messages?: any[];
  created_at: string;
  updated_at: string;
}

// Ключи для localStorage
const STORAGE_KEYS = {
  USER: 'context_user',
  SESSION: 'context_session',
  USERS: 'context_users', // База пользователей
  PROJECTS: 'context_projects',
  DIAGRAMS: 'context_diagrams',
};

// Хэширование пароля с использованием Web Crypto API (встроенный в браузер)
async function hashPassword(password: string): Promise<string> {
  if (typeof window === 'undefined') {
    throw new Error('Crypto API is not available');
  }
  
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Работа с пользователями
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

  // Получить всех пользователей (для проверки регистрации)
  getAllUsers: (): User[] => {
    if (typeof window === 'undefined') return [];
    const usersStr = localStorage.getItem(STORAGE_KEYS.USERS);
    if (!usersStr) return [];
    try {
      return JSON.parse(usersStr);
    } catch {
      return [];
    }
  },

  // Сохранить пользователя в базу
  saveUser: (user: User): void => {
    if (typeof window === 'undefined') return;
    const allUsers = auth.getAllUsers();
    const existingIndex = allUsers.findIndex(u => u.id === user.id);
    
    if (existingIndex >= 0) {
      allUsers[existingIndex] = user;
    } else {
      allUsers.push(user);
    }
    
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(allUsers));
  },

  // Вход с проверкой пароля
  signIn: async (email: string, password: string): Promise<{ user: User | null; error: Error | null }> => {
    try {
      const trimmedEmail = email.trim().toLowerCase();
      
      if (!trimmedEmail || !password) {
        return { user: null, error: new Error('Заполните все поля') };
      }

      // Ищем пользователя в базе
      const allUsers = auth.getAllUsers();
      const existingUser = allUsers.find(u => u.email.toLowerCase() === trimmedEmail);
      
      if (!existingUser) {
        return { user: null, error: new Error('Пользователь с таким email не найден') };
      }

      // Проверяем пароль
      const passwordHash = await hashPassword(password);
      if (existingUser.passwordHash !== passwordHash) {
        return { user: null, error: new Error('Неверный пароль') };
      }

      // Сохраняем текущую сессию
      const userForSession: Omit<User, 'passwordHash'> = {
        id: existingUser.id,
        email: existingUser.email,
        created_at: existingUser.created_at,
      };
      
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userForSession));
        localStorage.setItem(STORAGE_KEYS.SESSION, 'true');
      }
      
      return { user: userForSession as User, error: null };
    } catch (error) {
      return { user: null, error: error instanceof Error ? error : new Error('Ошибка при входе') };
    }
  },

  // Регистрация с проверкой существующего пользователя
  signUp: async (email: string, password: string): Promise<{ user: User | null; error: Error | null }> => {
    try {
      const trimmedEmail = email.trim().toLowerCase();
      
      if (!trimmedEmail || !password) {
        return { user: null, error: new Error('Заполните все поля') };
      }

      if (password.length < 6) {
        return { user: null, error: new Error('Пароль должен содержать минимум 6 символов') };
      }

      // Проверяем, не существует ли уже пользователь
      const allUsers = auth.getAllUsers();
      const existingUser = allUsers.find(u => u.email.toLowerCase() === trimmedEmail);
      
      if (existingUser) {
        return { user: null, error: new Error('Пользователь с таким email уже зарегистрирован') };
      }

      // Создаем нового пользователя
      const passwordHash = await hashPassword(password);
      const newUser: User = {
        id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        email: trimmedEmail,
        passwordHash,
        created_at: new Date().toISOString(),
      };

      // Сохраняем в базу пользователей
      auth.saveUser(newUser);

      // Сохраняем текущую сессию (без пароля)
      const userForSession: Omit<User, 'passwordHash'> = {
        id: newUser.id,
        email: newUser.email,
        created_at: newUser.created_at,
      };
      
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userForSession));
        localStorage.setItem(STORAGE_KEYS.SESSION, 'true');
      }
      
      return { user: userForSession as User, error: null };
    } catch (error) {
      return { user: null, error: error instanceof Error ? error : new Error('Ошибка при регистрации') };
    }
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
    return localStorage.getItem(STORAGE_KEYS.SESSION) === 'true' && auth.getCurrentUser() !== null;
  },
};

// Работа с проектами (каждый пользователь видит только свои проекты)
export const projects = {
  // Получить все проекты пользователя
  getAll: (userId: string): Project[] => {
    if (typeof window === 'undefined') return [];
    const projectsStr = localStorage.getItem(STORAGE_KEYS.PROJECTS);
    if (!projectsStr) return [];
    try {
      const allProjects: Project[] = JSON.parse(projectsStr);
      // Фильтруем только проекты текущего пользователя
      return allProjects.filter(p => p.user_id === userId);
    } catch {
      return [];
    }
  },

  // Получить проект по ID (только если он принадлежит пользователю)
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

  // Обновить проект (только если он принадлежит пользователю)
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

  // Удалить проект (только если он принадлежит пользователю)
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

// Работа с диаграммами (каждый пользователь видит только свои диаграммы)
export const diagrams = {
  // Получить все диаграммы пользователя
  getAll: (userId: string): Diagram[] => {
    if (typeof window === 'undefined') return [];
    const diagramsStr = localStorage.getItem(STORAGE_KEYS.DIAGRAMS);
    if (!diagramsStr) return [];
    try {
      const allDiagrams: Diagram[] = JSON.parse(diagramsStr);
      // Фильтруем только диаграммы текущего пользователя
      return allDiagrams.filter(d => d.user_id === userId);
    } catch {
      return [];
    }
  },

  // Получить диаграмму по ID (только если она принадлежит пользователю)
  getById: (diagramId: string, userId: string): Diagram | null => {
    if (typeof window === 'undefined') return null;
    const diagramsStr = localStorage.getItem(STORAGE_KEYS.DIAGRAMS);
    if (!diagramsStr) return null;
    try {
      const allDiagrams: Diagram[] = JSON.parse(diagramsStr);
      const diagram = allDiagrams.find(d => d.id === diagramId && d.user_id === userId);
      return diagram || null;
    } catch {
      return null;
    }
  },

  // Создать диаграмму
  create: (diagram: Omit<Diagram, 'id' | 'created_at' | 'updated_at'>): Diagram => {
    if (typeof window === 'undefined') {
      throw new Error('localStorage is not available');
    }

    const newDiagram: Diagram = {
      ...diagram,
      id: `diagram_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const diagramsStr = localStorage.getItem(STORAGE_KEYS.DIAGRAMS);
    const allDiagrams: Diagram[] = diagramsStr ? JSON.parse(diagramsStr) : [];
    allDiagrams.push(newDiagram);
    localStorage.setItem(STORAGE_KEYS.DIAGRAMS, JSON.stringify(allDiagrams));

    return newDiagram;
  },

  // Обновить диаграмму (только если она принадлежит пользователю)
  update: (diagramId: string, userId: string, updates: Partial<Diagram>): Diagram | null => {
    if (typeof window === 'undefined') {
      throw new Error('localStorage is not available');
    }

    const diagramsStr = localStorage.getItem(STORAGE_KEYS.DIAGRAMS);
    if (!diagramsStr) return null;

    const allDiagrams: Diagram[] = JSON.parse(diagramsStr);
    const index = allDiagrams.findIndex(d => d.id === diagramId && d.user_id === userId);
    
    if (index === -1) return null;

    allDiagrams[index] = {
      ...allDiagrams[index],
      ...updates,
      updated_at: new Date().toISOString(),
    };

    localStorage.setItem(STORAGE_KEYS.DIAGRAMS, JSON.stringify(allDiagrams));
    return allDiagrams[index];
  },

  // Удалить диаграмму (только если она принадлежит пользователю)
  delete: (diagramId: string, userId: string): boolean => {
    if (typeof window === 'undefined') {
      throw new Error('localStorage is not available');
    }

    const diagramsStr = localStorage.getItem(STORAGE_KEYS.DIAGRAMS);
    if (!diagramsStr) return false;

    const allDiagrams: Diagram[] = JSON.parse(diagramsStr);
    const filtered = allDiagrams.filter(d => !(d.id === diagramId && d.user_id === userId));
    
    if (filtered.length === allDiagrams.length) return false;

    localStorage.setItem(STORAGE_KEYS.DIAGRAMS, JSON.stringify(filtered));
    return true;
  },
};
