import 'reflect-metadata';
import { Container } from 'inversify';
import { TYPES } from './types';
import { LoggingService, ILoggingService } from '../services/LoggingService';
import { createTodoStore } from '../stores/todoStore';

const container = new Container();

container.bind(TYPES.LoggingService).to(LoggingService).inSingletonScope();
container.bind(TYPES.TodoStore).toDynamicValue((context) => {
  const loggingService = context.container.get<ILoggingService>(TYPES.LoggingService);
  return createTodoStore(loggingService);
}).inSingletonScope();

export { container };