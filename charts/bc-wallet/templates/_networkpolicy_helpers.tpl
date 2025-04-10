{{/*
Define a common template for allowing intra-release communication with namespace support
*/}}
{{- define "bc-wallet-showcase-builder.intra-release-network-policy" -}}
{{- $releaseName := .Release.Name -}}
# Network policy to allow communication between services in the same release
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: {{ include "bc-wallet-showcase-builder.fullname" .Release }}-{{ .componentName }}-allow-same-release
  namespace: {{ .Values.global.namespaceOverride | default .Release.Namespace }}
  labels:
    app.kubernetes.io/component: {{ .componentLabel }}
    app.kubernetes.io/part-of: bc-wallet
    {{- include "bc-wallet-showcase-builder.labels" . | nindent 4 }}
spec:
  podSelector:
    matchLabels:
      app: {{ include "bc-wallet-showcase-builder.fullname" .Release }}-{{ .componentName }}
  ingress:
  - from:
    - podSelector:
        matchExpressions:
        - key: app
          operator: In
          values:
          - {{ include "bc-wallet-showcase-builder.fullname" .Release }}-api-server
          - {{ include "bc-wallet-showcase-builder.fullname" .Release }}-traction-adapter
          - {{ include "bc-wallet-showcase-builder.fullname" .Release }}-demo-web
          - {{ include "bc-wallet-showcase-builder.fullname" .Release }}-showcase-creator
          - {{ include "bc-wallet-showcase-builder.fullname" .Release }}-demo-server
    ports:
    - protocol: TCP
      port: {{ .servicePort }}
{{- end -}} 