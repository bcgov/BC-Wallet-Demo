{{/*
Expand the name of the chart.
*/}}
{{- define "bc-wallet-showcase.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
If release name contains chart name it will be used as a full name.
*/}}
{{- define "bc-wallet-showcase.fullname" -}}
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
{{- define "bc-wallet-showcase.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Common labels
*/}}
{{- define "bc-wallet-showcase.labels" -}}
helm.sh/chart: {{ include "bc-wallet-showcase.chart" . }}
{{ include "bc-wallet-showcase.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
app.kubernetes.io/part-of: {{ .Release.Name }}
{{- end }}

{{/*
Selector labels
*/}}
{{- define "bc-wallet-showcase.selectorLabels" -}}
app.kubernetes.io/name: {{ include "bc-wallet-showcase.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
Render envFrom from either service or global scope
*/}}
{{- define "bc-wallet-showcase.renderEnvFrom" -}}
{{- $service := index . 0 -}}
{{- $ctx := index . 1 -}}
{{- $cm := default (get $ctx.Values.global "extraEnvVarsCM") (get $ctx.Values $service).extraEnvVarsCM }}
{{- $secret := default (get $ctx.Values.global "extraEnvVarsSecret") (get $ctx.Values $service).extraEnvVarsSecret }}
{{- if or $cm $secret }}
envFrom:
  {{- if $cm }}
  - configMapRef:
      name: {{ $cm | quote }}
  {{- end }}
  {{- if $secret }}
  - secretRef:
      name: {{ $secret | quote }}
  {{- end }}
{{- end }}
{{- end }}

{{/*
Create the name of the service account to use
*/}}
{{- define "bc-wallet-showcase.serviceAccountName" -}}
{{- if .Values.serviceAccount.create }}
{{- default (include "bc-wallet-showcase.fullname" .) .Values.serviceAccount.name }}
{{- else }}
{{- default "default" .Values.serviceAccount.name }}
{{- end }}
{{- end }}

{{/*
generate api server host
*/}}
{{- define "bc-wallet-showcase.apiServer.host" -}}
{{- include "bc-wallet-showcase.fullname" . }}-api-server{{ .Values.global.ingressSuffix -}}
{{- end -}}

{{/*
generate demo server host
*/}}
{{- define "bc-wallet-showcase.demoServer.host" -}}
{{- include "bc-wallet-showcase.fullname" . }}-demo-server{{ .Values.global.ingressSuffix -}}
{{- end -}}

{{/*
generate demo web host
*/}}
{{- define "bc-wallet-showcase.demoWeb.host" -}}
{{- include "bc-wallet-showcase.fullname" . }}-demo-web{{ .Values.global.ingressSuffix -}}
{{- end -}}

{{/*
generate showcase creator host
*/}}
{{- define "bc-wallet-showcase.showcaseCreator.host" -}}
{{- include "bc-wallet-showcase.fullname" . }}-showcase-creator{{ .Values.global.ingressSuffix -}}
{{- end -}}

{{/*
generate traction adapter host
*/}}
{{- define "bc-wallet-showcase.tractionAdapter.host" -}}
{{- include "bc-wallet-showcase.fullname" . }}-traction-adapter{{ .Values.global.ingressSuffix -}}
{{- end -}}

{{/*
Define database secret name - used to reference PostgreSQL generated secret
*/}}
{{- define "bc-wallet-showcase.database.secret.name" -}}
{{- if .Values.postgresql.auth.existingSecret -}}
    {{- .Values.postgresql.auth.existingSecret -}}
{{- else -}}
    {{- printf "%s-postgresql" .Release.Name -}}
{{- end -}}
{{- end -}}

{{/*
Define database user password key - used to reference PostgreSQL generated secret
*/}}
{{- define "bc-wallet-showcase.database.userPasswordKey" -}}
{{- if .Values.postgresql.auth.secretKeys.userPasswordKey -}}
{{- printf "%s" .Values.postgresql.auth.secretKeys.userPasswordKey -}}
{{- else -}}
password
{{- end -}}
{{- end -}}

{{/*
Define rabbitmq secret name - used to reference RabbitMQ generated secret
*/}}
{{- define "bc-wallet-showcase.rabbitmq.secret.name" -}}
{{- if .Values.rabbitmq.auth.existingPasswordSecret -}}
    {{- .Values.rabbitmq.auth.existingPasswordSecret -}}
{{- else -}}
    {{- printf "%s-rabbitmq" .Release.Name -}}
{{- end -}}
{{- end -}}

{{/*
Return the RabbitMQ password key
*/}}
{{- define "bc-wallet-showcase.rabbitmq.passwordKey" -}}
{{- if .Values.rabbitmq.auth.existingSecretKey -}}
{{- .Values.rabbitmq.auth.existingSecretKey -}}
{{- else -}}
{{- "rabbitmq-password" -}}
{{- end -}}
{{- end -}}

