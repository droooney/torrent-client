import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

import App from 'web-client/components/App/App';

(async () => {
  const root = document.getElementById('root');

  if (!root) {
    console.log('No root element');

    return;
  }

  createRoot(root).render(
    <BrowserRouter>
      <App />
    </BrowserRouter>,
  );
})();
