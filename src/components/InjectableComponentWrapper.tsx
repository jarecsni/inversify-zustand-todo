import React, { Component } from 'react';
import { Container } from 'inversify';
import { InjectableTodoList } from './InjectableTodoList';

interface InjectableComponentWrapperProps {
  container: Container;
}

export class InjectableComponentWrapper extends Component<InjectableComponentWrapperProps> {
  render() {
    const { container } = this.props;
    const todoListComponent = container.get(InjectableTodoList);
    
    // We need to manually call the render method of the injectable component
    return todoListComponent.render();
  }
}