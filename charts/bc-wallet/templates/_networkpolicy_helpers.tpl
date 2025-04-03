
{{/*
Define a common template for allowing intra-release communication with namespace support
*/}}
{{- define "bc-wallet-showcase-builder.intra-release-network-policy" -}}
{{- $releaseName := .Release.Name -}}
# Network policy to allow communication between services in the same release
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: {{ $releaseName }}-{{ .componentName }}-allow-same-release
  namespace: {{ .Values.global.namespaceOverride | default .Release.Namespace }}
  labels:
    app.kubernetes.io/component: {{ .componentLabel }}
    app.kubernetes.io/part-of: bc-wallet-showcase-builder
    {{- include "bc-wallet-showcase-builder.labels" . | nindent 4 }}
spec:
  podSelector:
    matchLabels:
      app: {{ $releaseName }}-{{ .componentName }}
  ingress:
  - from:
    - podSelector:
        matchExpressions:
        - key: app
          operator: In
          values:
          - {{ $releaseName }}-{{ .Values.api_server.name }}
          - {{ $releaseName }}-{{ .Values.traction_adapter.name }}
          - {{ $releaseName }}-{{ .Values.demo_web.name }}
          - {{ $releaseName }}-{{ .Values.showcase_creator.name }}
          - {{ $releaseName }}-{{ .Values.demo_server.name }}
    ports:
    - protocol: TCP
      port: {{ .servicePort }}
{{- end -}} 