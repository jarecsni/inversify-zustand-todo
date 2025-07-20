import React, { useState } from 'react';
import { container } from './container/container';
import { ContainerAwareTodoApp } from './components/ContainerAwareTodoApp';
import { TodoList } from './components';

const App: React.FC = () => {
  const [useInjectableComponents, setUseInjectableComponents] = useState(true);

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#f8f9fa',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{ textAlign: 'center', padding: '20px', borderBottom: '1px solid #eee', backgroundColor: 'white' }}>
        <h2>InversifyJS + Zustand Todo App</h2>
        <p>
          <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <input
              type="checkbox"
              checked={useInjectableComponents}
              onChange={(e) => setUseInjectableComponents(e.target.checked)}
            />
            Use Injectable Components (Class-based with @inject decorators)
          </label>
        </p>
        <p style={{ fontSize: '14px', color: '#6c757d' }}>
          {useInjectableComponents 
            ? 'Using container-aware functional component that gets dependencies from InversifyJS container'
            : 'Using functional components with container context (traditional approach)'
          }
        </p>
      </div>

      {useInjectableComponents ? (
        <ContainerAwareTodoApp container={container} />
      ) : (
        <div>
          <TodoList />
        </div>
      )}
    </div>
  );
};

export default App;