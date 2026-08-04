import React from 'react';
import { renderToString } from 'react-dom/server';
import MigrationCenter from './pages/MigrationCenter';

try {
  const html = renderToString(React.createElement(MigrationCenter));
  console.log("Rendered successfully");
} catch (e) {
  console.error("React Render Error:", e);
}
