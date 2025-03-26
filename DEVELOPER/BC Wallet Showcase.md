# BC Wallet Showcase Developer Documentation
https://github.com/bcgov/BC-Wallet-Demo

The BC Wallet Showcase is an application used to issue demo credentials and proof requests. It consists of a React frontend and a TS-Node Backend. Additionally it needs to be connected to a traction agent.

## Setup: Local Development
There are two env files that you need to configure. This stage assumes you already have access to a traction agent. If you have a fresh setup on your traction agent you'll need to do a couple things to connect it with the showcase. Log on to your traction agent, depending on the environment the url will be slightly different:
- dev:  https://traction-tenant-ui-dev.apps.silver.devops.gov.bc.ca/
- test:  https://traction-tenant-ui-test.apps.silver.devops.gov.bc.ca/
- prod:  https://traction-tenant-ui.apps.silver.devops.gov.bc.ca/  
  
  
once logged in navigate to to the API keys section under the wallet icon to the top right.
![](Pasted%20image%2020241002093928.png)
Create a new API key and save the key and tenant ID in a password manager. You should only have to do this once when migrating to a new traction agent. 

The next thing you'll have to do is setup webhooks for your local environment. Start an ngrok instance on your local machine on port 5000 like so `ngrok http 5000` copy the URL you get in to command window. Go to Settings under the wallet icon, you should see a section where you can add your webhook url. Add the following url to the webhook url textbox: `https://<YOUR_NGROK_URL>/digital-trust/showcase/demo/whook` then in the webhook key generate a random key and paste it in there. Make sure you save the webhook key since we'll need it later. Hit the Save Changes button at the bottom.
![](Pasted%20image%2020241002095030.png)
One last thing that needs to be done is to ensure that your traction agent is setup as an issuer. You should see this icon at the top right of your tenant's profile, this means it has the ability to create schemas and cred defs on the ledger.  
![](Pasted%20image%2020241002100018.png)

There are two .env files that you need to create and configure on the showcase. They go in the same folder as the .env.example file. In the server folder the .env file should look like this:
```bash
TENANT_ID=<YOUR_TENNANT_ID>
API_KEY=<YOUR_API_KEY>
TRACTION_URL=https://traction-tenant-proxy-test.apps.silver.devops.gov.bc.ca
TRACTION_DID=<YOUR_AGENTS_DID>
BASE_ROUTE=/digital-trust/showcase
STUDENT_VERSION=1.6
LAWYER_VERSION=1.54
PERSON_VERSION=1.3
WEBHOOK_SECRET=<YOUR_WEBHOOK_SECRET>
```
populate the values with the API key, and webhook secret that you made in the previous step. You'll also need you agent's DID which can be found under `Profile > Public DID` after clicking the wallet icon on the top right.  
In the client folder the .env file should look like this:
```bash
SNOWPLOW_ENDPOINT=spm.apps.gov.bc.ca
REACT_APP_HOST_BACKEND=http://127.0.0.1:5000
REACT_APP_BASE_ROUTE=/digital-trust/showcase
REACT_APP_INSIGHTS_PROJECT_ID=
```
When adding environment variables to this file in the future, ensure that they start with `REACT_APP_` otherwise react won't pick them up. Also note that the environment variables will only be present during development on the frontend. In production the frontend gets compiled down into static files and served with a caddy proxy. Caddy can still read the environment variables but the frontend code can't because they're just static files running on the user's browser at that point.  

Ensure that both the env files are named `.env` and that they're in the same folder as their respective `.env.example` files, otherwise they won't get loaded.  

In the command line, go to the project directory and run `yarn install` then run `yarn run dev` this will install all dependancies and start the front and backend. Your development environment should be accessible on port http://localhost:3000

## Project Structure
As stated in the previous section, the application is split up in to a frontend and backend. The code for each is located in the `client` and `server` folders respectively.

### Client Structure:
The are two main flows on the Client, the onboarding flow where a user gets their credentials, and the useCase where the user presents information about their credentials in proof requests. These are located in `client > src > pages > onboarding > steps`. Here's an overview of the steps and their role:
- SetupConnection.tsx: generates a QR code to establish a connection with the user's wallet
- AcceptCredential.tsx: issues the configured credential to the existing connection
- StepView.tsx: displays the configured text and images for the current step
- ChooseWallet.tsx: displays the choose wallet screen that instructs users to install BC Wallet
- PickCharater.tsx: the character selection screen that allows you to select different characters based on the configuration
- SetupStart.tsx: provides a preamble about what credentials you'll be receiving and the usecases
- SetupCompleted.tsx: displays a success screen that shows after the onboarding is completed

