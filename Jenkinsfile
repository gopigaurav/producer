pipeline {
    agent {
        kubernetes {
            inheritFrom 'default' // optional, can remove if static pod only
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
      image: gcr.io/kaniko-project/executor:debug
      command:
        - /busybox/sh
      args:
        - -c
        - 'sleep 99999999'
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
        REGISTRY = "gopigaurav"
        IMAGE_NAME = "producer"
        INFRA_REPO = "git@github.com:gopigaurav/infra-gitops.git"
        BRANCH = "main"
        BUILD_NUMBER = "${env.BUILD_NUMBER}"
    }


    stages {
        stage('Checkout Code') {
            steps {
                checkout scm
            }
        }

        stage('Build & Push Image') {
            steps {
                container('kaniko') {
                    sh """
                        /kaniko/executor \\
                        --dockerfile=Dockerfile \\
                        --context=dir://\$PWD \\
                        --destination=\${REGISTRY}/\${IMAGE_NAME}:\${BUILD_NUMBER} \\
                        --destination=\${REGISTRY}/\${IMAGE_NAME}:latest \\
                        --verbosity=info \\
                        --cleanup \\
                        --docker-config=/kaniko/.docker
                    """
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
