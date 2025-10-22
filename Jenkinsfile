pipeline {
    agent {
        kubernetes {
            label 'kaniko-agent'
            defaultContainer 'kaniko'
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
                container('kaniko-agent') {
                    sh 'executor --dockerfile=Dockerfile --context=./ --destination=your-registry/your-image:tag'
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
