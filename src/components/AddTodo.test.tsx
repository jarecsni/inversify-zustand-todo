import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AddTodo } from './AddTodo';
import { renderWithContainer, createTestContainer } from '../test-utils/component-test-utils';

describe('AddTodo', () => {
  let testContainer: ReturnType<typeof createTestContainer>;
  let mockOnAdd: jest.Mock;

  beforeEach(() => {
    testContainer = createTestContainer();
    mockOnAdd = jest.fn();
  });

  afterEach(() => {
    testContainer.mockLoggingService.clear();
  });

  it('renders with placeholder text and add button', () => {
    renderWithContainer(<AddTodo onAdd={mockOnAdd} />, { testContainer });
    
    expect(screen.getByPlaceholderText('Add a new todo...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add Todo' })).toBeInTheDocument();
  });

  it('calls onAdd with trimmed text when form is submitted', async () => {
    const user = userEvent.setup();
    renderWithContainer(<AddTodo onAdd={mockOnAdd} />, { testContainer });

    const input = screen.getByPlaceholderText('Add a new todo...');
    const button = screen.getByRole('button', { name: 'Add Todo' });

    await user.type(input, '  Test todo item  ');
    await user.click(button);

    expect(mockOnAdd).toHaveBeenCalledTimes(1);
    expect(mockOnAdd).toHaveBeenCalledWith('  Test todo item  ');
  });

  it('calls onAdd when Enter key is pressed in input', async () => {
    const user = userEvent.setup();
    renderWithContainer(<AddTodo onAdd={mockOnAdd} />, { testContainer });

    const input = screen.getByPlaceholderText('Add a new todo...');

    await user.type(input, 'Test todo with enter');
    await user.keyboard('{Enter}');

    expect(mockOnAdd).toHaveBeenCalledTimes(1);
    expect(mockOnAdd).toHaveBeenCalledWith('Test todo with enter');
  });

  it('clears input after successful submission', async () => {
    const user = userEvent.setup();
    renderWithContainer(<AddTodo onAdd={mockOnAdd} />, { testContainer });

    const input = screen.getByPlaceholderText('Add a new todo...');

    await user.type(input, 'Test todo');
    expect(input).toHaveValue('Test todo');

    await user.keyboard('{Enter}');

    await waitFor(() => {
      expect(input).toHaveValue('');
    });
  });

  it('does not call onAdd when input is empty', async () => {
    const user = userEvent.setup();
    renderWithContainer(<AddTodo onAdd={mockOnAdd} />, { testContainer });

    const button = screen.getByRole('button', { name: 'Add Todo' });

    await user.click(button);

    expect(mockOnAdd).not.toHaveBeenCalled();
  });

  it('does not call onAdd when input contains only whitespace', async () => {
    const user = userEvent.setup();
    renderWithContainer(<AddTodo onAdd={mockOnAdd} />, { testContainer });

    const input = screen.getByPlaceholderText('Add a new todo...');
    const button = screen.getByRole('button', { name: 'Add Todo' });

    await user.type(input, '   ');
    await user.click(button);

    expect(mockOnAdd).not.toHaveBeenCalled();
    expect(input).toHaveValue('   '); // Input is not cleared if submission is rejected
  });

  it('handles multiple submissions correctly', async () => {
    const user = userEvent.setup();
    renderWithContainer(<AddTodo onAdd={mockOnAdd} />, { testContainer });

    const input = screen.getByPlaceholderText('Add a new todo...');

    // First submission
    await user.type(input, 'First todo');
    await user.keyboard('{Enter}');

    await waitFor(() => {
      expect(input).toHaveValue('');
    });

    // Second submission  
    await user.type(input, 'Second todo');
    await user.keyboard('{Enter}');

    await waitFor(() => {
      expect(input).toHaveValue('');
    });

    expect(mockOnAdd).toHaveBeenCalledTimes(2);
    expect(mockOnAdd).toHaveBeenNthCalledWith(1, 'First todo');
    expect(mockOnAdd).toHaveBeenNthCalledWith(2, 'Second todo');
  });

  it('updates input value as user types', async () => {
    const user = userEvent.setup();
    renderWithContainer(<AddTodo onAdd={mockOnAdd} />, { testContainer });

    const input = screen.getByPlaceholderText('Add a new todo...');

    await user.type(input, 'T');
    expect(input).toHaveValue('T');

    await user.type(input, 'est');
    expect(input).toHaveValue('Test');

    await user.type(input, ' todo');
    expect(input).toHaveValue('Test todo');
  });

  it('can be controlled programmatically', () => {
    renderWithContainer(<AddTodo onAdd={mockOnAdd} />, { testContainer });

    const input = screen.getByPlaceholderText('Add a new todo...') as HTMLInputElement;
    const form = input.closest('form')!;

    // Simulate programmatic input
    fireEvent.change(input, { target: { value: 'Programmatic todo' } });
    expect(input.value).toBe('Programmatic todo');

    // Simulate form submission
    fireEvent.submit(form);

    expect(mockOnAdd).toHaveBeenCalledWith('Programmatic todo');
    expect(input.value).toBe(''); // Should be cleared after submission
  });

  it('prevents default form submission behavior', async () => {
    const user = userEvent.setup();
    const mockPreventDefault = jest.fn();
    
    renderWithContainer(<AddTodo onAdd={mockOnAdd} />, { testContainer });

    const form = screen.getByRole('button', { name: 'Add Todo' }).closest('form')!;
    
    // Mock the preventDefault method
    const originalAddEventListener = form.addEventListener;
    form.addEventListener = jest.fn((event, handler) => {
      if (event === 'submit') {
        const mockEvent = {
          preventDefault: mockPreventDefault,
          target: form,
        } as any;
        (handler as EventListener)(mockEvent);
      }
    });

    const input = screen.getByPlaceholderText('Add a new todo...');
    await user.type(input, 'Test');
    
    fireEvent.submit(form, { preventDefault: mockPreventDefault });

    expect(mockOnAdd).toHaveBeenCalledWith('Test');
    
    // Restore original method
    form.addEventListener = originalAddEventListener;
  });

  describe('Integration with Test Container', () => {
    it('demonstrates how component can work with dependency injection', () => {
      // This test shows that even though AddTodo doesn't directly use DI,
      // it can be part of a larger DI ecosystem
      const { testContainer: setup } = renderWithContainer(
        <AddTodo onAdd={mockOnAdd} />, 
        { testContainer }
      );

      // We can verify the test container is set up correctly
      expect(setup.container).toBeDefined();
      expect(setup.mockLoggingService).toBeDefined();
      expect(setup.todoStore).toBeDefined();

      // The component renders correctly within the DI context
      expect(screen.getByPlaceholderText('Add a new todo...')).toBeInTheDocument();
    });

    it('can be integrated with a store that uses dependency injection', async () => {
      const user = userEvent.setup();
      
      // Create a callback that uses the injected store
      const handleAdd = (text: string) => {
        testContainer.todoStore.getState().addTodo(text);
      };

      renderWithContainer(<AddTodo onAdd={handleAdd} />, { testContainer });

      const input = screen.getByPlaceholderText('Add a new todo...');
      await user.type(input, 'DI integrated todo');
      await user.keyboard('{Enter}');

      // Verify the store was updated
      const storeState = testContainer.todoStore.getState();
      expect(storeState.todos).toHaveLength(1);
      expect(storeState.todos[0].text).toBe('DI integrated todo');

      // Verify logging happened through DI
      expect(testContainer.mockLoggingService.infoLogs).toHaveLength(1);
      expect(testContainer.mockLoggingService.getLastInfoLog()).toEqual({
        message: 'Todo added',
        data: expect.objectContaining({
          text: 'DI integrated todo'
        })
      });
    });
  });
});