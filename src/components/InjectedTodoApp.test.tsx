import React from 'react';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Container } from 'inversify';
import { TYPES } from '../container/types';
import { TodoStoreFactory } from '../stores/todoStore';
import { InjectedTodoApp } from './InjectedTodoApp';
import { SimpleInjectedWrapper } from './SimpleInjectedWrapper';
import { MockLoggingService } from '../test-utils/MockLoggingService';

describe('InjectedTodoApp - Complete Injectable Component', () => {
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
    container.bind(InjectedTodoApp).toSelf().inSingletonScope();
  });

  afterEach(() => {
    mockLoggingService.clear();
  });

  describe('Dependency Injection with @inject Decorator', () => {
    it('successfully creates component with injected TodoStore', () => {
      const todoApp = container.get(InjectedTodoApp);
      expect(todoApp).toBeInstanceOf(InjectedTodoApp);
      expect((todoApp as any).todoStore).toBeDefined();
      expect(typeof (todoApp as any).todoStore.getState).toBe('function');
    });

    it('renders the injectable component through wrapper', () => {
      render(<SimpleInjectedWrapper container={container} />);
      
      expect(screen.getByText('Todo App (Fully Injectable)')).toBeInTheDocument();
      expect(screen.getByText('No todos yet. Add one above!')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Add a new todo...')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Add Todo' })).toBeInTheDocument();
    });

    it('demonstrates store injection by adding todos', async () => {
      render(<SimpleInjectedWrapper container={container} />);
      
      const user = userEvent.setup();
      const input = screen.getByPlaceholderText('Add a new todo...');
      const addButton = screen.getByRole('button', { name: 'Add Todo' });
      
      // Add a todo
      await user.type(input, 'Injectable component test');
      await user.click(addButton);
      
      // Verify UI updates
      expect(screen.getByText('Injectable component test')).toBeInTheDocument();
      expect(screen.getByText('0 of 1 tasks completed')).toBeInTheDocument();
      
      // Verify logging through dependency injection
      expect(mockLoggingService.infoLogs).toContainEqual(
        expect.objectContaining({
          message: 'Todo added',
          data: expect.objectContaining({ text: 'Injectable component test' })
        })
      );
    });

    it('handles complete todo workflow with dependency injection', async () => {
      render(<SimpleInjectedWrapper container={container} />);
      
      const user = userEvent.setup();
      
      // Add todo
      const input = screen.getByPlaceholderText('Add a new todo...');
      await user.type(input, 'Full workflow test');
      await user.keyboard('{Enter}');
      
      expect(screen.getByText('Full workflow test')).toBeInTheDocument();
      
      // Toggle todo
      const checkbox = screen.getByRole('checkbox');
      await user.click(checkbox);
      
      expect(checkbox).toBeChecked();
      expect(screen.getByText('1 of 1 tasks completed')).toBeInTheDocument();
      
      // Remove todo
      const removeButton = screen.getByRole('button', { name: 'Remove' });
      await user.click(removeButton);
      
      expect(screen.getByText('No todos yet. Add one above!')).toBeInTheDocument();
      expect(screen.queryByText('Full workflow test')).not.toBeInTheDocument();
      
      // Verify all operations were logged through dependency injection
      const logs = mockLoggingService.infoLogs;
      expect(logs.filter(log => log.message === 'Todo added')).toHaveLength(1);
      expect(logs.filter(log => log.message === 'Todo toggled')).toHaveLength(1);
      expect(logs.filter(log => log.message === 'Todo removed')).toHaveLength(1);
    });
  });

  describe('Component Lifecycle and State Management', () => {
    it('subscribes to store changes and updates component state', () => {
      const todoApp = container.get(InjectedTodoApp);
      const store = (todoApp as any).todoStore;
      
      // Initial state
      expect(todoApp.state.todos).toHaveLength(0);
      
      // Simulate componentDidMount
      todoApp.componentDidMount();
      
      // Add todo through store
      act(() => {
        store.getState().addTodo('State sync test');
      });
      
      // Component state should be updated
      expect(todoApp.state.todos).toHaveLength(1);
      expect(todoApp.state.todos[0].text).toBe('State sync test');
    });

    it('cleans up subscription on unmount', () => {
      const todoApp = container.get(InjectedTodoApp);
      
      // Mount and verify subscription exists
      todoApp.componentDidMount();
      expect((todoApp as any).unsubscribe).toBeDefined();
      
      // Unmount and verify cleanup
      todoApp.componentWillUnmount();
      expect((todoApp as any).unsubscribe).toBeNull();
    });

    it('resets form input after adding todo', () => {
      const todoApp = container.get(InjectedTodoApp);
      
      // Set form state
      todoApp.setState({ newTodoText: 'Test input' });
      expect(todoApp.state.newTodoText).toBe('Test input');
      
      // Simulate form submission
      const mockEvent = { preventDefault: jest.fn() } as any;
      act(() => {
        (todoApp as any).handleAddTodo(mockEvent);
      });
      
      // Form should be reset
      expect(todoApp.state.newTodoText).toBe('');
    });
  });

  describe('Decorator-based vs Manual Dependency Injection Comparison', () => {
    it('shows automatic dependency resolution with @inject', () => {
      // With @inject, we just get the component from container
      const todoApp = container.get(InjectedTodoApp);
      const store = (todoApp as any).todoStore;
      const storeFactory = container.get(TodoStoreFactory);
      const loggingService = (storeFactory as any).loggingService;
      
      // Entire dependency chain resolved automatically:
      // LoggingService -> TodoStoreFactory -> TodoStore -> InjectedTodoApp
      expect(todoApp).toBeInstanceOf(InjectedTodoApp);
      expect(store).toBeDefined();
      expect(storeFactory).toBeDefined();
      expect(loggingService).toBe(mockLoggingService);
      
      // This is much cleaner than manual:
      // const loggingService = new LoggingService();
      // const store = createTodoStore(loggingService);
      // const todoApp = new InjectedTodoApp(store);
    });

    it('demonstrates singleton behavior', () => {
      const app1 = container.get(InjectedTodoApp);
      const app2 = container.get(InjectedTodoApp);
      const store1 = (app1 as any).todoStore;
      const store2 = (app2 as any).todoStore;
      
      // Components should be same instance (singleton)
      expect(app1).toBe(app2);
      
      // Store should also be same instance
      expect(store1).toBe(store2);
    });

    it('allows easy dependency substitution', () => {
      // Create custom logger
      class CustomLogger {
        logs: string[] = [];
        info(msg: string) { this.logs.push(`CUSTOM: ${msg}`); }
        error(msg: string) { this.logs.push(`CUSTOM ERROR: ${msg}`); }
        warn(msg: string) { this.logs.push(`CUSTOM WARN: ${msg}`); }
      }
      
      const customLogger = new CustomLogger();
      
      // Create new container with custom logger
      const customContainer = new Container();
      customContainer.bind(TYPES.LoggingService).toConstantValue(customLogger);
      customContainer.bind(TodoStoreFactory).toSelf().inSingletonScope();
      customContainer.bind(TYPES.TodoStore).toDynamicValue((context) => {
        const factory = context.container.get(TodoStoreFactory);
        return factory.getStore();
      }).inSingletonScope();
      customContainer.bind(InjectedTodoApp).toSelf().inSingletonScope();
      
      // Get component with custom logger
      const todoApp = customContainer.get(InjectedTodoApp);
      const store = (todoApp as any).todoStore;
      
      act(() => {
        store.getState().addTodo('Custom logger test');
      });
      
      // Custom logger should be used
      expect(customLogger.logs).toContain('CUSTOM: Todo added');
      
      // Original mock unchanged
      expect(mockLoggingService.getTotalLogCount()).toBe(0);
    });
  });

  describe('Real-world Usage Patterns', () => {
    it('handles multiple rapid interactions correctly', async () => {
      render(<SimpleInjectedWrapper container={container} />);
      
      const user = userEvent.setup();
      const input = screen.getByPlaceholderText('Add a new todo...');
      
      // Add multiple todos quickly
      for (let i = 1; i <= 3; i++) {
        await user.type(input, `Todo ${i}`);
        await user.keyboard('{Enter}');
      }
      
      // All todos should appear
      expect(screen.getByText('Todo 1')).toBeInTheDocument();
      expect(screen.getByText('Todo 2')).toBeInTheDocument();
      expect(screen.getByText('Todo 3')).toBeInTheDocument();
      expect(screen.getByText('0 of 3 tasks completed')).toBeInTheDocument();
      
      // All operations should be logged
      expect(mockLoggingService.infoLogs.filter(log => log.message === 'Todo added')).toHaveLength(3);
    });

    it('handles empty input gracefully', async () => {
      render(<SimpleInjectedWrapper container={container} />);
      
      const user = userEvent.setup();
      const addButton = screen.getByRole('button', { name: 'Add Todo' });
      
      // Try to add empty todo
      await user.click(addButton);
      
      // Should remain in empty state
      expect(screen.getByText('No todos yet. Add one above!')).toBeInTheDocument();
      
      // No logging should occur for empty todos
      expect(mockLoggingService.infoLogs.filter(log => log.message === 'Todo added')).toHaveLength(0);
    });
  });
});