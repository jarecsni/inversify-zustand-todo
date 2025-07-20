import React, { Component } from 'react';
import { injectable, inject } from 'inversify';
import type { Todo } from '../types';
import type { TodoStore } from '../stores/todoStore';
import { TYPES } from '../container/types';

interface InjectableTodoItemProps {
  todo: Todo;
}

@injectable()
export class InjectableTodoItem extends Component<InjectableTodoItemProps> {
  constructor(
    @inject(TYPES.TodoStore) private todoStore: TodoStore,
    props?: InjectableTodoItemProps
  ) {
    super(props || {} as InjectableTodoItemProps);
  }

  private handleToggle = () => {
    this.todoStore.getState().toggleTodo(this.props.todo.id);
  };

  private handleRemove = () => {
    this.todoStore.getState().removeTodo(this.props.todo.id);
  };

  render() {
    const { todo } = this.props;
    
    return (
      <div
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
          onChange={this.handleToggle}
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
          onClick={this.handleRemove}
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
    );
  }
}