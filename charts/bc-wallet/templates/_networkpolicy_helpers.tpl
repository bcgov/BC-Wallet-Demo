{{/*
Define a common template for allowing intra-release communication with namespace support
*/}}
{{- define "bc-wallet.intra-release-network-policy" -}}
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: {{ .Release.Name }}-{{ .componentName }}-allow-internal
  namespace: {{ .Values.global.namespaceOverride | default .Release.Namespace }}
  labels:
    app.kubernetes.io/component: {{ .componentLabel }}
    app.kubernetes.io/part-of: bc-wallet
    app.kubernetes.io/instance: {{ .Release.Name }}
    app.kubernetes.io/managed-by: {{ .Release.Service }}
spec:
  podSelector:
    matchLabels:
      app: {{ .Release.Name }}-{{ .componentName }}
  ingress:
  - from:
    - podSelector:
        matchLabels:
          app.kubernetes.io/part-of: bc-wallet
          app.kubernetes.io/instance: {{ .Release.Name }}
    ports:
    - protocol: TCP
      port: {{ .servicePort }}
{{- end -}} 