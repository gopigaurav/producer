pipeline {
    agent {
    // You can keep the label for documentation, but be aware of the 
    // deprecation warning and the potential for confusion (as discussed previously).
    label 'kaniko-agent' 
    defaultContainer 'jnlp' // Explicitly use 'jnlp' as the default execution environment
    yaml """
apiVersion: v1
kind: Pod
metadata:
  labels:
    jenkins/label: kaniko-agent
spec:
  # Add securityContext for Kaniko to work in many Kubernetes environments
  securityContext:
    fsGroup: 1000
    runAsUser: 1000
  containers:
    # 1. Kaniko container (The BUILDER)
    - name: kaniko
      image: gcr.io/kaniko-project/executor:latest
      # FIX: Use a command that works with Kaniko's minimal image 
      # and keeps the container alive for Jenkins to execute commands inside it.
      command:
        - /busybox/sh 
      args:
        - -c
        - 'sleep 99999999' # Keep the container alive
      tty: true
      volumeMounts:
        # Docker config secret mount is correct
        - name: kaniko-secret
          mountPath: /kaniko/.docker
    
    # 2. JNLP container (The CONTROLLER) - REMOVED
    # It's best to let the Jenkins Kubernetes plugin automatically inject 
    # and configure the 'jnlp' container, as it handles the args and volumes correctly.
    
  volumes:
    # Docker secret volume is correct
    - name: kaniko-secret
      secret:
        secretName: dockerhub-creds
"""
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
