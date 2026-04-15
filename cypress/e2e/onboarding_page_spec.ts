describe('Onboarding Page', () => {
  const BASE_ROUTE = '/digital-trust/showcase'
  beforeEach(() => {
    cy.intercept('GET', '**/demo/characters', { fixture: 'characters.json' }).as('getCharacters')
    cy.intercept('GET', '**/demo/wallets', { body: [] }).as('getWallets')
    cy.visit(`${BASE_ROUTE}/demo`)
    cy.wait('@getCharacters')
  })

  it('shows the character picker', () => {
    cy.get('[data-cy=select-char]').should('have.length.at.least', 1)
  })

  it('NEXT button is disabled before a character is selected', () => {
    cy.get('[data-cy=next-onboarding-step] [data-cy=standard-button]').should('be.disabled')
  })

  it('NEXT button is enabled after selecting a character', () => {
    cy.get('[data-cy=select-char]').first().click()
    cy.get('[data-cy=next-onboarding-step] [data-cy=standard-button]').should('not.be.disabled')
  })

  it('advances to the next step after selecting a character and clicking NEXT', () => {
    cy.get('[data-cy=select-char]').first().click()
    cy.get('[data-cy=next-onboarding-step] [data-cy=standard-button]').click()
    cy.contains("Let's get started!").should('be.visible')
  })
})
