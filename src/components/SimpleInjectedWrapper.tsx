import React, { Component } from 'react';
import { Container } from 'inversify';
import { InjectedTodoApp } from './InjectedTodoApp';

interface SimpleInjectedWrapperProps {
  container: Container;
}

export class SimpleInjectedWrapper extends Component<SimpleInjectedWrapperProps> {
  render() {
    const { container } = this.props;
    const todoApp = container.get(InjectedTodoApp);
    
    // Render the injectable component
    return todoApp.render();
  }
}