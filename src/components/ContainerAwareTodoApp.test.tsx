import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Container } from 'inversify';
import { TYPES } from '../container/types';
import { TodoStoreFactory } from '../stores/todoStore';
import { ContainerAwareTodoApp } from './ContainerAwareTodoApp';
import { MockLoggingService } from '../test-utils/MockLoggingService';

describe('ContainerAwareTodoApp - Injectable Dependencies via Container', () => {
  let container: Container;
  let mockLoggingService: MockLoggingService;

  beforeEach(() => {
    container = new Container();
    mockLoggingService = new MockLoggingService();

    // Bind all dependencies
    container.bind(TYPES.LoggingService).toConstantValue(mockLoggingService);
    container.bind(TodoStoreFactory).toSelf().inSingletonScope();
    container.bind(TYPES.TodoStore).toDynamicValue((context) => {
      const factory = context.container.get(TodoStoreFactory);
      return factory.getStore();
    }).inSingletonScope();
  });

  afterEach(() => {
    mockLoggingService.clear();
  });

  describe('Dependency Injection via Container Props', () => {
    it('renders successfully with container-injected dependencies', () => {
      render(<ContainerAwareTodoApp container={container} />);
      
      expect(screen.getByText('Todo App (Container-Aware Functional Component)')).toBeInTheDocument();
      expect(screen.getByText('No todos yet. Add one above!')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Add a new todo...')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Add Todo' })).toBeInTheDocument();
    });

    it('successfully uses injected TodoStore from container', async () => {
      render(<ContainerAwareTodoApp container={container} />);
      
      const user = userEvent.setup();
      const input = screen.getByPlaceholderText('Add a new todo...');
      const addButton = screen.getByRole('button', { name: 'Add Todo' });
      
      // Add a todo
      await user.type(input, 'Container injection test');
      await user.click(addButton);
      
      // Verify UI updates
      await waitFor(() => {
        expect(screen.getByText('Container injection test')).toBeInTheDocument();
        expect(screen.getByText('0 of 1 tasks completed')).toBeInTheDocument();
      });
      
      // Verify logging through injected dependencies
      await waitFor(() => {
        expect(mockLoggingService.infoLogs).toContainEqual(
          expect.objectContaining({
            message: 'Todo added',
            data: expect.objectContaining({ text: 'Container injection test' })
          })
        );
      });
    });

    it('handles complete todo workflow with injected store', async () => {
      render(<ContainerAwareTodoApp container={container} />);
      
      const user = userEvent.setup();
      
      // Add todo
      const input = screen.getByPlaceholderText('Add a new todo...');
      await user.type(input, 'Full workflow test');
      await user.keyboard('{Enter}');
      
      await waitFor(() => {
        expect(screen.getByText('Full workflow test')).toBeInTheDocument();
      });
      
      // Toggle todo
      const checkbox = screen.getByRole('checkbox');
      await user.click(checkbox);
      
      await waitFor(() => {
        expect(checkbox).toBeChecked();
        expect(screen.getByText('1 of 1 tasks completed')).toBeInTheDocument();
      });
      
      // Remove todo
      const removeButton = screen.getByRole('button', { name: 'Remove' });
      await user.click(removeButton);
      
      await waitFor(() => {
        expect(screen.getByText('No todos yet. Add one above!')).toBeInTheDocument();
        expect(screen.queryByText('Full workflow test')).not.toBeInTheDocument();
      });
      
      // Verify all operations were logged through dependency injection
      await waitFor(() => {
        const logs = mockLoggingService.infoLogs;
        expect(logs.filter(log => log.message === 'Todo added')).toHaveLength(1);
        expect(logs.filter(log => log.message === 'Todo toggled')).toHaveLength(1);
        expect(logs.filter(log => log.message === 'Todo removed')).toHaveLength(1);
      });
    });

    it('demonstrates @inject decorator working in TodoStoreFactory', async () => {
      render(<ContainerAwareTodoApp container={container} />);
      
      // Verify the store factory was created with injected logging service
      const storeFactory = container.get(TodoStoreFactory);
      const loggingService = (storeFactory as any).loggingService;
      
      expect(loggingService).toBe(mockLoggingService);
      
      const user = userEvent.setup();
      const input = screen.getByPlaceholderText('Add a new todo...');
      
      await user.type(input, 'Decorator injection test');
      await user.keyboard('{Enter}');
      
      await waitFor(() => {
        // The @inject decorator in TodoStoreFactory should have worked
        expect(mockLoggingService.infoLogs).toContainEqual(
          expect.objectContaining({
            message: 'Todo added',
            data: expect.objectContaining({ text: 'Decorator injection test' })
          })
        );
      });
    });
  });

  describe('Container Dependency Benefits', () => {
    it('allows easy dependency swapping via container configuration', async () => {
      // Create alternative logger
      class AlternativeLogger {
        logs: Array<{ message: string; data?: any }> = [];
        info(message: string, data?: any) { 
          this.logs.push({ message: `[ALT] ${message}`, data }); 
        }
        error(message: string, data?: any) { 
          this.logs.push({ message: `[ALT ERROR] ${message}`, data }); 
        }
        warn(message: string, data?: any) { 
          this.logs.push({ message: `[ALT WARN] ${message}`, data }); 
        }
      }
      
      const altLogger = new AlternativeLogger();
      
      // Create new container with alternative logger
      const altContainer = new Container();
      altContainer.bind(TYPES.LoggingService).toConstantValue(altLogger);
      altContainer.bind(TodoStoreFactory).toSelf().inSingletonScope();
      altContainer.bind(TYPES.TodoStore).toDynamicValue((context) => {
        const factory = context.container.get(TodoStoreFactory);
        return factory.getStore();
      }).inSingletonScope();
      
      render(<ContainerAwareTodoApp container={altContainer} />);
      
      const user = userEvent.setup();
      const input = screen.getByPlaceholderText('Add a new todo...');
      
      await user.type(input, 'Alternative logger test');
      await user.keyboard('{Enter}');
      
      await waitFor(() => {
        // Alternative logger should have been used
        expect(altLogger.logs).toContainEqual(
          expect.objectContaining({
            message: '[ALT] Todo added',
            data: expect.objectContaining({ text: 'Alternative logger test' })
          })
        );
      });
      
      // Original mock should be unchanged
      expect(mockLoggingService.getTotalLogCount()).toBe(0);
    });

    it('demonstrates singleton behavior across multiple component instances', () => {
      // Render two instances of the component
      const { rerender } = render(<ContainerAwareTodoApp container={container} />);
      
      const store1 = container.get(TYPES.TodoStore);
      
      rerender(<ContainerAwareTodoApp container={container} />);
      
      const store2 = container.get(TYPES.TodoStore);
      
      // Should be the same store instance (singleton)
      expect(store1).toBe(store2);
    });

    it('shows how @injectable decorator chain works', () => {
      // This demonstrates the full dependency injection chain:
      // MockLoggingService -> @inject -> TodoStoreFactory -> TodoStore -> Component
      
      const loggingService = container.get(TYPES.LoggingService);
      const storeFactory = container.get(TodoStoreFactory);
      const store = container.get(TYPES.TodoStore);
      
      // Verify the chain
      expect(loggingService).toBe(mockLoggingService);
      expect((storeFactory as any).loggingService).toBe(mockLoggingService);
      expect(store).toBe(storeFactory.getStore());
      
      // The @injectable() and @inject() decorators made this automatic resolution possible
      expect(storeFactory).toBeInstanceOf(TodoStoreFactory);
    });
  });

  describe('Comparison: Decorator-based vs Manual DI', () => {
    it('shows the power of @inject decorators vs manual dependency passing', async () => {
      render(<ContainerAwareTodoApp container={container} />);
      
      // With @inject decorators:
      // 1. TodoStoreFactory is marked with @injectable()
      // 2. Constructor uses @inject(TYPES.LoggingService) 
      // 3. Container automatically resolves and injects dependencies
      // 4. Component gets store via container.get()
      
      const user = userEvent.setup();
      const input = screen.getByPlaceholderText('Add a new todo...');
      
      await user.type(input, 'Decorator power test');
      await user.keyboard('{Enter}');
      
      await waitFor(() => {
        expect(screen.getByText('Decorator power test')).toBeInTheDocument();
      });
      
      // This all worked because of the @inject decorators in TodoStoreFactory
      // Compare with manual approach:
      // const loggingService = new LoggingService();
      // const storeFactory = new TodoStoreFactory(loggingService);
      // const store = storeFactory.getStore();
      // Much more verbose and error-prone!
      
      await waitFor(() => {
        expect(mockLoggingService.infoLogs).toContainEqual(
          expect.objectContaining({
            message: 'Todo added',
            data: expect.objectContaining({ text: 'Decorator power test' })
          })
        );
      });
    });

    it('demonstrates testability benefits of dependency injection', async () => {
      // Easy to test because we can inject mocks
      render(<ContainerAwareTodoApp container={container} />);
      
      const user = userEvent.setup();
      const input = screen.getByPlaceholderText('Add a new todo...');
      
      await user.type(input, 'Testability demo');
      await user.keyboard('{Enter}');
      
      // We can easily verify interactions with injected dependencies
      await waitFor(() => {
        expect(mockLoggingService.infoLogs).toHaveLength(2); // loadTodos + addTodo
        expect(mockLoggingService.getLastInfoLog()).toEqual(
          expect.objectContaining({
            message: 'Todo added',
            data: expect.objectContaining({ text: 'Testability demo' })
          })
        );
      });
      
      // This testability comes from using dependency injection with @inject decorators
    });
  });

  describe('Real-world Usage Patterns', () => {
    it('handles rapid user interactions correctly', async () => {
      render(<ContainerAwareTodoApp container={container} />);
      
      const user = userEvent.setup();
      const input = screen.getByPlaceholderText('Add a new todo...');
      
      // Add multiple todos rapidly
      for (let i = 1; i <= 3; i++) {
        await user.type(input, `Rapid todo ${i}`);
        await user.keyboard('{Enter}');
      }
      
      // All todos should appear
      await waitFor(() => {
        expect(screen.getByText('Rapid todo 1')).toBeInTheDocument();
        expect(screen.getByText('Rapid todo 2')).toBeInTheDocument();
        expect(screen.getByText('Rapid todo 3')).toBeInTheDocument();
        expect(screen.getByText('0 of 3 tasks completed')).toBeInTheDocument();
      });
      
      // All operations should be logged
      await waitFor(() => {
        expect(mockLoggingService.infoLogs.filter(log => log.message === 'Todo added')).toHaveLength(3);
      });
    });

    it('handles empty input gracefully', async () => {
      render(<ContainerAwareTodoApp container={container} />);
      
      const user = userEvent.setup();
      const addButton = screen.getByRole('button', { name: 'Add Todo' });
      
      // Try to add empty todo
      await user.click(addButton);
      
      // Should remain in empty state
      expect(screen.getByText('No todos yet. Add one above!')).toBeInTheDocument();
      
      // No add logging should occur (only loadTodos)
      await waitFor(() => {
        expect(mockLoggingService.infoLogs.filter(log => log.message === 'Todo added')).toHaveLength(0);
      });
    });
  });
});