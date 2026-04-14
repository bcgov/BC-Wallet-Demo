{{/*
Expand the name of the chart.
*/}}
{{- define "showcase.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
API (server) resource name prefix.
*/}}
{{- define "showcase.server.fullname" -}}
{{- printf "%s-server" (include "common.names.fullname" .) }}
{{- end }}

{{/*
Web (Caddy) resource name prefix.
*/}}
{{- define "showcase.web.fullname" -}}
{{- printf "%s-web" (include "common.names.fullname" .) }}
{{- end }}

{{/*
Server image (Bitnami common helper pattern from OWF acapy chart).
*/}}
{{- define "showcase.server.image" -}}
{{ include "common.images.image" ( dict "imageRoot" .Values.showcase.server.image "global" .Values.global "chart" .Chart ) }}
{{- end }}

{{/*
Web image.
*/}}
{{- define "showcase.web.image" -}}
{{ include "common.images.image" ( dict "imageRoot" .Values.showcase.web.image "global" .Values.global "chart" .Chart ) }}
{{- end }}

{{/*
MongoDB service hostname (Bitnami subchart default naming).
*/}}
{{- define "showcase.mongodb.host" -}}
{{- printf "%s-mongodb" .Release.Name }}
{{- end }}

{{/*
Server env Secret name.
*/}}
{{- define "showcase.server.secretName" -}}
{{- printf "%s-server-env" (include "common.names.fullname" .) }}
{{- end }}

{{/*
Web ConfigMap name (Caddyfile).
*/}}
{{- define "showcase.web.configmapName" -}}
{{- printf "%s-web-caddy" (include "common.names.fullname" .) }}
{{- end }}
