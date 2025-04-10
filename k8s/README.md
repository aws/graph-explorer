# Kubernetes

## Setup graph-explorer on kubernetes for tests using kustomize

* Resources that will be created:

* Namespace graph-explorer
* Deployment (1 pod replica)
* ClusterIP Service 


```bash

kubectl apply -k k8s/manifests/overlays/default

```

## Using port-forward to access the graph-explorer

```bash
kubectl port-forward svc/graph-explorer 8080:443
```

* Open the url to access on browser: [https://localhost:8080/explorer](https://localhost:8080/explorer)

## Removing all resources:

```bash

kubectl delete -k k8s/manifests/overlays/default

```