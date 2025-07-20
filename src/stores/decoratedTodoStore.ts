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

// This is the decorator-based approach using @injectable and @inject
@injectable()
export class DecoratedTodoStoreFactory {
  private store: TodoStore;

  constructor(
    @inject(TYPES.LoggingService) private loggingService: ILoggingService
  ) {
    // InversifyJS automatically injects ILoggingService here!
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
          
          // Using the injected logging service
          this.loggingService.info('Todo added via decorator injection', { 
            id: newTodo.id, 
            text: newTodo.text 
          });
          
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
            
            this.loggingService.info('Todo toggled via decorator injection', { 
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
            this.loggingService.info('Todo removed via decorator injection', { id });
          } else {
            this.loggingService.warn('Todo not found for removal', { id });
          }
          
          return { todos: updatedTodos };
        });
      },
      
      loadTodos: () => {
        this.loggingService.info('Todos loaded via decorator injection', { count: 0 });
      }
    }));
  }

  getStore(): TodoStore {
    return this.store;
  }
}

// Alternative: Factory function approach (what we currently use)
export const createTodoStoreWithManualDI = (loggingService: ILoggingService): TodoStore => {
  let idCounter = 1;
  
  return create<TodoState>((set) => ({
    todos: [],
    
    addTodo: (text: string) => {
      if (text.trim()) {
        const newTodo: Todo = {
          id: (Date.now() + idCounter++).toString(),
          text: text.trim(),
          completed: false,
          createdAt: new Date(),
        };
        
        // Using the manually passed logging service
        loggingService.info('Todo added via manual injection', { 
          id: newTodo.id, 
          text: newTodo.text 
        });
        
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
          
          loggingService.info('Todo toggled via manual injection', { 
            id, 
            completed: updatedTodo.completed 
          });
          
          return { todos: updatedTodos };
        } else {
          loggingService.warn('Todo not found for toggle', { id });
          return state;
        }
      });
    },
    
    removeTodo: (id: string) => {
      set(state => {
        const initialLength = state.todos.length;
        const updatedTodos = state.todos.filter(todo => todo.id !== id);
        
        if (updatedTodos.length < initialLength) {
          loggingService.info('Todo removed via manual injection', { id });
        } else {
          loggingService.warn('Todo not found for removal', { id });
        }
        
        return { todos: updatedTodos };
      });
    },
    
    loadTodos: () => {
      loggingService.info('Todos loaded via manual injection', { count: 0 });
    }
  }));
};