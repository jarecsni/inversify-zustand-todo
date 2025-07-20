import 'reflect-metadata';
import { Container } from 'inversify';
import { act } from '@testing-library/react';
import { 
  DecoratedTodoStoreFactory, 
  createTodoStoreWithManualDI,
  TodoStore 
} from './decoratedTodoStore';
import { MockLoggingService } from '../test-utils/MockLoggingService';
import { LoggingService, ILoggingService } from '../services/LoggingService';
import { TYPES } from '../container/types';

describe('InversifyJS Decorator vs Manual DI Comparison', () => {
  let container: Container;
  let mockLoggingService: MockLoggingService;

  beforeEach(() => {
    container = new Container();
    mockLoggingService = new MockLoggingService();
  });

  afterEach(() => {
    mockLoggingService.clear();
  });

  describe('Decorator-based Dependency Injection (@injectable + @inject)', () => {
    let decoratedStore: TodoStore;

    beforeEach(() => {
      // Bind the mock logging service
      container.bind<ILoggingService>(TYPES.LoggingService).toConstantValue(mockLoggingService);
      
      // Bind the decorated store factory
      container.bind(DecoratedTodoStoreFactory).toSelf();
      
      // Get the factory and create store (InversifyJS handles @inject automatically)
      const storeFactory = container.get(DecoratedTodoStoreFactory);
      decoratedStore = storeFactory.getStore();
    });

    it('automatically injects dependencies using @inject decorator', () => {
      act(() => {
        decoratedStore.getState().addTodo('Decorator injection test');
      });

      const todos = decoratedStore.getState().todos;
      expect(todos).toHaveLength(1);
      expect(todos[0].text).toBe('Decorator injection test');

      // Verify that the injected logging service was used
      expect(mockLoggingService.infoLogs).toHaveLength(1);
      expect(mockLoggingService.getLastInfoLog()).toEqual({
        message: 'Todo added via decorator injection',
        data: expect.objectContaining({
          text: 'Decorator injection test'
        })
      });
    });

    it('demonstrates how @inject works with InversifyJS container resolution', () => {
      // The fact that this test works proves that:
      // 1. @injectable() made DecoratedTodoStoreFactory discoverable by InversifyJS
      // 2. @inject(TYPES.LoggingService) told InversifyJS what to inject
      // 3. The container automatically resolved and injected the dependency
      
      expect(mockLoggingService.getTotalLogCount()).toBe(0);
      
      act(() => {
        decoratedStore.getState().loadTodos();
      });

      expect(mockLoggingService.getTotalLogCount()).toBe(1);
      expect(mockLoggingService.getLastInfoLog().message).toBe('Todos loaded via decorator injection');
    });

    it('handles constructor injection automatically', () => {
      // Create a second instance to verify constructor injection works repeatedly
      const storeFactory2 = container.get(DecoratedTodoStoreFactory);
      const decoratedStore2 = storeFactory2.getStore();

      act(() => {
        decoratedStore2.getState().addTodo('Second instance test');
      });

      expect(mockLoggingService.infoLogs).toHaveLength(1);
      expect(mockLoggingService.getLastInfoLog().data).toMatchObject({
        text: 'Second instance test'
      });
    });
  });

  describe('Manual Dependency Injection (Function Parameter)', () => {
    let manualStore: TodoStore;

    beforeEach(() => {
      // With manual DI, we explicitly pass the dependency
      manualStore = createTodoStoreWithManualDI(mockLoggingService);
    });

    it('requires explicit dependency passing', () => {
      act(() => {
        manualStore.getState().addTodo('Manual injection test');
      });

      const todos = manualStore.getState().todos;
      expect(todos).toHaveLength(1);
      expect(todos[0].text).toBe('Manual injection test');

      // Verify the manually passed logging service was used
      expect(mockLoggingService.infoLogs).toHaveLength(1);
      expect(mockLoggingService.getLastInfoLog()).toEqual({
        message: 'Todo added via manual injection',
        data: expect.objectContaining({
          text: 'Manual injection test'
        })
      });
    });

    it('demonstrates manual control over dependencies', () => {
      // We can pass different implementations easily
      const customMock = new MockLoggingService();
      const customStore = createTodoStoreWithManualDI(customMock);

      act(() => {
        customStore.getState().addTodo('Custom mock test');
      });

      // Original mock should be unchanged
      expect(mockLoggingService.getTotalLogCount()).toBe(0);
      
      // Custom mock should have the log
      expect(customMock.getTotalLogCount()).toBe(1);
      expect(customMock.getLastInfoLog().data).toMatchObject({
        text: 'Custom mock test'
      });
    });
  });

  describe('Side-by-Side Comparison', () => {
    it('both approaches achieve the same result with different mechanisms', () => {
      // Setup decorator approach
      container.bind<ILoggingService>(TYPES.LoggingService).toConstantValue(mockLoggingService);
      container.bind(DecoratedTodoStoreFactory).toSelf();
      const decoratedFactory = container.get(DecoratedTodoStoreFactory);
      const decoratedStore = decoratedFactory.getStore();

      // Setup manual approach  
      const manualStore = createTodoStoreWithManualDI(mockLoggingService);

      // Both should work identically
      act(() => {
        decoratedStore.getState().addTodo('Decorator approach');
        manualStore.getState().addTodo('Manual approach');
      });

      // Both should have created todos
      expect(decoratedStore.getState().todos).toHaveLength(1);
      expect(manualStore.getState().todos).toHaveLength(1);

      // Both should have logged (2 total logs)
      expect(mockLoggingService.infoLogs).toHaveLength(2);
      
      const decoratorLog = mockLoggingService.infoLogs.find(log => 
        log.message === 'Todo added via decorator injection'
      );
      const manualLog = mockLoggingService.infoLogs.find(log => 
        log.message === 'Todo added via manual injection'  
      );

      expect(decoratorLog).toBeDefined();
      expect(manualLog).toBeDefined();
    });
  });

  describe('Why We Chose Manual DI for Zustand', () => {
    it('demonstrates that manual DI is simpler for functional approaches', () => {
      // Manual DI advantages:
      // 1. No need for class-based approach
      // 2. More explicit and easier to understand
      // 3. Better fits with Zustand's functional nature
      // 4. Easier to test (no need for container setup in simple cases)
      
      const simpleLoggingService = new LoggingService();
      const store = createTodoStoreWithManualDI(simpleLoggingService);
      
      // This is straightforward and requires no decorators or container magic
      expect(store).toBeDefined();
      expect(typeof store.getState).toBe('function');
      expect(Array.isArray(store.getState().todos)).toBe(true);
    });

    it('shows decorator DI is better for complex class hierarchies', () => {
      // Decorator DI advantages:
      // 1. Automatic resolution of complex dependency graphs
      // 2. Better for large applications with many dependencies
      // 3. More "magical" but more powerful for complex scenarios
      
      container.bind<ILoggingService>(TYPES.LoggingService).to(LoggingService);
      container.bind(DecoratedTodoStoreFactory).toSelf();
      
      // InversifyJS automatically handles the entire dependency graph
      const factory = container.get(DecoratedTodoStoreFactory);
      const store = factory.getStore();
      
      expect(store).toBeDefined();
      expect(typeof store.getState).toBe('function');
      expect(Array.isArray(store.getState().todos)).toBe(true);
    });
  });
});