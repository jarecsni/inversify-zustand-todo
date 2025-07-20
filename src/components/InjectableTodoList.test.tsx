import React from 'react';
import { screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Container } from 'inversify';
import { TYPES } from '../container/types';
import { TodoStoreFactory } from '../stores/todoStore';
import { InjectableTodoList } from './InjectableTodoList';
import { InjectableAddTodo } from './InjectableAddTodo';
import { InjectableTodoItem } from './InjectableTodoItem';
import { MockLoggingService } from '../test-utils/MockLoggingService';
import { LoggingService } from '../services/LoggingService';

describe('Injectable Components with @inject Decorators', () => {
  let container: Container;
  let mockLoggingService: MockLoggingService;
  let todoList: InjectableTodoList;

  beforeEach(() => {
    container = new Container();
    mockLoggingService = new MockLoggingService();

    // Bind dependencies
    container.bind(TYPES.LoggingService).toConstantValue(mockLoggingService);
    container.bind(TodoStoreFactory).toSelf().inSingletonScope();
    container.bind(TYPES.TodoStore).toDynamicValue((context) => {
      const factory = context.container.get(TodoStoreFactory);
      return factory.getStore();
    }).inSingletonScope();

    // Bind injectable components
    container.bind(InjectableAddTodo).toSelf();
    container.bind(InjectableTodoItem).toSelf();
    container.bind(InjectableTodoList).toSelf();

    // Get the main component
    todoList = container.get(InjectableTodoList);
  });

  afterEach(() => {
    mockLoggingService.clear();
  });

  describe('InjectableTodoList Class Component', () => {
    it('successfully injects TodoStore via @inject decorator', () => {
      expect(todoList).toBeInstanceOf(InjectableTodoList);
      expect((todoList as any).todoStore).toBeDefined();
      expect(typeof (todoList as any).todoStore.getState).toBe('function');
    });

    it('renders correctly with injected dependencies', () => {
      const rendered = todoList.render();
      expect(rendered).toBeDefined();
      expect(React.isValidElement(rendered)).toBe(true);
    });

    it('manages state through injected store', () => {
      const store = (todoList as any).todoStore;
      
      // Initial state should be empty
      expect(store.getState().todos).toHaveLength(0);
      
      // Add a todo through the store
      act(() => {
        store.getState().addTodo('Test injectable todo');
      });
      
      // State should be updated
      expect(store.getState().todos).toHaveLength(1);
      expect(store.getState().todos[0].text).toBe('Test injectable todo');
      
      // Logging should have happened through dependency injection
      expect(mockLoggingService.infoLogs).toHaveLength(1);
      expect(mockLoggingService.getLastInfoLog().message).toBe('Todo added');
    });

    it('subscribes to store changes on mount', () => {
      const store = (todoList as any).todoStore;
      
      // Simulate componentDidMount
      todoList.componentDidMount();
      
      expect(mockLoggingService.infoLogs).toContainEqual(
        expect.objectContaining({
          message: 'Todos loaded',
          data: { count: 0 }
        })
      );
      
      // Change store state
      act(() => {
        store.getState().addTodo('Subscription test');
      });
      
      // Component state should be updated via subscription
      expect(todoList.state.todos).toHaveLength(1);
      expect(todoList.state.todos[0].text).toBe('Subscription test');
    });

    it('unsubscribes on unmount', () => {
      todoList.componentDidMount();
      expect((todoList as any).unsubscribe).toBeDefined();
      
      todoList.componentWillUnmount();
      
      // Subscription should be cleaned up
      expect((todoList as any).unsubscribe).toBeNull();
    });
  });

  describe('InjectableAddTodo Class Component', () => {
    it('successfully injects TodoStore via @inject decorator', () => {
      const addTodoComponent = container.get(InjectableAddTodo);
      expect(addTodoComponent).toBeInstanceOf(InjectableAddTodo);
      expect((addTodoComponent as any).todoStore).toBeDefined();
    });

    it('can add todos through injected store', () => {
      const addTodoComponent = container.get(InjectableAddTodo);
      const store = (addTodoComponent as any).todoStore;
      
      // Set component state and trigger submit
      addTodoComponent.setState({ text: 'Injectable add test' });
      
      const mockEvent = {
        preventDefault: jest.fn()
      } as any;
      
      act(() => {
        (addTodoComponent as any).handleSubmit(mockEvent);
      });
      
      // Todo should be added to store
      expect(store.getState().todos).toHaveLength(1);
      expect(store.getState().todos[0].text).toBe('Injectable add test');
      
      // Component state should be reset
      expect(addTodoComponent.state.text).toBe('');
      
      // Logging should have occurred
      expect(mockLoggingService.infoLogs).toHaveLength(1);
    });
  });

  describe('InjectableTodoItem Class Component', () => {
    it('successfully injects TodoStore via @inject decorator', () => {
      const todo = { id: '1', text: 'Test todo', completed: false, createdAt: new Date() };
      const itemComponent = container.get(InjectableTodoItem);
      
      // Manually set props since we can't use React rendering in this test
      (itemComponent as any).props = { todo };
      
      expect(itemComponent).toBeInstanceOf(InjectableTodoItem);
      expect((itemComponent as any).todoStore).toBeDefined();
    });

    it('can toggle todos through injected store', () => {
      const todo = { id: '1', text: 'Test todo', completed: false, createdAt: new Date() };
      const itemComponent = container.get(InjectableTodoItem);
      const store = (itemComponent as any).todoStore;
      
      // Manually set props and add todo to store
      (itemComponent as any).props = { todo };
      act(() => {
        store.getState().addTodo('Test todo');
      });
      mockLoggingService.clear(); // Clear add log
      
      // Trigger toggle
      act(() => {
        (itemComponent as any).handleToggle();
      });
      
      // Todo should be toggled in store
      const todos = store.getState().todos;
      expect(todos).toHaveLength(1);
      expect(todos[0].completed).toBe(true);
      
      // Logging should have occurred
      expect(mockLoggingService.infoLogs).toHaveLength(1);
      expect(mockLoggingService.getLastInfoLog().message).toBe('Todo toggled');
    });

    it('can remove todos through injected store', () => {
      const todo = { id: '1', text: 'Test todo', completed: false, createdAt: new Date() };
      const itemComponent = container.get(InjectableTodoItem);
      const store = (itemComponent as any).todoStore;
      
      // Manually set props and add todo to store
      (itemComponent as any).props = { todo };
      act(() => {
        store.getState().addTodo('Test todo');
      });
      mockLoggingService.clear(); // Clear add log
      
      // Trigger remove
      act(() => {
        (itemComponent as any).handleRemove();
      });
      
      // Todo should be removed from store
      expect(store.getState().todos).toHaveLength(0);
      
      // Logging should have occurred
      expect(mockLoggingService.infoLogs).toHaveLength(1);
      expect(mockLoggingService.getLastInfoLog().message).toBe('Todo removed');
    });
  });

  describe('Dependency Injection Validation', () => {
    it('demonstrates automatic dependency resolution with @inject', () => {
      // All these components should be created with their dependencies automatically injected
      const addTodo = container.get(InjectableAddTodo);
      const todoItem = container.get(InjectableTodoItem);
      const todoListComp = container.get(InjectableTodoList);
      
      // All should have the same store instance (singleton)
      const addTodoStore = (addTodo as any).todoStore;
      const todoItemStore = (todoItem as any).todoStore;
      const todoListStore = (todoListComp as any).todoStore;
      
      expect(addTodoStore).toBe(todoItemStore);
      expect(todoItemStore).toBe(todoListStore);
    });

    it('shows InversifyJS resolves the entire dependency graph', () => {
      // The container should automatically wire:
      // 1. LoggingService -> TodoStoreFactory -> TodoStore
      // 2. TodoStore -> InjectableTodoList
      
      const loggingService = container.get(TYPES.LoggingService);
      const storeFactory = container.get(TodoStoreFactory);
      const store = container.get(TYPES.TodoStore);
      const todoListComp = container.get(InjectableTodoList);
      
      expect(loggingService).toBe(mockLoggingService);
      expect((storeFactory as any).loggingService).toBe(mockLoggingService);
      expect(store).toBe((todoListComp as any).todoStore);
    });

    it('allows swapping implementations via container rebinding', () => {
      // Replace with real logging service
      container.rebind(TYPES.LoggingService).to(LoggingService);
      
      // Get a fresh component
      const freshTodoList = container.get(InjectableTodoList);
      const freshStore = (freshTodoList as any).todoStore;
      
      // Should use the real logging service now
      act(() => {
        freshStore.getState().addTodo('Real logger test');
      });
      
      // Mock service should be unchanged
      expect(mockLoggingService.getTotalLogCount()).toBe(0);
    });
  });

  describe('Performance and Lifecycle', () => {
    it('demonstrates singleton behavior for stores', () => {
      const comp1 = container.get(InjectableTodoList);
      const comp2 = container.get(InjectableTodoList);
      
      // Components should be different instances
      expect(comp1).not.toBe(comp2);
      
      // But they should share the same store (singleton)
      expect((comp1 as any).todoStore).toBe((comp2 as any).todoStore);
    });

    it('handles component lifecycle correctly', () => {
      const component = container.get(InjectableTodoList);
      
      // Before mount
      expect(component.state.todos).toHaveLength(0);
      expect((component as any).unsubscribe).toBeNull();
      
      // After mount
      component.componentDidMount();
      expect((component as any).unsubscribe).toBeDefined();
      
      // After unmount
      component.componentWillUnmount();
      expect((component as any).unsubscribe).toBeNull();
    });
  });
});