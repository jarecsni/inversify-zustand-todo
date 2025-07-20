import React, { Component } from 'react';
import { injectable, inject } from 'inversify';
import type { Todo } from '../types';
import type { TodoStore, TodoState } from '../stores/todoStore';
import { TYPES } from '../container/types';
import { InjectableAddTodo } from './InjectableAddTodo';
import { InjectableTodoItem } from './InjectableTodoItem';

interface InjectableTodoListState {
  todos: Todo[];
}

@injectable()
export class InjectableTodoList extends Component<{}, InjectableTodoListState> {
  private unsubscribe: (() => void) | null = null;

  constructor(
    @inject(TYPES.TodoStore) private todoStore: TodoStore
  ) {
    super({});
    this.state = {
      todos: this.todoStore.getState().todos
    };
  }

  componentDidMount() {
    // Subscribe to store changes
    this.unsubscribe = this.todoStore.subscribe((state: TodoState) => {
      this.setState({ todos: state.todos });
    });

    // Load todos on mount
    this.todoStore.getState().loadTodos();
  }

  componentWillUnmount() {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
  }

  render() {
    const { todos } = this.state;
    const completedCount = todos.filter((todo: Todo) => todo.completed).length;
    const totalCount = todos.length;

    return (
      <div data-testid="todo-list-container" style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
        <h1 style={{ textAlign: 'center', marginBottom: '30px' }}>
          Todo App (Injectable Components)
        </h1>
        
        <InjectableAddTodo />
        
        <div style={{ marginBottom: '20px' }}>
          <p data-testid="todo-stats" style={{ color: '#6c757d', fontSize: '14px' }}>
            {totalCount > 0 ? (
              `${completedCount} of ${totalCount} tasks completed`
            ) : (
              'No todos yet. Add one above!'
            )}
          </p>
        </div>

        <div data-testid="todos-container">
          {todos.map((todo: Todo) => (
            <InjectableTodoItem
              key={todo.id}
              todo={todo}
            />
          ))}
        </div>
      </div>
    );
  }
}