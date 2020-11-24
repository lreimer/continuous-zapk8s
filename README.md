# Continuous ZAP on K8s

Continuous ZAP security tests on Kubernetes. We will run the tests continuously
in headless mode against a demo HTTP endpoint.

## Usage

### Basic Setup

This example deploys a simple microservice in the default K8s namespace. It also
creates a `zap` namespace and deploys the ZED Attach Proxy.

```bash
$ pulumi up
$ k get all -n zap
$ k get all
```

### Using ZAP Web UI

The easiest way is to use the ZAP UI in a Browser. Issue the following commands to get a
Swing UI in your web browser:
```bash
$ export PORT=`kubectl get service zap-gui -n zap -o=json | jq -r '.spec.ports[] | select (.name | test("http")) | .nodePort'`
$ open http://localhost:$PORT/zap
```

### Using ZAP via API

Another option is to use the ZAP API to programmatically connect, scan and attack your application targets:
```bash
$ ./gradlew test
```

### Continuous API Scan

```bash
# https://www.zaproxy.org/docs/docker/api-scan/
$ k describe cronjob.batch/zap-api-scan -n zap
```

## Maintainer

M.-Leander Reimer (@lreimer), <mario-leander.reimer@qaware.de>

## License

This software is provided under the MIT open source license, read the `LICENSE` file for details.