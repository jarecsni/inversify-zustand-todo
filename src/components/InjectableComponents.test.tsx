import React from 'react';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Container } from 'inversify';
import { TYPES } from '../container/types';
import { TodoStoreFactory } from '../stores/todoStore';
import { InjectableComponentWrapper } from './InjectableComponentWrapper';
import { InjectableTodoList } from './InjectableTodoList';
import { InjectableAddTodo } from './InjectableAddTodo';
import { InjectableTodoItem } from './InjectableTodoItem';
import { MockLoggingService } from '../test-utils/MockLoggingService';

describe('Injectable Components Integration', () => {
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

    // Bind injectable components
    container.bind(InjectableAddTodo).toSelf();
    container.bind(InjectableTodoItem).toSelf();
    container.bind(InjectableTodoList).toSelf().inSingletonScope();
  });

  afterEach(() => {
    mockLoggingService.clear();
  });

  describe('Dependency Injection with @inject Decorators', () => {
    it('successfully creates injectable components with injected dependencies', () => {
      render(<InjectableComponentWrapper container={container} />);
      
      expect(screen.getByText('Todo App (Injectable Components)')).toBeInTheDocument();
      expect(screen.getByText('No todos yet. Add one above!')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Add a new todo...')).toBeInTheDocument();
    });

    it('demonstrates that components receive injected stores', () => {
      const todoListComponent = container.get(InjectableTodoList);
      const addTodoComponent = container.get(InjectableAddTodo);
      
      // Both components should have the same injected store (singleton)
      const todoListStore = (todoListComponent as any).todoStore;
      const addTodoStore = (addTodoComponent as any).todoStore;
      
      expect(todoListStore).toBeDefined();
      expect(addTodoStore).toBeDefined();
      expect(todoListStore).toBe(addTodoStore);
    });

    it('shows that store operations work through dependency injection', async () => {
      render(<InjectableComponentWrapper container={container} />);
      
      const input = screen.getByPlaceholderText('Add a new todo...');
      const addButton = screen.getByRole('button', { name: 'Add Todo' });
      
      const user = userEvent.setup();
      
      // Add a todo through the UI
      await user.type(input, 'Injectable DI test');
      await user.click(addButton);
      
      // The UI should update
      expect(screen.getByText('Injectable DI test')).toBeInTheDocument();
      expect(screen.getByText('0 of 1 tasks completed')).toBeInTheDocument();
      
      // Logging should have occurred through dependency injection
      expect(mockLoggingService.infoLogs).toContainEqual(
        expect.objectContaining({
          message: 'Todo added',
          data: expect.objectContaining({ text: 'Injectable DI test' })
        })
      );
    });

    it('handles todo interactions through injected components', async () => {
      render(<InjectableComponentWrapper container={container} />);
      
      const user = userEvent.setup();
      
      // Add a todo
      const input = screen.getByPlaceholderText('Add a new todo...');
      await user.type(input, 'Interactive test');
      await user.keyboard('{Enter}');
      
      // Toggle the todo
      const checkbox = screen.getByRole('checkbox');
      await user.click(checkbox);
      
      expect(screen.getByText('1 of 1 tasks completed')).toBeInTheDocument();
      expect(checkbox).toBeChecked();
      
      // Remove the todo
      const removeButton = screen.getByRole('button', { name: 'Remove' });
      await user.click(removeButton);
      
      expect(screen.getByText('No todos yet. Add one above!')).toBeInTheDocument();
      
      // All operations should have been logged through DI
      const logs = mockLoggingService.infoLogs;
      expect(logs).toContainEqual(expect.objectContaining({ message: 'Todo added' }));
      expect(logs).toContainEqual(expect.objectContaining({ message: 'Todo toggled' }));
      expect(logs).toContainEqual(expect.objectContaining({ message: 'Todo removed' }));
    });
  });

  describe('Container Architecture Benefits', () => {
    it('allows easy swapping of dependencies', () => {
      // Create alternative mock with different behavior
      class AlternativeMockLogger {
        logs: string[] = [];
        info(message: string) { this.logs.push(`ALT: ${message}`); }
        error(message: string) { this.logs.push(`ALT ERROR: ${message}`); }
        warn(message: string) { this.logs.push(`ALT WARN: ${message}`); }
      }
      
      const altLogger = new AlternativeMockLogger();
      
      // Create new container with alternative logger
      const altContainer = new Container();
      altContainer.bind(TYPES.LoggingService).toConstantValue(altLogger);
      altContainer.bind(TodoStoreFactory).toSelf().inSingletonScope();
      altContainer.bind(TYPES.TodoStore).toDynamicValue((context) => {
        const factory = context.container.get(TodoStoreFactory);
        return factory.getStore();
      }).inSingletonScope();
      altContainer.bind(InjectableTodoList).toSelf().inSingletonScope();
      
      // Get component with alternative logger
      const todoList = altContainer.get(InjectableTodoList);
      const store = (todoList as any).todoStore;
      
      // Add a todo
      act(() => {
        store.getState().addTodo('Alternative logger test');
      });
      
      // Alternative logger should have been used
      expect(altLogger.logs).toContain('ALT: Todo added');
      
      // Original mock should be unchanged
      expect(mockLoggingService.getTotalLogCount()).toBe(0);
    });

    it('demonstrates singleton behavior across components', () => {
      const todoList1 = container.get(InjectableTodoList);
      const todoList2 = container.get(InjectableTodoList);
      const addTodo = container.get(InjectableAddTodo);
      
      // Components should be the same instance (singleton)
      expect(todoList1).toBe(todoList2);
      
      // But different component types should be different
      expect(todoList1).not.toBe(addTodo);
      
      // All should share the same store instance
      const store1 = (todoList1 as any).todoStore;
      const store2 = (todoList2 as any).todoStore;
      const store3 = (addTodo as any).todoStore;
      
      expect(store1).toBe(store2);
      expect(store2).toBe(store3);
    });
  });

  describe('Comparison with Manual DI', () => {
    it('shows the power of decorator-based injection vs manual passing', () => {
      // With @inject decorators, we just need to:
      // 1. Bind dependencies in container
      // 2. Get component from container
      // 3. Dependencies are automatically resolved
      
      const component = container.get(InjectableTodoList);
      const store = (component as any).todoStore;
      const storeFactory = container.get(TodoStoreFactory);
      const loggingService = (storeFactory as any).loggingService;
      
      // Verify the entire dependency chain was resolved automatically
      expect(component).toBeInstanceOf(InjectableTodoList);
      expect(store).toBeDefined();
      expect(storeFactory).toBeDefined();
      expect(loggingService).toBe(mockLoggingService);
      
      // Compare with manual approach (would require explicit passing):
      // const loggingService = new MockLoggingService();
      // const store = createTodoStore(loggingService);
      // const component = new TodoListComponent(store);
      
      // The decorator approach is much cleaner for complex dependency graphs
    });
  });
});