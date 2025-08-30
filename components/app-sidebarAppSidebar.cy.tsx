import React from 'react'
import { AppSidebar } from './app-sidebar'

describe('<AppSidebar />', () => {
  it('renders', () => {
    // see: https://on.cypress.io/mounting-react
    cy.mount(<AppSidebar />)
  })
})