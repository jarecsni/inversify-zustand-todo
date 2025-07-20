import { create, StoreApi, UseBoundStore } from 'zustand';
import { Todo } from '../types';
import { ILoggingService } from '../services/LoggingService';

export interface TodoState {
  todos: Todo[];
  addTodo: (text: string) => void;
  toggleTodo: (id: string) => void;
  removeTodo: (id: string) => void;
  loadTodos: () => void;
}

export type TodoStore = UseBoundStore<StoreApi<TodoState>>;

export const createTodoStore = (loggingService: ILoggingService) => {
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
        
        loggingService.info('Todo added', { id: newTodo.id, text: newTodo.text });
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
          loggingService.info('Todo toggled', { 
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
          loggingService.info('Todo removed', { id });
        } else {
          loggingService.warn('Todo not found for removal', { id });
        }
        
        return { todos: updatedTodos };
      });
    },
    
    loadTodos: () => {
      // For now, this is a no-op since we start with empty todos
      // In the future, this could load from localStorage, API, etc.
      loggingService.info('Todos loaded', { count: 0 });
    }
  }));
};