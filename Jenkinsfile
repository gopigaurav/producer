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
  securityContext:
    fsGroup: 1000
    runAsUser: 1000
  containers:
    - name: kaniko
      image: gcr.io/kaniko-project/executor:latest
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
        REGISTRY = "yourdockerhubusername"   // Replace with your DockerHub registry
        IMAGE_NAME = "yourimage"            // Replace with your image name
        BUILD_NUMBER = "${env.BUILD_NUMBER}"
    }

    stages {
        stage('Checkout Code') {
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
