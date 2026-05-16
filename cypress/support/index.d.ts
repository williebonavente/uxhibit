/// <reference types="cypress" />
import type React from 'react';
import type { MountOptions, MountReturn } from 'cypress/react';

declare namespace Cypress {
  interface Chainable {
    mount(component: React.ReactNode, options?: MountOptions): Chainable<MountReturn>;
    loginBySupabaseApi(email?: string, password?: string): Chainable<void>;
    seedSupabaseSession(userId?: string): Chainable<void>;
  }
}