import React from 'react';
import { TodoList } from './components';

const App: React.FC = () => {
  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#f8f9fa',
      fontFamily: 'Arial, sans-serif'
    }}>
      <TodoList />
    </div>
  );
};

export default App;