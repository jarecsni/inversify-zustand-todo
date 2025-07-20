import { injectable, inject } from 'inversify';
import { create, StoreApi, UseBoundStore } from 'zustand';
import { Todo } from '../types';
import type { ILoggingService } from '../services/LoggingService';
import { TYPES } from '../container/types';

export interface TodoState {
  todos: Todo[];
  addTodo: (text: string) => void;
  toggleTodo: (id: string) => void;
  removeTodo: (id: string) => void;
  loadTodos: () => void;
}

export type TodoStore = UseBoundStore<StoreApi<TodoState>>;

@injectable()
export class TodoStoreFactory {
  private store: TodoStore;

  constructor(
    @inject(TYPES.LoggingService) private loggingService: ILoggingService
  ) {
    let idCounter = 1;
    
    this.store = create<TodoState>((set) => ({
      todos: [],
      
      addTodo: (text: string) => {
        if (text.trim()) {
          const newTodo: Todo = {
            id: (Date.now() + idCounter++).toString(),
            text: text.trim(),
            completed: false,
            createdAt: new Date(),
          };
          
          this.loggingService.info('Todo added', { id: newTodo.id, text: newTodo.text });
          set(state => ({
            todos: [...state.todos, newTodo]
          }));
        }
      },
      
      toggleTodo: (id: string) => {
        set(state => {
          const todoIndex = state.todos.findIndex(todo => todo.id === id);
          if (todoIndex !== -1) {
            const updatedTodos = state.todos.map(todo => 
              todo.id === id ? { ...todo, completed: !todo.completed } : todo
            );
            const updatedTodo = updatedTodos[todoIndex];
            this.loggingService.info('Todo toggled', { 
              id, 
              completed: updatedTodo.completed 
            });
            return { todos: updatedTodos };
          } else {
            this.loggingService.warn('Todo not found for toggle', { id });
            return state;
          }
        });
      },
      
      removeTodo: (id: string) => {
        set(state => {
          const initialLength = state.todos.length;
          const updatedTodos = state.todos.filter(todo => todo.id !== id);
          
          if (updatedTodos.length < initialLength) {
            this.loggingService.info('Todo removed', { id });
          } else {
            this.loggingService.warn('Todo not found for removal', { id });
          }
          
          return { todos: updatedTodos };
        });
      },
      
      loadTodos: () => {
        // For now, this is a no-op since we start with empty todos
        // In the future, this could load from localStorage, API, etc.
        this.loggingService.info('Todos loaded', { count: 0 });
      }
    }));
  }

  getStore(): TodoStore {
    return this.store;
  }
}

// Legacy export for backward compatibility
export const createTodoStore = (loggingService: ILoggingService) => {
  // Create a manual instance for backward compatibility
  const factory = new TodoStoreFactory(loggingService);
  return factory.getStore();
};