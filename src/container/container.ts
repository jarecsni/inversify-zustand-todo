import 'reflect-metadata';
import { Container } from 'inversify';
import { TYPES } from './types';
import { LoggingService, ILoggingService } from '../services/LoggingService';
import { TodoStoreFactory } from '../stores/todoStore';
import { InjectableAddTodo } from '../components/InjectableAddTodo';
import { InjectableTodoItem } from '../components/InjectableTodoItem';
import { InjectableTodoList } from '../components/InjectableTodoList';
import { InjectedTodoApp } from '../components/InjectedTodoApp';

const container = new Container();

// Services
container.bind(TYPES.LoggingService).to(LoggingService).inSingletonScope();

// Store Factory and Store
container.bind(TodoStoreFactory).toSelf().inSingletonScope();
container.bind(TYPES.TodoStore).toDynamicValue((context) => {
  const factory = context.container.get(TodoStoreFactory);
  return factory.getStore();
}).inSingletonScope();

// Injectable Components
container.bind(InjectableAddTodo).toSelf();
container.bind(InjectableTodoItem).toSelf();
container.bind(InjectableTodoList).toSelf().inSingletonScope();
container.bind(InjectedTodoApp).toSelf().inSingletonScope();

export { container };