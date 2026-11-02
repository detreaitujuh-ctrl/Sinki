import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { applyThemeToDocument, getStoredTheme } from './utils/themeStorage';

applyThemeToDocument(getStoredTheme().id);

createRoot(document.getElementById('root')!).render(<App />);
