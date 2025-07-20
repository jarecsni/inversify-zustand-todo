import React, { useEffect } from 'react';
import { container } from '../container';
import { TYPES } from '../container/types';
import { Todo } from '../types';
import { TodoStore, TodoState } from '../stores/todoStore';
import { TodoItem } from './TodoItem';
import { AddTodo } from './AddTodo';

export const TodoList: React.FC = () => {
  const todoStore = container.get<TodoStore>(TYPES.TodoStore);
  const todos = todoStore((state: TodoState) => state.todos);
  const addTodo = todoStore((state: TodoState) => state.addTodo);
  const toggleTodo = todoStore((state: TodoState) => state.toggleTodo);
  const removeTodo = todoStore((state: TodoState) => state.removeTodo);
  const loadTodos = todoStore((state: TodoState) => state.loadTodos);

  useEffect(() => {
    loadTodos();
  }, [loadTodos]);

  const completedCount = todos.filter((todo: Todo) => todo.completed).length;
  const totalCount = todos.length;

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '30px' }}>
        Todo App
      </h1>
      
      <AddTodo onAdd={addTodo} />
      
      <div style={{ marginBottom: '20px' }}>
        <p style={{ color: '#6c757d', fontSize: '14px' }}>
          {totalCount > 0 ? (
            `${completedCount} of ${totalCount} tasks completed`
          ) : (
            'No todos yet. Add one above!'
          )}
        </p>
      </div>

      <div>
        {todos.map((todo: Todo) => (
          <TodoItem
            key={todo.id}
            todo={todo}
            onToggle={toggleTodo}
            onRemove={removeTodo}
          />
        ))}
      </div>
    </div>
  );
};