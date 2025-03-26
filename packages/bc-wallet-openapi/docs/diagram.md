```mermaid
---
config:
  theme: neo
  layout: elk
---
classDiagram
    class Showcase {
        +name : String
        +slug : String
        +description : String
        +status : String
        +scenarios: List~String~
        +personas: List~String~
        +hidden : Boolean
        +createdAt : DateTime
        +updatedAt : DateTime
        bannerImage: Asset
        completionMessage : String
        createdBy: User
    }
    class Scenario {
        <!-- Scenarios is a collection of workflows -->
        +name : String
        +slug : String
        +description : String
        +steps: List~Steps~
        +personas: List~Persona~
        +hidden : Boolean
        +createdAt : DateTime
        +updatedAt : DateTime
        bannerImage: Asset
    }
    class IssuanceScenario {
        issuer: Issuer
    }
    class PresentationScenario {
        relyingParty: RelyingParty
    }
    class Step {
        +title : String
        +description : String
        +order : int
        +type : StepType
        +createdAt : DateTime
        +updatedAt : DateTime
        subFlow: Scenario
        actions: List~StepAction~
        asset: Asset
    }
    class StepAction {
        +type: String
        +title: String
        +text: String
        +createdAt : DateTime
        +updatedAt : DateTime
    }
    class AriesOOBAction {
        proofRequest: AriesProofRequest
    }
    class AcceptCredentialAction {
        credentialDefinitionId: String
        connectionId: String
    }
    class ShareCredentialAction {
        credentialDefinitionId: String
        connectionId: String
    }
    class SetupConnectionAction {
    }
    class ChooseWalletAction {
    }
    class ButtonAction {
        goToStep: String
    }
    class AriesProofRequest {
        +createdAt : DateTime
        +updatedAt : DateTime
        attributes: Dictionary~String, AriesRequestCredentialAttributes~
        predicates: Dictionary~String, AriesRequestCredentialPredicates~
    }
    class AriesRequestCredentialAttributes {
        attributes: List~String~
        restrictions: List~String~
    }
    class AriesRequestCredentialPredicates {
        name: String
        type: String
        value: String
        restrictions: List~String~
    }
    class StepType {
        <<enumeration>>
        HUMAN_TASK
        SERVICE
        WORKFLOW
    }
    class Asset {
        +mediaType : String
        +content : String
        +createdAt : DateTime
        +updatedAt : DateTime
        fileName : String
        description : String
    }
    class Persona {
        +name : String
        +slug : String
        +role: String
        +description: String
        +createdAt : DateTime
        +updatedAt : DateTime
        +hidden : Boolean
        headshotImage: Asset
        bodyImage: Asset
    }
    class Issuer {
        +name : String
        +type: IssuerType
        +credentialDefinitions: List~CredentialDefinition~
        +credentialSchemas: List~CredentialSchema~
        +description: String
        +createdAt : DateTime
        +updatedAt : DateTime
        organization: String
        logo: Asset
        identifierType: IdentifierType
        identifier: String
    }
    class IssuerType {
        <<enumeration>>
        ARIES
    }
    class RelyingParty {
        +name : String
        +type: RelyingPartyType
        +credentialDefinitions: List~CredentialDefinition~
        +description: String
        +createdAt : DateTime
        +updatedAt : DateTime
        organization: String
        logo: Asset
    }
    class RelyingPartyType {
        <<enumeration>>
        ARIES
    }
    class CredentialSchema {
        +name: String
        +version: String
        identifierType: IdentifierType
        identifier: String
        +attributes: List~CredentialAttribute~
        source: Source
        +createdAt : DateTime
        +updatedAt : DateTime
    }
    class IdentifierType {
        <<enumeration>>
    }
    class Source {
        <<enumeration>>
    }
    class CredentialDefinition {
        +name : String
        +version : String
        identifierType: IdentifierType
        identifier: String
        +icon: Asset
        +type: CredentialType
         credentialSchema: CredentialSchema
        +representations: List~CredentialRepresentation~
        +createdAt : DateTime
        +updatedAt : DateTime
        revocation: RevocationInfo
   }
   class RevocationInfo {
        +title: String
        +description: String
        +createdAt : DateTime
        +updatedAt : DateTime
   }
   class AnonCredRevocation {
        registryId: String
   }
   class CredentialRepresentation {
        +id: String
        +createdAt : DateTime
        +updatedAt : DateTime
   }
   class OCARepresentation {
       +credDefId: String
       +schemaId: String
       ocaBundleUrl: String
   }
    class CredentialAttribute {
        +name : String
        +value : String
        +type: CredentialAttributeType
        +createdAt : DateTime
        +updatedAt : DateTime
    }
    class CredentialType {
        <<enumeration>>
        ANONCRED
    }
   class CredentialAttributeType {
    <<enumeration>>
    STRING
    INTEGER
    FLOAT
    BOOLEAN
    DATE
   }
   class ShowcaseStatus {
    <<enumeration>>
    PENDING
    ACTIVE
    ARCHIVED
   }
   class ScenarioType {
    <<enumeration>>
    ISSUANCE
    PRESENTATION
   }
   class User {
    +id: String
    +identifierType: IdentifierType
    +identifier: String
    +createdAt : DateTime
    +updatedAt : DateTime
   }
    Showcase "1" <|-- "1..*" Scenario: has
    Showcase "1..*" o-- "1..*" Persona
    Showcase "1" -- "0..*" Asset : references
    Showcase "1" -- "1" User : created by
    Scenario <|-- IssuanceScenario : specialization (onboarding)
    Scenario <|-- PresentationScenario : specialization (scenario)
    Scenario "1" *-- "1..*" Step : contains
    Scenario "1" -- "0..*" Asset : references
    Scenario o-- "1" ScenarioType: of
    CredentialAttribute  o-- "1" CredentialAttributeType : of
    CredentialSchema "1" *-- "1..*" CredentialAttribute : has
    CredentialSchema o-- "1" IdentifierType : of
    CredentialSchema o-- "1" Source: of
    CredentialDefinition "icon" --> Asset
    CredentialDefinition "1" *-- "1..*" CredentialRepresentation : has
    CredentialDefinition "1" *-- "0..*" RevocationInfo : has
    CredentialDefinition  o-- "1" CredentialType : of
    CredentialDefinition o-- "1" IdentifierType : of
    CredentialDefinition "1" o-- "1" CredentialSchema : references
    CredentialRepresentation <|-- OCARepresentation: specialization (OCA)
    Issuer "0..*" o-- "1..*" CredentialDefinition : issues with
    Issuer "0..*" o-- "1..*" CredentialSchema : issues with
    RelyingParty "0..*" o-- "1..*" CredentialDefinition : accepts
    RelyingParty o-- "1" RelyingPartyType: of
    RevocationInfo <|-- AnonCredRevocation : specialization
    Step "1" -- "0..*" Asset : references
    Persona -- "0..*" Asset : references
    Issuer -- "0..*" Asset : references
    Issuer o-- "1" IssuerType: of
    Issuer o-- "1" IdentifierType: of
    RelyingParty -- "0..*" Asset : references
    Step o-- "1" StepType: of
    Step "1" *-- "0..*" StepAction: actions
    StepAction <|-- AriesOOBAction: Aries implementation
    StepAction <|-- AcceptCredentialAction: Accept credential
    StepAction <|-- ShareCredentialAction: Share credential
    StepAction <|-- SetupConnectionAction: Setup connection
    StepAction <|-- ChooseWalletAction: Choose wallet
    StepAction <|-- ButtonAction: Button action
    AriesOOBAction "1" *-- "1" AriesProofRequest
    AriesProofRequest "1" *-- "1..*" AriesRequestCredentialAttributes: attributes
    AriesProofRequest "1" *-- "1..*" AriesRequestCredentialPredicates: predicates
    Scenario "0..*" o-- "1..*" Persona : involves
    IssuanceScenario "0..*" o-- "1" Issuer : includes
    PresentationScenario "0..*" o-- "1" RelyingParty : includes

```
