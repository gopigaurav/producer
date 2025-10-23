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
                        sh """
                            rm -rf infra-gitops
                            git clone ${INFRA_REPO}
                            sleep 600
                            cd infra-gitops/overlays/dev
                            yq e -i '.image.tag = "${BUILD_NUMBER}"' ${IMAGE_NAME}-values.yaml
                            git config user.email "gopigaurav9@gmail.com"
                            git config user.name "gopigaurav"
                            git commit -am "Update ${IMAGE_NAME} to build ${BUILD_NUMBER}"
                            git push origin ${BRANCH}
                        """
                    }
                }
            }
        }
    }
}
