## Helm upgrade command

```bash
helm upgrade --install bc-wallet ./charts/bc-wallet -f ./charts/bc-wallet/values.yaml --wait

helm uninstall bc-wallet

oc delete secret,ingress,pvc,route,service,deployment,statefulset,configmap --selector "app.kubernetes.io/instance=bc-wallet"
```