The structure is similar for the client use cases as well. The useCase screens are located at `client > src > pages > useCase > steps`. Here's an overview of the steps and their role:
- StartContainer.tsx: used to show a preamble about the proof and provide a start button
- StepConnection.tsx: generates a QR Code to establish a connection with the user's wallet
- StepCredential.tsx: not is use. Previously it was used to issue a credential during the proof request process.
- StepEnd.tsx: used to show a success message after all of the proof requests
- StepInformation.tsx: like BasicSlide.tsx displays configured text and images to provide context for the proof.
- StepProof.tsx: issues the configured proof to the user's wallet

All of these steps are configurable via the `lawyerCustom.ts` and `studentCustom.ts` files in `server > config`

### Server Structure:
For the most part the server acts as a sort of proxy to pass requests to the traction agent. There's some additional routes provided as well but for the most part it passes requests to the traction agent. The handlers for each route are all located in `server > src > controllers`. 

### Server Config:
Two important files in the server are `lawyerCustom.ts` and `studentCustom.ts` these files are used to configure the Lawyer and Student flows. We'll walk though the configuration and what they mean:  
#### Basic Character Info
```typescript
export const studentCustom: CustomCharacter = {
name: 'Alice',
type: 'Student',
image: '/public/student/student.svg',
...
}
```

This first section here defines some basic information about the character, their `name` which gets displayed in various places throughout the app. `type` which also gets displayed throughout the app and is used as a sort of character ID in some places, and `image` which points to the image for the character's avatar. The image should be on the server side `server > src > public > ...`  

#### Progress Bar:
``` typescript
export const studentCustom: CustomCharacter = {
...
progressBar: [
	{
		name: 'person',
		onboardingStep: 'PICK_CHARACTER',
		iconLight: '/public/common/icon-person-light.svg',
		iconDark: '/public/common/icon-person-dark.svg',
	},
	{
		name: 'moon',
		onboardingStep: 'SETUP_START',
		iconLight: '/public/common/icon-moon-light.svg',
		iconDark: '/public/common/icon-moon-dark.svg',
	},
	{
		name: 'wallet',
		onboardingStep: 'CHOOSE_WALLET',
		iconLight: '/public/common/icon-wallet-light.svg',
		iconDark: '/public/common/icon-wallet-dark.svg',
	},
	...
],
...
}
```
The progress bar section is used to configured the progress bar at the top of the app during onboarding:
![](Pasted%20image%2020241002141757.png)
`name` refers to the type of icon used, this is used as and `alt` attribute for accessibility purposes. `onboardingStep` refers to the step ID when the icon becomes highlighted, here we can see that the person icon is highlighted because the user is on the `PICK_CHARACTER` screen id. `iconLight` and `iconDark` are the actual icons to display when the app is in light or dark mode.

#### Onboarding:
``` typescript
export const studentCustom: CustomCharacter = {
	...
	onboarding: [
		{
			screenId: 'PICK_CHARACTER',
			title: 'Meet Alice',
			text: "Meet Alice (that's you in this demo!). Alice is a student at BestBC College. To help make student life easier, BestBC College is going to offer Alice a digital Student Card to put in her BC Wallet.",
		},
		{
			screenId: 'SETUP_START',
			title: "Let's get started!",
			text: 'BC Wallet is a new app for storing and using credentials on your smartphone. Credentials are things like IDs, licenses and diplomas. \nUsing your BC Wallet is fast and simple. In the future it can be used online and in person. You approve every use, and share only what is needed. \nIn this demo, you will use two credentials to prove who you are and access court materials online instead of in-person.',
			image: '/public/common/getStarted.svg',
		},
		{
			screenId: 'CHOOSE_WALLET',
			title: 'Install BC Wallet',
			text: 'First, install the BC Wallet app onto your smartphone. Select the button below for instructions and the next step.',
			image: '/public/common/app-store-screenshots.png',
		},
		{
			screenId: 'CONNECT',
			title: 'Connect with BestBC College',
			text: 'Imagine, as Alice, you are logged into the BestBC College website (see below). They want to offer you a Digital Student Card. Use your BC Wallet to scan the QR code from the website.',
			image: '/public/student/onboarding-connect-light.svg',
			issuer_name: 'BestBC College',
		},
		{
			screenId: 'ACCEPT_CREDENTIAL',
			title: 'Accept your student card',
			text: "Your wallet now has a secure and private connection with BestBC College. You should have received an offer in BC Wallet for a Student Card.\nReview what they are sending, and choose 'Accept offer'.",
			image: '/public/common/onboarding-credential-light.svg',
			credentials: [
				{
					name: 'student_card',
					version: process.env.STUDENT_VERSION ?? '1.0',
					icon: '/public/student/icon-student.svg',
					attributes: [
					{
						name: 'student_first_name',
						value: 'Alice',
					},
					{
						name: 'student_last_name',
						value: 'Smith',
					},
					{
						name: 'expiry_date',
						value: `${getDateInt(4)}`,
					}
				},
			],
		},
		{
			screenId: 'SETUP_COMPLETED',
			title: "You're all set!",
			text: 'Congratulations, you’ve just received your first digital credentials. They are safely stored in your wallet and ready to be used. So, what are you waiting for? Let’s go!',
			image: '/public/common/onboarding-completed-light.svg',
		},
	],
	...
}
```

