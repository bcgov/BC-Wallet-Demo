# BC Wallet Showcase Developer Documentation

https://github.com/bcgov/BC-Wallet-Demo

The BC Wallet Showcase is an application used to issue demo credentials and proof requests. It consists of a React frontend and a TS-Node Backend. Additionally it needs to be connected to a traction agent.

## Continuous integration

GitHub Actions run on pull requests (unit tests, lint, Cypress, Docker smoke builds) and on releases (optional Cypress, then publishing showcase images to GHCR). Node **22** is required in CI, matching the repo `engines` field. For workflow names, job graph, secrets used at Docker build time, and the reusable **setup-node** composite action, see **[.github/README.md](../.github/README.md)** in the repository.

## Setup: Local Development

There are two env files that you need to configure. This stage assumes you already have access to a traction agent. If you have a fresh setup on your traction agent you'll need to do a couple things to connect it with the showcase. Log on to your traction agent, depending on the environment the url will be slightly different:

- dev: https://traction-tenant-ui-dev.apps.silver.devops.gov.bc.ca/
- test: https://traction-tenant-ui-test.apps.silver.devops.gov.bc.ca/
- prod: https://traction-tenant-ui.apps.silver.devops.gov.bc.ca/

once logged in, navigate to the API keys section under the wallet icon to the top right.
![](Pasted%20image%2020241002093928.png)
Create a new API key and save the key and tenant ID in a password manager. You should only have to do this once when migrating to a new traction agent.

The next thing you'll have to do is setup webhooks for your local environment. Start an ngrok instance on your local machine on port 5000 like so `ngrok http 5000` copy the URL you get in to command window. Go to Settings under the wallet icon, you should see a section where you can add your webhook url. Add the following url to the webhook url textbox: `https://<YOUR_NGROK_URL>/digital-trust/showcase/demo/whook` then in the webhook key generate a random key and paste it in there. Make sure you save the webhook key since we'll need it later. Hit the Save Changes button at the bottom.
![](Pasted%20image%2020241002095030.png)
One last thing that needs to be done is to ensure that your traction agent is setup as an issuer. You should see this icon at the top right of your tenant's profile, this means it has the ability to create schemas and cred defs on the ledger.  
![](Pasted%20image%2020241002100018.png)

There are two .env files that you need to create and configure on the showcase. They go in the same folder as the .env.example file. In the server folder the .env file should look like this:

```bash
TENANT_ID=<YOUR_TENANT_ID>
API_KEY=<YOUR_API_KEY>
TRACTION_URL=https://traction-tenant-proxy-test.apps.silver.devops.gov.bc.ca
BASE_ROUTE=/digital-trust/showcase
WEBHOOK_SECRET=<YOUR_WEBHOOK_SECRET>
```

populate the values with the API key and webhook secret that you made in the previous step.  
In the frontend folder the .env file should look like this:

```bash
VITE_HOST_BACKEND=http://127.0.0.1:5000
VITE_BASE_ROUTE=/digital-trust/showcase
VITE_INSIGHTS_PROJECT_ID=
```

When adding environment variables for the **Vite** dev client, use the `VITE_` prefix (see `frontend/.env.example`). In production the app is static files behind Caddy; **Caddy** reads `VITE_BASE_ROUTE` (and related vars) at runtime from the same `frontend/.env` when using Docker Compose.

Ensure that both the env files are named `.env` and that they're in the same folder as their respective `.env.example` files, otherwise they won't get loaded.

Start the stack with Docker Compose (recommended) or natively — see the main [README](../README.md) for both options. With Docker Compose the app is available at http://localhost:3000/digital-trust/showcase/ once all services are healthy.

## Project Structure

As stated in the previous section, the application is split up in to a frontend and backend. The code for each is located in the `frontend` and `server` folders respectively.

### Frontend Structure:

There are two main flows on the client: the introduction flow where a user gets their credentials, and the use case flow where the user presents credentials in proof requests. Introduction steps are located in `frontend/src/client/pages/introduction/steps`. Here's an overview of the steps and their role:

- SetupConnection.tsx: generates a QR code to establish a connection with the user's wallet
- AcceptCredential.tsx: issues the configured credential to the existing connection
- BasicSlide.tsx: displays the configured text and images for the current step
- ChooseWallet.tsx: displays the choose wallet screen that instructs users to install BC Wallet
- PickCharacter.tsx: the character selection screen that allows you to select different characters based on the configuration
- SetupStart.tsx: provides a preamble about what credentials you'll be receiving and the usecases
- SetupCompleted.tsx: displays a success screen that shows after the onboarding is completed

The structure is similar for the use case flow. Those screens are located at `frontend/src/client/pages/useCase/steps`. Here's an overview of the steps and their role:

