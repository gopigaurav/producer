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
          readOnly: false
  volumes:
    - name: kaniko-secret
      emptyDir: {}
"""
        }
    }

    environment {
        REGISTRY = "gopigaurav" // ECR or dockerhub
        IMAGE_NAME = "producer"
        INFRA_REPO = "https://github.com/gopigaurav/gitops_infra_kubernetes.git"
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
                    withCredentials([usernamePassword(credentialsId: 'dockerhub-creds',
                                                    usernameVariable: 'DOCKER_USERNAME',
                                                    passwordVariable: 'DOCKER_PASSWORD')]) {
                        sh '''
                            mkdir -p /kaniko/.docker

                            # ✅ Create valid JSON with proper escaping
                            echo "{\\"auths\\":{\\"https://index.docker.io/v1/\\":{\\"auth\\":\\"$(echo -n $DOCKER_USERNAME:$DOCKER_PASSWORD | base64)\\"}}}" > /kaniko/.docker/config.json

                            echo "✅ Docker config created at cat /kaniko/.docker/config.json"
                            cat /kaniko/.docker/config.json

                            echo "✅ Final Docker config that Kaniko will use:"
                            export DOCKER_CONFIG=/kaniko/.docker


                            /kaniko/executor \
                                --dockerfile=Dockerfile \
                                --context=dir://$PWD \
                                --destination=${REGISTRY}/${IMAGE_NAME}:${BUILD_NUMBER} \
                                --destination=${REGISTRY}/${IMAGE_NAME}:latest \
                                --verbosity=debug \
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
                        withCredentials([usernamePassword(credentialsId: 'github-token-jenkins', usernameVariable: 'GIT_USER', passwordVariable: 'GIT_TOKEN')]) {
                            sh """
                                echo "===== Current Directory and Files ====="
                                pwd
                                ls -l

                                # Move to Jenkins workspace (writeable)
                                cd /home/jenkins/agent/workspace
                                echo "===== Workspace Directory ====="
                                pwd
                                ls -l

                                # Remove existing repo folder if present
                                rm -rf infra-gitops

                                # Clone the infra repo into infra-gitops folder using credentials
                                git clone https://${GIT_USER}:${GIT_TOKEN}@github.com/gopigaurav/gitops_infra_kubernetes.git infra-gitops
                                echo "===== Files After Clone ====="
                                ls -l

                                # Navigate to the dev overlay folder
                                if [ -d "infra-gitops/overlays/dev" ]; then
                                    cd infra-gitops/overlays/dev
                                    echo "===== Inside overlays/dev ====="
                                    pwd
                                    ls -l
                                else
                                    echo "Error: overlays/dev folder does not exist!"
                                    exit 1
                                fi

                                # Install yq locally if not present
                                mkdir -p /home/jenkins/bin
                                export PATH=/home/jenkins/bin:\$PATH
                                if ! command -v yq &> /dev/null; then
                                    echo "yq not found, installing locally..."
                                    curl -L https://github.com/mikefarah/yq/releases/latest/download/yq_linux_amd64 -o /home/jenkins/bin/yq
                                    chmod +x /home/jenkins/bin/yq
                                else
                                    echo "yq already installed"
                                fi

                                # Verify yq
                                yq --version

                                # Update image tag in YAML
                                yq e -i '.image.tag = "${BUILD_NUMBER}"' ${IMAGE_NAME}-values.yaml

                                # Configure git for commit
                                git config user.email "gopigaurav9@gmail.com"
                                git config user.name "gopigaurav"

                                
                                # Commit and push changes using credentials
                                git add ${IMAGE_NAME}-values.yaml
                                git commit -m "Update ${IMAGE_NAME} to build ${BUILD_NUMBER}" || echo "No changes to commit changes"
                                echo "GIT_TOKEN length=${GIT_TOKEN}"
                                git remote add origin 'https://${GIT_USER}:${GIT_TOKEN}@github.com/gopigaurav/gitops_infra_kubernetes.git'
                                git push origin ${BRANCH}
                            """
                        }
                    }
                }
            }
        }

    }
}