The onboarding sections consist of a basic structure which sometimes includes special attributes like `credentials`. The basic structure has 4 attributes:
- `screenId`: this is the string that identifies an onboarding step, it also maps a onboarding section to an onboarding step component:
	- `PICK_CHARACTER`: (required) at the start of the onboarding sections, makes the app render the `PickCharacter.tsx` screen with the provided configuration
	- `SETUP_START`: (required) after `PICK_CHARACTER` makes the app render the `SetupStart.tsx` screen with the provided configuration
	- `CHOOSE_WALLET`: (optional) makes the app render the `ChooseWallet.tsx` screen with the provided configuration
	- `CONNECT*`: makes the app create a new connection invitation and render `SetupConnection.tsx`. The `issuer_name` attribute provides the connection display name that the user will see in their wallet.
	- `ACCEPT*`: makes the app render `AcceptCredential.tsx` and send the specified credential offer to the user's wallet. This step must have a `CONNECT*` step that comes before it. The `credentials` attribute provides information about the credential offer: `name` is the schema name of the credential, and `version` is the schema version. If the schema or cred def don't exist then the app will issue a request to traction to create one. The `icon` is the small icon that gets displayed on the loading screen while the app waits for you to accept your credential. The `attributes` section is the field that maps the values to the schema attributes.
	- `SETUP_COMPLETED`: (required) must come at the end. Makes the app display the `SetupCompleted.tsx` with the provided configuration
- `title`: the text to display on the page title
- `text`: the main text to display as part of the page content
- `image`: the main image to display, sometimes as a background picture or an image to display beside the text depending on the screen
Note that the screen id must be unique for each section, hence the wildcards on `ACCEPT*` and `CONNECT*` 

