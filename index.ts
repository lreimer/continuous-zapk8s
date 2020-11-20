import * as k8s from "@pulumi/kubernetes";

const zapLabels = { app: "zap" };

const zapService = new k8s.core.v1.Service("zap", {
    spec: {
        type: 'LoadBalancer',
        ports: [{ port: 8090, protocol: 'TCP', targetPort: 8090 }],
        selector: zapLabels
    }
});

const zapDaemon = new k8s.core.v1.Pod("zap-daemon", {
    metadata: {
        name: "zap-daemon",
        labels: zapLabels,
    },
    spec: {
        containers: [{ 
            name: "zap",                     
            image: "owasp/zap2docker-stable:2.9.0",
            command: ['zap.sh', '-daemon', '-port', '8090'],
            ports: [{containerPort: 8090}]
        }]
    }
});

export const zap = zapDaemon.metadata.name;
