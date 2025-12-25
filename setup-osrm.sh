#!/bin/bash
set -e

# Directory for OSRM data
DATA_DIR="./docker/osrm"
mkdir -p "$DATA_DIR"

echo "Directory setup: $DATA_DIR"

# 1. Download GCC States (Saudi Arabia is part of it)
if [ ! -f "$DATA_DIR/gcc-states.osm.pbf" ]; then
    echo "Downloading GCC States map data..."
    curl -L https://download.geofabrik.de/asia/gcc-states-latest.osm.pbf -o "$DATA_DIR/gcc-states.osm.pbf"
else
    echo "Map data already downloaded."
fi

# 2. Extract Custom Region
# Region: 40.443377,15.997326,44.486346,18.952097
# We use a temporary debian container to install osmctools and run osmconvert
# This avoids installing dependencies on the host machine
echo "Extracting custom region..."
docker run --rm -v "$(pwd)/$DATA_DIR:/data" debian:bookworm-slim bash -c "
    apt-get update && \
    apt-get install -y osmctools && \
    osmconvert /data/gcc-states.osm.pbf -b=40.443377,15.997326,44.486346,18.952097 -o=/data/custom_region.osm.pbf
"

# 3. Process with OSRM
echo "Processing map data with OSRM..."
# Extract
docker run --rm -t -v "$(pwd)/$DATA_DIR:/data" osrm/osrm-backend osrm-extract -p /opt/car.lua /data/custom_region.osm.pbf
# Partition
docker run --rm -t -v "$(pwd)/$DATA_DIR:/data" osrm/osrm-backend osrm-partition /data/custom_region.osrm
# Customize
docker run --rm -t -v "$(pwd)/$DATA_DIR:/data" osrm/osrm-backend osrm-customize /data/custom_region.osrm

echo "OSRM setup complete! Data is ready in $DATA_DIR"
