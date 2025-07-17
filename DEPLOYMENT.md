# Deployment Guide

This guide provides instructions for deploying the application to Google Cloud Run using Docker.

## Prerequisites

1.  **Google Cloud SDK:** Make sure you have `gcloud` installed and configured.
2.  **Docker:** Docker must be installed and running on your local machine.
3.  **Google Cloud Project:** You need a Google Cloud project with the Artifact Registry and Cloud Run APIs enabled.
4.  **Permissions:** You need permissions to push to Artifact Registry and deploy to Cloud Run.

## 1. Local Docker-based Deployment

These steps allow you to run the entire application stack (frontend and backend) locally using Docker.

### Setup

1.  **Create a `.env` file:** In the project root, create a `.env` file and add your Google API key:
    ```
    GOOGLE_API_KEY=your_google_api_key_here
    ```

### Running the Application

1.  **Build the Docker images:**
    ```bash
    npm run docker:build
    ```

2.  **Start the services:**
    ```bash
    npm run docker:up
    ```
    This will start the frontend and backend services in detached mode.

3.  **Access the application:**
    *   Frontend: `http://localhost:8080`
    *   Backend Health Check: `http://localhost:3001/api/health`

4.  **Stop the services:**
    ```bash
    npm run docker:down
    ```

## 2. Google Cloud Run Deployment

These steps guide you through deploying the frontend and backend services to Google Cloud Run.

### Setup

1.  **Authenticate with Google Cloud:**
    ```bash
    gcloud auth login
    gcloud config set project YOUR_PROJECT_ID
    ```

2.  **Configure Docker to use `gcloud`:**
    ```bash
    gcloud auth configure-docker
    ```

3.  **Create an Artifact Registry repository:**
    You only need to do this once.
    ```bash
    gcloud artifacts repositories create your-repo-name --repository-format=docker --location=your-region
    ```
    *Replace `your-repo-name` and `your-region` (e.g., `us-central1`).*

### Step-by-Step Deployment

Let's define some variables to make the commands easier:

```bash
export PROJECT_ID=$(gcloud config get-value project)
export REGION=us-central1
export REPO_NAME=interrogation-simulator-repo
export FRONTEND_IMAGE_NAME=frontend
export BACKEND_IMAGE_NAME=backend
```

**A. Build and Push the Frontend Image**

1.  **Build:**
    ```bash
    docker-compose build frontend
    ```
2.  **Tag:**
    ```bash
    docker tag YOUR_LOCAL_FRONTEND_IMAGE_ID ${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO_NAME}/${FRONTEND_IMAGE_NAME}:latest
    ```
    *Find `YOUR_LOCAL_FRONTEND_IMAGE_ID` by running `docker images`.*
3.  **Push:**
    ```bash
    docker push ${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO_NAME}/${FRONTEND_IMAGE_NAME}:latest
    ```

**B. Deploy the Frontend to Cloud Run**

```bash
gcloud run deploy interrogation-frontend \
  --image=${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO_NAME}/${FRONTEND_IMAGE_NAME}:latest \
  --platform=managed \
  --region=${REGION} \
  --allow-unauthenticated
```
*Take note of the URL provided after deployment.*

**C. Build and Push the Backend Image**

1.  **Build:**
    ```bash
    docker-compose build backend
    ```
2.  **Tag:**
    ```bash
    docker tag YOUR_LOCAL_BACKEND_IMAGE_ID ${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO_NAME}/${BACKEND_IMAGE_NAME}:latest
    ```
3.  **Push:**
    ```bash
    docker push ${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO_NAME}/${BACKEND_IMAGE_NAME}:latest
    ```

**D. Deploy the Backend to Cloud Run**

```bash
gcloud run deploy interrogation-backend \
  --image=${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO_NAME}/${BACKEND_IMAGE_NAME}:latest \
  --platform=managed \
  --region=${REGION} \
  --set-env-vars="GOOGLE_API_KEY=your_google_api_key_here" \
  --allow-unauthenticated # For now, will be changed later
```
**Important:** For production, you should use Secret Manager for the API key instead of setting it as an environment variable directly.

**E. Configure Frontend to Talk to Backend**

After deploying, you need to update the `API_BASE_URL` in `services/ApiService.ts` to point to your deployed backend's URL and then redeploy the frontend. This will be improved in future steps with service discovery or build-time environment variables.
