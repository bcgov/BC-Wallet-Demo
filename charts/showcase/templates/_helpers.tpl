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
Kubernetes service-link env prefix for the API Service `metadata.name` (uppercase, `-` → `_`).
Used by the frontend `SHOWCASE_API_UPSTREAM` so Caddy dials ClusterIP without pod DNS.
Must match the server Service port name `http` → `_SERVICE_PORT_HTTP`.
*/}}
{{- define "showcase.server.serviceEnvPrefix" -}}
{{- upper (replace "-" "_" (include "showcase.server.fullname" .)) -}}
{{- end }}

{{/*
Frontend (Caddy + static SPA) resource name prefix.
*/}}
{{- define "showcase.frontend.fullname" -}}
{{- printf "%s-frontend" (include "showcase.fullname" .) }}
{{- end }}

{{/*
Server container image.
*/}}
{{- define "showcase.server.image" -}}
{{ include "showcase.image" (dict "image" .Values.showcase.server.image "global" .Values.global) }}
{{- end }}

{{/*
Frontend container image.
*/}}
{{- define "showcase.frontend.image" -}}
{{ include "showcase.image" (dict "image" .Values.showcase.frontend.image "global" .Values.global) }}
{{- end }}

{{/*
MongoDB Service metadata.name / in-cluster short DNS host (must match CloudPirates `mongodb.fullname`).
*/}}
{{- define "showcase.mongodb.host" -}}
{{- if .Values.mongodb.fullnameOverride }}
{{- .Values.mongodb.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default "mongodb" .Values.mongodb.nameOverride }}
{{- if contains $name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
{{- end }}

{{/*
Kubernetes service-link env prefix for MongoDB Service `metadata.name` (uppercase, `-` -> `_`).
Example: pr-403-showcase-mongodb -> PR_403_SHOWCASE_MONGODB
*/}}
{{- define "showcase.mongodb.serviceEnvPrefix" -}}
{{- upper (replace "-" "_" (include "showcase.mongodb.host" .)) -}}
{{- end }}

{{/*
Fully-qualified in-cluster DNS name for the MongoDB Service (fallback when Service ClusterIP is unavailable).
*/}}
{{- define "showcase.mongodb.serviceFqdn" -}}
{{- $ns := include "showcase.namespace" . -}}
{{- $domain := .Values.showcase.clusterDNSDomain | default "cluster.local" -}}
{{- printf "%s.%s.svc.%s" (include "showcase.mongodb.host" .) $ns $domain }}
{{- end }}

{{/*
Host for chart-built MONGODB_URI: Service ClusterIP when lookup succeeds (no DNS; same path as init nc), else FQDN.
*/}}
{{- define "showcase.mongodb.uriHost" -}}
{{- $ns := include "showcase.namespace" . -}}
{{- $svcName := include "showcase.mongodb.host" . -}}
{{- $svc := lookup "v1" "Service" $ns $svcName -}}
{{- if and $svc $svc.spec.clusterIP (ne $svc.spec.clusterIP "None") -}}
{{- $svc.spec.clusterIP -}}
{{- else -}}
{{- include "showcase.mongodb.serviceFqdn" . -}}
{{- end -}}
{{- end }}

{{/*
Query fragment appended to chart-built MONGODB_URI after authSource. directConnection=true avoids the
Node driver sitting in an Unknown topology when a single mongod advertises a different "me" host
than the in-cluster Service DNS name (common with standalone StatefulSet + ClusterIP).
*/}}
{{- define "showcase.mongodb.uriDriverQuerySuffix" -}}
&directConnection=true
{{- end }}

{{/*
Server env Secret name.
*/}}
{{- define "showcase.server.secretName" -}}
{{- printf "%s-server-env" (include "showcase.fullname" .) }}
{{- end }}

{{/*
Frontend ConfigMap name (Caddyfile).
*/}}
{{- define "showcase.frontend.configmapName" -}}
{{- printf "%s-frontend-caddy" (include "showcase.fullname" .) }}
{{- end }}

{{/*
Fail when required public browser origin is missing.
*/}}
{{- define "showcase.validatePublicOrigin" -}}
{{- if not .Values.showcase.publicOrigin }}
{{- fail "showcase.publicOrigin must be set to the browser-reachable origin (scheme + host[:port], no path)." }}
{{- end }}
{{- end }}

{{/*
Ingress hostname for the frontend: use ingress.frontend.hostname when set; otherwise the host from
showcase.publicOrigin (same browser origin for UI + API through Caddy on one hostname).
*/}}
{{- define "showcase.ingressFrontendHost" -}}
{{- include "showcase.validatePublicOrigin" . -}}
{{- $origin := .Values.showcase.publicOrigin -}}
{{- $p := urlParse $origin -}}
{{- coalesce .Values.ingress.frontend.hostname $p.hostname | required "ingress: set ingress.frontend.hostname or use showcase.publicOrigin with a valid host" -}}
{{- end }}

{{/*
Secret name for chart-generated Mongo root password (used by mongodb.auth.existingSecret tpl).
*/}}
{{- define "showcase.autoMongoRootSecretName" -}}
{{- printf "%s-showcase-mongo-root" .Release.Name }}
{{- end }}

{{/*
True (string "1") when the chart should create *-showcase-server-env (no showcase.server.existingSecret,
and bundled MongoDB is enabled).
*/}}
{{- define "showcase.server.chartServerSecretNeeded" -}}
{{- if and (not .Values.showcase.server.existingSecret) .Values.mongodb.enabled }}1{{- end }}
{{- end }}

{{/*
Fail when bundled MongoDB is on but chart cannot determine generated Mongo secret wiring.
*/}}
{{- define "showcase.validateMongoAuth" -}}
{{- if and .Values.mongodb.enabled (not .Values.showcase.server.existingSecret) }}
{{- if not (and .Values.mongodb.auth.existingSecret .Values.mongodb.auth.existingSecretPasswordKey) }}
{{- fail "When mongodb.enabled is true: set mongodb.auth.existingSecret and mongodb.auth.existingSecretPasswordKey for chart-generated Mongo root password wiring." }}
{{- end }}
{{- end }}
{{- end }}
