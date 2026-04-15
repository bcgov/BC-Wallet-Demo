describe('Landing Page', () => {
  it('loads and shows the BC Wallet Showcase heading', () => {
    cy.visit('/')
    cy.contains('BC Wallet Showcase').should('be.visible')
  })

  it('has a Get started button that navigates to the onboarding page', () => {
    cy.intercept('GET', '**/demo/characters', { fixture: 'characters.json' }).as('getCharacters')
    cy.intercept('GET', '**/demo/wallets', { body: [] }).as('getWallets')
    cy.visit('/')
    cy.contains('button', 'Get started').click()
    cy.url().should('include', '/demo')
  })
})
