import React, { useState, useEffect } from 'react';
import { Container } from 'inversify';
import { TYPES } from '../container/types';
import type { Todo } from '../types';
import type { TodoStore, TodoState } from '../stores/todoStore';

interface ContainerAwareTodoAppProps {
  container: Container;
}

export const ContainerAwareTodoApp: React.FC<ContainerAwareTodoAppProps> = ({ container }) => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTodoText, setNewTodoText] = useState('');

  // Get injected dependencies from container
  const todoStore = container.get<TodoStore>(TYPES.TodoStore);

  useEffect(() => {
    // Subscribe to store changes
    const unsubscribe = todoStore.subscribe((state: TodoState) => {
      setTodos(state.todos);
    });

    // Load initial todos
    todoStore.getState().loadTodos();
    setTodos(todoStore.getState().todos);

    return () => {
      unsubscribe();
    };
  }, [todoStore]);

  const handleAddTodo = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (newTodoText.trim()) {
      todoStore.getState().addTodo(newTodoText);
      setNewTodoText('');
    }
  };

  const handleToggle = (id: string) => {
    todoStore.getState().toggleTodo(id);
  };

  const handleRemove = (id: string) => {
    todoStore.getState().removeTodo(id);
  };

  const completedCount = todos.filter((todo: Todo) => todo.completed).length;
  const totalCount = todos.length;

  return (
    <div data-testid="container-aware-todo-app" style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '30px' }}>
        Todo App (Container-Aware Functional Component)
      </h1>
      
      {/* Add Todo Form */}
      <form onSubmit={handleAddTodo} style={{ marginBottom: '20px' }}>
        <input
          type="text"
          value={newTodoText}
          onChange={(e) => setNewTodoText(e.target.value)}
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
              onChange={() => handleToggle(todo.id)}
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
              onClick={() => handleRemove(todo.id)}
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
};