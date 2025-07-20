import React, { createContext, useContext } from 'react';
import { render, RenderOptions, RenderResult } from '@testing-library/react';
import { Container } from 'inversify';
import { createTestContainer, TestContainerSetup } from './test-container';
import { TYPES } from '../container/types';
import { TodoStore } from '../stores/todoStore';

// Create a context for the test container
const TestContainerContext = createContext<Container | null>(null);

// Provider component that provides the test container
interface TestContainerProviderProps {
  container: Container;
  children: React.ReactNode;
}

const TestContainerProvider: React.FC<TestContainerProviderProps> = ({ container, children }) => {
  return (
    <TestContainerContext.Provider value={container}>
      {children}
    </TestContainerContext.Provider>
  );
};

// Hook to access the test container in components
export const useTestContainer = () => {
  const container = useContext(TestContainerContext);
  if (!container) {
    throw new Error('useTestContainer must be used within a TestContainerProvider');
  }
  return container;
};

// Mock version of the container hook that components can use
export const useMockContainer = () => {
  const container = useTestContainer();
  return {
    get: <T,>(token: symbol) => container.get<T>(token),
  };
};

// Enhanced render function for component testing
interface ComponentTestRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  testContainer?: TestContainerSetup;
}

interface ComponentTestRenderResult extends RenderResult {
  testContainer: TestContainerSetup;
  rerender: (ui: React.ReactElement) => void;
}

export function renderWithContainer(
  ui: React.ReactElement,
  options: ComponentTestRenderOptions = {}
): ComponentTestRenderResult {
  const { testContainer, ...renderOptions } = options;
  const containerSetup = testContainer || createTestContainer();

  const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <TestContainerProvider container={containerSetup.container}>
      {children}
    </TestContainerProvider>
  );

  const renderResult = render(ui, {
    wrapper: Wrapper,
    ...renderOptions,
  });

  return {
    ...renderResult,
    testContainer: containerSetup,
    rerender: (ui: React.ReactElement) => {
      renderResult.rerender(
        <TestContainerProvider container={containerSetup.container}>
          {ui}
        </TestContainerProvider>
      );
    },
  };
}

// Helper function to create testable versions of components that need container access
export function withTestContainer<P extends object,>(
  Component: React.ComponentType<P>,
  containerSetup?: TestContainerSetup
) {
  const setup = containerSetup || createTestContainer();
  
  const TestableComponent: React.FC<P> = (props) => {
    return (
      <TestContainerProvider container={setup.container}>
        <Component {...props} />
      </TestContainerProvider>
    );
  };

  return {
    Component: TestableComponent,
    testContainer: setup,
  };
}

// Hook to get the TodoStore from the test container (for components that need it)
export const useTodoStore = (): TodoStore => {
  const container = useTestContainer();
  return container.get<TodoStore>(TYPES.TodoStore);
};

// Re-export everything from the main test utils
export * from '@testing-library/react';
export * from '@testing-library/user-event';
export { createTestContainer, createTestContainerWithCustomMocks } from './test-container';
export { MockLoggingService } from './MockLoggingService';