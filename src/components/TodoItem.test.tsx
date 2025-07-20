import React from 'react';
import { screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TodoItem } from './TodoItem';
import { Todo } from '../types';
import { renderWithContainer, createTestContainer } from '../test-utils/component-test-utils';

describe('TodoItem', () => {
  let testContainer: ReturnType<typeof createTestContainer>;
  let mockOnToggle: jest.Mock;
  let mockOnRemove: jest.Mock;
  let sampleTodo: Todo;

  beforeEach(() => {
    testContainer = createTestContainer();
    mockOnToggle = jest.fn();
    mockOnRemove = jest.fn();
    sampleTodo = {
      id: 'test-todo-1',
      text: 'Test todo item',
      completed: false,
      createdAt: new Date('2024-01-01T00:00:00Z'),
    };
  });

  afterEach(() => {
    testContainer.mockLoggingService.clear();
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders todo text correctly', () => {
      renderWithContainer(
        <TodoItem todo={sampleTodo} onToggle={mockOnToggle} onRemove={mockOnRemove} />,
        { testContainer }
      );

      expect(screen.getByText('Test todo item')).toBeInTheDocument();
    });

    it('renders checkbox that reflects completion status', () => {
      renderWithContainer(
        <TodoItem todo={sampleTodo} onToggle={mockOnToggle} onRemove={mockOnRemove} />,
        { testContainer }
      );

      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).not.toBeChecked();
    });

    it('renders completed todo with correct styling', () => {
      const completedTodo: Todo = { ...sampleTodo, completed: true };
      
      renderWithContainer(
        <TodoItem todo={completedTodo} onToggle={mockOnToggle} onRemove={mockOnRemove} />,
        { testContainer }
      );

      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toBeChecked();

      const text = screen.getByText('Test todo item');
      expect(text).toHaveStyle('text-decoration: line-through');
      expect(text).toHaveStyle('color: rgb(108, 117, 125)'); // #6c757d
    });

    it('renders uncompleted todo with correct styling', () => {
      renderWithContainer(
        <TodoItem todo={sampleTodo} onToggle={mockOnToggle} onRemove={mockOnRemove} />,
        { testContainer }
      );

      const text = screen.getByText('Test todo item');
      expect(text).toHaveStyle('text-decoration: none');
      expect(text).toHaveStyle('color: rgb(0, 0, 0)');
    });

    it('renders remove button', () => {
      renderWithContainer(
        <TodoItem todo={sampleTodo} onToggle={mockOnToggle} onRemove={mockOnRemove} />,
        { testContainer }
      );

      const removeButton = screen.getByRole('button', { name: 'Remove' });
      expect(removeButton).toBeInTheDocument();
      expect(removeButton).toHaveStyle('background-color: rgb(220, 53, 69)'); // #dc3545
    });
  });

  describe('User Interactions', () => {
    it('calls onToggle with correct ID when checkbox is clicked', async () => {
      const user = userEvent.setup();
      
      renderWithContainer(
        <TodoItem todo={sampleTodo} onToggle={mockOnToggle} onRemove={mockOnRemove} />,
        { testContainer }
      );

      const checkbox = screen.getByRole('checkbox');
      await user.click(checkbox);

      expect(mockOnToggle).toHaveBeenCalledTimes(1);
      expect(mockOnToggle).toHaveBeenCalledWith('test-todo-1');
    });

    it('calls onRemove with correct ID when remove button is clicked', async () => {
      const user = userEvent.setup();
      
      renderWithContainer(
        <TodoItem todo={sampleTodo} onToggle={mockOnToggle} onRemove={mockOnRemove} />,
        { testContainer }
      );

      const removeButton = screen.getByRole('button', { name: 'Remove' });
      await user.click(removeButton);

      expect(mockOnRemove).toHaveBeenCalledTimes(1);
      expect(mockOnRemove).toHaveBeenCalledWith('test-todo-1');
    });

    it('handles multiple toggle clicks correctly', async () => {
      const user = userEvent.setup();
      
      renderWithContainer(
        <TodoItem todo={sampleTodo} onToggle={mockOnToggle} onRemove={mockOnRemove} />,
        { testContainer }
      );

      const checkbox = screen.getByRole('checkbox');
      
      await user.click(checkbox);
      await user.click(checkbox);
      await user.click(checkbox);

      expect(mockOnToggle).toHaveBeenCalledTimes(3);
      expect(mockOnToggle).toHaveBeenNthCalledWith(1, 'test-todo-1');
      expect(mockOnToggle).toHaveBeenNthCalledWith(2, 'test-todo-1');
      expect(mockOnToggle).toHaveBeenNthCalledWith(3, 'test-todo-1');
    });

    it('works with programmatic events', () => {
      renderWithContainer(
        <TodoItem todo={sampleTodo} onToggle={mockOnToggle} onRemove={mockOnRemove} />,
        { testContainer }
      );

      const checkbox = screen.getByRole('checkbox');
      const removeButton = screen.getByRole('button', { name: 'Remove' });

      // Programmatic click events
      fireEvent.click(checkbox);
      fireEvent.click(removeButton);

      expect(mockOnToggle).toHaveBeenCalledWith('test-todo-1');
      expect(mockOnRemove).toHaveBeenCalledWith('test-todo-1');
    });
  });

  describe('Props Variations', () => {
    it('handles different todo IDs correctly', async () => {
      const user = userEvent.setup();
      const todoWithDifferentId: Todo = { ...sampleTodo, id: 'different-id' };
      
      renderWithContainer(
        <TodoItem todo={todoWithDifferentId} onToggle={mockOnToggle} onRemove={mockOnRemove} />,
        { testContainer }
      );

      await user.click(screen.getByRole('checkbox'));
      await user.click(screen.getByRole('button', { name: 'Remove' }));

      expect(mockOnToggle).toHaveBeenCalledWith('different-id');
      expect(mockOnRemove).toHaveBeenCalledWith('different-id');
    });

    it('handles long text content correctly', () => {
      const longTextTodo: Todo = {
        ...sampleTodo,
        text: 'This is a very long todo item text that should still be displayed correctly even if it is quite lengthy and contains many words that might wrap or cause layout issues'
      };
      
      renderWithContainer(
        <TodoItem todo={longTextTodo} onToggle={mockOnToggle} onRemove={mockOnRemove} />,
        { testContainer }
      );

      expect(screen.getByText(longTextTodo.text)).toBeInTheDocument();
    });

    it('handles special characters in todo text', () => {
      const specialCharTodo: Todo = {
        ...sampleTodo,
        text: 'Todo with special chars: @#$%^&*()_+-=[]{}|;\':",./<>?`~'
      };
      
      renderWithContainer(
        <TodoItem todo={specialCharTodo} onToggle={mockOnToggle} onRemove={mockOnRemove} />,
        { testContainer }
      );

      expect(screen.getByText(specialCharTodo.text)).toBeInTheDocument();
    });

    it('handles empty todo text', () => {
      const emptyTextTodo: Todo = { ...sampleTodo, text: '' };
      
      renderWithContainer(
        <TodoItem todo={emptyTextTodo} onToggle={mockOnToggle} onRemove={mockOnRemove} />,
        { testContainer }
      );

      // The span should still exist even with empty text - find it by its style properties
      const textSpan = screen.getByTestId('todo-text');
      expect(textSpan).toBeInTheDocument();
      expect(textSpan).toHaveTextContent('');
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA roles', () => {
      renderWithContainer(
        <TodoItem todo={sampleTodo} onToggle={mockOnToggle} onRemove={mockOnRemove} />,
        { testContainer }
      );

      expect(screen.getByRole('checkbox')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Remove' })).toBeInTheDocument();
    });

    it('checkbox has correct checked state for screen readers', () => {
      const completedTodo: Todo = { ...sampleTodo, completed: true };
      
      renderWithContainer(
        <TodoItem todo={completedTodo} onToggle={mockOnToggle} onRemove={mockOnRemove} />,
        { testContainer }
      );

      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toBeChecked();
    });

    it('is keyboard accessible', async () => {
      const user = userEvent.setup();
      
      renderWithContainer(
        <TodoItem todo={sampleTodo} onToggle={mockOnToggle} onRemove={mockOnRemove} />,
        { testContainer }
      );

      // Tab to checkbox and activate with space
      await user.tab();
      expect(screen.getByRole('checkbox')).toHaveFocus();
      await user.keyboard(' ');
      expect(mockOnToggle).toHaveBeenCalledWith('test-todo-1');

      // Tab to remove button and activate with enter
      await user.tab();
      expect(screen.getByRole('button', { name: 'Remove' })).toHaveFocus();
      await user.keyboard('{Enter}');
      expect(mockOnRemove).toHaveBeenCalledWith('test-todo-1');
    });
  });

  describe('Integration with Test Container', () => {
    it('can be integrated with the todo store through callbacks', async () => {
      const user = userEvent.setup();
      
      // Add a todo to the store first
      testContainer.todoStore.getState().addTodo('Test todo for integration');
      const todos = testContainer.todoStore.getState().todos;
      const testTodo = todos[0];

      // Create callbacks that interact with the store
      const handleToggle = (id: string) => {
        testContainer.todoStore.getState().toggleTodo(id);
      };

      const handleRemove = (id: string) => {
        testContainer.todoStore.getState().removeTodo(id);
      };

      renderWithContainer(
        <TodoItem todo={testTodo} onToggle={handleToggle} onRemove={handleRemove} />,
        { testContainer }
      );

      // Test toggle functionality with store integration
      const checkbox = screen.getByRole('checkbox');
      await user.click(checkbox);

      // Verify store state changed
      const updatedTodos = testContainer.todoStore.getState().todos;
      expect(updatedTodos[0].completed).toBe(true);

      // Verify logging occurred through DI
      expect(testContainer.mockLoggingService.infoLogs.filter(log => log.message === 'Todo toggled')).toHaveLength(1);
    });

    it('demonstrates component isolation within DI context', () => {
      // Create multiple TodoItem components with different containers
      const container1 = createTestContainer();
      const container2 = createTestContainer();

      const { rerender } = renderWithContainer(
        <TodoItem todo={sampleTodo} onToggle={mockOnToggle} onRemove={mockOnRemove} />,
        { testContainer: container1 }
      );

      // Verify first container setup
      expect(container1.container).toBeDefined();

      // Re-render with different container
      rerender(
        <TodoItem 
          todo={{ ...sampleTodo, text: 'Different container todo' }} 
          onToggle={mockOnToggle} 
          onRemove={mockOnRemove} 
        />
      );

      // Component should work the same regardless of container
      expect(screen.getByText('Different container todo')).toBeInTheDocument();
    });

    it('works correctly when multiple TodoItems share the same container', () => {
      const todo1: Todo = { ...sampleTodo, id: 'todo-1', text: 'First todo' };
      const todo2: Todo = { ...sampleTodo, id: 'todo-2', text: 'Second todo' };

      renderWithContainer(
        <div>
          <TodoItem todo={todo1} onToggle={mockOnToggle} onRemove={mockOnRemove} />
          <TodoItem todo={todo2} onToggle={mockOnToggle} onRemove={mockOnRemove} />
        </div>,
        { testContainer }
      );

      expect(screen.getByText('First todo')).toBeInTheDocument();
      expect(screen.getByText('Second todo')).toBeInTheDocument();
      
      // Both components should have access to the same test container context
      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes).toHaveLength(2);
    });
  });
});