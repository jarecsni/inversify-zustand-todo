import React from 'react';
import { render, RenderOptions, RenderResult } from '@testing-library/react';
import { Container } from 'inversify';
import { createTestContainer, TestContainerSetup } from './test-container';

// Create a custom render function that provides the test container context
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  testContainer?: TestContainerSetup;
}

interface CustomRenderResult extends RenderResult {
  testContainer: TestContainerSetup;
}

export function renderWithTestContainer(
  ui: React.ReactElement,
  options: CustomRenderOptions = {}
): CustomRenderResult {
  const { testContainer, ...renderOptions } = options;
  const containerSetup = testContainer || createTestContainer();

  // For this example, we'll modify the component to use the test container
  // In a real app, you might use a React Context Provider
  const result = render(ui, renderOptions);

  return {
    ...result,
    testContainer: containerSetup,
  };
}

// Export commonly used testing utilities
export * from '@testing-library/react';
export * from '@testing-library/user-event';
export { createTestContainer, createTestContainerWithCustomMocks } from './test-container';
export { MockLoggingService } from './MockLoggingService';