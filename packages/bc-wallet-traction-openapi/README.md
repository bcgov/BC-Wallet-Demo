## credential-showcase-traction-openapi

### Environment setup

Make sure following software is installed on your PC.

- [OpenJDK 17](https://jdk.java.net/java-se-ri/17).
- [Maven 3.8.1](https://maven.apache.org/download.cgi) or later.

### Generate API/Models

The following command will generate the models in `src/models`.

```
mvn -U clean generate-sources
```

**Profile id defaults to typescript-fetch-models and may be ignored at the moment**

### Using the models

The models will be generated in `src/models`, therefore, they may be imported into another submodule as a workspace dependency by:

adding the lines below to the respective files

###### package.json

```json
{
  "dependencies": {
    "credential-showcase-traction-openapi": "workspace:*"
  }
}
```

###### tsconfig.json

```json
{
  "references": [
    {
      "path": "../credential-showcase-traction-openapi"
    }
  ]
}
```

running the command below from the root project

```shell
pnpm install
```

And importing them as any other package

```typescript
import { Asset } from 'credential-showcase-traction-openapi'

const asset: Asset = {}
```