- StartContainer.tsx: used to show a preamble about the proof and provide a start button
- StepConnection.tsx: generates a QR Code to establish a connection with the user's wallet
- StepCredential.tsx: not in use. Previously it was used to issue a credential during the proof request process.
- StepEnd.tsx: used to show a success message after all of the proof requests
- StepInformation.tsx: like BasicSlide.tsx displays configured text and images to provide context for the proof.
- StepProof.tsx: issues the configured proof to the user's wallet

All of these steps are configurable via the JSON showcase files in `server/scripts/values` (`studentShowcase.json`, `lawyerShowcase.json`, `businessShowcase.json`), loaded by `server/src/content/Showcases.ts`

### Server Structure:

For the most part the server acts as a sort of proxy to pass requests to the traction agent. There's some additional routes provided as well but for the most part it passes requests to the traction agent. The handlers for each route are all located in `server > src > controllers`.

### Server Config:

The showcase configurations live in `server/scripts/values/` as JSON files (`studentShowcase.json`, `lawyerShowcase.json`, `businessShowcase.json`). They are loaded by `server/src/content/Showcases.ts`. We'll walk through the structure and what the fields mean:

#### Basic Character Info

```json
{
  "persona": {
    "name": "Alice",
    "type": "Student",
    "image": "/public/student/student.svg"
  }
}
```

This section defines basic information about the character. `name` and `type` are displayed in various places throughout the app; `type` is also used as a character identifier. `image` points to the character's avatar served from `server/src/public/`.

#### Progress Bar:

```json
{
  "progressBar": [
    {
      "name": "person",
      "introductionStep": "PICK_CHARACTER",
      "iconLight": "/public/common/icon-person-light.svg",
      "iconDark": "/public/common/icon-person-dark.svg"
    },
    {
      "name": "moon",
      "introductionStep": "SETUP_START",
      "iconLight": "/public/common/icon-moon-light.svg",
      "iconDark": "/public/common/icon-moon-dark.svg"
    },
    {
      "name": "wallet",
      "introductionStep": "CHOOSE_WALLET",
      "iconLight": "/public/common/icon-wallet-light.svg",
      "iconDark": "/public/common/icon-wallet-dark.svg"
    }
  ]
}
```

The progress bar section configures the progress bar at the top of the app during the introduction flow:
![](Pasted%20image%2020241002141757.png)
`name` is used as an `alt` attribute for accessibility. `introductionStep` is the screen ID at which the icon becomes highlighted. `iconLight` and `iconDark` are the icons to display in light or dark mode.

#### Introduction:

```json
{
  "introduction": [
    { "screenId": "PICK_CHARACTER", "name": "Meet Alice", "text": "..." },
    {
      "screenId": "SETUP_START",
      "name": "Let's get started!",
      "text": "...",
      "image": "/public/common/getStarted.svg"
    },
    {
      "screenId": "CHOOSE_WALLET",
      "name": "Install BC Wallet",
      "text": "...",
      "image": "/public/common/app-store-screenshots.png"
    },
    {
      "screenId": "CONNECT",
      "name": "Connect with BestBC College",
      "text": "...",
      "image": "/public/student/onboarding-connect-light.svg",
      "issuer_name": "BestBC College"
    },
    {
      "screenId": "ACCEPT_CREDENTIAL",
      "name": "Accept your student card",
      "text": "...",
      "image": "/public/common/onboarding-credential-light.svg",
      "credentials": ["student-card"]
    },
    {
      "screenId": "SETUP_COMPLETED",
      "name": "You're all set!",
      "text": "...",
      "image": "/public/common/onboarding-completed-light.svg"
    }
  ]
}
```

The introduction sections follow a common structure. Key fields:

- `screenId`: identifies the step and determines which component renders it:
  - `PICK_CHARACTER`: (required) first step — renders `PickCharacter.tsx`
  - `SETUP_START`: (required) second step — renders `SetupStart.tsx`
  - `CHOOSE_WALLET`: (optional) renders `ChooseWallet.tsx`
  - `CONNECT*`: creates a connection invitation and renders `SetupConnection.tsx`. `issuer_name` is the display name shown in the user's wallet.
  - `ACCEPT*`: renders `AcceptCredential.tsx` and sends the credential offer. Must be preceded by a `CONNECT*` step. The `credentials` field is an array of credential IDs referencing entries in `server/config/credentials.json`. If the schema or cred def do not exist, the server requests Traction to create them.
  - `SETUP_COMPLETED`: (required) last step — renders `SetupCompleted.tsx`
- `name`: the page title
- `text`: the main body text
- `image`: the main image (used as background or beside text depending on the screen)

Screen IDs must be unique within a showcase, hence the wildcards on `ACCEPT*` and `CONNECT*`.

#### Scenarios:

