import './commands';
import React from 'react';
import { mount } from 'cypress/react';
import type { MountOptions, MountReturn } from 'cypress/react';
import { ThemeProvider } from '../../components/theme-provider';

declare global {
  namespace Cypress {
    interface Chainable {
      mount(
        component: React.ReactNode,
        options?: MountOptions & { styles?: string | string[] }
      ): Chainable<MountReturn>;
    }
  }
}

// Ignore Next style-loader head/parentNode injection crashes
Cypress.on('uncaught:exception', (err) => {
  const msg = typeof err?.message === 'string' ? err.message : '';
  const stack = typeof err?.stack === 'string' ? err.stack : '';
  if (
    msg.includes('parentNode') &&
    (stack.includes('next-style-loader') || stack.includes('globals.css'))
  ) {
    return false;
  }
});

Cypress.Commands.add(
  'mount',
  (component: React.ReactNode, options?: MountOptions & { styles?: string | string[] }) => {
    const styles = options?.styles;
    if (typeof window !== 'undefined' && document?.head && styles) {
      const inject = (s: string) => {
        const el = document.createElement('style');
        el.innerHTML = s;
        document.head.appendChild(el);
      };
      Array.isArray(styles) ? styles.forEach(inject) : inject(styles);
    }

    return mount(
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
        {component}
      </ThemeProvider>,
      options
    );
  }
);