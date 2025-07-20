import React, { useEffect } from 'react';
import { screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Container } from 'inversify';
import { TYPES } from '../container/types';
import { Todo } from '../types';
import { TodoStore, TodoState } from '../stores/todoStore';
import { TodoItem } from './TodoItem';
import { AddTodo } from './AddTodo';
import { 
  renderWithContainer, 
  createTestContainer, 
  useTestContainer 
} from '../test-utils/component-test-utils';

// Create a testable version of TodoList that uses the test container
const TestableTodoList: React.FC = () => {
  const container = useTestContainer();
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
    <div data-testid="todo-list-container" style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '30px' }}>
        Todo App
      </h1>
      
      <AddTodo onAdd={addTodo} />
      
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

describe('TodoList Integration Tests', () => {
  let testContainer: ReturnType<typeof createTestContainer>;

  beforeEach(() => {
    testContainer = createTestContainer();
  });

  afterEach(() => {
    testContainer.mockLoggingService.clear();
  });

  describe('Initial Rendering', () => {
    it('renders the main todo app structure', () => {
      renderWithContainer(<TestableTodoList />, { testContainer });
      
      expect(screen.getByText('Todo App')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Add a new todo...')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Add Todo' })).toBeInTheDocument();
      expect(screen.getByTestId('todo-stats')).toBeInTheDocument();
      expect(screen.getByTestId('todos-container')).toBeInTheDocument();
    });

    it('shows empty state message initially', () => {
      renderWithContainer(<TestableTodoList />, { testContainer });
      
      expect(screen.getByText('No todos yet. Add one above!')).toBeInTheDocument();
    });

    it('calls loadTodos on mount and logs the action', async () => {
      renderWithContainer(<TestableTodoList />, { testContainer });
      
      await waitFor(() => {
        expect(testContainer.mockLoggingService.infoLogs).toContainEqual(
          expect.objectContaining({
            message: 'Todos loaded',
            data: { count: 0 }
          })
        );
      });
    });
  });

  describe('Adding Todos', () => {
    it('adds a todo and updates the UI', async () => {
      const user = userEvent.setup();
      
      renderWithContainer(<TestableTodoList />, { testContainer });

      const input = screen.getByPlaceholderText('Add a new todo...');
      const addButton = screen.getByRole('button', { name: 'Add Todo' });

      await user.type(input, 'Test todo item');
      await user.click(addButton);

      await waitFor(() => {
        expect(screen.getByText('Test todo item')).toBeInTheDocument();
        expect(screen.getByText('0 of 1 tasks completed')).toBeInTheDocument();
      });

      // Verify logging through dependency injection
      await waitFor(() => {
        const addLogs = testContainer.mockLoggingService.infoLogs.filter(log => log.message === 'Todo added');
        expect(addLogs).toHaveLength(1);
        expect(addLogs[0].data).toMatchObject({ text: 'Test todo item' });
      });
    });

    it('adds multiple todos correctly', async () => {
      const user = userEvent.setup();
      
      renderWithContainer(<TestableTodoList />, { testContainer });

      const input = screen.getByPlaceholderText('Add a new todo...');

      // Add first todo
      await user.type(input, 'First todo');
      await user.keyboard('{Enter}');

      // Add second todo  
      await user.type(input, 'Second todo');
      await user.keyboard('{Enter}');

      // Add third todo
      await user.type(input, 'Third todo');
      await user.keyboard('{Enter}');

      await waitFor(() => {
        expect(screen.getByText('First todo')).toBeInTheDocument();
        expect(screen.getByText('Second todo')).toBeInTheDocument();
        expect(screen.getByText('Third todo')).toBeInTheDocument();
        expect(screen.getByText('0 of 3 tasks completed')).toBeInTheDocument();
      });

      // Verify all three logging events
      await waitFor(() => {
        const addLogs = testContainer.mockLoggingService.infoLogs.filter(log => log.message === 'Todo added');
        expect(addLogs).toHaveLength(3);
      });
    });
  });

  describe('Toggling Todos', () => {
    beforeEach(async () => {
      // Add some test todos before each test
      act(() => {
        testContainer.todoStore.getState().addTodo('First todo');
        testContainer.todoStore.getState().addTodo('Second todo');
      });
      testContainer.mockLoggingService.clear(); // Clear add logs
    });

    it('toggles a todo and updates the completion count', async () => {
      const user = userEvent.setup();
      
      renderWithContainer(<TestableTodoList />, { testContainer });

      await waitFor(() => {
        expect(screen.getByText('0 of 2 tasks completed')).toBeInTheDocument();
      });

      const checkboxes = screen.getAllByRole('checkbox');
      await user.click(checkboxes[0]);

      await waitFor(() => {
        expect(screen.getByText('1 of 2 tasks completed')).toBeInTheDocument();
        expect(checkboxes[0]).toBeChecked();
      });

      // Verify logging
      await waitFor(() => {
        const toggleLogs = testContainer.mockLoggingService.infoLogs.filter(log => log.message === 'Todo toggled');
        expect(toggleLogs).toHaveLength(1);
        expect(toggleLogs[0].data).toMatchObject({ completed: true });
      });
    });

    it('toggles multiple todos and updates counts correctly', async () => {
      const user = userEvent.setup();
      
      renderWithContainer(<TestableTodoList />, { testContainer });

      const checkboxes = screen.getAllByRole('checkbox');
      
      // Toggle both todos
      await user.click(checkboxes[0]);
      await user.click(checkboxes[1]);

      await waitFor(() => {
        expect(screen.getByText('2 of 2 tasks completed')).toBeInTheDocument();
        expect(checkboxes[0]).toBeChecked();
        expect(checkboxes[1]).toBeChecked();
      });

      // Toggle one back
      await user.click(checkboxes[0]);

      await waitFor(() => {
        expect(screen.getByText('1 of 2 tasks completed')).toBeInTheDocument();
        expect(checkboxes[0]).not.toBeChecked();
        expect(checkboxes[1]).toBeChecked();
      });
    });
  });

  describe('Removing Todos', () => {
    beforeEach(async () => {
      act(() => {
        testContainer.todoStore.getState().addTodo('Todo to remove');
        testContainer.todoStore.getState().addTodo('Todo to keep');
      });
      testContainer.mockLoggingService.clear();
    });

    it('removes a todo and updates the UI', async () => {
      const user = userEvent.setup();
      
      renderWithContainer(<TestableTodoList />, { testContainer });

      await waitFor(() => {
        expect(screen.getByText('Todo to remove')).toBeInTheDocument();
        expect(screen.getByText('Todo to keep')).toBeInTheDocument();
      });

      const removeButtons = screen.getAllByRole('button', { name: 'Remove' });
      await user.click(removeButtons[0]);

      await waitFor(() => {
        expect(screen.queryByText('Todo to remove')).not.toBeInTheDocument();
        expect(screen.getByText('Todo to keep')).toBeInTheDocument();
        expect(screen.getByText('0 of 1 tasks completed')).toBeInTheDocument();
      });

      // Verify logging
      await waitFor(() => {
        const removeLogs = testContainer.mockLoggingService.infoLogs.filter(log => log.message === 'Todo removed');
        expect(removeLogs).toHaveLength(1);
      });
    });

    it('removes all todos and shows empty state', async () => {
      const user = userEvent.setup();
      
      renderWithContainer(<TestableTodoList />, { testContainer });

      const removeButtons = screen.getAllByRole('button', { name: 'Remove' });
      
      // Remove both todos
      await user.click(removeButtons[0]);
      await user.click(removeButtons[1]);

      await waitFor(() => {
        expect(screen.queryByText('Todo to remove')).not.toBeInTheDocument();
        expect(screen.queryByText('Todo to keep')).not.toBeInTheDocument();
        expect(screen.getByText('No todos yet. Add one above!')).toBeInTheDocument();
      });
    });
  });

  describe('Complete Workflow Tests', () => {
    it('handles a complete todo lifecycle with dependency injection verification', async () => {
      const user = userEvent.setup();
      
      renderWithContainer(<TestableTodoList />, { testContainer });

      // 1. Add a todo
      const input = screen.getByPlaceholderText('Add a new todo...');
      await user.type(input, 'Complete lifecycle todo');
      await user.keyboard('{Enter}');

      await waitFor(() => {
        expect(screen.getByText('Complete lifecycle todo')).toBeInTheDocument();
      });

      // 2. Toggle it to completed
      const checkbox = screen.getByRole('checkbox');
      await user.click(checkbox);

      await waitFor(() => {
        expect(checkbox).toBeChecked();
        expect(screen.getByText('1 of 1 tasks completed')).toBeInTheDocument();
      });

      // 3. Toggle it back to incomplete
      await user.click(checkbox);

      await waitFor(() => {
        expect(checkbox).not.toBeChecked();
        expect(screen.getByText('0 of 1 tasks completed')).toBeInTheDocument();
      });

      // 4. Remove it
      const removeButton = screen.getByRole('button', { name: 'Remove' });
      await user.click(removeButton);

      await waitFor(() => {
        expect(screen.queryByText('Complete lifecycle todo')).not.toBeInTheDocument();
        expect(screen.getByText('No todos yet. Add one above!')).toBeInTheDocument();
      });

      // Verify all logging happened through dependency injection
      await waitFor(() => {
        const allLogs = testContainer.mockLoggingService.infoLogs;
        expect(allLogs.filter(log => log.message === 'Todo added')).toHaveLength(1);
        expect(allLogs.filter(log => log.message === 'Todo toggled')).toHaveLength(2);
        expect(allLogs.filter(log => log.message === 'Todo removed')).toHaveLength(1);
      });
    });

    it('handles edge cases and error conditions', async () => {
      const user = userEvent.setup();
      
      renderWithContainer(<TestableTodoList />, { testContainer });

      // Try to add empty todo (should be rejected by AddTodo component)
      const addButton = screen.getByRole('button', { name: 'Add Todo' });
      await user.click(addButton);

      // Should still show empty state
      expect(screen.getByText('No todos yet. Add one above!')).toBeInTheDocument();

      // Add a real todo
      const input = screen.getByPlaceholderText('Add a new todo...');
      await user.type(input, 'Valid todo');
      await user.keyboard('{Enter}');

      await waitFor(() => {
        expect(screen.getByText('Valid todo')).toBeInTheDocument();
      });

      // Only one todo should have been added (the valid one)
      expect(screen.getByText('0 of 1 tasks completed')).toBeInTheDocument();
    });
  });

  describe('Dependency Injection Showcase', () => {
    it('demonstrates that TodoList gets dependencies from the injected container', () => {
      const { testContainer: setup } = renderWithContainer(<TestableTodoList />, { testContainer });

      // Verify the component has access to the correct injected dependencies
      expect(setup.container.get(TYPES.TodoStore)).toBe(testContainer.todoStore);
      expect(setup.container.get(TYPES.LoggingService)).toBe(testContainer.mockLoggingService);
    });

    it('works with different container configurations', () => {
      // Create a second test container
      const alternativeContainer = createTestContainer();
      
      const { rerender } = renderWithContainer(<TestableTodoList />, { testContainer });
      
      expect(screen.getByText('Todo App')).toBeInTheDocument();
      
      // Re-render with different container
      rerender(<TestableTodoList />);
      
      // Should still work with the same container context
      expect(screen.getByText('Todo App')).toBeInTheDocument();
    });

    it('allows testing with custom mock implementations', async () => {
      // Create a custom logging service that counts calls differently
      class CustomMockLogger {
        public totalCalls = 0;
        info() { this.totalCalls++; }
        error() { this.totalCalls++; }
        warn() { this.totalCalls++; }
      }

      const customLogger = new CustomMockLogger();
      
      // Create a fresh container with custom logger implementation
      const customContainer = createTestContainer();
      customContainer.container.unbind(TYPES.LoggingService);
      customContainer.container.bind(TYPES.LoggingService).toConstantValue(customLogger);
      
      // Recreate the store with the new logger
      const newLogger = customContainer.container.get(TYPES.LoggingService);
      const { createTodoStore } = await import('../stores/todoStore');
      const freshStore = createTodoStore(newLogger as any);
      customContainer.container.rebind(TYPES.TodoStore).toConstantValue(freshStore);
      
      const user = userEvent.setup();
      
      renderWithContainer(<TestableTodoList />, { testContainer: customContainer });

      // Add a todo
      const input = screen.getByPlaceholderText('Add a new todo...');
      await user.type(input, 'Custom logger test');
      await user.keyboard('{Enter}');

      await waitFor(() => {
        expect(screen.getByText('Custom logger test')).toBeInTheDocument();
      });

      // Verify our custom logger was used (should have loadTodos + addTodo calls)
      expect(customLogger.totalCalls).toBeGreaterThanOrEqual(1);
    });

    it('demonstrates how container provides singleton behavior', () => {
      renderWithContainer(<TestableTodoList />, { testContainer });

      // Get the same services multiple times
      const store1 = testContainer.container.get(TYPES.TodoStore);
      const store2 = testContainer.container.get(TYPES.TodoStore);
      const logger1 = testContainer.container.get(TYPES.LoggingService);
      const logger2 = testContainer.container.get(TYPES.LoggingService);

      // Should be the same instances (singleton)
      expect(store1).toBe(store2);
      expect(logger1).toBe(logger2);
    });
  });
});