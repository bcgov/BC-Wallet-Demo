describe('Landing Page', () => {
  it('loads and shows the BC Digital Trust Showcase heading', () => {
    cy.visit('/')
    cy.contains('BC Digital Trust Showcase').should('be.visible')
  })

  it('has a Get started button that navigates to the onboarding page', () => {
    cy.intercept('GET', '**/demo/showcases', { fixture: 'showcases.json' }).as('getShowcases')
    cy.intercept('GET', '**/demo/wallets', { body: [] }).as('getWallets')
    cy.visit('/')
    cy.contains('button', 'Get started').click()
    cy.url().should('include', '/demo')
  })
})
