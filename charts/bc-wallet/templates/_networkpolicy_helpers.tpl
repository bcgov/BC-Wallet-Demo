{{/*
Define a common template for allowing intra-release communication with namespace support
*/}}
{{- define "bc-wallet.intra-release-network-policy" -}}
{{- $releaseName := .Release.Name -}}
# Network policy to allow communication between services in the same release
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: {{ include "bc-wallet.fullname" .Release }}-{{ .componentName }}-allow-same-release
  namespace: {{ .Values.global.namespaceOverride | default .Release.Namespace }}
  labels:
    app.kubernetes.io/component: {{ .componentLabel }}
    app.kubernetes.io/part-of: bc-wallet
    {{- include "bc-wallet.labels" . | nindent 4 }}
spec:
  podSelector:
    matchLabels:
      app: {{ include "bc-wallet.fullname" .Release }}-{{ .componentName }}
  ingress:
  - from:
    - podSelector:
        matchExpressions:
        - key: app
          operator: In
          values:
          - {{ include "bc-wallet.fullname" .Release }}-api-server
          - {{ include "bc-wallet.fullname" .Release }}-traction-adapter
          - {{ include "bc-wallet.fullname" .Release }}-demo-web
          - {{ include "bc-wallet.fullname" .Release }}-showcase-creator
          - {{ include "bc-wallet.fullname" .Release }}-demo-server
    ports:
    - protocol: TCP
      port: {{ .servicePort }}
{{- end -}} 