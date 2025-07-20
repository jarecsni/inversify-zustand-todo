import React, { Component } from 'react';
import { injectable, inject } from 'inversify';
import type { TodoStore } from '../stores/todoStore';
import { TYPES } from '../container/types';

interface InjectableAddTodoState {
  text: string;
}

@injectable()
export class InjectableAddTodo extends Component<{}, InjectableAddTodoState> {
  constructor(
    @inject(TYPES.TodoStore) private todoStore: TodoStore
  ) {
    super({});
    this.state = { text: '' };
  }

  private handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (this.state.text.trim()) {
      this.todoStore.getState().addTodo(this.state.text);
      this.setState({ text: '' });
    }
  };

  private handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ text: e.target.value });
  };

  render() {
    return (
      <form onSubmit={this.handleSubmit} style={{ marginBottom: '20px' }}>
        <input
          type="text"
          value={this.state.text}
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
    );
  }
}