import { createRoot } from 'react-dom/client';
import './styles/global.scss';
import App from './App';

const container = document.getElementById('root');
if (!container) throw new Error('#root 元素不存在');

createRoot(container).render(<App />);
