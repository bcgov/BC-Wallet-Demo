describe('Protected Routes', () => {
  const BASE_ROUTE = '/digital-trust/showcase'
  it('redirects to the landing page when onboarding has not been completed', () => {
    // Use-case pages are behind a PrivateRoute that checks onboarding completion.
    // Visiting directly without completing onboarding should redirect to the landing page.
    cy.visit(`${BASE_ROUTE}/uc/some-use-case`)
    cy.url().should('include', BASE_ROUTE).and('not.include', '/uc/')
    cy.contains('BC Wallet Showcase').should('be.visible')
  })

  it('redirects to the landing page when visiting the dashboard without onboarding', () => {
    cy.visit(`${BASE_ROUTE}/dashboard`)
    cy.url().should('include', BASE_ROUTE).and('not.include', '/dashboard')
    cy.contains('BC Wallet Showcase').should('be.visible')
  })
})
