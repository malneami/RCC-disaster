# OSRM Offline Deployment Guide

Since your server has internet/SSL issues, we are using the **Offline Docker Method**.

## Files to Transfer
1. `osrm-backend-docker.tar` (The detailed Docker image)
2. `docker/osrm/` folder (The map data)

## Step 1: Transfer Files to Server
On your **Local Mac**, run:
```bash
# Transfer the Docker image
scp osrm-backend-docker.tar dell@<YOUR_SERVER_IP>:~/rcc-pre-release/

# Transfer the map data (if not already there)
scp -r docker/osrm dell@<YOUR_SERVER_IP>:~/rcc-pre-release/docker/
```

## Step 2: Load and Run on Server
On your **Linux Server**, run:

```bash
# 1. Load the Docker image
sudo docker load -i osrm-backend-docker.tar

# 2. Start the Server
sudo docker run -d \
  --name rcc-osrm \
  --restart always \
  -p 5001:5000 \
  -v "$(pwd)/docker/osrm:/data" \
  osrm/osrm-backend \
  osrm-routed --algorithm mld /data/custom_region.osrm
```

## Step 3: Verify
```bash
sudo docker ps
curl "http://localhost:5001/route/v1/driving/42.0,17.0;43.0,18.0?overview=false"
```