#### Use Cases:
``` typescript
export const studentCustom: CustomCharacter = {
	...
	useCases: [
		{
			id: 'clothesOnline',
			name: 'Cool Clothes Online',
			screens: [
				{
					screenId: 'START',
					title: 'Getting a student discount',
					text: "Alice (that's you in this demo!) can get a student discount on her online purchase. In this example, you will just tell Cool Clothes Online you're a student.",
					image: '/public/student/useCases/store/card-school.svg',
				},
				{
					screenId: 'CONNECTION',
					title: "Start proving you're a student",
					text: "Imagine, as Alice, you are in the checkout process for Cool Clothes Online. They're offering you a 15% discount on your purchase if you can prove you're a student. First, scan the QR code.",
					image: '/public/student/useCases/store/cool-clothes-no-overlay.png',
					verifier: { name: 'Cool Clothes Online', icon: '/public/student/useCases/store/logo-university.png' },
				},
				{
					screenId: 'PROOF',
					title: 'Confirm the information to send',
					text: "BC Wallet will now ask you to confirm what to send. Notice how it will only share if the credential has expired, not even the expiry date itself gets shared. You don't have to share anything else for it to be trustable.",
					requestOptions: {
						title: 'Cool Clothes Online Request',
						text: 'Cool Clothes Online would like some of your personal information.',
						requestedCredentials: [
							{
								icon: '/public/student/useCases/school/icon-university-card.png',
								name: 'student_card',
								schema_id: 'QEquAHkM35w4XVT3Ku5yat:2:student_card:1.6',
								predicates: {
									name: 'expiry_date',
									type: '>=',
									value: getDateInt(),
								},
							},
						],
					},
				},
				{
					screenId: 'STEP_END',
					title: "You're done!",
					text: "You proved that you're a student, and Cool Clothes Online gave you the discount. It only took a few seconds, you revealed minimal information, and Cool Clothes Online could easily and automatically trust what you sent.",
					image: '/public/student/student-accepted.svg',
				},
			],
		},

		{
			id: 'study',
			name: 'BestBC College',
			screens: [
				{
					screenId: 'START',
					title: 'Book a study room',
					text: "Alice has lots of work to do, and needs a study room for some peace and quiet. In this example, we'll present some info from our Student Card, but just what's needed to book the room.",
					image: '/public/student/useCases/school/card-school.svg',
				},
				{
					screenId: 'CONNECTION',
					title: 'Start booking the room',
					text: "Imagine you're on the room booking page for BestBC College, abd you've chosen a data and time. Now they just need to confirm a few details. Scan the QR code to continue.",
					image: '/public/student/useCases/school/best-bc-college-no-overlay.png',
					verifier: { name: 'BestBC College', icon: '/public/student/useCases/school/logo-university.png' },
				},
				{
					screenId: 'PROOF',
					title: 'Confirm the information to send',
					text: "BC Wallet will now ask you to confirm what to send for the booking. Notice how they only need your first name so they can display it on the booking screen. By providing anything from your student card, they automatically know your student card hasn't been revoked.",
					requestOptions: {
						title: 'BestBC College Request',
						text: 'BestBC College would like some of your personal information.',
						requestedCredentials: [
							{
								icon: '/public/student/useCases/school/icon-university-card.png',
								name: 'student_card',
								schema_id: 'QEquAHkM35w4XVT3Ku5yat:2:student_card:1.6',
								properties: ['student_first_name'],
							},
						],
					},
				},
				{
					screenId: 'STEP_END',
					title: "You're done!",
					text: "The room is booked. Just by proving your first name, Best BC College could trust you are a current student, and could let others know there's a booking without revealing too much about you.",
					image: '/public/student/student-accepted.svg',
				},
			],
		},
	],
	...
}
```
Like the onboarding section, the use case section consist of a basic structure which sometimes includes special attributes like `requestOptions`. The basic structure has 4 attributes:
- `screenId`: this is the string that identifies an onboarding step, it also maps a onboarding section to an onboarding step component:
	- `START`: (required) at the start of the onboarding sections, makes the app render the `StartContainer.tsx` screen with the provided configuration
	- `CONNECTION*`: creates a new connection invitation and makes the app render `StepConnection.tsx`. The `verifier` field consists of two attributes: `name` is the name of the connection that the user will see in the wallet. `icon` is the icon that gets displayed in the top left of the usecase on the connection screen: ![](Pasted%20image%2020241002151846.png)
	- `PROOF*`: makes the app render the `StepProof.tsx` screen. The `requestedCredentials` object can contain requests for predicates and/or credential attributes. The `title` and `text` attributes get displayed on the holder's wallet when viewing the proof request. `requestedCredentials` contains an array of request objects. Each request object contains the following: `icon`(the icon to display on the proof request loading component), `name` (the schema_name to use in the proof request restriction), `schema_id` (the schema id used to lookup OCA branding), `properties` ( the credential attributes to request), `predicates` (the credential predicates to request)
	- `STEP_END`: makes the app render the `StepEnd.tsx` screen with the provided configuration
- `title`: the text to display on the page title
- `text`: the main text to display as part of the page content
- `image`: the main image to display, sometimes as a background picture or an image to display beside the text depending on the screen
Note that the screen id must be unique for each section within a use case, hence the wildcards on `CONNECTION*` and `PROOF*` 

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
There are three pipelines for the showcase: `bc-wallet-demo-pipeline`, `bc-wallet-demo-deploy-to-test-pipeline`, and `bc-wallet-demo-deploy-to-prod-pipeline`.  `bc-wallet-demo-pipeline` deploys to dev and gets triggered whenever someone pushes to the github repo. This pipeline runs the build, creates a new image stream, and tags it as dev. If this pipeline gets stuck in the `new` state and never builds, it's probably because there's too many old builds in the environment. Delete some of the old builds and it should work again.

The other two pipelines are triggered manually, the test pipeline points the test image stream tags to dev, and the prod pipeline points the prod image stream tags to test. This means to deploy changes to prod, the test pipeline must run first.

To trigger a pipeline manually go to the buildconfigs section in a99fd4-tools, find the pipeline you would like to run and select `Start Build`.
![](Pasted%20image%2020241003161630.png)
Once the a pipeline has been run, there's nothing else you need to do, it will automatically handle the deployment to dev, test, or prod depending on the pipeline.

**Note:** The name pipeline is a bit of a misnomer because the pipelines are actually located under the buildconfig section in a99fd4-tools, not the pipeline section.
