/// <reference types="cypress" />
// ***********************************************
// This example commands.ts shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add('login', (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })
//
// declare global {
//   namespace Cypress {
//     interface Chainable {
//       login(email: string, password: string): Chainable<void>
//       drag(subject: string, options?: Partial<TypeOptions>): Chainable<Element>
//       dismiss(subject: string, options?: Partial<TypeOptions>): Chainable<Element>
//       visit(originalFn: CommandOriginalFn, url: string, options: Partial<VisitOptions>): Chainable<Element>
//     }
//   }
// }

declare global {
  namespace Cypress {
    interface Chainable {
      loginBySupabaseApi(email?: string, password?: string): Chainable<void>;
    }
  }
}

Cypress.Commands.add('loginBySupabaseApi', (email?: string, password?: string) => {
  const projectRef = 'sbsxkbapdmlnyhvjvsei';
  const supabaseUrl = 'https://sbsxkbapdmlnyhvjvsei.supabase.co';
  const anon = Cypress.env('SUPABASE_ANON_KEY'); // set via Cypress env
  const userEmail = email || Cypress.env('SUPABASE_EMAIL');
  const userPassword = password || Cypress.env('SUPABASE_PASSWORD');

  if (!anon || !userEmail || !userPassword) {
    throw new Error('Missing SUPABASE_ANON_KEY, SUPABASE_EMAIL, or SUPABASE_PASSWORD in Cypress env.');
  }

  cy.request({
    method: 'POST',
    url: `${supabaseUrl}/auth/v1/token?grant_type=password`,
    headers: {
      apikey: anon,
      Authorization: `Bearer ${anon}`,
      'content-type': 'application/json',
    },
    body: { email: userEmail, password: userPassword },
  }).then(({ body }) => {
    const { access_token, refresh_token, token_type, expires_in } = body;
    const cookieName = `sb-${projectRef}-auth-token`;
    const expires_at = Math.floor(Date.now() / 1000) + (expires_in || 3600);
    const tokenPayload = { access_token, refresh_token, token_type, expires_at };

    // For server-side auth (SSR/middleware) and client library
    cy.setCookie(cookieName, JSON.stringify(tokenPayload));
    cy.window().then((win) => {
      win.localStorage.setItem(cookieName, JSON.stringify(tokenPayload));
    });
  });
});