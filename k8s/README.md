# Kubernetes manifests

This section includes basic kubernetes manifests to quickly deploy Haus onto your cluster. Before deploying, customize the ingress to your needs and check the image version in `deployment.yaml` to see if it is still up to date.

## Deployment

To deploy, run the following command:
```sh
kubectl apply -k /manifests -n haus --create-namespace
```