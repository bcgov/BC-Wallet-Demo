{{/*
Chart name and version for the `helm.sh/chart` label.
*/}}
{{- define "showcase.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Short app name (chart name or nameOverride).
*/}}
{{- define "showcase.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Fully qualified application name (release + chart, or fullnameOverride).
*/}}
{{- define "showcase.fullname" -}}
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
Namespace for templated resources.
*/}}
{{- define "showcase.namespace" -}}
{{- default .Release.Namespace .Values.namespaceOverride }}
{{- end }}

{{/*
Selector labels (must match pod template labels used in matchLabels).
*/}}
{{- define "showcase.selectorLabels" -}}
app.kubernetes.io/name: {{ include "showcase.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
Common labels on metadata (chart + optional commonLabels).
*/}}
{{- define "showcase.labels" -}}
helm.sh/chart: {{ include "showcase.chart" . }}
{{ include "showcase.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- range $k, $v := .Values.commonLabels }}
{{ $k }}: {{ $v | quote }}
{{- end }}
{{- end }}

{{/*
Container image reference (registry + repository + tag or digest).
*/}}
{{- define "showcase.image" -}}
{{- $img := .image -}}
{{- $global := .global -}}
{{- $reg := coalesce $img.registry $global.imageRegistry "" -}}
{{- $repo := $img.repository -}}
{{- $tag := default "latest" $img.tag -}}
{{- $dig := $img.digest -}}
{{- if $dig -}}
{{- if $reg -}}
{{- printf "%s/%s@%s" $reg $repo $dig -}}
{{- else -}}
{{- printf "%s@%s" $repo $dig -}}
{{- end -}}
{{- else -}}
{{- if $reg -}}
{{- printf "%s/%s:%s" $reg $repo $tag -}}
{{- else -}}
{{- printf "%s:%s" $repo $tag -}}
{{- end -}}
{{- end -}}
{{- end }}

{{/*
API (server) resource name prefix.
*/}}
{{- define "showcase.server.fullname" -}}
{{- printf "%s-server" (include "showcase.fullname" .) }}
{{- end }}

{{/*
Web (Caddy) resource name prefix.
*/}}
{{- define "showcase.web.fullname" -}}
{{- printf "%s-web" (include "showcase.fullname" .) }}
{{- end }}

{{/*
Server container image.
*/}}
{{- define "showcase.server.image" -}}
{{ include "showcase.image" (dict "image" .Values.showcase.server.image "global" .Values.global) }}
{{- end }}

{{/*
Web container image.
*/}}
{{- define "showcase.web.image" -}}
{{ include "showcase.image" (dict "image" .Values.showcase.web.image "global" .Values.global) }}
{{- end }}

{{/*
MongoDB ClusterIP service hostname (CloudPirates chart uses `<release>-mongodb`).
*/}}
{{- define "showcase.mongodb.host" -}}
{{- printf "%s-mongodb" .Release.Name }}
{{- end }}

{{/*
Server env Secret name.
*/}}
{{- define "showcase.server.secretName" -}}
{{- printf "%s-server-env" (include "showcase.fullname" .) }}
{{- end }}

{{/*
Web ConfigMap name (Caddyfile).
*/}}
{{- define "showcase.web.configmapName" -}}
{{- printf "%s-web-caddy" (include "showcase.fullname" .) }}
{{- end }}

{{/*
Fail when bundled MongoDB is on but neither a pre-provisioned server Secret nor rootPassword is set.
*/}}
{{- define "showcase.validateMongoAuth" -}}
{{- if and .Values.mongodb.enabled (not .Values.showcase.server.existingSecret) (not .Values.mongodb.auth.rootPassword) }}
{{- fail "When mongodb.enabled is true: set showcase.server.existingSecret to a Secret that includes MONGODB_URI (recommended), or set mongodb.auth.rootPassword for a chart-managed server Secret (dev only)." }}
{{- end }}
{{- end }}
