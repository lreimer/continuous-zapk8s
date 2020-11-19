import * as k8s from "@pulumi/kubernetes";

const appLabels = { app: "nginx" };

const service = new k8s.core.v1.Service("nginx", {
    spec: {
        type: 'LoadBalancer',
        ports: [{ port: 8080, protocol: 'TCP', targetPort: 80 }],
        selector: appLabels
    }
});

const deployment = new k8s.apps.v1.Deployment("nginx", {
    spec: {
        selector: { matchLabels: appLabels },
        replicas: 1,
        template: {
            metadata: { labels: appLabels },
            spec: { 
                containers: [
                    { 
                        name: "nginx", 
                        image: "nginx:1.19.4-alpine", 
                        ports: [{containerPort: 80}]
                    }
                ] 
            }
        }
    }
});

export const name = deployment.metadata.name;
