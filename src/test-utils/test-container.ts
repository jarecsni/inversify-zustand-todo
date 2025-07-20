import 'reflect-metadata';
import { Container } from 'inversify';
import { TYPES } from '../container/types';
import { ILoggingService } from '../services/LoggingService';
import { MockLoggingService } from './MockLoggingService';
import { createTodoStore, TodoStore } from '../stores/todoStore';

export interface TestContainerSetup {
  container: Container;
  mockLoggingService: MockLoggingService;
  todoStore: TodoStore;
}

export function createTestContainer(): TestContainerSetup {
  const container = new Container();
  const mockLoggingService = new MockLoggingService();

  // Bind the mock logging service
  container.bind<ILoggingService>(TYPES.LoggingService).toConstantValue(mockLoggingService);

  // Create and bind the todo store with the mock logging service
  const todoStore = createTodoStore(mockLoggingService);
  container.bind<TodoStore>(TYPES.TodoStore).toConstantValue(todoStore);

  return {
    container,
    mockLoggingService,
    todoStore,
  };
}

export function createTestContainerWithCustomMocks(
  customLoggingService?: ILoggingService
): TestContainerSetup {
  const container = new Container();
  const mockLoggingService = (customLoggingService as MockLoggingService) || new MockLoggingService();

  container.bind<ILoggingService>(TYPES.LoggingService).toConstantValue(mockLoggingService);
  
  const todoStore = createTodoStore(mockLoggingService);
  container.bind<TodoStore>(TYPES.TodoStore).toConstantValue(todoStore);

  return {
    container,
    mockLoggingService,
    todoStore,
  };
}