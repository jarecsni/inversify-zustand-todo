import { createTestContainer, createTestContainerWithCustomMocks } from '../test-utils/test-container';
import { MockLoggingService } from '../test-utils/MockLoggingService';
import { TYPES } from './types';
import { ILoggingService } from '../services/LoggingService';
import { TodoStore } from '../stores/todoStore';
import { act } from '@testing-library/react';

describe('InversifyJS Integration Tests', () => {
  describe('Container Setup', () => {
    it('creates container with all required bindings', () => {
      const { container } = createTestContainer();

      // Verify all required services are bound
      expect(() => container.get(TYPES.LoggingService)).not.toThrow();
      expect(() => container.get(TYPES.TodoStore)).not.toThrow();
    });

    it('provides singleton instances', () => {
      const { container } = createTestContainer();

      const loggingService1 = container.get(TYPES.LoggingService);
      const loggingService2 = container.get(TYPES.LoggingService);
      const todoStore1 = container.get(TYPES.TodoStore);
      const todoStore2 = container.get(TYPES.TodoStore);

      // Should be the same instances (singletons)
      expect(loggingService1).toBe(loggingService2);
      expect(todoStore1).toBe(todoStore2);
    });

    it('injects dependencies correctly', () => {
      const { container, mockLoggingService, todoStore } = createTestContainer();

      // Verify the store received the correct logging service
      act(() => {
        todoStore.getState().addTodo('Dependency injection test');
      });

      // The mock should have received the logging call
      expect(mockLoggingService.infoLogs).toHaveLength(1);
      expect(mockLoggingService.getLastInfoLog().message).toBe('Todo added');
    });
  });

  describe('Custom Mock Injection', () => {
    it('allows custom mock implementations', () => {
      // Create a custom logging implementation with different behavior
      class SilentLogger implements ILoggingService {
        public wasCalled = false;

        info(): void {
          this.wasCalled = true;
        }

        error(): void {
          this.wasCalled = true;
        }

        warn(): void {
          this.wasCalled = true;
        }
      }

      const silentLogger = new SilentLogger();
      const { container, todoStore } = createTestContainerWithCustomMocks(silentLogger);

      act(() => {
        todoStore.getState().addTodo('Silent logging test');
      });

      // Verify our custom logger was used
      expect(silentLogger.wasCalled).toBe(true);
    });

    it('demonstrates testing different logging scenarios', () => {
      // Mock that throws errors to test error handling
      class ErrorThrowingLogger implements ILoggingService {
        public errorCount = 0;

        info(): void {
          this.errorCount++;
          throw new Error('Logging failed');
        }

        error(): void {
          this.errorCount++;
        }

        warn(): void {
          this.errorCount++;
        }
      }

      const errorLogger = new ErrorThrowingLogger();
      const { todoStore } = createTestContainerWithCustomMocks(errorLogger);

      // This would normally throw, but our store should handle it gracefully
      // (In a real app, you might want to add try-catch in the store)
      expect(() => {
        act(() => {
          try {
            todoStore.getState().addTodo('Error test');
          } catch (error) {
            // Expected to throw due to our mock
            expect(error).toBeInstanceOf(Error);
          }
        });
      }).not.toThrow(); // The test itself shouldn't crash
    });
  });

  describe('Mock Verification Examples', () => {
    let testSetup: ReturnType<typeof createTestContainer>;

    beforeEach(() => {
      testSetup = createTestContainer();
    });

    it('verifies logging call order and content', () => {
      const { todoStore, mockLoggingService } = testSetup;

      act(() => {
        todoStore.getState().addTodo('First todo');
        todoStore.getState().addTodo('Second todo');
      });

      // Verify call order
      expect(mockLoggingService.infoLogs).toHaveLength(2);
      expect(mockLoggingService.infoLogs[0].data).toMatchObject({ text: 'First todo' });
      expect(mockLoggingService.infoLogs[1].data).toMatchObject({ text: 'Second todo' });
    });

    it('verifies different log levels are used appropriately', () => {
      const { todoStore, mockLoggingService } = testSetup;

      act(() => {
        // This should create info logs
        todoStore.getState().addTodo('Valid todo');
        
        // This should create warn logs
        todoStore.getState().toggleTodo('non-existent');
        todoStore.getState().removeTodo('also-non-existent');
      });

      expect(mockLoggingService.infoLogs).toHaveLength(1);
      expect(mockLoggingService.warnLogs).toHaveLength(2);
      expect(mockLoggingService.errorLogs).toHaveLength(0);
    });

    it('verifies no unexpected logging occurs', () => {
      const { todoStore, mockLoggingService } = testSetup;

      act(() => {
        // Add empty todo (should be rejected silently)
        todoStore.getState().addTodo('');
        todoStore.getState().addTodo('   ');
      });

      // No logging should occur for rejected empty todos
      expect(mockLoggingService.getTotalLogCount()).toBe(0);
    });

    it('can reset and isolate test scenarios', () => {
      const { todoStore, mockLoggingService } = testSetup;

      // First scenario
      act(() => {
        todoStore.getState().addTodo('Scenario 1');
      });
      expect(mockLoggingService.getTotalLogCount()).toBe(1);

      // Reset for second scenario
      mockLoggingService.clear();
      
      // Second scenario should start fresh
      act(() => {
        todoStore.getState().addTodo('Scenario 2');
      });
      expect(mockLoggingService.getTotalLogCount()).toBe(1);
      expect(mockLoggingService.getLastInfoLog().data).toMatchObject({ text: 'Scenario 2' });
    });
  });

  describe('Real-world Testing Patterns', () => {
    it('demonstrates testing business logic with mocked dependencies', () => {
      const { todoStore, mockLoggingService } = createTestContainer();

      // Test the complete business flow
      act(() => {
        // Add some todos
        todoStore.getState().addTodo('Buy groceries');
        todoStore.getState().addTodo('Walk the dog');
        todoStore.getState().addTodo('Write tests');
      });

      let state = todoStore.getState();
      expect(state.todos).toHaveLength(3);

      // Complete one task
      const firstTodoId = state.todos[0].id;
      act(() => {
        todoStore.getState().toggleTodo(firstTodoId);
      });

      state = todoStore.getState();
      expect(state.todos[0].completed).toBe(true);

      // Remove completed task
      act(() => {
        todoStore.getState().removeTodo(firstTodoId);
      });

      state = todoStore.getState();
      expect(state.todos).toHaveLength(2);
      expect(state.todos.find(todo => todo.id === firstTodoId)).toBeUndefined();
      
      // Verify remaining todos are correct
      expect(state.todos.map(todo => todo.text)).toEqual(['Walk the dog', 'Write tests']);

      // Verify all business logic was logged appropriately
      const addLogs = mockLoggingService.infoLogs.filter(log => log.message === 'Todo added');
      const toggleLogs = mockLoggingService.infoLogs.filter(log => log.message === 'Todo toggled');
      const removeLogs = mockLoggingService.infoLogs.filter(log => log.message === 'Todo removed');

      expect(addLogs).toHaveLength(3);
      expect(toggleLogs).toHaveLength(1);
      expect(removeLogs).toHaveLength(1);
    });

    it('demonstrates testing error conditions with mocks', () => {
      const { todoStore, mockLoggingService } = createTestContainer();

      // Test various error conditions
      act(() => {
        todoStore.getState().toggleTodo('invalid-id-1');
        todoStore.getState().removeTodo('invalid-id-2');
        todoStore.getState().toggleTodo('invalid-id-3');
      });

      // All should result in warning logs
      expect(mockLoggingService.warnLogs).toHaveLength(3);
      
      const messages = mockLoggingService.warnLogs.map(log => log.message);
      expect(messages).toContain('Todo not found for toggle');
      expect(messages).toContain('Todo not found for removal');

      // Verify specific error details
      const toggleWarnings = mockLoggingService.warnLogs.filter(log => log.message === 'Todo not found for toggle');
      const removeWarnings = mockLoggingService.warnLogs.filter(log => log.message === 'Todo not found for removal');
      
      expect(toggleWarnings).toHaveLength(2);
      expect(removeWarnings).toHaveLength(1);
    });
  });
});