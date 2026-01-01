import '@testing-library/jest-dom';

// Mock window.location
Object.defineProperty(window, 'location', {
  value: {
    pathname: '/',
    href: 'http://localhost:3000',
  },
  writable: true,
});



