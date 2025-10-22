pipeline {
    agent {
        kubernetes {
            label 'kaniko-agent'
            defaultContainer 'kaniko'
            yaml """
                apiVersion: v1
                kind: Pod
                metadata:
                    labels:
                        jenkins/label: kaniko-agent
                spec:
                containers:
                  - name: kaniko
                    image: gcr.io/kaniko-project/executor:latest
                    command:
                      - cat
                    tty: true
                    volumeMounts:
                      - name: kaniko-secret
                        mountPath: /kaniko/.docker


                volumes:
                  - name: kaniko-secret
                    secret:
                        secretName: dockerhub-creds
                """
        }
    }

    environment {
        REGISTRY = "gopi_gaurav"
        IMAGE_NAME = "producer"
        INFRA_REPO = "git@github.com:gopigaurav/infra-gitops.git"
        BRANCH = "main"
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Build and Push Image') {
            steps {
                container('kaniko') {
                    sh '''
                    /kaniko/executor \
                        --context $PWD \
                        --dockerfile Dockerfile \
                        --destination=docker.io/gopigaurav/producer:latest \
                        --cleanup
                    '''
                }
            }
        }


        stage('Update Infra GitOps Repo') {
            steps {
                script {
                    sh """
                        rm -rf infra-gitops
                        git clone ${INFRA_REPO}
                        cd infra-gitops/overlays/dev
                        yq e -i '.image.tag = "${BUILD_NUMBER}"' ${IMAGE_NAME}-values.yaml
                        git config user.email "ci@yourcompany.com"
                        git config user.name "ci-bot"
                        git commit -am "Update ${IMAGE_NAME} to build ${BUILD_NUMBER}"
                        git push origin ${BRANCH}
                    """
                }
            }
        }
    }
}
