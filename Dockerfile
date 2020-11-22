FROM qaware/distroless-zulu-payara-micro:11.0.9-5.2020.5
COPY build/libs/continuous-zapk8s.war $DEPLOY_DIR
