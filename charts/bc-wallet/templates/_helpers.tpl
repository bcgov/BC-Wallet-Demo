{{/*
Expand the name of the chart.
*/}}
{{- define "bc-wallet.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
If release name contains chart name it will be used as a full name.
*/}}
{{- define "bc-wallet.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- if contains $name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
{{- end }}

{{/*
Create chart name and version as used by the chart label.
*/}}
{{- define "bc-wallet.chart" -}}
{{- if .Chart }}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" "bc-wallet" "0.1.0" | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}

{{/*
Common labels
*/}}
{{- define "bc-wallet.labels" -}}
helm.sh/chart: {{ include "bc-wallet.chart" . }}
{{- if .Release }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/*
Selector labels
*/}}
{{- define "bc-wallet.selectorLabels" -}}
app.kubernetes.io/name: {{ include "bc-wallet.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
Returns a secret if it already exists in Kubernetes, otherwise creates
it randomly.
*/}}
{{- define "getOrGeneratePass" -}}
{{- $len := (default 32 .Length) | int -}}
{{- $obj := (lookup "v1" .Kind .Namespace .Name).data -}}
{{- if $obj }}
{{- index $obj .Key -}}
{{- else -}}
  {{- $randomBytes := randBytes $len -}}
  {{- $base58Password := $randomBytes | b58enc -}}
  {{- if (eq (lower .Kind) "secret") -}}
    {{- $base58Password | b64enc -}}
  {{- else -}}
    {{- $base58Password -}}
  {{- end -}}
{{- end -}}
{{- end }}

{{/*
Define database secret name - used to reference PostgreSQL generated secret
*/}}
{{- define "bc-wallet.database.secret.name" -}}
{{- if .Values.postgresql.auth.existingSecret -}}
    {{- .Values.postgresql.auth.existingSecret -}}
{{- else -}}
    {{- printf "%s-postgresql" .Release.Name -}}
{{- end -}}
{{- end -}}

{{/*
Define database user password key - used to reference PostgreSQL generated secret
*/}}
{{- define "bc-wallet.database.userPasswordKey" -}}
{{- if .Values.postgresql.auth.secretKeys.userPasswordKey -}}
{{- printf "%s" .Values.postgresql.auth.secretKeys.userPasswordKey -}}
{{- else -}}
password
{{- end -}}
{{- end -}}

{{/*
Define rabbitmq secret name - used to reference RabbitMQ generated secret
*/}}
{{- define "bc-wallet.rabbitmq.secret.name" -}}
{{- if .Values.rabbitmq.auth.existingPasswordSecret -}}
    {{- .Values.rabbitmq.auth.existingPasswordSecret -}}
{{- else -}}
    {{- printf "%s-rabbitmq" .Release.Name -}}
{{- end -}}
{{- end -}}

{{/*
Return the RabbitMQ password key
*/}}
{{- define "bc-wallet.rabbitmq.passwordKey" -}}
{{- if .Values.rabbitmq.auth.existingSecretKey -}}
{{- .Values.rabbitmq.auth.existingSecretKey -}}
{{- else -}}
{{- "rabbitmq-password" -}}
{{- end -}}
{{- end -}}

{{/*
Get the rabbitmq erlang cookie key.
*/}}
{{- define "bc-wallet.rabbitmq.erlangCookieKey" -}}
{{- if .Values.rabbitmq.auth.secretKeys.erlangCookieKey -}}
{{- printf "%s" .Values.rabbitmq.auth.secretKeys.erlangCookieKey -}}
{{- else -}}
rabbitmq-erlang-cookie
{{- end -}}
{{- end -}}

{{/*
Define a FIXED auth token secret name that can be shared between frontend and backend
*/}}
{{- define "bc-wallet.authtoken.secret.name" -}}
bc-wallet-authtoken
{{- end -}}

{{/*
Generate API Server host if not overridden
*/}}
{{- define "bc-wallet.api-server.host" -}}
{{- if (and (hasKey .Values.api_server "openshift") (hasKey .Values.api_server.openshift "route") (hasKey .Values.api_server.openshift.route "host")) -}}
{{- .Values.api_server.openshift.route.host -}}
{{- else -}}
{{- printf "%s-%s%s" .Release.Name "api-server" .Values.ingressSuffix -}}
{{- end -}}
{{- end -}}

{{/*
Generate Traction Adapter host if not overridden
*/}}
{{- define "bc-wallet.traction-adapter.host" -}}
{{- if (and (hasKey .Values.traction_adapter "openshift") (hasKey .Values.traction_adapter.openshift "route") (hasKey .Values.traction_adapter.openshift.route "host")) -}}
{{- .Values.traction_adapter.openshift.route.host -}}
{{- else -}}
{{- printf "%s-%s%s" .Release.Name "traction-adapter" .Values.ingressSuffix -}}
{{- end -}}
{{- end -}}

{{/*
Generate Demo Web host if not overridden
*/}}
{{- define "bc-wallet.demo-web.host" -}}
{{- if (and (hasKey .Values.demo_web "openshift") (hasKey .Values.demo_web.openshift "route") (hasKey .Values.demo_web.openshift.route "host")) -}}
{{- .Values.demo_web.openshift.route.host -}}
{{- else -}}
{{- printf "%s-%s%s" .Release.Name "demo-web" .Values.ingressSuffix -}}
{{- end -}}
{{- end -}}

{{/*
Generate Showcase Creator host if not overridden
*/}}
{{- define "bc-wallet.showcase-creator.host" -}}
{{- if (and (hasKey .Values.showcase_creator "openshift") (hasKey .Values.showcase_creator.openshift "route") (hasKey .Values.showcase_creator.openshift.route "host")) -}}
{{- .Values.showcase_creator.openshift.route.host -}}
{{- else -}}
{{- printf "%s-%s%s" .Release.Name "showcase-creator" .Values.ingressSuffix -}}
{{- end -}}
{{- end -}}

{{/*
Generate Demo Server host if not overridden
*/}}
{{- define "bc-wallet.demo-server.host" -}}
{{- if (and (hasKey .Values.demo_server "openshift") (hasKey .Values.demo_server.openshift "route") (hasKey .Values.demo_server.openshift.route "host")) -}}
{{- .Values.demo_server.openshift.route.host -}}
{{- else -}}
{{- printf "%s-%s%s" .Release.Name "demo-server" .Values.ingressSuffix -}}
{{- end -}}
{{- end -}}