```json
{
  "scenarios": [
    {
      "id": "clothesOnline",
      "name": "Cool Clothes Online",
      "screens": [
        {
          "screenId": "START",
          "name": "Getting a student discount",
          "text": "...",
          "image": "/public/student/useCases/store/card-school.svg"
        },
        {
          "screenId": "CONNECTION",
          "name": "Start proving you're a student",
          "text": "...",
          "image": "/public/student/useCases/store/cool-clothes-no-overlay.png",
          "verifier": { "name": "Cool Clothes Online", "icon": "/public/student/useCases/store/logo-university.png" }
        },
        {
          "screenId": "PROOF",
          "name": "Confirm the information to send",
          "text": "...",
          "requestOptions": {
            "name": "Cool Clothes Online Request",
            "text": "Cool Clothes Online would like some of your personal information.",
            "requestedCredentials": [
              {
                "icon": "/public/student/useCases/school/icon-university-card.png",
                "name": "student_card",
                "schema_id": "QEquAHkM35w4XVT3Ku5yat:2:student_card:1.6",
                "predicates": [{ "name": "expiry_date", "type": ">=", "value": "$dateint:0" }]
              }
            ]
          }
        },
        {
          "screenId": "STEP_END",
          "name": "You're done!",
          "text": "...",
          "image": "/public/student/student-accepted.svg"
        }
      ]
    }
  ]
}
```

Scenarios share a common structure with the introduction flow. Key fields:

- `screenId`: identifies the step and determines which component renders it:
  - `START`: (required) first step — renders `StartContainer.tsx`
  - `CONNECTION*`: creates a connection invitation and renders `StepConnection.tsx`. `verifier.name` is the display name shown in the wallet; `verifier.icon` is the icon shown in the top-left of the connection screen: ![](Pasted%20image%2020241002151846.png)
  - `PROOF*`: renders `StepProof.tsx`. `requestOptions.name` and `requestOptions.text` appear on the holder's wallet proof request screen. Each entry in `requestedCredentials` contains: `icon` (loading screen icon), `name` (schema name for the proof restriction), `schema_id` (used for OCA branding lookup), `properties` (credential attributes to request), `predicates` (credential predicates to request — use `"$dateint:0"` as value for a current-date integer).
  - `STEP_END`: renders `StepEnd.tsx`
- `name`: the page title
- `text`: the main body text
- `image`: the main image

Screen IDs must be unique within a scenario, hence the wildcards on `CONNECTION*` and `PROOF*`.

## Deployment

When pushing changes to github the dev showcase environment should automatically update. The openshift deployments for the showcase are located here: https://github.com/bcgov/BC-Wallet-Demo-Configurations

ensure you have the openshift developer tools installed: https://github.com/BCDevOps/openshift-developer-tools you'll also need to instal jq as well. Make sure the bin folder is discoverable from your path. Example on linux `echo 'PATH=$PATH:/<OPENSHIFT_TOOLS_LOCATION>/bin' >> ~/.bashrc`

The showcase configuration files are organized into the `bc-wallet-demo-web` and `bc-wallet-demo-server` folders. Each folder has a `build.yaml`, `deploy.yaml`, `overrides.sh` and several param files. The build and deploy yaml files hold the build and deployment configurations. `overrides.sh` is used to prompt the user for secret values such as API keys, wallet keys, etc. The secrets are then uploaded to openshift secret storage. This prevents secrets from being accidentally included in the configurations. The `param` files are used to override the openshift variables used in the deployment templates, this allows you to deploy to dev, test, and prod using the same base template.

#### Build Config

To modify the build config, make sure you're in the project's openshift directory. Then run the following command:

```bash
genBuilds.sh -n a99fd4-tools -e tools -u
```

This will update the build configs with your modifications.

#### Deployment Config

To modify the deployment config, make sure you're in the project's openshift directory. Then run the following command, swap out occurrences of `dev` for the environment you're trying to update.

```bash
genDepls.sh -n a99fd4-dev -e dev -u
```

There may be one or two errors/warnings, just press enter to get through them.

#### Pipelines

There are three pipelines for the showcase: `bc-wallet-demo-pipeline`, `bc-wallet-demo-deploy-to-test-pipeline`, and `bc-wallet-demo-deploy-to-prod-pipeline`. `bc-wallet-demo-pipeline` deploys to dev and gets triggered whenever someone pushes to the github repo. This pipeline runs the build, creates a new image stream, and tags it as dev. If this pipeline gets stuck in the `new` state and never builds, it's probably because there's too many old builds in the environment. Delete some of the old builds and it should work again.

The other two pipelines are triggered manually, the test pipeline points the test image stream tags to dev, and the prod pipeline points the prod image stream tags to test. This means to deploy changes to prod, the test pipeline must run first.

To trigger a pipeline manually go to the buildconfigs section in a99fd4-tools, find the pipeline you would like to run and select `Start Build`.
![](Pasted%20image%2020241003161630.png)
Once the a pipeline has been run, there's nothing else you need to do, it will automatically handle the deployment to dev, test, or prod depending on the pipeline.

**Note:** The name pipeline is a bit of a misnomer because the pipelines are actually located under the buildconfig section in a99fd4-tools, not the pipeline section.
