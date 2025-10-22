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
  - name: jnlp
    image: jenkins/inbound-agent:latest
    args: ['\$(JENKINS_SECRET)', '\$(JENKINS_NAME)']
    tty: true
    volumeMounts:
      - name: workspace-volume
        mountPath: /home/jenkins/agent
  volumes:
    - name: kaniko-secret
      secret:
        secretName: dockerhub-creds
    - name: workspace-volume
      emptyDir: {}
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
                        --dockerfile=Dockerfile \
                        --context=$PWD \
                        --destination=${REGISTRY}/${IMAGE_NAME}:${BUILD_NUMBER} \
                        --destination=${REGISTRY}/${IMAGE_NAME}:latest \
                        --cleanup
                    '''
                }
            }
        }

        stage('Update Infra GitOps Repo') {
            steps {
                container('jnlp') {
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
}
