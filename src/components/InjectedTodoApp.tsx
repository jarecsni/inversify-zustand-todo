import React, { Component } from 'react';
import { injectable, inject } from 'inversify';
import type { Todo } from '../types';
import type { TodoStore, TodoState } from '../stores/todoStore';
import { TYPES } from '../container/types';

interface InjectedTodoAppState {
  todos: Todo[];
  newTodoText: string;
}

// This is a complete Todo App as a single injectable component
@injectable()
export class InjectedTodoApp extends Component<{}, InjectedTodoAppState> {
  private unsubscribe: (() => void) | null = null;

  constructor(
    @inject(TYPES.TodoStore) private todoStore: TodoStore
  ) {
    super({});
    this.state = {
      todos: this.todoStore.getState().todos,
      newTodoText: ''
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

  private handleAddTodo = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (this.state.newTodoText.trim()) {
      this.todoStore.getState().addTodo(this.state.newTodoText);
      this.setState({ newTodoText: '' });
    }
  };

  private handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ newTodoText: e.target.value });
  };

  private handleToggle = (id: string) => {
    this.todoStore.getState().toggleTodo(id);
  };

  private handleRemove = (id: string) => {
    this.todoStore.getState().removeTodo(id);
  };

  render() {
    const { todos, newTodoText } = this.state;
    const completedCount = todos.filter((todo: Todo) => todo.completed).length;
    const totalCount = todos.length;

    return (
      <div data-testid="injected-todo-app" style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
        <h1 style={{ textAlign: 'center', marginBottom: '30px' }}>
          Todo App (Fully Injectable)
        </h1>
        
        {/* Add Todo Form */}
        <form onSubmit={this.handleAddTodo} style={{ marginBottom: '20px' }}>
          <input
            type="text"
            value={newTodoText}
            onChange={this.handleTextChange}
            placeholder="Add a new todo..."
            style={{
              padding: '10px',
              fontSize: '16px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              marginRight: '10px',
              width: '300px'
            }}
          />
          <button
            type="submit"
            style={{
              padding: '10px 20px',
              fontSize: '16px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Add Todo
          </button>
        </form>
        
        {/* Stats */}
        <div style={{ marginBottom: '20px' }}>
          <p data-testid="todo-stats" style={{ color: '#6c757d', fontSize: '14px' }}>
            {totalCount > 0 ? (
              `${completedCount} of ${totalCount} tasks completed`
            ) : (
              'No todos yet. Add one above!'
            )}
          </p>
        </div>

        {/* Todo List */}
        <div data-testid="todos-container">
          {todos.map((todo: Todo) => (
            <div
              key={todo.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                marginBottom: '8px',
                backgroundColor: todo.completed ? '#f8f9fa' : 'white'
              }}
            >
              <input
                type="checkbox"
                checked={todo.completed}
                onChange={() => this.handleToggle(todo.id)}
                style={{ marginRight: '10px' }}
              />
              <span
                style={{
                  flex: 1,
                  textDecoration: todo.completed ? 'line-through' : 'none',
                  color: todo.completed ? '#6c757d' : 'black'
                }}
              >
                {todo.text}
              </span>
              <button
                onClick={() => this.handleRemove(todo.id)}
                style={{
                  padding: '5px 10px',
                  fontSize: '12px',
                  backgroundColor: '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: '3px',
                  cursor: 'pointer'
                }}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  }
}