import { act } from '@testing-library/react';
import { createTodoStore, TodoStore } from './todoStore';
import { MockLoggingService } from '../test-utils/MockLoggingService';
import { ILoggingService } from '../services/LoggingService';

describe('TodoStore', () => {
  let mockLoggingService: MockLoggingService;
  let todoStore: TodoStore;

  beforeEach(() => {
    mockLoggingService = new MockLoggingService();
    todoStore = createTodoStore(mockLoggingService);
  });

  afterEach(() => {
    mockLoggingService.clear();
  });

  describe('Initial State', () => {
    it('starts with empty todos array', () => {
      const state = todoStore.getState();
      expect(state.todos).toEqual([]);
    });

    it('has all required actions available', () => {
      const state = todoStore.getState();
      expect(typeof state.addTodo).toBe('function');
      expect(typeof state.toggleTodo).toBe('function');
      expect(typeof state.removeTodo).toBe('function');
      expect(typeof state.loadTodos).toBe('function');
    });
  });

  describe('addTodo', () => {
    it('adds a new todo with correct properties', () => {
      const todoText = 'Test todo item';
      
      act(() => {
        todoStore.getState().addTodo(todoText);
      });

      const state = todoStore.getState();
      expect(state.todos).toHaveLength(1);
      
      const addedTodo = state.todos[0];
      expect(addedTodo.text).toBe(todoText);
      expect(addedTodo.completed).toBe(false);
      expect(addedTodo.id).toBeDefined();
      expect(addedTodo.createdAt).toBeInstanceOf(Date);
    });

    it('trims whitespace from todo text', () => {
      act(() => {
        todoStore.getState().addTodo('  Whitespace test  ');
      });

      const state = todoStore.getState();
      expect(state.todos[0].text).toBe('Whitespace test');
    });

    it('does not add empty or whitespace-only todos', () => {
      act(() => {
        todoStore.getState().addTodo('');
        todoStore.getState().addTodo('   ');
        todoStore.getState().addTodo('\t\n');
      });

      const state = todoStore.getState();
      expect(state.todos).toHaveLength(0);
    });

    it('logs when a todo is added', () => {
      const todoText = 'Logging test todo';
      
      act(() => {
        todoStore.getState().addTodo(todoText);
      });

      expect(mockLoggingService.infoLogs).toHaveLength(1);
      expect(mockLoggingService.getLastInfoLog()).toEqual({
        message: 'Todo added',
        data: expect.objectContaining({
          text: todoText,
          id: expect.any(String)
        })
      });
    });

    it('does not log when empty todo is rejected', () => {
      act(() => {
        todoStore.getState().addTodo('');
      });

      expect(mockLoggingService.infoLogs).toHaveLength(0);
    });

    it('generates unique IDs for multiple todos', async () => {
      act(() => {
        todoStore.getState().addTodo('First todo');
      });
      
      // Small delay to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 1));
      
      act(() => {
        todoStore.getState().addTodo('Second todo');
      });

      const state = todoStore.getState();
      expect(state.todos).toHaveLength(2);
      expect(state.todos[0].id).not.toBe(state.todos[1].id);
    });
  });

  describe('toggleTodo', () => {
    let todoId: string;

    beforeEach(() => {
      act(() => {
        todoStore.getState().addTodo('Test todo for toggle');
      });
      todoId = todoStore.getState().todos[0].id;
      mockLoggingService.clear(); // Clear add logs
    });

    it('toggles todo completion status', () => {
      // Initially not completed
      expect(todoStore.getState().todos[0].completed).toBe(false);

      // Toggle to completed
      act(() => {
        todoStore.getState().toggleTodo(todoId);
      });
      expect(todoStore.getState().todos[0].completed).toBe(true);

      // Toggle back to not completed
      act(() => {
        todoStore.getState().toggleTodo(todoId);
      });
      expect(todoStore.getState().todos[0].completed).toBe(false);
    });

    it('logs when todo is toggled', () => {
      act(() => {
        todoStore.getState().toggleTodo(todoId);
      });

      expect(mockLoggingService.getLastInfoLog()).toEqual({
        message: 'Todo toggled',
        data: {
          id: todoId,
          completed: true
        }
      });
    });

    it('logs warning when trying to toggle non-existent todo', () => {
      const nonExistentId = 'non-existent-id';
      
      act(() => {
        todoStore.getState().toggleTodo(nonExistentId);
      });

      expect(mockLoggingService.getLastWarnLog()).toEqual({
        message: 'Todo not found for toggle',
        data: { id: nonExistentId }
      });
    });

    it('does not modify state when toggling non-existent todo', () => {
      const stateBefore = todoStore.getState();
      
      act(() => {
        todoStore.getState().toggleTodo('non-existent-id');
      });

      const stateAfter = todoStore.getState();
      expect(stateAfter.todos).toEqual(stateBefore.todos);
    });
  });

  describe('removeTodo', () => {
    let todoId: string;

    beforeEach(() => {
      act(() => {
        todoStore.getState().addTodo('Test todo for removal');
      });
      todoId = todoStore.getState().todos[0].id;
      mockLoggingService.clear(); // Clear add logs
    });

    it('removes todo from the list', () => {
      expect(todoStore.getState().todos).toHaveLength(1);

      act(() => {
        todoStore.getState().removeTodo(todoId);
      });

      expect(todoStore.getState().todos).toHaveLength(0);
    });

    it('logs when todo is removed', () => {
      act(() => {
        todoStore.getState().removeTodo(todoId);
      });

      expect(mockLoggingService.getLastInfoLog()).toEqual({
        message: 'Todo removed',
        data: { id: todoId }
      });
    });

    it('logs warning when trying to remove non-existent todo', () => {
      const nonExistentId = 'non-existent-id';
      
      act(() => {
        todoStore.getState().removeTodo(nonExistentId);
      });

      expect(mockLoggingService.getLastWarnLog()).toEqual({
        message: 'Todo not found for removal',
        data: { id: nonExistentId }
      });
    });

    it('removes only the specified todo when multiple exist', async () => {
      // Add another todo with delay to ensure different IDs
      await new Promise(resolve => setTimeout(resolve, 1));
      act(() => {
        todoStore.getState().addTodo('Second todo');
      });
      
      const state1 = todoStore.getState();
      expect(state1.todos).toHaveLength(2);
      const secondTodoId = state1.todos[1].id;

      // Remove the first todo
      act(() => {
        todoStore.getState().removeTodo(todoId);
      });

      const state2 = todoStore.getState();
      expect(state2.todos).toHaveLength(1);
      expect(state2.todos[0].id).toBe(secondTodoId);
      expect(state2.todos[0].text).toBe('Second todo');
    });
  });

  describe('loadTodos', () => {
    it('logs when todos are loaded', () => {
      act(() => {
        todoStore.getState().loadTodos();
      });

      expect(mockLoggingService.getLastInfoLog()).toEqual({
        message: 'Todos loaded',
        data: { count: 0 }
      });
    });

    it('can be called multiple times without side effects', () => {
      act(() => {
        todoStore.getState().loadTodos();
        todoStore.getState().loadTodos();
      });

      expect(mockLoggingService.infoLogs.filter(log => log.message === 'Todos loaded')).toHaveLength(2);
    });
  });

  describe('Complex scenarios', () => {
    it('handles a complete todo lifecycle with logging', () => {
      const todoText = 'Lifecycle test todo';
      let todoId: string;

      // Add todo
      act(() => {
        todoStore.getState().addTodo(todoText);
      });
      
      todoId = todoStore.getState().todos[0].id;
      expect(mockLoggingService.getLastInfoLog().message).toBe('Todo added');

      // Toggle todo
      act(() => {
        todoStore.getState().toggleTodo(todoId);
      });
      
      expect(mockLoggingService.getLastInfoLog().message).toBe('Todo toggled');
      expect(todoStore.getState().todos[0].completed).toBe(true);

      // Toggle back
      act(() => {
        todoStore.getState().toggleTodo(todoId);
      });
      
      expect(todoStore.getState().todos[0].completed).toBe(false);

      // Remove todo
      act(() => {
        todoStore.getState().removeTodo(todoId);
      });
      
      expect(mockLoggingService.getLastInfoLog().message).toBe('Todo removed');
      expect(todoStore.getState().todos).toHaveLength(0);

      // Check that all logging calls were made
      expect(mockLoggingService.getTotalLogCount()).toBe(4); // add, toggle, toggle, remove
    });

    it('maintains immutability when modifying state', () => {
      act(() => {
        todoStore.getState().addTodo('Immutability test');
      });

      const stateBefore = todoStore.getState();
      const todosBefore = stateBefore.todos;
      const todoId = todosBefore[0].id;

      act(() => {
        todoStore.getState().toggleTodo(todoId);
      });

      const stateAfter = todoStore.getState();
      
      // State references should be different (immutable)
      expect(stateAfter.todos).not.toBe(todosBefore);
      expect(stateAfter.todos[0]).not.toBe(todosBefore[0]);
      
      // But the original state should be unchanged
      expect(todosBefore[0].completed).toBe(false);
      expect(stateAfter.todos[0].completed).toBe(true);
    });
  });

  describe('Dependency Injection Showcase', () => {
    it('can use different logging implementations', () => {
      // Create a custom mock that tracks different behavior
      class CustomMockLogger implements ILoggingService {
        public calls: Array<{ level: string; message: string; data?: any }> = [];
        
        info(message: string, data?: any): void {
          this.calls.push({ level: 'INFO', message, data });
        }
        
        error(message: string, error?: any): void {
          this.calls.push({ level: 'ERROR', message, data: error });
        }
        
        warn(message: string, data?: any): void {
          this.calls.push({ level: 'WARN', message, data });
        }
      }

      const customLogger = new CustomMockLogger();
      const customStore = createTodoStore(customLogger);

      act(() => {
        customStore.getState().addTodo('Custom logger test');
      });

      expect(customLogger.calls).toHaveLength(1);
      expect(customLogger.calls[0]).toEqual({
        level: 'INFO',
        message: 'Todo added',
        data: expect.objectContaining({
          text: 'Custom logger test'
        })
      });
    });

    it('demonstrates the power of mock verification', () => {
      // This test shows how we can verify exact logging behavior
      act(() => {
        todoStore.getState().addTodo('Mock verification test');
      });

      // We can verify not just that logging happened, but exactly what was logged
      expect(mockLoggingService.infoLogs).toHaveLength(1);
      expect(mockLoggingService.errorLogs).toHaveLength(0);
      expect(mockLoggingService.warnLogs).toHaveLength(0);

      const logEntry = mockLoggingService.infoLogs[0];
      expect(logEntry.message).toBe('Todo added');
      expect(logEntry.data).toMatchObject({
        text: 'Mock verification test',
        id: expect.stringMatching(/^\d+$/) // Should be a timestamp-based ID
      });
    });
  });
});