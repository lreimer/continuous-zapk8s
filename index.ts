import * as k8s from "@pulumi/kubernetes";

const zapNamespace = new k8s.core.v1.Namespace("zap", {
    metadata: { name: 'zap' }
});

const zapGuiService = new k8s.core.v1.Service("zap-gui", {
    metadata: {
        namespace: zapNamespace.metadata.name
    },
    spec: {
        type: 'NodePort',
        ports: [
            { name: 'proxy', port: 8090, protocol: 'TCP', targetPort: 8090 },
            { name: 'http', port: 8080, protocol: 'TCP', targetPort: 8080 },
        ],
        selector: { app: "zap", mode: "gui" }
    }
});

const zapGui = new k8s.core.v1.Pod("zap-gui", {
    metadata: {
        name: "zap-gui",
        namespace: zapNamespace.metadata.name,
        labels: { app: "zap", mode: "gui" },
    },
    spec: {
        containers: [{ 
            name: "zap-webswing",
            image: "owasp/zap2docker-weekly:latest",
            args: ['zap-webswing.sh'],
            ports: [
                { containerPort: 8080 },
                { containerPort: 8090 },
            ]
        }]
    }
});

const zapApiService = new k8s.core.v1.Service("zap-api", {
    metadata: {
        namespace: zapNamespace.metadata.name
    },
    spec: {
        type: 'LoadBalancer',
        ports: [
            { name: 'api', port: 9080, protocol: 'TCP', targetPort: 9080 },
        ],
        selector: { app: "zap", mode: "api" }
    }
});

const zapApiDaemon = new k8s.core.v1.Pod("zap-api", {
    metadata: {
        name: "zap-api",
        namespace: zapNamespace.metadata.name,
        labels: { app: "zap", mode: "api" }
    },
    spec: {
        containers: [{ 
            name: "zap",                     
            image: "owasp/zap2docker-weekly:latest",
            args: ['zap.sh', '-daemon', 
                      '-port', '9080', 
                      '-host', '0.0.0.0', 
                      '-config', 'api.addrs.addr.name=.*',
                      '-config', 'api.addrs.addr.regex=true', 
                      '-config', 'api.key=1qay2wsx3edc'],
            ports: [{ containerPort: 9080 }]
        }]
    }
});

const apiScanCronJob = new k8s.batch.v1beta1.CronJob("zap-api-scan", {
    metadata: {
        name: "zap-api-scan",
        namespace: zapNamespace.metadata.name
    },
    spec: {
        schedule: "*/5 * * * *",
        jobTemplate: {
            spec: {
                ttlSecondsAfterFinished: 120,
                template: {
                    spec: {
                        containers: [{
                            name: "zap",
                            image: "owasp/zap2docker-weekly:latest",
                            args: [
                                "zap-api-scan.py", 
                                "-t", "http://microservice.default.svc.cluster.local:8080/openapi/", 
                                "-f", "openapi",
                                "-l", "INFO",
                                "-I"
                            ]
                        }],
                        restartPolicy: "Never",
                    }
                }
            }
        }
    }
});

export const apiScanCronJobName = apiScanCronJob.metadata.name;

const microservice = new k8s.core.v1.Service("microservice", {
    metadata: {
        name: 'microservice'
    },
    spec: {
        type: 'NodePort',
        ports: [
            { name: 'http', port: 8080, protocol: 'TCP' },
        ],
        selector: { app: "microservice" }
    }
});

const deployment = new k8s.apps.v1.Deployment("microservice", {
    metadata: {
        labels: { app: "microservice" }
    },
    spec: {
        replicas: 2,
        selector: {
            matchLabels: { app: "microservice" }
        },
        template: {
            metadata: {
                labels:{ app: "microservice" }
            },
            spec: {
                containers: [{
                    name: 'microservice',
                    image: 'lreimer/continuous-zapk8s:latest',
                    ports: [
                        { name: 'http', containerPort: 8080 }
                    ],
                    livenessProbe: {
                        initialDelaySeconds: 30,
                        httpGet: { port: 8080, path: '/health/liveness' }
                    },
                    readinessProbe: {
                        initialDelaySeconds: 15,
                        httpGet: { port: 8080, path: '/health/readiness' }
                    }
                }]
            }
        }
    }
});